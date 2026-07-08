/* ============================================================
 * Aetheria RPG — Backend Server (Express)
 * Auth (register/login), cloud save, play history, เสิร์ฟไฟล์เกม
 * รันด้วย: node --experimental-sqlite server.js
 * ========================================================== */
require("dotenv").config();
const path = require("path");
const http = require("http");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { WebSocketServer } = require("ws");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || "aetheria-dev-secret-change-me";
const ROOT = path.join(__dirname, "..");

app.use(express.json({ limit: "1mb" }));

/* ---------- helpers ---------- */
function sign(user) {
  return jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: "30d" });
}
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "ต้องเข้าสู่ระบบก่อน" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" });
  }
}
function validCreds(username, password) {
  if (!username || typeof username !== "string" || username.length < 3 || username.length > 20)
    return "ชื่อผู้ใช้ต้องยาว 3–20 ตัวอักษร";
  if (!/^[a-zA-Z0-9_ก-๙.\-]+$/.test(username)) return "ชื่อผู้ใช้มีอักขระที่ไม่อนุญาต";
  if (!password || typeof password !== "string" || password.length < 4)
    return "รหัสผ่านต้องยาวอย่างน้อย 4 ตัวอักษร";
  return null;
}

/* ---------- auth ---------- */
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const err = validCreds(username, password);
    if (err) return res.status(400).json({ error: err });
    const exists = await db.getUserByName(username);
    if (exists) return res.status(409).json({ error: "มีชื่อผู้ใช้นี้แล้ว" });
    const hash = bcrypt.hashSync(password, 10);
    const user = await db.createUser(username, hash);
    await db.addHistory(user.id, "register", { username });
    res.json({ token: sign(user), user: { id: user.id, username: user.username } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "สมัครไม่สำเร็จ" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "กรอกข้อมูลให้ครบ" });
    const user = await db.getUserByName(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    await db.addHistory(user.id, "login", null);
    res.json({ token: sign(user), user: { id: user.id, username: user.username } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "เข้าสู่ระบบไม่สำเร็จ" });
  }
});

app.get("/api/me", auth, async (req, res) => {
  const user = await db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: "ไม่พบผู้ใช้" });
  res.json({ user });
});

/* ---------- cloud save ---------- */
app.put("/api/save", auth, async (req, res) => {
  try {
    const data = req.body && req.body.data;
    if (!data || typeof data !== "object") return res.status(400).json({ error: "ข้อมูลเซฟไม่ถูกต้อง" });
    await db.upsertSave(req.user.id, data);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "บันทึกไม่สำเร็จ" });
  }
});

app.get("/api/save", auth, async (req, res) => {
  const row = await db.getSave(req.user.id);
  if (!row) return res.status(404).json({ error: "ยังไม่มีข้อมูลเซฟบนคลาวด์" });
  res.json({ data: row.data, updated_at: row.updated_at });
});

/* ---------- play history ---------- */
app.post("/api/history", auth, async (req, res) => {
  try {
    const { event, detail } = req.body || {};
    if (!event || typeof event !== "string") return res.status(400).json({ error: "event ไม่ถูกต้อง" });
    await db.addHistory(req.user.id, event.slice(0, 40), detail || null);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "บันทึกประวัติไม่สำเร็จ" });
  }
});

app.get("/api/history", auth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
  const events = await db.getHistory(req.user.id, limit);
  res.json({ events });
});

app.get("/api/health", (req, res) => res.json({ ok: true, db: db.kind }));

/* ---------- static game ---------- */
app.use(express.static(ROOT));
app.get("/", (req, res) => res.sendFile(path.join(ROOT, "index.html")));

/* ============================================================
 * Multiplayer (WebSocket) — presence ต่อแผนที่ + แชทเรียลไทม์
 * ========================================================== */
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });
const clients = new Map();          // id -> { ws, id, name, map, x, y, cls }
let nextId = 1;

function send(c, obj) { try { if (c.ws.readyState === 1) c.ws.send(JSON.stringify(obj)); } catch (e) {} }
function broadcastAll(obj) { for (const c of clients.values()) send(c, obj); }
function rosterOfMap(map) {
  return [...clients.values()].filter((c) => c.map === map)
    .map((c) => ({ id: c.id, name: c.name, x: c.x, y: c.y, cls: c.cls,
      weapon: c.weapon || null, armor: c.armor || null,
      head: c.head || null, offhand: c.offhand || null, legs: c.legs || null, boots: c.boots || null }));
}
function broadcastMap(map) {
  if (!map) return;
  const list = rosterOfMap(map);
  for (const c of clients.values()) if (c.map === map) send(c, { type: "players", map, list });
}

wss.on("connection", (ws, req) => {
  const id = nextId++;
  let name = "ผู้เดินทาง";
  // ยืนยันตัวตนจาก token (ถ้ามี) ไม่งั้นเป็นผู้เล่นรับเชิญ
  try {
    const url = new URL(req.url, "http://x");
    const token = url.searchParams.get("token");
    if (token) { const u = jwt.verify(token, SECRET); name = u.username; }
    const guest = url.searchParams.get("name");
    if (name === "ผู้เดินทาง" && guest) name = guest.slice(0, 16) + "★";
  } catch (e) {}
  const c = { ws, id, name, map: null, x: 8, y: 8, cls: "warrior",
    weapon: null, armor: null, head: null, offhand: null, legs: null, boots: null };
  clients.set(id, c);
  send(c, { type: "welcome", id, name, online: clients.size });

  ws.on("message", (raw) => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (m.type === "join" || m.type === "move") {
      const oldMap = c.map;
      if (typeof m.name === "string" && m.name) c.name = m.name.slice(0, 16);
      c.map = m.map; c.x = m.x; c.y = m.y; c.cls = m.cls || c.cls;
      if ("weapon" in m) c.weapon = m.weapon;
      if ("armor" in m) c.armor = m.armor;
      if ("head" in m) c.head = m.head;
      if ("offhand" in m) c.offhand = m.offhand;
      if ("legs" in m) c.legs = m.legs;
      if ("boots" in m) c.boots = m.boots;
      if (oldMap && oldMap !== c.map) broadcastMap(oldMap);   // อัปเดตแมพเดิม
      broadcastMap(c.map);
    } else if (m.type === "chat") {
      const text = ("" + (m.text || "")).slice(0, 200).trim();
      if (text) broadcastAll({ type: "chat", id: c.id, name: c.name, text, ts: Date.now() });
    }
  });

  ws.on("close", () => {
    const map = c.map;
    clients.delete(id);
    broadcastMap(map);
  });
});

/* ---------- start ---------- */
(async () => {
  await db.init();
  server.listen(PORT, () => {
    console.log(`Aetheria server บน http://localhost:${PORT}  (db: ${db.kind}, ws: /ws)`);
  });
})();
