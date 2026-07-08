/* ============================================================
 * Aetheria RPG — Main / Bootstrap
 * เชื่อมทุกระบบเข้าด้วยกัน, จัดการ event, เริ่มเกม
 * ========================================================== */

const Game = {};
let selectedClass = "warrior";

/* ---------- เริ่มต้น ---------- */
Game.init = function () {
  if (typeof Art !== "undefined") Art.mount();
  World.init();
  Sprites.load(function () { if (State.screen === "world") World.draw(); });
  Sprites.startLoop();          // ลูป animation กลาง (idle ขยับตลอด)
  Auth.init().then(Game.renderAccount);   // ตรวจ backend + กู้เซสชัน
  // Autosave: ทุก 30 วิ + ตอนปิด/สลับแท็บ
  setInterval(() => { if (State.player && State.screen !== "title") Game.autosave("interval"); }, 30000);
  window.addEventListener("beforeunload", () => { if (State.player) State.save(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && State.player) Game.autosave("hidden"); });
  Game.bindTitle();
  Game.bindCreate();
  Game.bindWorld();
  Game.bindBattle();
  Game.bindOverlay();
  Game.bindKeyboard();
  Game.bindSound();
  Game.bindChat();

  // ปุ่ม "เล่นต่อ" ใช้ได้เมื่อมีเซฟ (local)
  UI.$("#btn-continue").disabled = !State.hasSave();
  UI.showScreen("title");
};

/* ---------- แชท multiplayer ---------- */
Game.chatOpen = false;
Game.bindChat = function () {
  const panel = UI.$("#chat-panel");
  const badge = UI.$("#chat-badge");
  const msgs = UI.$("#chat-msgs");
  const input = UI.$("#chat-text");

  const openChat = () => {
    Game.chatOpen = true; panel.classList.add("open");
    badge.classList.remove("show"); badge.textContent = "";
    setTimeout(() => input.focus(), 50);
  };
  const closeChat = () => { Game.chatOpen = false; panel.classList.remove("open"); input.blur(); };
  Game.openChat = openChat;    // ให้คีย์บอร์ด (Enter) เรียกได้
  Game.closeChat = closeChat;
  UI.$("#chat-toggle").addEventListener("click", () => (Game.chatOpen ? closeChat() : openChat()));
  UI.$("#chat-close").addEventListener("click", closeChat);

  const send = () => {
    const t = input.value.trim();
    if (!t) return;
    if (!Net.connected) { Game.addChat({ name: "ระบบ", text: "ยังไม่ได้เชื่อมต่อเซิร์ฟเวอร์", sys: true }); return; }
    Net.sendChat(t); input.value = "";
  };
  UI.$("#chat-send").addEventListener("click", send);
  // Enter = ส่ง (ถ้ามีข้อความ) แล้วปิดกล่องแชท · Esc = ปิดเฉยๆ · คีย์อื่นกันไม่ให้ขยับตัวละคร
  input.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") { send(); closeChat(); e.preventDefault(); }
    else if (e.key === "Escape") { closeChat(); e.preventDefault(); }
  });

  // รับข้อความจากเซิร์ฟเวอร์
  Net.onChat = (m) => Game.addChat(m);

  // อัปเดตจำนวนออนไลน์เป็นระยะ
  setInterval(() => {
    const on = UI.$("#chat-online");
    if (on && typeof Net !== "undefined") {
      const n = (Net.others ? Net.others.length : 0) + (Net.connected ? 1 : 0);
      on.textContent = (Net.connected ? "🟢 " : "⚪ ") + n + " ในแมพนี้";
    }
  }, 1500);
};

Game.addChat = function (m) {
  const msgs = UI.$("#chat-msgs");
  if (!msgs) return;
  const div = document.createElement("div");
  div.className = "cm" + (m.sys ? " sys" : "");
  div.innerHTML = m.sys ? m.text : `<span class="who">${Game.esc(m.name)}:</span> ${Game.esc(m.text)}`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  while (msgs.children.length > 80) msgs.removeChild(msgs.firstChild);
  if (!Game.chatOpen && !m.sys) {
    const badge = UI.$("#chat-badge");
    badge.classList.add("show");
    badge.textContent = Math.min(99, (parseInt(badge.textContent, 10) || 0) + 1);
  }
};
Game.esc = function (s) {
  return ("" + s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
};

/* เสียง: ปลดล็อก audio หลังคลิกแรก + ปุ่มเปิด/ปิด */
Game.bindSound = function () {
  const unlock = () => { SFX.unlock(); if (typeof Music !== "undefined") Music.autostart(); };
  document.addEventListener("pointerdown", unlock, { once: false });
  document.addEventListener("keydown", unlock, { once: false });
  const btn = UI.$("#sound-toggle");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const on = SFX.toggle();
    btn.textContent = on ? "🔊" : "🔈";
    btn.classList.toggle("off", !on);
    if (typeof Music !== "undefined") { if (on) { Music.autostart(); SFX.play("select"); } else Music.stop(); }
  });
};

/* ---------- หน้าไตเติล ---------- */
Game.bindTitle = function () {
  UI.$("#btn-new").addEventListener("click", () => {
    Game.renderClassList();
    UI.showScreen("create");
  });
  UI.$("#btn-continue").addEventListener("click", Game.continueGame);
  UI.$("#btn-auth").addEventListener("click", Game.openAuth);
};

/* เล่นต่อ: ลองโหลดจากคลาวด์ก่อน (ถ้าล็อกอิน) ไม่งั้นใช้ local */
Game.continueGame = async function () {
  if (Auth.isLoggedIn()) {
    const cloud = await Auth.cloudLoad();
    if (cloud) {
      State.player = cloud;
      State.ensureProgression(State.player);
      State.save();               // sync ลง local ด้วย
      Game.enterWorld();
      UI.toast("☁ โหลดจากคลาวด์สำเร็จ");
      return;
    }
  }
  if (State.load()) {
    Game.enterWorld();
    UI.toast("โหลดเกมสำเร็จ");
  } else {
    UI.toast("ไม่มีข้อมูลเซฟ");
  }
};

/* แสดงสถานะบัญชีบนหน้าไตเติล */
Game.renderAccount = function () {
  const box = UI.$("#account-box");
  if (!Auth.online) {
    box.innerHTML = '<span class="who">โหมดออฟไลน์</span> — เซฟในเครื่องนี้เท่านั้น';
    UI.$("#btn-continue").disabled = !State.hasSave();
    return;
  }
  if (Auth.isLoggedIn()) {
    box.innerHTML =
      `👤 <span class="who">${Auth.user.username}</span><br>` +
      `<button id="btn-history" class="btn small">ประวัติการเล่น</button> ` +
      `<button id="btn-logout" class="btn small">ออกจากระบบ</button>`;
    UI.$("#btn-history").addEventListener("click", Game.openHistory);
    UI.$("#btn-logout").addEventListener("click", () => {
      Auth.logout(); Game.renderAccount(); UI.toast("ออกจากระบบแล้ว");
    });
    UI.$("#btn-continue").disabled = false; // มีคลาวด์เซฟให้ลองเสมอ
  } else {
    box.innerHTML = '<button id="btn-auth2" class="btn small">เข้าสู่ระบบ / สมัคร</button>' +
      '<br><small style="color:var(--muted)">เข้าสู่ระบบเพื่อเซฟข้ามเครื่อง + เก็บประวัติ</small>';
    UI.$("#btn-auth2").addEventListener("click", Game.openAuth);
    UI.$("#btn-continue").disabled = !State.hasSave();
  }
};

/* ฟอร์มเข้าสู่ระบบ / สมัคร */
Game.openAuth = function () {
  if (!Auth.online) { UI.toast("ต่อเซิร์ฟเวอร์ไม่ได้ — เล่นแบบออฟไลน์ได้เลย"); return; }
  let mode = "login";
  const render = () => {
    UI.openOverlay(`
      <h2>บัญชีผู้เล่น</h2>
      <div class="auth-tabs">
        <button class="btn ${mode==="login"?"act":""}" data-mode="login">เข้าสู่ระบบ</button>
        <button class="btn ${mode==="register"?"act":""}" data-mode="register">สมัครใหม่</button>
      </div>
      <label class="field"><span>ชื่อผู้ใช้</span><input id="au-user" type="text" maxlength="20" autocomplete="username" /></label>
      <label class="field"><span>รหัสผ่าน</span><input id="au-pass" type="password" maxlength="40" autocomplete="current-password" /></label>
      <p class="auth-err" id="au-err"></p>
      <button class="btn btn-primary wide" id="au-submit">${mode==="login"?"เข้าสู่ระบบ":"สมัครและเข้าสู่ระบบ"}</button>
    `);
    UI.$$("[data-mode]").forEach((b) => b.addEventListener("click", () => { mode = b.dataset.mode; render(); }));
    UI.$("#au-submit").addEventListener("click", submit);
    UI.$("#au-pass").addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
  };
  const submit = async () => {
    const u = UI.$("#au-user").value.trim();
    const p = UI.$("#au-pass").value;
    const err = UI.$("#au-err");
    err.textContent = "";
    try {
      if (mode === "login") await Auth.login(u, p);
      else await Auth.register(u, p);
      if (typeof SFX !== "undefined") SFX.play("select");
      UI.closeOverlay();
      Game.renderAccount();
      UI.toast(`ยินดีต้อนรับ ${Auth.user.username}!`);
    } catch (e) {
      err.textContent = e.message;
      if (typeof SFX !== "undefined") SFX.play("error");
    }
  };
  render();
};

/* ดูประวัติการเล่นจากเซิร์ฟเวอร์ */
Game.openHistory = async function () {
  UI.openOverlay('<h2>📖 ประวัติการเล่น</h2><p class="sub">กำลังโหลด...</p>');
  const events = await Auth.history(40);
  const label = {
    register: "สมัครสมาชิก", login: "เข้าสู่ระบบ", new_game: "เริ่มเกมใหม่",
    save: "บันทึกเกม", level_up: "เลเวลอัพ", boss_defeated: "ปราบบอส", quest_done: "ทำเควสสำเร็จ",
  };
  let rows = events.map((e) => {
    const name = label[e.event] || e.event;
    let extra = "";
    if (e.detail) {
      if (e.detail.level) extra = ` Lv.${e.detail.level}`;
      else if (e.detail.name) extra = ` ${e.detail.name}`;
      else if (e.detail.boss) extra = ` ${e.detail.boss}`;
      else if (e.detail.title) extra = ` ${e.detail.title}`;
    }
    return `<li><span class="ev">${name}${extra}</span><time>${(e.created_at||"").replace("T"," ").slice(0,16)}</time></li>`;
  }).join("");
  if (!rows) rows = '<li>ยังไม่มีประวัติ</li>';
  UI.openOverlay(`<h2>📖 ประวัติการเล่น</h2><p class="sub">ผู้เล่น: ${Auth.user.username}</p><ul class="hist-list">${rows}</ul>`);
};

/* ---------- หน้าสร้างตัวละคร ---------- */
Game.renderClassList = function () {
  const list = UI.$("#class-list");
  list.innerHTML = GameData.classes.map((c) => `
    <button class="class-card ${c.id === selectedClass ? "sel" : ""}" data-class="${c.id}">
      <span class="cc-ic">${c.icon}</span>
      <b>${c.name}</b>
      <small>${c.desc}</small>
      <div class="cc-stats">HP ${c.base.maxHp} · MP ${c.base.maxMp} · ATK ${c.base.atk} · DEF ${c.base.def}</div>
    </button>
  `).join("");
  UI.$$("[data-class]").forEach((b) =>
    b.addEventListener("click", () => {
      selectedClass = b.dataset.class;
      Game.renderClassList();
    })
  );
};

Game.bindCreate = function () {
  UI.$("#btn-start").addEventListener("click", () => {
    const name = UI.$("#hero-name").value.trim() || "ผู้กล้า";
    State.player = State.createPlayer(name, selectedClass);
    State.save();
    if (Auth.isLoggedIn()) { Auth.cloudSave(State.player); Auth.log("new_game", { name, class: selectedClass }); }
    if (typeof SFX !== "undefined") SFX.play("select");
    Game.enterWorld();
    setTimeout(() => UI.playDialogue(Story.intro()), 400);   // ฉากเปิดเรื่อง
  });
};

/* ---------- Autosave (บันทึกอัตโนมัติเสมอ) ---------- */
Game._lastCloud = 0;
Game.autosave = function (reason) {
  if (!State.player) return;
  State.save();                                   // local ทันทีเสมอ
  const now = Date.now();
  if (Auth.isLoggedIn() && now - Game._lastCloud > 12000) {
    Game._lastCloud = now;
    Auth.cloudSave(State.player).catch(() => {});  // คลาวด์ (throttle 12 วิ)
  }
  Game.flashSaved();
};
Game.flashSaved = function () {
  const el = UI.$("#save-indicator");
  if (!el) return;
  el.classList.add("show");
  clearTimeout(Game._saveTimer);
  Game._saveTimer = setTimeout(() => el.classList.remove("show"), 1200);
};

/* บันทึกเกม: local เสมอ + คลาวด์ถ้าล็อกอิน + log ประวัติ */
Game.saveGame = async function () {
  const okLocal = State.save();
  if (Auth.isLoggedIn()) {
    try {
      await Auth.cloudSave(State.player);
      Auth.log("save", { level: State.player.level });
      UI.toast("☁ บันทึกลงคลาวด์แล้ว");
    } catch (e) {
      UI.toast(okLocal ? "💾 บันทึกในเครื่อง (คลาวด์พลาด)" : "บันทึกไม่สำเร็จ");
    }
  } else {
    UI.toast(okLocal ? "💾 บันทึกเกมแล้ว" : "บันทึกไม่สำเร็จ");
  }
};

/* ยืนยันก่อนออกจากระบบ */
Game.confirmLogout = function () {
  const logged = (typeof Auth !== "undefined") && Auth.isLoggedIn();
  const msg = logged
    ? `ออกจากระบบบัญชี '${Auth.user.username}'? (เกมถูกบันทึกอัตโนมัติแล้ว)`
    : "กลับสู่หน้าเมนูหลัก? (เกมถูกบันทึกอัตโนมัติแล้ว)";
  UI.playChoice(msg, [
    { label: "✔ ยืนยันออกจากระบบ", on: () => Game.logout() },
    { label: "✕ ยกเลิก", on: () => {} },
  ]);
};

/* ออกจากระบบ: บันทึก -> ตัดการเชื่อมต่อ -> กลับหน้าไตเติล */
Game.logout = function () {
  Game.autosave && Game.autosave("logout");
  if (typeof World !== "undefined" && World.clearInput) World.clearInput();
  if (typeof Net !== "undefined" && Net.disconnect) Net.disconnect();
  if (typeof Auth !== "undefined" && Auth.isLoggedIn()) Auth.logout();
  UI.closeOverlay && UI.closeOverlay();
  UI.showScreen("title");
  if (typeof Music !== "undefined") Music.play("calm");
  Game.renderAccount();
  UI.$("#btn-continue").disabled = !State.hasSave();
  UI.toast("ออกจากระบบแล้ว");
};

/* ---------- เข้าสู่โลก ---------- */
Game.enterWorld = function () {
  UI.showScreen("world");
  UI.updateHud();
  if (typeof Art !== "undefined") Art.applyZoneMood(State.player.map);
  if (typeof Music !== "undefined") Music.playForMap(State.player.map);
  World.resize();
  World.resume();
  World.draw();
  UI.$("#btn-continue").disabled = !State.hasSave();
  if (typeof Net !== "undefined") { Net.enabled = true; Net.connect(); setTimeout(() => Net.sendState("join"), 600); }
};

/* ---------- ปุ่มบนแผนที่ ---------- */
Game.bindWorld = function () {
  // D-pad แบบกดค้าง (รองรับทั้งเมาส์และสัมผัส)
  UI.$$(".dbtn[data-dir]").forEach((b) => {
    const dir = b.dataset.dir;
    const press = (e) => { e.preventDefault(); World.setInput(dir, true); b.classList.add("held"); };
    const release = (e) => { if (e) e.preventDefault(); World.setInput(dir, false); b.classList.remove("held"); };
    b.addEventListener("pointerdown", press);
    b.addEventListener("pointerup", release);
    b.addEventListener("pointerleave", release);
    b.addEventListener("pointercancel", release);
  });
  UI.$('.dbtn[data-act="interact"]').addEventListener("click", () => World.interact());

  // เมนู
  UI.$$('.menu-buttons [data-menu]').forEach((b) =>
    b.addEventListener("click", () => {
      const m = b.dataset.menu;
      if (typeof SFX !== "undefined") SFX.play("menu");
      if (m === "stats") UI.openStats();
      else if (m === "inventory") UI.openInventory();
      else if (m === "quests") UI.openJournal();
      else if (m === "pets") Pets.openMenu();
      else if (m === "save") Game.saveGame();
      else if (m === "logout") Game.confirmLogout();
    })
  );
};

/* ---------- ปุ่มต่อสู้ ---------- */
Game.bindBattle = function () {
  UI.$$('#battle-actions [data-battle]').forEach((b) =>
    b.addEventListener("click", () => {
      const a = b.dataset.battle;
      if (a === "attack") Battle.playerAttack();
      else if (a === "skill") Battle.openSkillMenu();
      else if (a === "item") Battle.openItemMenu();
      else if (a === "flee") Battle.playerFlee();
    })
  );
};

/* ---------- Overlay ---------- */
Game.bindOverlay = function () {
  UI.$("#overlay-close").addEventListener("click", UI.closeOverlay);
  UI.$("#overlay").addEventListener("click", (e) => {
    if (e.target.id === "overlay") UI.closeOverlay();
  });
};

/* ---------- คีย์บอร์ด (เล่นบน PC) ---------- */
Game.bindKeyboard = function () {
  const keyDir = (k) => ({
    ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down",
    ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right",
  }[k]);
  document.addEventListener("keydown", (e) => {
    if (State.screen !== "world") return;
    if (Game.chatOpen) return;                         // กำลังพิมพ์แชท ไม่คุมเกม
    if (e.key === "Enter") { if (Game.openChat) Game.openChat(); e.preventDefault(); return; }  // Enter = เปิดแชท
    const dir = keyDir(e.key);
    if (dir) { World.setInput(dir, true); e.preventDefault(); return; }
    if (e.key === " ") { World.interact(); e.preventDefault(); }   // Space = คุย/โต้ตอบ
  });
  document.addEventListener("keyup", (e) => {
    const dir = keyDir(e.key);
    if (dir) World.setInput(dir, false);
  });
  // ล้าง input เมื่อออกจากโฟกัส/สลับแท็บ (กันเดินค้าง)
  window.addEventListener("blur", () => World.clearInput());
  document.addEventListener("visibilitychange", () => { if (document.hidden) World.clearInput(); });
};

/* ---------- ส่งเควส / รับรางวัล ---------- */
Game.completeQuest = function (qid) {
  const p = State.player;
  const q = p.quests[qid];
  const def = GameData.quests[qid];
  if (!q || q.state !== "active" || !State.questComplete(q)) return;
  q.state = "done";
  if (typeof SFX !== "undefined") SFX.play("victory");
  if (typeof Auth !== "undefined") Auth.log("quest_done", { title: def.title });
  const rw = def.reward;
  const msgs = State.gainExp(p, rw.exp || 0);
  if (msgs.length && typeof SFX !== "undefined") setTimeout(() => SFX.play("levelup"), 500);
  p.gold += rw.gold || 0;
  if (rw.item) State.addItem(p, rw.item, 1);
  UI.updateHud();
  let txt = `เควสสำเร็จ! +${rw.exp} EXP, +${rw.gold}💰`;
  if (rw.item) txt += `, ${GameData.items[rw.item].name}`;
  UI.toast(txt);
  if (msgs.length) setTimeout(() => UI.toast(msgs[msgs.length - 1]), 1000);
};

window.Game = Game;
document.addEventListener("DOMContentLoaded", Game.init);
