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
  if (typeof Sprites !== "undefined" && Sprites.ready) return Sprites.itemIcon(itemId, px || 32);
  return `<span style="font-size:22px">${it ? it.icon : "❔"}</span>`;
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
  if (port && typeof Sprites !== "undefined" && Sprites.ready && Sprites.man.heroes) {
    const H = Sprites.man.heroes;
    const row = H.rows[p.classId + "_down"];
    if (row !== undefined) {
      const px = 66, scale = px / H.cell;
      port.style.backgroundImage = "url('assets/sprites/heroes.png')";
      port.style.backgroundRepeat = "no-repeat";
      port.style.backgroundSize = `${H.frames * H.cell * scale}px ${Object.keys(H.rows).length * H.cell * scale}px`;
      port.style.backgroundPosition = `-6px ${-row * H.cell * scale - 6}px`;
      port.style.imageRendering = "pixelated";
    }
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
  const w = p.equip.weapon ? GameData.items[p.equip.weapon].name : "— ไม่มี —";
  const a = p.equip.armor ? GameData.items[p.equip.armor].name : "— ไม่มี —";
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
      <div><span>SPD</span><b>${p.spd}</b>${plus("spd")}</div>
      <div><span>EXP</span><b>${p.exp}/${GameData.expForLevel(p.level)}</b></div>
    </div>
    <div class="equip-box">
      <p>🗡️ อาวุธ: <b>${w}</b></p>
      <p>🛡️ เกราะ: <b>${a}</b></p>
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
UI.openInventory = function () {
  const p = State.player;
  let rows = p.inventory
    .map((slot) => {
      const it = GameData.items[slot.id];
      if (!it) return "";
      let action = "";
      if (it.type === "consume") action = `<button class="btn tiny" data-use="${it.id}">ใช้</button>`;
      else if (it.type === "weapon") action = `<button class="btn tiny" data-equip="${it.id}">สวม</button>`;
      else if (it.type === "armor") action = `<button class="btn tiny" data-equip="${it.id}">สวม</button>`;
      else if (it.type === "skillbook") action = `<button class="btn tiny" data-learn="${it.id}">เรียนรู้</button>`;
      else if (it.type === "petegg") action = `<button class="btn tiny" data-hatch="${it.id}">ฟัก 🐣</button>`;
      else if (it.type === "petfood") action = `<button class="btn tiny" data-petmenu="1">ให้อาหาร</button>`;
      const equipped = (p.equip.weapon === it.id || p.equip.armor === it.id) ? ' <span class="badge">สวมอยู่</span>' : "";
      return `<li>
        <span class="it-ic">${UI.itemIcon(it.id)}</span>
        <span class="it-name">${it.name}${equipped}<small>${it.desc || ""}</small></span>
        <span class="it-qty">x${slot.qty}</span>
        ${action}
      </li>`;
    })
    .join("");
  if (!rows) rows = '<li class="empty">กระเป๋าว่างเปล่า</li>';
  UI.openOverlay(`<h2>🎒 กระเป๋า</h2><ul class="item-list">${rows}</ul>`);

  UI.$$("[data-use]").forEach((b) =>
    b.addEventListener("click", () => { UI.useItem(b.dataset.use); UI.openInventory(); })
  );
  UI.$$("[data-equip]").forEach((b) =>
    b.addEventListener("click", () => { UI.equipItem(b.dataset.equip); UI.openInventory(); })
  );
  UI.$$("[data-learn]").forEach((b) =>
    b.addEventListener("click", () => { UI.learnFromBook(b.dataset.learn); UI.openInventory(); })
  );
  UI.$$("[data-hatch]").forEach((b) =>
    b.addEventListener("click", () => Pets.hatchEgg(b.dataset.hatch))
  );
  UI.$$("[data-petmenu]").forEach((b) =>
    b.addEventListener("click", () => Pets.openMenu())
  );
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

UI.equipItem = function (itemId) {
  const p = State.player;
  const it = GameData.items[itemId];
  if (!it) return;
  if (it.type === "weapon") p.equip.weapon = itemId;
  else if (it.type === "armor") p.equip.armor = itemId;
  UI.toast(`สวม ${it.name}`);
  UI.updateHud();
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
