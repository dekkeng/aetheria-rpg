/* ============================================================
 * Aetheria RPG — เควสย่อยในหมู่บ้าน (Side Quests)
 * เควสเสริมทำซ้ำได้จาก NPC ในเมือง — ไม่เกี่ยวกับเนื้อเรื่องหลัก
 * ติดตามความคืบหน้าด้วย snapshot ของ p.kills / countItem (ไม่ต้อง hook)
 * ========================================================== */

const SideQuests = {};

/* p.side[questId] = { state:"active"|"done", startKills:n } */
SideQuests.ensure = function (p) { if (!p.side) p.side = {}; return p.side; };

SideQuests.DEFS = {
  taro_slime: {
    giver: "taro", title: "สไลม์บุกไร่", npc: "ชาวนาทาโร่",
    type: "hunt", target: "slime", need: 6,
    reward: { gold: 60, exp: 40, item: "potion", qty: 2 }, repeat: true,
    offer: [
      { s: "ชาวนาทาโร่", t: "โอ๊ย ท่านนักผจญภัย! สไลม์โคลนบุกไร่ผักข้าอีกแล้ว!" },
      { s: "ชาวนาทาโร่", t: "ช่วยไปจัดการมันที่ทุ่งอาโอบะสัก 6 ตัวได้ไหม จะตอบแทนให้เต็มที่เลย" },
    ],
    nudge: [{ s: "ชาวนาทาโร่", t: "สไลม์ยังเหลืออยู่นะ กำจัดให้ครบ 6 ตัวก่อนล่ะ" }],
    done: [{ s: "ชาวนาทาโร่", t: "โอ้โฮ เรียบร้อยเลย! ไร่ข้ารอดแล้ว ขอบคุณมากนะท่าน!" }],
  },
  hana_gel: {
    giver: "hana", title: "เจลสไลม์ทำยา", npc: "แม่ค้าฮานะ",
    type: "collect", item: "slime_gel", need: 3,
    reward: { gold: 55, item: "hi_potion", qty: 1 }, repeat: true,
    offer: [
      { s: "แม่ค้าฮานะ", t: "ท่านนักเดินทาง! ข้าต้องใช้เจลสไลม์ทำยาสมุนไพร แต่เก็บเองไม่ไหวเลย" },
      { s: "แม่ค้าฮานะ", t: "ช่วยหาเจลสไลม์มาให้ข้า 3 ชิ้นได้ไหม (ดรอปจากสไลม์โคลนในทุ่งอาโอบะ)" },
    ],
    nudge: [{ s: "แม่ค้าฮานะ", t: "ยังได้เจลสไลม์ไม่ครบ 3 ชิ้นนะ ลองไปล่าสไลม์ดูสิ" }],
    done: [{ s: "แม่ค้าฮานะ", t: "ครบพอดี! ยาชุดนี้จะช่วยคนในหมู่บ้านได้อีกเยอะเลย ขอบคุณนะ" }],
  },
  kenji_fire: {
    giver: "kenji", title: "ไฟหลอมเหล็ก", npc: "ช่างตีดาบเคนจิ",
    type: "collect", item: "fire_crystal", need: 2,
    reward: { gold: 90, item: "town_scroll", qty: 2 }, repeat: true, requireLevel: 8,
    offer: [
      { s: "ช่างตีดาบเคนจิ", t: "เตาหลอมข้าไฟอ่อนไป จะตีคาตานะดีๆ ต้องใช้ผลึกไฟจากภูเขาไฟคาซัน" },
      { s: "ช่างตีดาบเคนจิ", t: "เอาผลึกไฟมาให้ข้า 2 ก้อนสิ ข้าจะให้โอฟุดะเรียกกลับเป็นรางวัล จะได้เดินทางสะดวก" },
    ],
    nudge: [{ s: "ช่างตีดาบเคนจิ", t: "ผลึกไฟยังไม่ครบ 2 ก้อน — โอนิบิที่ภูเขาไฟคาซันดรอปให้นะ" }],
    done: [{ s: "ช่างตีดาบเคนจิ", t: "ร้อนกำลังดี! นี่ โอฟุดะเรียกกลับ 2 ใบ ฉีกแล้ววาปกลับเมืองได้เลย" }],
  },
  yuki_berry: {
    giver: "yuki", title: "เบอร์รี่ให้เจ้าเหมียว", npc: "เด็กหญิงยูกิจัง",
    type: "collect", item: "pet_berry", need: 3,
    reward: { gold: 30, exp: 25, item: "pet_meat", qty: 1 }, repeat: true,
    offer: [
      { s: "เด็กหญิงยูกิจัง", t: "พี่ๆ เจ้าเหมียวของหนูหิว มันชอบกินเบอร์รี่ป่ามากเลย" },
      { s: "เด็กหญิงยูกิจัง", t: "ช่วยหาเบอร์รี่ป่ามาให้หน่อยได้ไหม 3 ลูกก็พอ! (เมทสึไอชอบดรอปให้)" },
    ],
    nudge: [{ s: "เด็กหญิงยูกิจัง", t: "ยังไม่ครบ 3 ลูกเลย เจ้าเหมียวยังหิวอยู่นะ~" }],
    done: [{ s: "เด็กหญิงยูกิจัง", t: "เย้! เจ้าเหมียวอิ่มแล้ว มันขอบคุณพี่ด้วยเหมียว~ 🐱" }],
  },
  // ---- โซนแตกแขนง ----
  kaede_kodama: {
    giver: "kaede", title: "วิญญาณป่าไผ่", npc: "นักสะสมคาเอเดะ",
    type: "hunt", target: "kodama", need: 5,
    reward: { gold: 70, exp: 45, item: "hi_potion", qty: 2 }, repeat: true, requireLevel: 2,
    offer: [
      { s: "นักสะสมคาเอเดะ", t: "โอ้ นักเดินทาง! ป่าไผ่ซาซะแห่งนี้มีโคดามะน้อยชุกชุมเหลือเกิน" },
      { s: "นักสะสมคาเอเดะ", t: "ข้าอยากศึกษามัน ช่วยปราบสัก 5 ตัวเก็บตัวอย่างมาให้หน่อยสิ" },
    ],
    nudge: [{ s: "นักสะสมคาเอเดะ", t: "โคดามะยังไม่ครบ 5 ตัวนะ ในป่าไผ่ซาซะมีเยอะเลย" }],
    done: [{ s: "นักสะสมคาเอเดะ", t: "สมบูรณ์แบบ! ตัวอย่างพวกนี้มีค่ามาก รับรางวัลไปเลย" }],
  },
  sora_fish: {
    giver: "sora", title: "ปีกผีเสื้อราตรี", npc: "กะลาสีโซระ",
    type: "collect", item: "wolf_fang", need: 2,
    reward: { gold: 80, item: "town_scroll", qty: 1 }, repeat: true, requireLevel: 4,
    offer: [
      { s: "กะลาสีโซระ", t: "ยะโฮ่ นักผจญภัย! ข้าทำเหยื่อตกปลาพิเศษ ต้องใช้เขี้ยวสัตว์" },
      { s: "กะลาสีโซระ", t: "หาเขี้ยว (จากทานุกิ/อินุงามิ) มาให้ข้า 2 ชิ้นสิ ข้าจะให้โอฟุดะเรียกกลับตอบแทน" },
    ],
    nudge: [{ s: "กะลาสีโซระ", t: "เขี้ยวยังไม่ครบ 2 ชิ้นเลยนายท่าน" }],
    done: [{ s: "กะลาสีโซระ", t: "เยี่ยม! เหยื่อชุดนี้ปลาต้องติดเพียบแน่ ขอบใจมาก" }],
  },
  inari_ari: {
    giver: "inari", title: "ชำระถ้ำต้องสาป", npc: "นักบวชศาลเจ้าอินาริ",
    type: "hunt", target: "stone_ari", need: 4,
    reward: { gold: 150, exp: 90, item: "iron_armor", qty: 1 }, repeat: true, requireLevel: 6,
    offer: [
      { s: "นักบวชศาลเจ้าอินาริ", t: "มดหินยักษ์ในถ้ำหินคุระรบกวนพลังศักดิ์สิทธิ์ของศาลเจ้า" },
      { s: "นักบวชศาลเจ้าอินาริ", t: "โปรดช่วยชำระล้างมันสัก 4 ตัว เพื่อสันติของคิสึเนะผู้พิทักษ์" },
    ],
    nudge: [{ s: "นักบวชศาลเจ้าอินาริ", t: "มดหินยักษ์ยังเหลืออยู่ ถ้ำหินคุระอยู่ทางตะวันออกของทุ่งอาโอบะ" }],
    done: [{ s: "นักบวชศาลเจ้าอินาริ", t: "ศาลเจ้าสงบลงแล้ว ขอพรอินาริคุ้มครองการเดินทางของท่าน" }],
  },
};

SideQuests.byGiver = function (giver) {
  return Object.keys(SideQuests.DEFS).find((id) => SideQuests.DEFS[id].giver === giver);
};

SideQuests.progress = function (p, id) {
  const def = SideQuests.DEFS[id];
  const rec = p.side && p.side[id];
  if (!rec || rec.state !== "active") return 0;
  if (def.type === "hunt") return Math.min(def.need, (p.kills[def.target] || 0) - (rec.startKills || 0));
  if (def.type === "collect") return Math.min(def.need, State.countItem(p, def.item));
  return 0;
};
SideQuests.isComplete = function (p, id) {
  return SideQuests.progress(p, id) >= SideQuests.DEFS[id].need;
};

/* เรียกจาก World.interact เมื่อคุย NPC เควสย่อย */
SideQuests.interact = function (giverId) {
  const p = State.player;
  SideQuests.ensure(p);
  if (giverId === "board" || giverId === "board2") { SideQuests.openBoard(p); return true; }
  const id = SideQuests.byGiver(giverId);
  if (!id) return false;
  const def = SideQuests.DEFS[id];
  const rec = p.side[id];

  // ยังไม่รับ (หรือทำจบแล้วและทำซ้ำได้)
  if (!rec || (rec.state === "done" && def.repeat)) {
    if (def.requireLevel && p.level < def.requireLevel) {
      UI.playDialogue([{ s: def.npc, t: `เจ้ายังไม่พร้อมสำหรับงานนี้ (ต้องถึง Lv.${def.requireLevel} ก่อน) กลับมาใหม่นะ` }]);
      return true;
    }
    UI.playDialogue(def.offer, () => {
      UI.playChoice("รับเควสนี้ไหม?", [
        { label: "รับเลย!", on: () => {
            p.side[id] = { state: "active", startKills: def.type === "hunt" ? (p.kills[def.target] || 0) : 0 };
            UI.toast("📋 รับเควสย่อย: " + def.title);
            if (typeof SFX !== "undefined") SFX.play("select");
            if (typeof Game !== "undefined" && Game.autosave) Game.autosave("side");
          } },
        { label: "ไว้ก่อน", on: () => {} },
      ]);
    });
    return true;
  }
  // กำลังทำ
  if (rec.state === "active") {
    if (SideQuests.isComplete(p, id)) { SideQuests.turnin(p, id); return true; }
    const prog = SideQuests.progress(p, id);
    UI.playDialogue([def.nudge[0], { s: SP0.narr, t: `(ความคืบหน้า ${prog}/${def.need})` }]);
    return true;
  }
  // done + ไม่ทำซ้ำ
  UI.playDialogue([{ s: def.npc, t: "ขอบคุณอีกครั้งสำหรับความช่วยเหลือนะ" }]);
  return true;
};

SideQuests.turnin = function (p, id) {
  const def = SideQuests.DEFS[id];
  // ใช้ของ (collect) หมดจากกระเป๋า
  if (def.type === "collect") State.removeItem(p, def.item, def.need);
  const rw = def.reward;
  const msgs = rw.exp ? State.gainExp(p, rw.exp) : [];
  if (rw.gold) p.gold += rw.gold;
  if (rw.item) State.addItem(p, rw.item, rw.qty || 1);
  p.side[id] = { state: "done" };
  if (typeof SFX !== "undefined") SFX.play("victory");
  UI.updateHud();
  let rewardTxt = [];
  if (rw.exp) rewardTxt.push(`+${rw.exp} EXP`);
  if (rw.gold) rewardTxt.push(`+${rw.gold}💰`);
  if (rw.item) rewardTxt.push(`${GameData.items[rw.item].name}${rw.qty > 1 ? " x" + rw.qty : ""}`);
  UI.playDialogue(def.done, () => {
    UI.toast("✅ เควสสำเร็จ! " + rewardTxt.join(" · "));
    if (msgs.length) setTimeout(() => UI.toast(msgs[msgs.length - 1]), 900);
    if (typeof Game !== "undefined" && Game.autosave) Game.autosave("side");
  });
};

/* กระดานเควส — สรุปสถานะเควสย่อยทั้งหมด */
SideQuests.openBoard = function (p) {
  SideQuests.ensure(p);
  const rows = Object.keys(SideQuests.DEFS).map((id) => {
    const def = SideQuests.DEFS[id];
    const rec = p.side[id];
    let status, cls;
    if (!rec) { status = "ยังไม่รับ"; cls = "new"; }
    else if (rec.state === "done") { status = def.repeat ? "ทำซ้ำได้" : "สำเร็จแล้ว"; cls = "done"; }
    else if (SideQuests.isComplete(p, id)) { status = "พร้อมส่ง!"; cls = "ready"; }
    else { status = `${SideQuests.progress(p, id)}/${def.need}`; cls = "active"; }
    const goal = def.type === "hunt"
      ? `ปราบ ${GameData.enemies[def.target].name} ${def.need} ตัว`
      : `หา ${GameData.items[def.item].name} ${def.need} ชิ้น`;
    return `<div class="sq-row sq-${cls}">
        <div><b>${def.title}</b><br><small>${goal} · ผู้ว่าจ้าง: ${def.npc}</small></div>
        <span class="sq-stat">${status}</span>
      </div>`;
  }).join("");
  UI.openOverlay(`<h2>📋 กระดานเควสหมู่บ้าน</h2>
    <p class="sub">รับงานจาก NPC ในหมู่บ้าน แล้วมาส่งเพื่อรับรางวัล (ทำซ้ำได้)</p>
    <div class="sq-list">${rows}</div>`);
};

// ตัวย่อ narrator สำหรับ SideQuests (ไม่พึ่ง SP ใน story.js)
const SP0 = { narr: "★" };

window.SideQuests = SideQuests;
