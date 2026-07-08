/* ============================================================
 * Aetheria RPG — UI Layer
 * HUD, เมนูตัวละคร/กระเป๋า/เควส, ไดอะล็อก NPC, ร้านค้า, toast
 * ========================================================== */

const UI = {};

UI.$ = (sel) => document.querySelector(sel);
UI.$$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ไอคอนไอเทม: ใช้ pixel sprite ถ้าโหลดแล้ว ไม่งั้น fallback เป็น emoji */
UI.itemIcon = function (itemId, px) {
  const it = GameData.items[itemId];
  px = px || 32;
  // ใช้ pixel sprite ถ้ามีในชีต ไม่งั้น fallback เป็น emoji ให้เห็นเสมอ
  if (typeof Sprites !== "undefined" && Sprites.ready && Sprites.man && Sprites.man.items && Sprites.man.items.map[itemId])
    return Sprites.itemIcon(itemId, px);
  return `<span class="item-emoji" style="font-size:${Math.round(px * 0.7)}px;line-height:${px}px">${it ? it.icon : "❔"}</span>`;
};

/* สลับหน้าจอหลัก */
UI.showScreen = function (id) {
  UI.$$(".screen").forEach((s) => s.classList.remove("active"));
  const el = document.getElementById("screen-" + id);
  if (el) el.classList.add("active");
  State.screen = id;
};

/* toast แจ้งเตือนสั้นๆ */
let toastTimer = null;
UI.toast = function (msg) {
  const t = UI.$("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
};

/* อัปเดตแถบ HUD บนแผนที่ */
UI.updateHud = function () {
  const p = State.player;
  if (!p) return;
  UI.$("#hud-name").textContent = p.name;
  UI.$("#hud-level").textContent = p.level;
  UI.$("#hud-gold").textContent = p.gold;

  // อาชีพ + พอร์เทรตฮีโร่
  const cls = GameData.classes.find((c) => c.id === p.classId);
  const clsEl = UI.$("#hud-class");
  if (clsEl && cls) clsEl.textContent = cls.name;
  const port = UI.$("#hud-portrait");
  if (port && typeof Sprites !== "undefined" && Sprites.ready) {
    const style = Sprites.heroPortraitStyle(p.classId, 54);
    if (style) port.setAttribute("style", style);
  }

  const need = GameData.expForLevel(p.level);
  UI.setBar("#bar-hp", p.hp, p.maxHp);
  UI.setBar("#bar-mp", p.mp, p.maxMp);
  UI.setBar("#bar-exp", p.exp, need);
  UI.$("#txt-hp").textContent = `❤ ${p.hp}/${p.maxHp}`;
  UI.$("#txt-mp").textContent = `✦ ${p.mp}/${p.maxMp}`;
  UI.$("#txt-exp").textContent = `★ ${p.exp}/${need}`;

  // แถบบทเนื้อเรื่อง
  const tab = UI.$("#chapter-tab");
  if (tab && typeof Story !== "undefined") {
    const st2 = Story.stage(p);
    if (st2) { tab.textContent = `องก์ ${st2.chapter} · ${st2.title}`; tab.classList.add("show"); }
    else { tab.textContent = "✦ จบเนื้อเรื่องแล้ว"; tab.classList.add("show"); }
  }
};

UI.setBar = function (sel, cur, max) {
  const el = UI.$(sel);
  if (!el) return;
  const pct = Math.max(0, Math.min(100, (cur / max) * 100));
  el.style.width = pct + "%";
};

/* map ชื่อผู้พูด -> id สำหรับพอร์เทรต */
UI.speakerPortrait = function (speaker) {
  if (typeof SP === "undefined") return null;
  const map = {};
  map[SP.rowan] = { t: "npc", id: "elder" };
  map[SP.doran] = { t: "npc", id: "guard" };
  map[SP.merric] = { t: "npc", id: "merchant" };
  map[SP.anselm] = { t: "npc", id: "healer" };
  map[SP.pip] = { t: "npc", id: "pip" };
  map[SP.isolde] = { t: "npc", id: "isolde" };
  map[SP.grimm] = { t: "npc", id: "grimm" };
  map[SP.maeve] = { t: "npc", id: "maeve" };
  map[SP.nyx] = { t: "npc", id: "nyx" };
  map[SP.vheron] = { t: "npc", id: "vheron" };
  return map[speaker] || null;
};

UI.portraitHtml = function (speaker) {
  if (typeof Sprites === "undefined" || !Sprites.ready) return "";
  const info = UI.speakerPortrait(speaker);
  if (!info) return "";
  const style = Sprites.npcPortraitStyle(info.id, 58);
  if (!style) return "";
  return `<div class="dlg-portrait" style="${style}"></div>`;
};

/* ---------- บทสนทนาแบบ visual-novel ---------- */
UI.playDialogue = function (lines, done) {
  if (!lines || !lines.length) { done && done(); return; }
  const layer = UI.$("#dialogue");
  let i = 0;
  const render = () => {
    const ln = lines[i];
    const isNarr = (ln.s === "★" || !ln.s);
    const portrait = isNarr ? "" : UI.portraitHtml(ln.s);
    const name = isNarr ? "" : `<div class="dlg-name">${ln.s}</div>`;
    layer.innerHTML = `<div class="dlg-box ${isNarr ? "narr" : ""} ${portrait ? "has-portrait" : ""}">
        ${portrait}${name}<div class="dlg-text">${ln.t}</div><div class="dlg-next">▶ แตะเพื่อไปต่อ</div>
      </div>`;
  };
  const advance = () => {
    i++;
    if (i >= lines.length) { layer.classList.remove("open"); layer.onclick = null; done && done(); return; }
    if (typeof SFX !== "undefined") SFX.play("menu");
    render();
  };
  layer.classList.add("open");
  layer.onclick = advance;
  render();
};

/* ตัวเลือกทางแยกเนื้อเรื่อง */
UI.playChoice = function (prompt, options, big) {
  const layer = UI.$("#dialogue");
  layer.classList.add("open");
  layer.onclick = null;
  const btns = options.map((o, idx) =>
    `<button class="btn ${big ? "btn-primary" : ""}" data-ci="${idx}">${o.label}</button>`).join("");
  layer.innerHTML = `<div class="dlg-box choice">
      <div class="dlg-text">${prompt}</div>
      <div class="dlg-choices">${btns}</div></div>`;
  UI.$$("#dialogue [data-ci]").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      const o = options[+b.dataset.ci];
      layer.classList.remove("open"); layer.onclick = null;
      if (typeof SFX !== "undefined") SFX.play("select");
      o.on();
    })
  );
};

/* ---------- สมุดบันทึกเนื้อเรื่อง ---------- */
UI.openJournal = function () {
  const p = State.player;
  const st = Story.stage(p);
  let html = '<h2>📖 สมุดบันทึกเนื้อเรื่อง</h2>';
  if (!st) {
    html += '<p class="sub">เจ้าเดินทางจนจบเนื้อเรื่องแล้ว</p>';
    if (p.ending) html += `<div class="quest-card done"><b>${Story.ENDINGS[p.ending].title}</b></div>`;
  } else {
    html += `<p class="sub">องก์ ${st.chapter} · บทที่ ${p.storyStage + 1}/${Story.STAGES.length}</p>`;
    const ready = Story.complete(p, st);
    html += `<div class="quest-card ${ready && p.stageAccepted ? "ready" : ""}">
      <b>${st.title}</b> ${ready && p.stageAccepted ? '<span class="badge ok">พร้อมส่ง</span>' : ""}
      <p>${st.objective}</p>`;
    if (p.stageAccepted && ["hunt", "collect", "boss"].includes(st.type))
      html += `<small>ความคืบหน้า: ${Story.progressText(p, st)}</small>`;
    else if (!p.stageAccepted)
      html += `<small>ไปคุยกับ ${(GameData.npcs[st.giver] || {}).name || "ผู้ให้เควส"} เพื่อเริ่ม</small>`;
    html += `</div>`;
  }
  const shards = ["shard1", "shard2", "shard3", "shard4"]
    .map((s) => (State.countItem(p, s) > 0 ? GameData.items[s].icon : "▫️")).join("  ");
  html += `<p style="margin-top:14px;font-size:14px">เสี้ยวมงกุฎ: <b>${shards}</b></p>`;
  UI.openOverlay(html);
};

/* ---------- Overlay กลาง ---------- */
UI.openOverlay = function (html) {
  UI.$("#overlay-content").innerHTML = html;
  UI.$("#overlay").classList.add("open");
};
UI.closeOverlay = function () {
  UI.$("#overlay").classList.remove("open");
};

/* ---------- เมนูตัวละคร ---------- */
UI.openStats = function () {
  const p = State.player;
  const cls = GameData.classes.find((c) => c.id === p.classId);
  if (!p.equip) p.equip = State.emptyEquip();
  const wornCount = State.EQUIP_SLOTS.filter((s) => p.equip[s]).length;
  const w = p.equip.hand_r ? GameData.items[p.equip.hand_r].name : "— ไม่มี —";
  const a = p.equip.body ? GameData.items[p.equip.body].name : "— ไม่มี —";
  const pts = p.statPoints || 0;
  // ปุ่ม + สำหรับลงแต้ม (แสดงเมื่อมีแต้ม)
  const plus = (stat) => pts > 0 ? `<button class="statplus" data-stat="${stat}">+</button>` : "";
  const html = `
    <h2>${cls.icon} ${p.name}</h2>
    <p class="sub">${cls.name} · Lv.${p.level}</p>
    ${pts > 0 ? `<div class="points-banner">มีแต้มสเตตัส <b>${pts}</b> แต้ม — กดปุ่ม + เพื่ออัพ</div>` : ""}
    <div class="stat-grid">
      <div><span>HP</span><b>${p.hp}/${p.maxHp}</b>${plus("hp")}</div>
      <div><span>MP</span><b>${p.mp}/${p.maxMp}</b>${plus("mp")}</div>
      <div><span>ATK</span><b>${State.totalAtk(p)}</b>${plus("atk")}</div>
      <div><span>DEF</span><b>${State.totalDef(p)}</b>${plus("def")}</div>
      <div><span>SPD</span><b>${State.totalSpd(p)}</b>${plus("spd")}</div>
      <div><span>EXP</span><b>${p.exp}/${GameData.expForLevel(p.level)}</b></div>
    </div>
    <div class="equip-box">
      <p>🗡️ มือขวา: <b>${w}</b></p>
      <p>🛡️ ตัว: <b>${a}</b></p>
      <p style="color:var(--muted)">สวมใส่ทั้งหมด <b>${wornCount}/11</b> ช่อง (ดูรายละเอียดในกระเป๋า)</p>
    </div>
    <button class="btn btn-primary wide" id="open-skills">⚔ จัดการสกิล${(p.skillPoints || 0) > 0 ? ` (มีแต้ม ${p.skillPoints})` : ""}</button>
  `;
  UI.openOverlay(html);
  UI.$$(".statplus").forEach((b) => b.addEventListener("click", () => {
    if (State.allocateStat(p, b.dataset.stat)) {
      if (typeof SFX !== "undefined") SFX.play("select");
      UI.updateHud(); UI.openStats();
    }
  }));
  UI.$("#open-skills").addEventListener("click", UI.openSkills);
};

/* ---------- หน้าจัดการสกิล ---------- */
UI.openSkills = function () {
  const p = State.player;
  const sp = p.skillPoints || 0;
  const known = Object.keys(p.skills || {});
  let rows = known.map((sid) => {
    const s = GameData.skills[sid]; if (!s) return "";
    const lv = p.skills[sid], max = s.maxLv || 5;
    const canUp = sp > 0 && lv < max;
    const bar = `<span class="sk-lv">${"★".repeat(lv)}${"☆".repeat(max - lv)}</span>`;
    const btn = lv >= max
      ? `<span class="badge ok">สูงสุด</span>`
      : `<button class="btn tiny ${canUp ? "" : "disabled"}" data-up="${sid}" ${canUp ? "" : "disabled"}>อัพ (1 แต้ม)</button>`;
    return `<li>
      <span class="it-name"><b>${s.name}</b> ${bar}<small>${s.desc} · MP ${s.mp}</small></span>
      ${btn}
    </li>`;
  }).join("");
  if (!rows) rows = '<li class="empty">ยังไม่มีสกิล — ปลดล็อกด้วยตำราจากบอส/เควส/ร้านค้า</li>';
  UI.openOverlay(`<h2>⚔ สกิล</h2>
    <p class="sub">แต้มสกิล: <b>${sp}</b> · ปลดล็อกสกิลใหม่ด้วย 'ตำรา' (ดรอปจากบอส/ซื้อที่ร้าน)</p>
    <ul class="item-list">${rows}</ul>
    <button class="btn wide" id="back-stats">◂ กลับ</button>`);
  UI.$$("[data-up]").forEach((b) => b.addEventListener("click", () => {
    if (State.upgradeSkill(p, b.dataset.up)) {
      if (typeof SFX !== "undefined") SFX.play("levelup");
      UI.toast(`อัพสกิล ${GameData.skills[b.dataset.up].name} เป็น Lv.${p.skills[b.dataset.up]}`);
      UI.openSkills();
    }
  }));
  UI.$("#back-stats").addEventListener("click", UI.openStats);
};

/* ---------- กระเป๋า / ไอเทม ---------- */
UI.SLOT_LABEL = {
  head: "หัว", body: "ตัว", hand_l: "มือซ้าย", hand_r: "มือขวา", legs: "กางเกง", boots: "รองเท้า",
  necklace: "สร้อยคอ", ring1: "แหวน 1", ring2: "แหวน 2", earring1: "ตุ้มหู 1", earring2: "ตุ้มหู 2",
};
UI.SLOT_PH = {
  head: "🪖", body: "🛡️", hand_l: "🤚", hand_r: "🗡️", legs: "👖", boots: "🥾",
  necklace: "📿", ring1: "💍", ring2: "💍", earring1: "💠", earring2: "💠",
};
UI.SLOT_ORDER = ["head", "body", "legs", "boots", "hand_l", "hand_r", "necklace", "ring1", "ring2", "earring1", "earring2"];

UI.openInventory = function () {
  const p = State.player;
  if (!p.equip) p.equip = State.emptyEquip();

  // ---- ช่องสวมใส่ (ด้านบน) — 11 ช่อง ----
  const eqHtml = UI.SLOT_ORDER.map((slot) => {
    const id = p.equip[slot];
    if (id && GameData.items[id]) {
      const it = GameData.items[id];
      return `<button class="eq-slot filled" data-uneq="${slot}" data-id="${id}" title="แตะเพื่อถอด">
        <span class="eq-ic">${UI.itemIcon(id, 34)}</span>
        <span class="eq-lb">${UI.SLOT_LABEL[slot]}<small>${it.name}</small></span>
      </button>`;
    }
    return `<div class="eq-slot empty">
      <span class="eq-ic ph">${UI.SLOT_PH[slot]}</span>
      <span class="eq-lb">${UI.SLOT_LABEL[slot]}<small>— ว่าง —</small></span>
    </div>`;
  }).join("");

  // ---- กริดไอเทม (ภาพ + จำนวน) ----
  const cells = p.inventory.map((slot) => {
    const it = GameData.items[slot.id];
    if (!it) return "";
    const q = slot.qty > 1 ? `<span class="cell-q">${slot.qty}</span>` : "";
    return `<button class="inv-cell" data-id="${slot.id}">
      <span class="cell-ic">${UI.itemIcon(slot.id, 40)}</span>${q}
    </button>`;
  }).join("");
  const gridHtml = cells || '<p class="empty">กระเป๋าว่างเปล่า</p>';

  UI.openOverlay(`
    <h2>🎒 กระเป๋า</h2>
    <p class="inv-section">สวมใส่อยู่</p>
    <div class="equip-slots">${eqHtml}</div>
    <p class="inv-section">ไอเทม</p>
    <div class="inv-grid">${gridHtml}</div>
    <div class="inv-detail" id="inv-detail"><p class="hint">ชี้หรือแตะไอเทมเพื่อดูรายละเอียด</p></div>
  `);

  UI.$$("[data-uneq]").forEach((b) => {
    const show = () => UI.showItemDetail(b.dataset.id, b.dataset.uneq);
    b.addEventListener("mouseenter", show);
    b.addEventListener("click", show);
  });
  UI.$$(".inv-cell").forEach((b) => {
    const show = () => UI.showItemDetail(b.dataset.id, null);
    b.addEventListener("mouseenter", show);
    b.addEventListener("focus", show);
    b.addEventListener("click", show);
  });
};

/* แสดงรายละเอียดไอเทมในกล่องด้านล่าง + ปุ่มแอ็กชัน (equippedSlot != null = กำลังสวมอยู่) */
UI.showItemDetail = function (itemId, equippedSlot) {
  const box = UI.$("#inv-detail");
  if (!box) return;
  const it = GameData.items[itemId];
  if (!it) { box.innerHTML = '<p class="hint">—</p>'; return; }
  const TYPE_LABEL = { weapon: "อาวุธ (มือขวา)", armor: "เกราะ (ตัว)", helmet: "หมวก (หัว)",
    shield: "โล่ (มือซ้าย)", legs: "เกราะขา", boots: "รองเท้า", necklace: "สร้อยคอ", ring: "แหวน",
    earring: "ตุ้มหู", consume: "ของใช้", skillbook: "ตำราสกิล",
    petegg: "ไข่สัตว์เลี้ยง", petfood: "อาหารสัตว์", material: "วัตถุดิบ", key: "ไอเทมเนื้อเรื่อง" };
  const stat = TYPE_LABEL[it.type] || "";

  let act = "";
  if (equippedSlot) act = `<button class="btn tiny danger" id="inv-act" data-act="unequip" data-slot="${equippedSlot}">ถอด</button>`;
  else if (it.type === "consume") act = `<button class="btn tiny" id="inv-act" data-act="use">ใช้</button>`;
  else if (State.itemSlot(it)) act = `<button class="btn tiny" id="inv-act" data-act="equip">สวมใส่</button>`;
  else if (it.type === "skillbook") act = `<button class="btn tiny" id="inv-act" data-act="learn">เรียนรู้</button>`;
  else if (it.type === "petegg") act = `<button class="btn tiny" id="inv-act" data-act="hatch">ฟัก 🐣</button>`;
  else if (it.type === "petfood") act = `<button class="btn tiny" id="inv-act" data-act="feed">ให้อาหาร</button>`;

  box.innerHTML = `
    <div class="det-ic">${UI.itemIcon(itemId, 44)}</div>
    <div class="det-info">
      <b>${it.name}</b>
      ${stat ? `<span class="det-stat">${stat.trim()}</span>` : ""}
      <small>${it.desc || ""}</small>
    </div>
    ${act}`;

  const btn = UI.$("#inv-act");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const a = btn.dataset.act;
    if (a === "unequip") { UI.unequipSlot(btn.dataset.slot); UI.openInventory(); }
    else if (a === "use") { UI.useItem(itemId); UI.openInventory(); }
    else if (a === "equip") { UI.equipItem(itemId); UI.openInventory(); }
    else if (a === "learn") { UI.learnFromBook(itemId); UI.openInventory(); }
    else if (a === "hatch") { Pets.hatchEgg(itemId); }
    else if (a === "feed") { Pets.openMenu(); }
  });
};

/* ใช้ตำราสกิล — เรียนรู้สกิลใหม่ หรืออัพสกิลที่มีอยู่ */
UI.learnFromBook = function (itemId) {
  const p = State.player;
  const it = GameData.items[itemId];
  if (!it || it.type !== "skillbook") return;
  if (State.countItem(p, itemId) <= 0) return;
  const r = State.learnSkill(p, it.skill);
  if (r.maxed) { UI.toast("สกิลนี้เลเวลสูงสุดแล้ว"); if (typeof SFX !== "undefined") SFX.play("error"); return; }
  if (!r.ok) { UI.toast("เรียนไม่สำเร็จ"); return; }
  State.removeItem(p, itemId, 1);
  const sName = GameData.skills[it.skill].name;
  UI.toast(r.learned ? `📖 เรียนรู้สกิลใหม่: ${sName}!` : `📖 อัพ ${sName} เป็น Lv.${r.level}`);
  if (typeof SFX !== "undefined") SFX.play("levelup");
  if (typeof Game !== "undefined" && Game.autosave) Game.autosave("skill");
};

UI.useItem = function (itemId, inBattle) {
  const p = State.player;
  const it = GameData.items[itemId];
  if (!it || it.type !== "consume") return false;
  if (State.countItem(p, itemId) <= 0) return false;
  let used = false;
  if (it.heal) { p.hp = Math.min(p.maxHp, p.hp + it.heal); used = true; }
  if (it.mp)   { p.mp = Math.min(p.maxMp, p.mp + it.mp); used = true; }
  if (it.cure) { used = true; }
  if (used) {
    State.removeItem(p, itemId, 1);
    UI.toast(`ใช้ ${it.name}`);
    UI.updateHud();
  }
  return used;
};

/* หาช่องเป้าหมายจริง: ring/earring มี 2 ช่อง เลือกช่องว่างก่อน ไม่งั้นช่องแรก */
UI.resolveSlot = function (p, base) {
  if (base === "ring") return !p.equip.ring1 ? "ring1" : (!p.equip.ring2 ? "ring2" : "ring1");
  if (base === "earring") return !p.equip.earring1 ? "earring1" : (!p.equip.earring2 ? "earring2" : "earring1");
  return base;
};

/* สวมใส่: ย้ายไอเทมออกจากกระเป๋าไปช่องสวมใส่ (ของเดิมในช่องเด้งกลับกระเป๋า) */
UI.equipItem = function (itemId) {
  const p = State.player;
  const it = GameData.items[itemId];
  const base = State.itemSlot(it);
  if (!base) return;
  if (!p.equip) p.equip = State.emptyEquip();
  if (State.countItem(p, itemId) <= 0) return;
  const slot = UI.resolveSlot(p, base);
  const prev = p.equip[slot];
  State.removeItem(p, itemId, 1);      // ออกจากกระเป๋า
  if (prev) State.addItem(p, prev, 1); // ของเดิมกลับเข้ากระเป๋า
  p.equip[slot] = itemId;
  if (typeof SFX !== "undefined") SFX.play("select");
  UI.toast(`สวม ${it.name}`);
  UI.afterEquipChange();
};

/* ถอด: คืนไอเทมจากช่องสวมใส่กลับเข้ากระเป๋า */
UI.unequipSlot = function (slot) {
  const p = State.player;
  if (!p.equip) return;
  const id = p.equip[slot];
  if (!id) return;
  p.equip[slot] = null;
  State.addItem(p, id, 1);
  if (typeof SFX !== "undefined") SFX.play("menu");
  UI.toast(`ถอด ${GameData.items[id] ? GameData.items[id].name : ""}`);
  UI.afterEquipChange();
};

/* อัปเดตหลังเปลี่ยนอุปกรณ์: HUD + วาดตัวละครใหม่ + broadcast + เซฟ */
UI.afterEquipChange = function () {
  const p = State.player;
  UI.updateHud();
  if (typeof World !== "undefined" && World.draw && State.screen === "world") World.draw();
  if (typeof Net !== "undefined" && Net.sendState) Net.sendState("move");   // ให้คนอื่นเห็นชุดที่เปลี่ยน
  if (typeof Game !== "undefined" && Game.autosave) Game.autosave("equip");
};

/* ---------- เควส ---------- */
UI.openQuests = function () {
  const p = State.player;
  const active = Object.values(p.quests).filter((q) => q.state === "active");
  const done = Object.values(p.quests).filter((q) => q.state === "done");
  let html = "<h2>📜 สมุดเควส</h2>";

  if (!active.length && !done.length) {
    html += '<p class="empty">ยังไม่มีเควส ลองคุยกับ NPC ในเมือง</p>';
  }
  if (active.length) {
    html += '<h3 class="q-head">กำลังทำ</h3>';
    active.forEach((q) => {
      const def = GameData.quests[q.id];
      const ready = State.questComplete(q);
      html += `<div class="quest-card ${ready ? "ready" : ""}">
        <b>${def.title}</b> ${ready ? '<span class="badge ok">พร้อมส่ง</span>' : ""}
        <p>${def.desc}</p>
        <small>ความคืบหน้า: ${q.progress || 0}/${def.need}</small>
      </div>`;
    });
  }
  if (done.length) {
    html += '<h3 class="q-head">สำเร็จแล้ว</h3>';
    done.forEach((q) => {
      const def = GameData.quests[q.id];
      html += `<div class="quest-card done"><b>${def.title}</b> <span class="badge">✔</span></div>`;
    });
  }
  UI.openOverlay(html);
};

/* ---------- ไดอะล็อก NPC ---------- */
UI.openDialog = function (npc) {
  const p = State.player;

  // พ่อค้า -> ร้านค้า
  if (npc.shop) return UI.openShop(npc);

  // นักบวช -> ฟื้นฟู
  if (npc.heal) {
    const cost = 20;
    let body = `<div class="npc-line"><span class="npc-ic">${npc.icon}</span>
      <p>"ขอพรแห่งแสงสว่างรักษาเจ้า... ฟื้น HP/MP เต็ม ค่าทำบุญ ${cost} ทอง"</p></div>`;
    body += `<div class="dialog-actions">
      <button class="btn btn-primary" id="do-heal">รักษา (${cost}💰)</button>
      <button class="btn" id="do-close">ไว้ก่อน</button></div>`;
    UI.openOverlay(body);
    UI.$("#do-heal").addEventListener("click", () => {
      if (p.gold < cost) { UI.toast("ทองไม่พอ"); if (typeof SFX!=="undefined") SFX.play("error"); return; }
      p.gold -= cost; p.hp = p.maxHp; p.mp = p.maxMp;
      if (typeof SFX !== "undefined") SFX.play("heal");
      UI.updateHud(); UI.toast("ฟื้นฟูเต็มแล้ว!"); UI.closeOverlay();
    });
    UI.$("#do-close").addEventListener("click", UI.closeOverlay);
    return;
  }

  // NPC ที่มีเควส
  if (npc.quests) {
    UI.renderQuestGiver(npc);
    return;
  }

  UI.openOverlay(`<div class="npc-line"><span class="npc-ic">${npc.icon}</span><p>"สวัสดี ผู้เดินทาง"</p></div>`);
};

/* NPC ผู้ให้เควส */
UI.renderQuestGiver = function (npc) {
  const p = State.player;
  // หาเควสที่พร้อมส่งก่อน
  for (const qid of npc.quests) {
    const q = p.quests[qid];
    if (q && q.state === "active" && State.questComplete(q)) {
      const def = GameData.quests[qid];
      let body = `<div class="npc-line"><span class="npc-ic">${npc.icon}</span>
        <p>"เยี่ยมมาก! เจ้าทำสำเร็จแล้ว นี่คือรางวัลของเจ้า"</p></div>`;
      body += `<div class="dialog-actions"><button class="btn btn-primary" id="q-turnin">รับรางวัล</button></div>`;
      UI.openOverlay(body);
      UI.$("#q-turnin").addEventListener("click", () => {
        Game.completeQuest(qid);
        UI.closeOverlay();
      });
      return;
    }
  }
  // เควสที่รับได้
  for (const qid of npc.quests) {
    const q = p.quests[qid];
    const def = GameData.quests[qid];
    if (q && q.state === "active") continue; // กำลังทำอยู่
    if (q && q.state === "done") continue;    // ทำแล้ว
    if (def.requires && (!p.quests[def.requires] || p.quests[def.requires].state !== "done")) continue;
    let body = `<div class="npc-line"><span class="npc-ic">${npc.icon}</span>
      <p><b>${def.title}</b><br>"${def.desc}"</p></div>`;
    const rw = def.reward;
    const rwItem = rw.item ? ` + ${GameData.items[rw.item].name}` : "";
    body += `<p class="reward">รางวัล: ${rw.exp} EXP, ${rw.gold}💰${rwItem}</p>`;
    body += `<div class="dialog-actions">
      <button class="btn btn-primary" id="q-accept">รับเควส</button>
      <button class="btn" id="q-no">ไว้ก่อน</button></div>`;
    UI.openOverlay(body);
    UI.$("#q-accept").addEventListener("click", () => {
      p.quests[qid] = { id: qid, state: "active", progress: 0 };
      UI.toast(`รับเควส: ${def.title}`);
      UI.closeOverlay();
    });
    UI.$("#q-no").addEventListener("click", UI.closeOverlay);
    return;
  }
  // ไม่มีเควสให้
  let inProgress = npc.quests.some((qid) => p.quests[qid] && p.quests[qid].state === "active");
  const line = inProgress ? "เควสยังไม่เสร็จนะ รีบไปจัดการซะ!" : "ตอนนี้ยังไม่มีงานให้เจ้า กลับมาใหม่ภายหลัง";
  UI.openOverlay(`<div class="npc-line"><span class="npc-ic">${npc.icon}</span><p>"${line}"</p></div>`);
};

/* ---------- ร้านค้า ---------- */
UI.openShop = function (npc) {
  const p = State.player;
  const render = () => {
    let rows = npc.shop.map((id) => {
      const it = GameData.items[id];
      return `<li>
        <span class="it-ic">${UI.itemIcon(it.id)}</span>
        <span class="it-name">${it.name}<small>${it.desc || ""}</small></span>
        <span class="it-price">${it.price}💰</span>
        <button class="btn tiny" data-buy="${id}">ซื้อ</button>
      </li>`;
    }).join("");
    UI.openOverlay(`<h2>🏪 ร้านค้า</h2>
      <p class="sub">ทองของเจ้า: <b>${p.gold}💰</b></p>
      <ul class="item-list shop">${rows}</ul>
      <p class="hint">ขายของ: ไปที่กระเป๋า (ได้ราคาครึ่งหนึ่ง)</p>`);
    UI.$$("[data-buy]").forEach((b) =>
      b.addEventListener("click", () => { UI.buy(b.dataset.buy); render(); })
    );
  };
  render();
};

UI.buy = function (itemId) {
  const p = State.player;
  const it = GameData.items[itemId];
  if (p.gold < it.price) { UI.toast("ทองไม่พอ"); return; }
  p.gold -= it.price;
  State.addItem(p, itemId, 1);
  UI.updateHud();
  if (typeof SFX !== "undefined") SFX.play("coin");
  UI.toast(`ซื้อ ${it.name}`);
};

window.UI = UI;
