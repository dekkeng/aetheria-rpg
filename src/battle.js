/* ============================================================
 * Aetheria RPG — Battle System
 * ต่อสู้แบบเทิร์นเบส: โจมตี / สกิล / ไอเทม / หนี
 * ========================================================== */

const Battle = {};

Battle.start = function (enemyId, opts) {
  opts = opts || {};
  const def = GameData.enemies[enemyId];
  State.battle = {
    enemyId: enemyId,
    enemy: {
      id: enemyId,
      name: def.name,
      lv: def.lv || 1,
      sprite: def.sprite,
      hp: def.hp, maxHp: def.hp,
      atk: def.atk, def: def.def,
    },
    def: def,
    bossNpc: opts.bossNpc || null,
    busy: false,
    over: false,
  };
  if (typeof SFX !== "undefined") SFX.play(def.boss ? "encounter" : "encounter");
  if (typeof Music !== "undefined") Music.playBattle(!!def.boss);
  if (typeof FX !== "undefined") FX.flash("#c94b4b");
  if (typeof FX !== "undefined") FX.transition(() => { UI.showScreen("battle"); Battle.render(); }, "#1a0d14");
  else { UI.showScreen("battle"); Battle.render(); }
  Battle.clearLog();
  Battle.log(`⚔ ${def.name} ปรากฏตัว!`);
  Battle.showActions(true);
};

Battle.render = function () {
  const b = State.battle;
  const p = State.player;
  UI.$("#enemy-name").innerHTML = `<span class="mon-lv">Lv.${b.enemy.lv}</span> ${Game.esc ? Game.esc(b.enemy.name) : b.enemy.name}`;
  UI.$("#battle-hero-name").textContent = `Lv.${p.level} ${p.name}`;
  Battle.drawSprites();

  UI.setBar("#enemy-hp-bar", b.enemy.hp, b.enemy.maxHp);
  UI.setBar("#hero-hp-bar", p.hp, p.maxHp);
  UI.setBar("#hero-mp-bar", p.mp, p.maxMp);
  UI.$("#hero-hp-txt").textContent = `HP ${p.hp}/${p.maxHp}`;
  UI.$("#hero-mp-txt").textContent = `MP ${p.mp}/${p.maxMp}`;
};

/* วาดสไปรต์ฮีโร่/ศัตรูลง canvas (เรียกซ้ำจากลูป animation เพื่อ idle) */
Battle.drawSprites = function () {
  const b = State.battle, p = State.player;
  if (!b || typeof Sprites === "undefined" || !Sprites.ready) return;
  const ec = UI.$("#enemy-sprite"), hc = UI.$("#hero-sprite");
  if (ec && ec.getContext) {
    const ex = ec.getContext("2d");
    ex.clearRect(0, 0, ec.width, ec.height);
    const ok = Sprites.drawEnemy(ex, b.enemyId, 0, 0, ec.width);
    if (!ok) Sprites.drawEmoji(ex, b.enemy.sprite, ec.width / 2, ec.height / 2, ec.width * 0.62);
  }
  if (hc && hc.getContext) {
    const hx = hc.getContext("2d");
    hx.clearRect(0, 0, hc.width, hc.height);
    Sprites.drawHeroBattle(hx, p.classId, "right", hc.width, p.equip);
    // คู่หูสัตว์เลี้ยงยืนข้างๆ (มุมล่างซ้าย)
    const pet = (typeof Pets !== "undefined") ? Pets.active(p) : null;
    if (pet && Sprites.drawPet) {
      const s = Math.round(hc.width * 0.4);
      Sprites.drawPet(hx, pet.species, 0, hc.height - s, s);
    }
  }
};

Battle.log = function (msg) {
  const el = UI.$("#battle-log");
  const line = document.createElement("div");
  line.textContent = msg;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
};
Battle.clearLog = function () { UI.$("#battle-log").innerHTML = ""; };

Battle.showActions = function (show) {
  UI.$("#battle-actions").style.display = show ? "grid" : "none";
  UI.$("#battle-submenu").innerHTML = "";
};

/* เลือกเสียงโจมตีปกติตามอาวุธ/อาชีพ */
Battle.attackSound = function (p) {
  const w = (p.equip && p.equip.hand_r) || "";
  if (w.includes("bow") || p.classId === "archer") return "bow";
  if (p.classId === "mage") return "magic_hit";
  return "slash";
};

/* คำนวณดาเมจ */
Battle.calcDamage = function (atk, def, power) {
  power = power || 1;
  let base = atk * power - def * 0.6;
  base = Math.max(1, base);
  const variance = 0.85 + Math.random() * 0.3; // สุ่ม ±15%
  return Math.round(base * variance);
};

/* ---------- แอ็กชันผู้เล่น ---------- */
Battle.playerAttack = function () {
  const b = State.battle, p = State.player;
  if (b.busy || b.over) return;
  b.busy = true;
  if (typeof SFX !== "undefined") SFX.play(Battle.attackSound(p));
  const dmg = Battle.calcDamage(State.totalAtk(p), b.enemy.def, 1);
  b.enemy.hp = Math.max(0, b.enemy.hp - dmg);
  Battle.flash("#enemy-sprite");
  setTimeout(() => { if (typeof SFX !== "undefined") SFX.play("hit"); }, 90);
  Battle.log(`${p.name} โจมตี! สร้างดาเมจ ${dmg}`);
  // คู่หูช่วยโจมตี (เพิร์ค assist)
  const assist = (typeof Pets !== "undefined") ? Pets.perkValue(p, "assist") : 0;
  if (assist > 0 && b.enemy.hp > 0 && Math.random() < 0.35) {
    const pdmg = Math.max(1, Math.round(assist * (0.85 + Math.random() * 0.3) - b.enemy.def * 0.3));
    b.enemy.hp = Math.max(0, b.enemy.hp - pdmg);
    const pet = Pets.active(p);
    setTimeout(() => { if (typeof SFX !== "undefined") SFX.play("hit"); }, 220);
    Battle.log(`🐾 ${pet.name} ช่วยโจมตี! +${pdmg} ดาเมจ`);
  }
  Battle.render();
  Battle.afterPlayer();
};

Battle.playerSkill = function (skillId) {
  const b = State.battle, p = State.player;
  if (b.busy || b.over) return;
  const sk = GameData.skills[skillId];
  const lv = (p.skills && p.skills[skillId]) || 1;
  if (p.mp < sk.mp) { UI.toast("MP ไม่พอ"); return; }
  b.busy = true;
  p.mp -= sk.mp;
  Battle.showActions(true);
  if (typeof SFX !== "undefined") SFX.play(sk.sfx || "skill");

  if (sk.type === "heal") {
    const heal = State.skillHeal(skillId, lv);
    p.hp = Math.min(p.maxHp, p.hp + heal);
    Battle.log(`${p.name} ร่าย ${sk.name} Lv.${lv} ฟื้น HP ${heal}`);
  } else {
    const power = State.skillPower(skillId, lv);
    const hits = sk.hits || 1;
    let totalDmg = 0;
    for (let i = 0; i < hits; i++) {
      const dmg = Battle.calcDamage(State.totalAtk(p), b.enemy.def, power);
      b.enemy.hp = Math.max(0, b.enemy.hp - dmg);
      totalDmg += dmg;
    }
    Battle.flash("#enemy-sprite");
    let line = `${p.name} ร่าย ${sk.name} Lv.${lv}! ดาเมจรวม ${totalDmg}${hits > 1 ? ` (${hits} ครั้ง)` : ""}`;
    // ดูดพลังชีวิต
    if (sk.drain) {
      const heal = Math.round(totalDmg * sk.drain);
      p.hp = Math.min(p.maxHp, p.hp + heal);
      line += ` · ดูด HP ${heal}`;
    }
    Battle.log(line);
  }
  Battle.render();
  Battle.afterPlayer();
};

Battle.playerItem = function (itemId) {
  const b = State.battle, p = State.player;
  if (b.busy || b.over) return;
  const ok = UI.useItem(itemId, true);
  if (!ok) return;
  b.busy = true;
  Battle.render();
  Battle.log(`${p.name} ใช้ ${GameData.items[itemId].name}`);
  Battle.afterPlayer();
};

Battle.playerFlee = function () {
  const b = State.battle, p = State.player;
  if (b.busy || b.over) return;
  if (b.def.boss) { UI.toast("หนีจากบอสไม่ได้!"); return; }
  b.busy = true;
  const chance = 0.5 + (State.totalSpd(p) - b.enemy.atk) * 0.03;
  if (Math.random() < Math.max(0.2, Math.min(0.9, chance))) {
    Battle.log("หนีสำเร็จ!");
    setTimeout(Battle.escape, 700);
  } else {
    Battle.log("หนีไม่สำเร็จ!");
    setTimeout(() => Battle.enemyTurn(), 700);
  }
};

/* หลังผู้เล่นทำแอ็กชัน -> เช็คศัตรูตาย หรือให้ศัตรูตอบโต้ */
Battle.afterPlayer = function () {
  const b = State.battle;
  Battle.showActions(false);
  if (b.enemy.hp <= 0) {
    setTimeout(Battle.win, 600);
    return;
  }
  setTimeout(() => Battle.enemyTurn(), 750);
};

Battle.enemyTurn = function () {
  const b = State.battle, p = State.player;
  if (b.over) return;
  const dmg = Battle.calcDamage(b.enemy.atk, State.totalDef(p), 1);
  p.hp = Math.max(0, p.hp - dmg);
  Battle.flash("#hero-sprite");
  if (typeof SFX !== "undefined") SFX.play("hit");
  if (typeof FX !== "undefined" && dmg > p.maxHp * 0.18) FX.shake();
  Battle.log(`${b.enemy.name} โจมตี! เจ้าเสีย HP ${dmg}`);
  Battle.render();
  UI.updateHud();
  if (p.hp <= 0) { setTimeout(Battle.lose, 600); return; }
  b.busy = false;
  Battle.showActions(true);
};

/* ---------- จบการต่อสู้ ---------- */
Battle.win = function () {
  const b = State.battle, p = State.player;
  b.over = true;
  Battle.showActions(false);
  const def = b.def;
  if (typeof SFX !== "undefined") SFX.play("victory");
  Battle.log(`🏆 ชนะ ${b.enemy.name}!`);
  // ตัวคูณจากเพิร์คสัตว์เลี้ยง
  const expMul = (typeof Pets !== "undefined") ? Pets.expMult(p) : 1;
  const goldMul = (typeof Pets !== "undefined") ? Pets.goldMult(p) : 1;
  const expGain = Math.round(def.exp * expMul);
  const goldGain = Math.round(def.gold * goldMul);
  const expMsgs = State.gainExp(p, expGain);
  p.gold += goldGain;
  Battle.log(`ได้รับ ${expGain} EXP และ ${goldGain} 💰${(expMul > 1 || goldMul > 1) ? " (โบนัสคู่หู)" : ""}`);
  // ดรอปไอเทม
  if (def.drop && Math.random() < def.drop.rate) {
    State.addItem(p, def.drop.item, 1);
    Battle.log(`ได้ไอเทม: ${GameData.items[def.drop.item].name}!`);
  }
  if (def.drop2 && Math.random() < def.drop2.rate) {
    State.addItem(p, def.drop2.item, 1);
    Battle.log(`ได้ไอเทม: ${GameData.items[def.drop2.item].name}!`);
  }
  // ตำราสกิล (การันตีจากบอส)
  if (def.book && GameData.items[def.book]) {
    State.addItem(p, def.book, 1);
    Battle.log(`📖 ได้ตำราสกิล: ${GameData.items[def.book].name}!`);
  }
  // ไข่สัตว์เลี้ยงจากบอส
  if (def.petEgg && Math.random() < def.petEgg.rate) {
    State.addItem(p, def.petEgg.item, 1);
    Battle.log(`🥚 ได้ ${GameData.items[def.petEgg.item].name}! (ฟักในกระเป๋า)`);
  }
  // เพิร์คพยาบาลน้อย: ฟื้น HP หลังชนะ
  const healPct = (typeof Pets !== "undefined") ? Pets.perkValue(p, "heal_after") : 0;
  if (healPct > 0 && p.hp < p.maxHp) {
    const heal = Math.round(p.maxHp * healPct / 100);
    p.hp = Math.min(p.maxHp, p.hp + heal);
    const pet = Pets.active(p);
    Battle.log(`🐾 ${pet.name} รักษาเจ้า +${heal} HP`);
  }
  // นับ kill + อัปเดตเควส
  State.recordKill(p, b.enemyId);
  if (typeof Story !== "undefined") Story.onKill(p, b.enemyId);   // อัปเดตเควสเนื้อเรื่อง
  if (expMsgs.length) {
    if (typeof SFX !== "undefined") setTimeout(() => SFX.play("levelup"), 400);
    if (typeof Auth !== "undefined") Auth.log("level_up", { level: p.level });
  }
  expMsgs.forEach((m) => Battle.log(m));
  // บอส
  if (def.boss) {
    p.defeatedBoss[b.enemyId] = true;
    if (typeof Story !== "undefined") Story.setFlag(p, "killed_" + b.enemyId);
    if (typeof Auth !== "undefined") Auth.log("boss_defeated", { boss: def.name });
    if (b.bossNpc) {
      const map = GameData.maps[p.map];
      map.npcs = map.npcs.filter((n) => n !== b.bossNpc);
    }
    Battle.log("🌟 เจ้าปราบบอสได้สำเร็จ!");
  }
  UI.updateHud();
  Battle.endButton("กลับสู่การผจญภัย", Battle.returnWorld);
};

Battle.lose = function () {
  const b = State.battle, p = State.player;
  b.over = true;
  Battle.showActions(false);
  if (typeof SFX !== "undefined") SFX.play("defeat");
  Battle.log("💀 เจ้าพ่ายแพ้...");
  // ลงโทษ: เสียทองครึ่งหนึ่ง, ฟื้นที่เมือง
  const lost = Math.floor(p.gold * 0.5);
  p.gold -= lost;
  p.hp = Math.floor(p.maxHp * 0.5);
  p.mp = Math.floor(p.maxMp * 0.5);
  Battle.log(`เจ้าถูกส่งกลับเมือง เสีย ${lost} 💰`);
  Battle.endButton("ฟื้นที่เมือง", () => {
    p.map = "town";
    p.x = GameData.maps.town.spawn.x;
    p.y = GameData.maps.town.spawn.y;
    // ต้องตั้งพิกัดทศนิยมด้วย ไม่งั้นกล้อง/การชนยังอยู่พิกัดแมพเก่า -> จอมืดเดินไม่ได้
    p.fx = p.x + 0.5;
    p.fy = p.y + 0.5;
    Battle.returnWorld();
  });
};

Battle.escape = function () {
  State.battle.over = true;
  Battle.returnWorld();
};

Battle.returnWorld = function () {
  const p = State.player;
  const go = () => {
    State.battle = null;
    Battle.clearLog();
    UI.showScreen("world");
    if (World.resume) World.resume();
    if (typeof Music !== "undefined" && p) Music.playForMap(p.map);
    World.draw();
    UI.updateHud();
    if (typeof Game !== "undefined" && Game.autosave) Game.autosave("battle");
    // เล่นฉาก cutscene ถ้ามีบอสเนื้อเรื่องเพิ่งถูกปราบ
    if (typeof Story !== "undefined") setTimeout(() => Story.flushScene(), 400);
  };
  if (typeof FX !== "undefined") FX.transition(go, "#0a0916");
  else go();
};

/* ปุ่มจบเกมการต่อสู้ */
Battle.endButton = function (label, cb) {
  const sub = UI.$("#battle-submenu");
  sub.innerHTML = `<button class="btn btn-primary wide" id="battle-end">${label}</button>`;
  UI.$("#battle-end").addEventListener("click", cb);
};

/* ---------- เมนูย่อย (สกิล/ไอเทม) ---------- */
Battle.openSkillMenu = function () {
  const b = State.battle, p = State.player;
  if (b.busy || b.over) return;
  const sub = UI.$("#battle-submenu");
  const skills = Object.keys(p.skills || {});
  // สกิลพิเศษจากคู่หูสัตว์เลี้ยง (ระดับตำนาน)
  const petSkill = (typeof Pets !== "undefined") ? Pets.grantedSkill(p) : null;
  if (petSkill && !skills.includes(petSkill)) skills.push(petSkill);
  if (!skills.length) { sub.innerHTML = `<p class="empty">ยังไม่มีสกิล</p><button class="btn back" data-skill-back>ย้อนกลับ</button>`; }
  else {
    let html = skills.map((sid) => {
      const s = GameData.skills[sid]; if (!s) return "";
      const lv = p.skills[sid] || 1;
      const fromPet = petSkill === sid && !p.skills[sid];
      const dis = p.mp < s.mp ? "disabled" : "";
      return `<button class="btn ${dis}" data-skill="${sid}" ${dis}>${fromPet ? "🐾 " : ""}${s.name} <small>Lv.${lv} · MP ${s.mp}</small></button>`;
    }).join("");
    html += `<button class="btn back" data-skill-back>ย้อนกลับ</button>`;
    sub.innerHTML = html;
    UI.$$("[data-skill]").forEach((btn) =>
      btn.addEventListener("click", () => Battle.playerSkill(btn.dataset.skill))
    );
  }
  UI.$("[data-skill-back]").addEventListener("click", () => (sub.innerHTML = ""));
};

Battle.openItemMenu = function () {
  const b = State.battle, p = State.player;
  if (b.busy || b.over) return;
  const sub = UI.$("#battle-submenu");
  const consumables = p.inventory.filter((s) => {
    const it = GameData.items[s.id];
    return it && it.type === "consume" && !it.warp;   // ไอเทมวาปใช้ในสนามรบไม่ได้
  });
  if (!consumables.length) {
    sub.innerHTML = `<p class="empty">ไม่มีไอเทมใช้ได้</p><button class="btn back" data-item-back>ย้อนกลับ</button>`;
  } else {
    let html = consumables.map((s) => {
      const it = GameData.items[s.id];
      return `<button class="btn" data-item="${s.id}">${UI.itemIcon(it.id, 20)} ${it.name} <small>x${s.qty}</small></button>`;
    }).join("");
    html += `<button class="btn back" data-item-back>ย้อนกลับ</button>`;
    sub.innerHTML = html;
    UI.$$("[data-item]").forEach((btn) =>
      btn.addEventListener("click", () => Battle.playerItem(btn.dataset.item))
    );
  }
  UI.$("[data-item-back]").addEventListener("click", () => (sub.innerHTML = ""));
};

/* เอฟเฟกต์กระพริบเมื่อโดนโจมตี */
Battle.flash = function (sel) {
  const el = UI.$(sel);
  if (!el) return;
  el.classList.remove("flash");
  void el.offsetWidth; // reflow
  el.classList.add("flash");
};

window.Battle = Battle;
