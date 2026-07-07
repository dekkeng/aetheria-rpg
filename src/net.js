/* ============================================================
 * Aetheria RPG — Multiplayer Client (WebSocket)
 * เชื่อมเซิร์ฟเวอร์, ส่งตำแหน่ง, รับผู้เล่นอื่นบนแมพเดียวกัน + แชท
 * ========================================================== */

const Net = {
  ws: null,
  id: null,
  connected: false,
  online: 0,
  others: [],          // ผู้เล่นอื่นบนแมพปัจจุบัน [{id,name,x,y,cls}]
  lastSend: 0,
  onChat: null,        // callback(msg) จาก UI แชท
  enabled: true,       // อนุญาตให้เชื่อมต่อ (ปิดเมื่อออกจากระบบ)
};

Net.url = function () {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  let u = proto + "//" + location.host + "/ws";
  const params = [];
  if (Auth.token) params.push("token=" + encodeURIComponent(Auth.token));
  const nm = State.player ? State.player.name : "ผู้เดินทาง";
  params.push("name=" + encodeURIComponent(nm));
  if (params.length) u += "?" + params.join("&");
  return u;
};

Net.connect = function () {
  if (!Auth.online || !Net.enabled) return;  // ไม่มีเซิร์ฟเวอร์/ปิดอยู่ = เล่นเดี่ยว
  if (Net.ws && (Net.ws.readyState === 0 || Net.ws.readyState === 1)) return;
  try { Net.ws = new WebSocket(Net.url()); } catch (e) { return; }

  Net.ws.onopen = () => { Net.connected = true; Net.sendState("join"); };
  Net.ws.onclose = () => {
    Net.connected = false; Net.others = [];
    if (Net.enabled) setTimeout(Net.connect, 4000);   // reconnect เฉพาะเมื่อยังเปิดอยู่
  };
  Net.ws.onerror = () => {};
  Net.ws.onmessage = (ev) => {
    let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
    if (m.type === "welcome") { Net.id = m.id; Net.online = m.online; }
    else if (m.type === "players") {
      if (State.player && m.map === State.player.map)
        Net.others = m.list.filter((pl) => pl.id !== Net.id);
    }
    else if (m.type === "chat") {
      Net.addBubble(m.id, m.text);       // ฟองแชทเหนือหัวตัวละคร
      if (Net.onChat) Net.onChat(m);     // แสดงในหน้าต่างแชทด้วย
    }
  };
};

Net.send = function (obj) {
  if (Net.ws && Net.ws.readyState === 1) { try { Net.ws.send(JSON.stringify(obj)); } catch (e) {} }
};

Net.sendState = function (type) {
  if (!State.player) return;
  const p = State.player;
  const eq = p.equip || {};
  Net.send({ type: type || "move", map: p.map, x: p.x, y: p.y, cls: p.classId, name: p.name,
             weapon: eq.weapon || null, armor: eq.armor || null });
};

/* เรียกจาก World.move — throttle การส่ง */
Net.moved = function () {
  const now = performance.now();
  if (now - Net.lastSend < 110) return;
  Net.lastSend = now;
  Net.sendState("move");
};

/* ---------- ฟองแชทเหนือหัว ---------- */
Net.bubbles = {};          // id -> [{ text, exp }]  (ใหม่สุดอยู่ท้าย array)
Net.BUBBLE_MS = 5000;      // แสดง 5 วินาที

Net.addBubble = function (id, text) {
  if (id == null) return;
  text = ("" + text).trim();
  if (!text) return;
  (Net.bubbles[id] || (Net.bubbles[id] = [])).push({ text, exp: performance.now() + Net.BUBBLE_MS });
  if (Net.bubbles[id].length > 4) Net.bubbles[id].shift();   // จำกัดสูงสุด 4 ฟอง/คน
  // เก็บกวาดฟองหมดอายุของทุกคน (กันหน่วยความจำรก)
  const now = performance.now();
  for (const k in Net.bubbles) {
    Net.bubbles[k] = Net.bubbles[k].filter((b) => b.exp > now);
    if (!Net.bubbles[k].length) delete Net.bubbles[k];
  }
};

/* คืนฟองที่ยังไม่หมดอายุของ id (เรียงเก่า->ใหม่) หรือ null */
Net.bubblesFor = function (id) {
  const arr = Net.bubbles[id];
  if (!arr || !arr.length) return null;
  const now = performance.now();
  const live = arr.filter((b) => b.exp > now);
  return live.length ? live : null;
};

Net.sendChat = function (text) {
  text = (text || "").trim();
  if (!text) return;
  Net.send({ type: "chat", text: text.slice(0, 200) });
};

/* ตัดการเชื่อมต่อ (ตอนออกจากระบบ) — ไม่ reconnect */
Net.disconnect = function () {
  Net.enabled = false;
  Net.others = [];
  Net.connected = false;
  try { if (Net.ws) Net.ws.close(); } catch (e) {}
  Net.ws = null;
};

window.Net = Net;
