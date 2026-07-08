/* ============================================================
 * Aetheria RPG — World / Overworld (logic เท่านั้น)
 * เดินอิสระแบบ pixel ต่อเนื่อง (ไม่เป็น grid), ชนกำแพง AABB,
 * พอร์ทัล/เจอศัตรู/คุย NPC ตามระยะ
 * การวาดภาพทั้งหมดอยู่ที่ src/iso.js (Phaser isometric renderer)
 * ========================================================== */

const World = {};

World.facing = "down";
World.lastMove = -9999;
World.movingNow = false;
World.input = { up: false, down: false, left: false, right: false };
World.walkDist = 0; World.encDist = 0;
World.portalCd = 0; World.locked = false;
World.petTrail = [];               // ประวัติตำแหน่งผู้เล่น (ให้สัตว์เดินตาม)
World.petPos = null;               // ตำแหน่งสัตว์เลี้ยงปัจจุบัน (ลื่นด้วย lerp)

World.init = function () {
  if (typeof Iso !== "undefined") Iso.init();
};

/* จอเพิ่งแสดง/ขนาดเปลี่ยน — ให้ Phaser คำนวณ scale ใหม่ */
World.resize = function () {
  if (typeof Iso !== "undefined") Iso.onShow();
};

World.currentMap = function () { return GameData.maps[State.player.map]; };
World.npcAt = function (map, x, y) { return (map.npcs || []).find((n) => n.x === x && n.y === y) || null; };
World.portalAt = function (map, x, y) { return (map.portals || []).find((pt) => pt.x === x && pt.y === y) || null; };

/* ช่องนี้ตันไหม (สำหรับการชน) */
World.solidAt = function (map, tx, ty) {
  if (ty < 0 || ty >= map.grid.length || tx < 0 || tx >= map.grid[0].length) return true;
  if (World.npcAt(map, tx, ty)) return true;
  if (World.portalAt(map, tx, ty)) return false;
  const t = GameData.tiles[map.grid[ty][tx]];
  return !(t && t.walk);
};

/* กล่องเท้าผู้เล่นชนกำแพงที่ตำแหน่ง (fx,fy) ไหม */
World.blockedBox = function (map, fx, fy) {
  const hw = 0.30, hh = 0.22;
  const cs = [[fx - hw, fy - hh], [fx + hw, fy - hh], [fx - hw, fy + hh], [fx + hw, fy + hh]];
  for (const [cx, cy] of cs) if (World.solidAt(map, Math.floor(cx), Math.floor(cy))) return true;
  return false;
};

/* ให้แน่ใจว่ามีตำแหน่งทศนิยม (รองรับเซฟเก่า) */
World.ensurePos = function (p) {
  if (typeof p.fx !== "number") p.fx = (p.x || 0) + 0.5;
  if (typeof p.fy !== "number") p.fy = (p.y || 0) + 0.5;
};

World.clearInput = function () {
  World.input.up = World.input.down = World.input.left = World.input.right = false;
  document.querySelectorAll(".dbtn.held").forEach((b) => b.classList.remove("held"));
};

World.setInput = function (dir, val) {
  if (dir in World.input) World.input[dir] = val;
};

/* กลับเข้าโลก: ปลดล็อก + ล้าง input */
World.resume = function () {
  World.locked = false; World.encDist = 0; World.walkDist = 0;
  World.clearInput();
  World.resize();
  World.resetPet();
};

/* รีเซ็ตตำแหน่งสัตว์เลี้ยงมาอยู่ข้างผู้เล่น */
World.resetPet = function () {
  const p = State.player;
  if (!p) return;
  World.ensurePos(p);
  World.petTrail = [];
  World.petPos = { x: p.fx - 0.7, y: p.fy + 0.15 };
};

/* ---------- อัปเดต logic (เรียกจาก Iso.tick ทุกเฟรม) ---------- */
World.update = function (dt) {
  const p = State.player;
  if (!p) return;
  World.ensurePos(p);
  const map = World.currentMap();
  dt = Math.min(dt, 60);                 // กันกระตุกเมื่อสลับแท็บ
  // ปุ่มคือทิศ "บนจอ" ตรงๆ (ขึ้น = ตัวละครเดินขึ้นจอ) — ไม่ผูกกับแกน grid
  const sxv = (World.input.right ? 1 : 0) - (World.input.left ? 1 : 0);
  const syv = (World.input.down ? 1 : 0) - (World.input.up ? 1 : 0);
  World.movingNow = !!(sxv || syv);

  if (World.movingNow) {
    // แปลงเวกเตอร์จอ -> เวกเตอร์ grid (isometric 2:1):
    // แกนจอ-x 1 หน่วย = grid (0.5,-0.5), แกนจอ-y 1 หน่วย = grid (1,1)
    const sl = Math.hypot(sxv, syv);
    const ux = sxv / sl, uy = syv / sl;
    let vx = ux * 0.5 + uy, vy = -ux * 0.5 + uy;
    const gl = Math.hypot(vx, vy) || 1;
    vx /= gl; vy /= gl;
    World.velX = vx; World.velY = vy;      // ให้ renderer ใช้หันหน้าตัวละคร
    if (Math.abs(sxv) >= Math.abs(syv)) World.facing = sxv > 0 ? "right" : "left";
    else World.facing = syv > 0 ? "down" : "up";

    const spd = 4.8 * (dt / 1000);       // ~4.8 ช่อง/วินาที
    const nfx = p.fx + vx * spd;
    if (!World.blockedBox(map, nfx, p.fy)) p.fx = nfx;
    const nfy = p.fy + vy * spd;
    if (!World.blockedBox(map, p.fx, nfy)) p.fy = nfy;
    World.lastMove = performance.now();

    p.x = Math.floor(p.fx); p.y = Math.floor(p.fy);

    // เสียงฝีเท้า
    World.walkDist += spd;
    if (World.walkDist > 0.55) { World.walkDist = 0; if (typeof SFX !== "undefined") SFX.play("step"); }
    if (typeof Net !== "undefined") Net.moved();

    // พอร์ทัล — เมื่อเข้าใกล้กลางช่องประตู
    if (performance.now() > World.portalCd) {
      const pt = World.portalAt(map, p.x, p.y);
      if (pt && Math.abs(p.fx - (p.x + 0.5)) < 0.4 && Math.abs(p.fy - (p.y + 0.5)) < 0.4) {
        World.portalCd = performance.now() + 1200; World.locked = true;
        World.enterPortal(pt); return;
      }
    }
    // สุ่มเจอศัตรูตามระยะที่เดินในโซนอันตราย
    const trow = map.grid[p.y], tile = trow ? GameData.tiles[trow[p.x]] : null;
    if (tile && tile.encounter && map.encounters && map.encounters.length) {
      World.encDist += spd;
      if (World.encDist > 7.0) {                 // เดินไกลขึ้นก่อนมีสิทธิ์เจอ
        World.encDist = 0;
        if (Math.random() < 0.4) { World.locked = true; Battle.start(World.rollEncounter(map)); return; }
      }
    }
  }

  // สัตว์เลี้ยงเดินตาม (trail + lerp)
  if (typeof Pets !== "undefined" && Pets.active(p)) {
    if (!World.petPos) World.resetPet();
    if (World.movingNow) {
      World.petTrail.push({ x: p.fx, y: p.fy });
      if (World.petTrail.length > 40) World.petTrail.shift();
    }
    // เป้าหมาย = ตำแหน่งผู้เล่นเมื่อ ~12 samples ก่อน (ห่างราว 1 ช่อง)
    const trail = World.petTrail;
    const target = trail.length > 12 ? trail[trail.length - 12] : { x: p.fx - 0.7, y: p.fy + 0.15 };
    const pk = Math.min(1, dt / 140);
    World.petPos.x += (target.x - World.petPos.x) * pk;
    World.petPos.y += (target.y - World.petPos.y) * pk;
  }
};

/* วาด: จัดการโดย Phaser (iso.js) — คงไว้เป็น no-op ให้โค้ดเก่าเรียกได้ */
World.draw = function () {};

World.rollEncounter = function (map) {
  const total = map.encounters.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of map.encounters) { r -= e.weight; if (r <= 0) return e.enemy; }
  return map.encounters[0].enemy;
};

World.enterPortal = function (pt) {
  const p = State.player;
  const lk = pt.lock;
  if (lk) {
    if (lk.flag && !(typeof Story !== "undefined" && Story.flag(p, lk.flag))) {
      UI.toast("🔒 " + (lk.msg || "ทางนี้ถูกปิดกั้น"));
      if (typeof SFX !== "undefined") SFX.play("error");
      World.locked = false; return;
    }
    if (lk.level && p.level < lk.level) {
      UI.toast(`🔒 ต้องถึงเลเวล ${lk.level} ก่อนจึงจะผ่านได้ (ตอนนี้ Lv.${p.level})`);
      if (typeof SFX !== "undefined") SFX.play("error");
      World.locked = false; return;
    }
  }
  if (typeof SFX !== "undefined") SFX.play("portal");
  const go = () => {
    p.map = pt.to; p.x = pt.tx; p.y = pt.ty; p.fx = pt.tx + 0.5; p.fy = pt.ty + 0.5;
    if (typeof Story !== "undefined") Story.onReach(p, pt.to);
    if (typeof Net !== "undefined") { Net.others = []; Net.sendState("move"); }
    if (typeof Art !== "undefined") Art.applyZoneMood(pt.to);
    if (typeof Music !== "undefined") Music.playForMap(pt.to);
    World.resume();
    UI.toast("➡ " + GameData.maps[pt.to].name);
    if (typeof Game !== "undefined" && Game.autosave) Game.autosave("map");
  };
  if (typeof FX !== "undefined") FX.transition(go, "#0a0916");
  else go();
};

/* คุยกับ NPC/บอส/ประตูที่อยู่ใกล้ที่สุด (ในรัศมี) */
World.interact = function () {
  if (State.screen !== "world") return;
  const p = State.player; World.ensurePos(p);
  const map = World.currentMap();
  let best = null, bestD = 1.5 * 1.5;   // รัศมี ~1.5 ช่อง
  (map.npcs || []).forEach((n) => {
    const dx = (n.x + 0.5) - p.fx, dy = (n.y + 0.5) - p.fy, d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = { type: "npc", n }; }
  });
  (map.portals || []).forEach((pt) => {
    const dx = (pt.x + 0.5) - p.fx, dy = (pt.y + 0.5) - p.fy, d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = { type: "portal", pt }; }
  });
  if (!best) { UI.toast("ไม่มีใครอยู่ใกล้ๆ"); return; }
  if (best.type === "portal") { World.locked = true; World.enterPortal(best.pt); return; }
  const npc = best.n;
  if (npc.boss) { Story.engageBoss(npc); return; }
  const def = GameData.npcs[npc.id] || { icon: "❓", name: "?" };
  if (def.shop) { UI.openShop(def); return; }
  if (def.heal) { UI.openDialog(def); return; }
  if (Story.interact(npc.id)) return;
  UI.openDialog(def);
};

window.World = World;
