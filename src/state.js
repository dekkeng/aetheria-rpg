/* ============================================================
 * Aetheria RPG — Game State
 * จัดการสถานะผู้เล่น, การสร้างตัวละคร, เลเวลอัพ, เซฟ/โหลด
 * ========================================================== */

const SAVE_KEY = "aetheria_save_v1";

const State = {
  player: null,   // ข้อมูลผู้เล่น
  screen: "title",
  battle: null,   // สถานะการต่อสู้ปัจจุบัน
};

/* สร้างผู้เล่นใหม่จากอาชีพที่เลือก */
State.createPlayer = function (name, classId) {
  const cls = GameData.classes.find((c) => c.id === classId) || GameData.classes[0];
  const b = cls.base;
  return {
    name: name || "ผู้กล้า",
    classId: cls.id,
    level: 1,
    exp: 0,
    hp: b.maxHp, maxHp: b.maxHp,
    mp: b.maxMp, maxMp: b.maxMp,
    atk: b.atk, def: b.def, spd: b.spd,
    gold: 60,
    skill: cls.skill,               // สกิลหลัก (compat)
    skills: { [cls.skill]: 1 },     // สกิลที่เรียนรู้แล้ว: id -> เลเวลสกิล
    statPoints: 0,                  // แต้มอัพสเตตัส
    skillPoints: 0,                 // แต้มอัพสกิล
    pets: [],                       // สัตว์เลี้ยงที่มี
    activePet: null,                // uid ของคู่หูที่ใช้อยู่
    inventory: [
      { id: "potion", qty: 3 },
      { id: "wood_sword", qty: 1 },
    ],
    equip: { weapon: null, armor: null },
    quests: {},          // (legacy — ไม่ใช้แล้ว)
    kills: {},           // enemyId -> count (นับรวม)
    map: "town",
    x: GameData.maps.town.spawn.x,
    y: GameData.maps.town.spawn.y,
    fx: GameData.maps.town.spawn.x + 0.5,
    fy: GameData.maps.town.spawn.y + 0.5,
    defeatedBoss: {},    // bossId -> true
    // ---- เนื้อเรื่อง ----
    storyStage: 0,       // ด่านเนื้อเรื่องปัจจุบัน (index ใน Story.STAGES)
    stageAccepted: false,// รับเควสด่านปัจจุบันแล้วหรือยัง
    stageProgress: 0,    // ความคืบหน้าของด่าน
    flags: {},           // ธงเนื้อเรื่อง (ปลดล็อกโซน ฯลฯ)
    ending: null,        // ตอนจบที่เลือก
  };
};

/* ค่าพลังรวม (base + อุปกรณ์สวมใส่ + คู่หูสัตว์เลี้ยง) */
State.totalAtk = function (p) {
  let a = p.atk;
  const w = p.equip.weapon;
  if (w && GameData.items[w]) a += GameData.items[w].atk || 0;
  if (typeof Pets !== "undefined") a += Pets.stat(p, "atk");
  return a;
};
State.totalDef = function (p) {
  let d = p.def;
  const ar = p.equip.armor;
  if (ar && GameData.items[ar]) d += GameData.items[ar].def || 0;
  if (typeof Pets !== "undefined") d += Pets.stat(p, "def");
  return d;
};
State.totalSpd = function (p) {
  let s = p.spd;
  if (typeof Pets !== "undefined") s += Pets.stat(p, "spd");
  return s;
};

/* เพิ่ม EXP และเช็คเลเวลอัพ — คืน array ข้อความที่เกิดขึ้น */
State.gainExp = function (p, amount) {
  const msgs = [];
  p.exp += amount;
  let need = GameData.expForLevel(p.level);
  while (p.exp >= need) {
    p.exp -= need;
    p.level++;
    // เพิ่มสเตตัสตามเลเวล
    const cls = GameData.classes.find((c) => c.id === p.classId);
    const growth = cls.base;
    p.maxHp += Math.round(growth.maxHp * 0.08) + 3;
    p.maxMp += Math.round(growth.maxMp * 0.07) + 1;
    p.atk += 1;
    p.def += 1;
    p.hp = p.maxHp;   // ฟื้นเต็มเมื่อเลเวลอัพ
    p.mp = p.maxMp;
    // แต้มให้ผู้เล่นจัดสรรเอง
    p.statPoints = (p.statPoints || 0) + 3;
    p.skillPoints = (p.skillPoints || 0) + 1;
    // จอมเวทเรียนรู้สกิลรักษาเองที่เลเวล 3
    if (!p.skills) p.skills = {};
    if (p.classId === "mage" && p.level >= 3 && !p.skills.heal_spell) {
      p.skills.heal_spell = 1;
      msgs.push("✨ จอมเวทเรียนรู้สกิล 'รักษา'!");
    }
    msgs.push(`🎉 เลเวลอัพ! Lv.${p.level} · ได้แต้มสเตตัส +3, แต้มสกิล +1`);
    need = GameData.expForLevel(p.level);
  }
  return msgs;
};

/* ค่าที่ได้ต่อการลงแต้มสเตตัส 1 แต้ม */
State.STAT_GAIN = { hp: 12, mp: 6, atk: 2, def: 2, spd: 1 };

/* ลงแต้มสเตตัส — คืน true ถ้าสำเร็จ */
State.allocateStat = function (p, stat) {
  if ((p.statPoints || 0) <= 0 || !State.STAT_GAIN[stat]) return false;
  const g = State.STAT_GAIN[stat];
  if (stat === "hp") { p.maxHp += g; p.hp += g; }
  else if (stat === "mp") { p.maxMp += g; p.mp += g; }
  else p[stat] += g;
  p.statPoints--;
  return true;
};

/* เรียนรู้/อัพสกิลจากตำรา — คืนสถานะ */
State.learnSkill = function (p, skillId) {
  if (!p.skills) p.skills = {};
  const def = GameData.skills[skillId];
  if (!def) return { ok: false };
  const cur = p.skills[skillId] || 0;
  const max = def.maxLv || 5;
  if (cur === 0) { p.skills[skillId] = 1; return { ok: true, learned: true, level: 1 }; }
  if (cur >= max) return { ok: false, maxed: true, level: cur };
  p.skills[skillId] = cur + 1;
  return { ok: true, learned: false, level: cur + 1 };
};

/* อัพสกิลด้วยแต้มสกิล */
State.upgradeSkill = function (p, skillId) {
  const def = GameData.skills[skillId];
  if (!def || !p.skills || !p.skills[skillId]) return false;
  if ((p.skillPoints || 0) <= 0) return false;
  if (p.skills[skillId] >= (def.maxLv || 5)) return false;
  p.skills[skillId]++;
  p.skillPoints--;
  return true;
};

/* พลังสกิลจริงตามเลเวลสกิล */
State.skillPower = function (skillId, level) {
  const def = GameData.skills[skillId];
  const lv = level || 1;
  return (def.power || 0) * (1 + (lv - 1) * 0.22);
};
State.skillHeal = function (skillId, level) {
  const def = GameData.skills[skillId];
  const lv = level || 1;
  return Math.round((def.heal || 0) * (1 + (lv - 1) * 0.25));
};

/* migration เซฟเก่าให้มีฟิลด์ครบ */
State.ensureProgression = function (p) {
  if (!p) return;
  if (!p.skills) p.skills = {};
  if (Object.keys(p.skills).length === 0 && p.skill) p.skills[p.skill] = 1;
  if (p.classId === "mage" && p.level >= 3 && !p.skills.heal_spell) p.skills.heal_spell = 1;
  if (typeof p.statPoints !== "number") p.statPoints = 0;
  if (typeof p.skillPoints !== "number") p.skillPoints = 0;
  if (!Array.isArray(p.pets)) p.pets = [];
  if (p.activePet === undefined) p.activePet = null;
  if (!p.equip || typeof p.equip !== "object") p.equip = { weapon: null, armor: null };
};

/* เพิ่มไอเทมเข้ากระเป๋า */
State.addItem = function (p, itemId, qty) {
  qty = qty || 1;
  const slot = p.inventory.find((s) => s.id === itemId);
  if (slot) slot.qty += qty;
  else p.inventory.push({ id: itemId, qty: qty });
};

/* ลบไอเทม — คืน true ถ้าสำเร็จ */
State.removeItem = function (p, itemId, qty) {
  qty = qty || 1;
  const slot = p.inventory.find((s) => s.id === itemId);
  if (!slot || slot.qty < qty) return false;
  slot.qty -= qty;
  if (slot.qty <= 0) p.inventory = p.inventory.filter((s) => s.id !== itemId);
  return true;
};

State.countItem = function (p, itemId) {
  const slot = p.inventory.find((s) => s.id === itemId);
  return slot ? slot.qty : 0;
};

/* นับศัตรูที่ฆ่า + อัปเดตความคืบหน้าเควส */
State.recordKill = function (p, enemyId) {
  p.kills[enemyId] = (p.kills[enemyId] || 0) + 1;
  Object.values(p.quests).forEach((q) => {
    if (q.state !== "active") return;
    const def = GameData.quests[q.id];
    if (def.type === "hunt" && def.target === enemyId) {
      q.progress = Math.min((q.progress || 0) + 1, def.need);
    }
  });
};

/* เช็คว่าเควสพร้อมส่งหรือยัง */
State.questComplete = function (q) {
  const def = GameData.quests[q.id];
  return (q.progress || 0) >= def.need;
};

/* ---------- เซฟ / โหลด ---------- */
State.save = function () {
  if (!State.player) return false;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(State.player));
    return true;
  } catch (e) {
    return false;
  }
};

State.load = function () {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    State.player = JSON.parse(raw);
    State.ensureProgression(State.player);
    return true;
  } catch (e) {
    return false;
  }
};

State.hasSave = function () {
  return !!localStorage.getItem(SAVE_KEY);
};

window.State = State;
