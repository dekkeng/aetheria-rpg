/* ============================================================
 * Aetheria RPG — Minimap (มุมซ้ายบน สไตล์ MMO)
 * วาด map.grid ย่อส่วนลง canvas เล็ก + จุดผู้เล่น/NPC/พอร์ทัล
 * ========================================================== */

const Minimap = {
  canvas: null, ctx: null,
  base: null,          // ภาพพื้นหลัง (วาดครั้งเดียวต่อแมพ)
  map: null,
  cell: 4,             // px ต่อช่อง
  lastDot: 0,
};

Minimap.init = function () {
  Minimap.canvas = document.getElementById("minimap-canvas");
  if (!Minimap.canvas) return;
  Minimap.ctx = Minimap.canvas.getContext("2d");
  // แตะ minimap -> เปิดแผนที่เต็ม + แผนที่โลก
  Minimap.canvas.style.cursor = "pointer";
  Minimap.canvas.title = "แตะเพื่อดูแผนที่เต็ม";
  Minimap.canvas.addEventListener("click", () => { if (typeof UI !== "undefined") UI.openMapView(); });
};

/* วาดแผนที่ลง canvas เป้าหมายที่ขนาด cell ใหญ่ (สำหรับหน้าต่างแผนที่เต็ม) */
Minimap.drawInto = function (target, map, maxPx) {
  const rows = map.grid.length, cols = map.grid[0].length;
  const cell = Math.max(3, Math.floor(maxPx / Math.max(cols, rows)));
  target.width = cols * cell; target.height = rows * cell;
  const c = target.getContext("2d");
  for (let r = 0; r < rows; r++) for (let cx = 0; cx < cols; cx++) {
    const t = GameData.tiles[map.grid[r][cx]];
    c.fillStyle = t ? Minimap.color(t) : "#000";
    c.fillRect(cx * cell, r * cell, cell, cell);
  }
  (map.portals || []).forEach((pt) => {
    c.fillStyle = pt.lock ? "#c8b25a" : "#69e0ff";
    c.fillRect(pt.x * cell, pt.y * cell, cell, cell);
  });
  // NPC (เฉพาะแมพปัจจุบัน ถ้าเป็นแมพที่ผู้เล่นอยู่)
  const isHere = State.player && State.player.map === map.id;
  (map.npcs || []).forEach((n) => {
    c.fillStyle = n.boss ? "#ff6a5e" : "#ffd76a";
    c.beginPath(); c.arc((n.x + 0.5) * cell, (n.y + 0.5) * cell, cell * 0.5, 0, 7); c.fill();
  });
  if (isHere) {
    const p = State.player;
    c.fillStyle = "#fff"; c.strokeStyle = "#6ee787"; c.lineWidth = 2;
    c.beginPath(); c.arc(p.fx * cell, p.fy * cell, cell * 0.6, 0, 7); c.fill(); c.stroke();
  }
  return cell;
};

/* สีของทายล์บนแผนที่ย่อ */
Minimap.color = function (tile) {
  return {
    grass: "#4d7a3a", tree: "#2c5228", water: "#2f5f95", floor: "#8d7a58",
    wild: "#5d8a42", cave: "#4a4252", wall: "#6b6675", snow: "#c3cede",
    ice: "#8fb4d4", lava: "#b34a22",
  }[tile.name] || tile.color || "#444";
};

/* สร้างภาพพื้นหลังใหม่ (เรียกเมื่อเปลี่ยนแมพ) */
Minimap.build = function (map) {
  if (!Minimap.canvas) Minimap.init();
  if (!Minimap.canvas || !map) return;
  Minimap.map = map;
  const rows = map.grid.length, cols = map.grid[0].length;
  const box = 132;                                   // ขนาดกรอบ CSS
  Minimap.cell = Math.max(2, Math.floor(Math.min(box / cols, box / rows)));
  const w = cols * Minimap.cell, h = rows * Minimap.cell;
  Minimap.canvas.width = w; Minimap.canvas.height = h;

  const off = document.createElement("canvas");
  off.width = w; off.height = h;
  const c = off.getContext("2d");
  for (let r = 0; r < rows; r++) {
    for (let cx = 0; cx < cols; cx++) {
      const t = GameData.tiles[map.grid[r][cx]];
      c.fillStyle = t ? Minimap.color(t) : "#000";
      c.fillRect(cx * Minimap.cell, r * Minimap.cell, Minimap.cell, Minimap.cell);
    }
  }
  // พอร์ทัล = จุดฟ้าสว่าง
  (map.portals || []).forEach((pt) => {
    c.fillStyle = pt.lock ? "#c8b25a" : "#69e0ff";
    c.fillRect(pt.x * Minimap.cell, pt.y * Minimap.cell, Minimap.cell, Minimap.cell);
  });
  Minimap.base = off;
};

/* วาดทับด้วยจุดที่ขยับ (ผู้เล่น/NPC/ผู้เล่นอื่น) — เรียกทุกเฟรมจาก Iso */
Minimap.tick = function () {
  if (!Minimap.ctx || !Minimap.base || !State.player) return;
  const now = performance.now();
  if (now - Minimap.lastDot < 120) return;           // ~8fps พอ
  Minimap.lastDot = now;
  const ctx = Minimap.ctx, cs = Minimap.cell;
  ctx.clearRect(0, 0, Minimap.canvas.width, Minimap.canvas.height);
  ctx.drawImage(Minimap.base, 0, 0);
  const map = Minimap.map;

  // NPC = จุดเหลือง, บอส = แดง
  (map.npcs || []).forEach((n) => {
    ctx.fillStyle = n.boss ? "#ff6a5e" : "#ffd76a";
    ctx.beginPath(); ctx.arc((n.x + 0.5) * cs, (n.y + 0.5) * cs, cs * 0.55, 0, 7); ctx.fill();
  });
  // ผู้เล่นคนอื่น = จุดม่วงอ่อน
  if (typeof Net !== "undefined" && Net.others) {
    ctx.fillStyle = "#b89aff";
    Net.others.forEach((o) => {
      ctx.beginPath(); ctx.arc((o.x + 0.5) * cs, (o.y + 0.5) * cs, cs * 0.5, 0, 7); ctx.fill();
    });
  }
  // ผู้เล่น = จุดขาวขอบเขียว (กะพริบเบาๆ)
  const p = State.player;
  const px = p.fx * cs, py = p.fy * cs;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#6ee787"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(px, py, cs * 0.65 + Math.sin(now / 300) * 0.5, 0, 7);
  ctx.fill(); ctx.stroke();
};

window.Minimap = Minimap;
