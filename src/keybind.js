/* ============================================================
 * Aetheria RPG — Keybindings
 * ตั้งค่าปุ่มเองได้ เก็บใน State.player.keybinds (บันทึกไปกับเซฟ
 * ทั้ง local + cloud ต่อ user โดยอัตโนมัติ)
 * ใช้ e.code (ตำแหน่งปุ่มจริง) รองรับทุกภาษาคีย์บอร์ด
 * ========================================================== */

const Keybind = {};

/* แอ็กชันที่ตั้งปุ่มได้ + ปุ่มเริ่มต้น (2 ช่องต่อแอ็กชัน) */
Keybind.ACTIONS = [
  { id: "up",       label: "เดินขึ้น" },
  { id: "down",     label: "เดินลง" },
  { id: "left",     label: "เดินซ้าย" },
  { id: "right",    label: "เดินขวา" },
  { id: "interact", label: "คุย / โต้ตอบ" },
  { id: "chat",     label: "เปิดแชท" },
];

Keybind.DEFAULT = {
  up:       ["KeyW", "ArrowUp"],
  down:     ["KeyS", "ArrowDown"],
  left:     ["KeyA", "ArrowLeft"],
  right:    ["KeyD", "ArrowRight"],
  interact: ["Space", ""],
  chat:     ["Enter", "NumpadEnter"],
};

/* คืนตารางปุ่มปัจจุบัน (ของ player นี้ หรือค่าเริ่มต้น) — เติมช่องที่ขาด */
Keybind.get = function () {
  const saved = (typeof State !== "undefined" && State.player && State.player.keybinds) || null;
  const out = {};
  Keybind.ACTIONS.forEach((a) => {
    const def = Keybind.DEFAULT[a.id];
    const cur = saved && Array.isArray(saved[a.id]) ? saved[a.id] : def;
    out[a.id] = [cur[0] || "", cur[1] || ""];
  });
  return out;
};

/* แอ็กชันที่ปุ่ม code นี้ผูกอยู่ (หรือ null) */
Keybind.actionFor = function (code) {
  const binds = Keybind.get();
  for (const a of Keybind.ACTIONS) {
    if (binds[a.id][0] === code || binds[a.id][1] === code) return a.id;
  }
  return null;
};

/* ตั้งปุ่มช่อง slot (0/1) ของ action — ถอดปุ่มซ้ำจากที่อื่นก่อน */
Keybind.set = function (action, slot, code) {
  if (!State.player) return;
  const binds = Keybind.get();
  // ปุ่มเดียวห้ามซ้ำ 2 แอ็กชัน: ล้างออกจากช่องอื่นที่ใช้ code เดียวกัน
  if (code) {
    Keybind.ACTIONS.forEach((a) => {
      for (let s = 0; s < 2; s++) {
        if (binds[a.id][s] === code) binds[a.id][s] = "";
      }
    });
  }
  binds[action][slot] = code || "";
  State.player.keybinds = binds;
  Keybind.save();
};

Keybind.reset = function () {
  if (!State.player) return;
  const fresh = {};
  Keybind.ACTIONS.forEach((a) => { fresh[a.id] = Keybind.DEFAULT[a.id].slice(); });
  State.player.keybinds = fresh;
  Keybind.save();
};

/* บันทึก: local ทันที + คลาวด์ผ่าน autosave (throttle) */
Keybind.save = function () {
  if (typeof State !== "undefined" && State.save) State.save();
  if (typeof Game !== "undefined" && Game.autosave) Game.autosave("keybind");
};

/* ป้ายแสดงผลของปุ่ม (สำหรับ UI + ป้ายในเกม) */
Keybind.label = function (code) {
  if (!code) return "—";
  const map = {
    Space: "␣", Enter: "⏎", NumpadEnter: "⏎",
    ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→",
    ShiftLeft: "⇧", ShiftRight: "⇧", ControlLeft: "Ctrl", ControlRight: "Ctrl",
    AltLeft: "Alt", AltRight: "Alt", Tab: "⇥", Escape: "Esc", Backspace: "⌫",
  };
  if (map[code]) return map[code];
  let m = code.match(/^Key([A-Z])$/);
  if (m) return m[1];
  m = code.match(/^Digit(\d)$/);
  if (m) return m[1];
  m = code.match(/^Numpad(\d)$/);
  if (m) return "№" + m[1];
  return code;
};

window.Keybind = Keybind;
