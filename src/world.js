/* ============================================================
 * Aetheria RPG — World / Overworld
 * เดินอิสระแบบ pixel ต่อเนื่อง (ไม่เป็น grid), ชนกำแพง AABB,
 * กล้องตามลื่น, พอร์ทัล/เจอศัตรู/คุย NPC ตามระยะ
 * ========================================================== */

const World = {};

World.TILE = 44;
World.canvas = null;
World.ctx = null;
World.facing = "down";
World.lastMove = -9999;
World.movingNow = false;
World.input = { up: false, down: false, left: false, right: false };
World.camX = 0; World.camY = 0;          // มุมซ้ายบนของกล้อง (หน่วยช่อง, ทศนิยม)
World.walkDist = 0; World.encDist = 0;
World.portalCd = 0; World.locked = false;
World.petTrail = [];               // ประวัติตำแหน่งผู้เล่น (ให้สัตว์เดินตาม)
World.petPos = null;               // ตำแหน่งสัตว์เลี้ยงปัจจุบัน (ลื่นด้วย lerp)

World.init = function () {
  World.canvas = document.getElementById("map-canvas");
  World.ctx = World.canvas.getContext("2d");
  World.resize();
  window.addEventListener("resize", () => { World.resize(); if (State.screen === "world") World.draw(); });
};

/* ปรับขนาด canvas ให้เต็มพื้นที่ + คำนวณขนาดช่องตามจอ */
World.resize = function () {
  const stage = document.getElementById("world-stage");
  if (!stage || !World.canvas) return;
  const w = Math.max(320, stage.clientWidth || window.innerWidth);
  const h = Math.max(320, stage.clientHeight || window.innerHeight);
  World.canvas.width = w; World.canvas.height = h;
  World.canvas.style.width = w + "px"; World.canvas.style.height = h + "px";
  World.TILE = Math.max(36, Math.min(78, Math.round(Math.min(w, h) / 10.5)));
  World.snapCamera();
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

/* กลับเข้าโลก: ปลดล็อก + ล้าง input + snap กล้อง */
World.resume = function () {
  World.locked = false; World.encDist = 0; World.walkDist = 0;
  World.clearInput();
  World.resize();
  World.snapCamera();
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

/* กล้องเป้าหมาย (หน่วยช่อง) */
World.camTarget = function () {
  const map = World.currentMap();
  const T = World.TILE;
  const p = State.player; World.ensurePos(p);
  const vtx = World.canvas.width / T, vty = World.canvas.height / T;
  const cols = map.grid[0].length, rows = map.grid.length;
  let cx = p.fx - vtx / 2, cy = p.fy - vty / 2;
  cx = (cols <= vtx) ? (cols - vtx) / 2 : Math.max(0, Math.min(cx, cols - vtx));
  cy = (rows <= vty) ? (rows - vty) / 2 : Math.max(0, Math.min(cy, rows - vty));
  return { cx, cy };
};
World.snapCamera = function () {
  if (!State.player || !World.canvas) return;
  const t = World.camTarget(); World.camX = t.cx; World.camY = t.cy;
};

/* ---------- ลูปหลัก: อัปเดต + วาด ---------- */
World.tick = function (dt) {
  if (!World.locked) World.update(dt);
  World.draw();
};

World.update = function (dt) {
  const p = State.player;
  if (!p) return;
  World.ensurePos(p);
  const map = World.currentMap();
  dt = Math.min(dt, 60);                 // กันกระตุกเมื่อสลับแท็บ
  let vx = (World.input.right ? 1 : 0) - (World.input.left ? 1 : 0);
  let vy = (World.input.down ? 1 : 0) - (World.input.up ? 1 : 0);
  World.movingNow = !!(vx || vy);

  if (World.movingNow) {
    if (vx && vy) { const s = 0.7071; vx *= s; vy *= s; }
    if (Math.abs(vx) >= Math.abs(vy)) World.facing = vx > 0 ? "right" : "left";
    else World.facing = vy > 0 ? "down" : "up";

    const spd = 4.8 * (dt / 1000);       // ~4.8 ช่อง/วินาที
    const nfx = p.fx + vx * spd;
    if (!World.blockedBox(map, nfx, p.fy)) p.fx = nfx;
    const nfy = p.fy + vy * spd;
    if (!World.blockedBox(map, p.fx, nfy)) p.fy = nfy;
    World.lastMove = (typeof Sprites !== "undefined") ? Sprites.now() : 0;

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

  // กล้องตามแบบลื่น (lerp)
  const t = World.camTarget();
  const k = Math.min(1, dt / 120);
  World.camX += (t.cx - World.camX) * k;
  World.camY += (t.cy - World.camY) * k;
};

/* ---------- วาดฉาก ---------- */
World.draw = function () {
  const p = State.player;
  if (!p || !World.ctx) return;
  World.ensurePos(p);
  const map = World.currentMap();
  const ctx = World.ctx, T = World.TILE;
  const vpW = World.canvas.width, vpH = World.canvas.height;
  const camX = World.camX, camY = World.camY;
  const cols = map.grid[0].length, rows = map.grid.length;
  const spr = (typeof Sprites !== "undefined" && Sprites.ready);

  ctx.clearRect(0, 0, vpW, vpH);

  const startCol = Math.max(0, Math.floor(camX)), startRow = Math.max(0, Math.floor(camY));
  const endCol = Math.min(cols - 1, Math.ceil(camX + vpW / T));
  const endRow = Math.min(rows - 1, Math.ceil(camY + vpH / T));

  const now = performance.now();
  const treeCells = [];   // เก็บช่องต้นไม้ไว้วาดเป็นวัตถุสูง (เลเยอร์ 2)

  // ---- PASS 1: พื้น + ประตู (ไม่รวมตัวละคร/ต้นไม้) ----
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const sx = (col - camX) * T, sy = (row - camY) * T;
      const tile = GameData.tiles[map.grid[row][col]];
      let name = tile.name;
      let painted = false;

      if (spr) {
        if (name === "tree") {
          // ต้นไม้: วาดหญ้าเป็นพื้น แล้วเก็บไว้วาดต้นไม้สูงทีหลัง (กันโดนตัดบน)
          painted = Sprites.drawTile(ctx, "grass", sx, sy, T + 1);
          treeCells.push({ col, row, sx, sy });
        } else if (name === "wild") {
          // โซนมอนสเตอร์: ส่วนใหญ่เป็นหญ้าเรียบ ดอกไม้แค่หย่อมเล็กๆ
          const h = (((col * 73856093) ^ (row * 19349663)) >>> 0) % 13;
          painted = Sprites.drawTile(ctx, h === 0 ? "wild" : "grass", sx, sy, T + 1);
        } else {
          painted = Sprites.drawTile(ctx, name, sx, sy, T + 1);
          // น้ำ: ประกายเคลื่อนไหวบางๆ ให้ดูมีชีวิต
          if (name === "water" && painted) {
            const sh = Math.sin(now / 900 + col * 0.9 + row * 0.4) * 0.5 + 0.5;
            ctx.save();
            ctx.globalAlpha = 0.10 * sh;
            ctx.fillStyle = "#dff1ff";
            ctx.fillRect(sx, sy + T * (0.28 + 0.12 * sh), T + 1, Math.max(1, T * 0.06));
            ctx.restore();
          }
        }
      }
      if (!painted) {
        ctx.fillStyle = tile.color; ctx.fillRect(sx, sy, T + 1, T + 1);
        if (tile.deco) { ctx.font = `${T - 6}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(tile.deco, sx + T / 2, sy + T / 2); }
      }
      const pt = World.portalAt(map, col, row);
      if (pt) {
        ctx.save();
        ctx.globalAlpha = 0.55 + 0.25 * Math.sin(now / 300);
        ctx.font = `${T - 10}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(pt.lock ? "🚪" : "✨", sx + T / 2, sy + T / 2);
        ctx.restore();
      }
    }
  }

  // ---- PASS 2: ตัวละครทั้งหมด เรียงตามตำแหน่งเท้า (Y-sort) ----
  // z = พิกัดเท้าในหน่วยช่อง — ตัวที่อยู่ล่างกว่า (หน้า) วาดทีหลังทับตัวหลัง
  const ents = [];

  (map.npcs || []).forEach((npc) => {
    if (npc.x + 1 < startCol || npc.x - 1 > endCol || npc.y + 1 < startRow || npc.y - 2 > endRow) return;
    const sx = (npc.x - camX) * T, sy = (npc.y - camY) * T;
    ents.push({
      z: npc.y + 1,
      draw: () => {
        let ok = false;
        if (spr) ok = npc.boss
          ? Sprites.drawEnemy(ctx, npc.boss, sx - T * 0.25, sy - T * 0.4, T * 1.5)
          : Sprites.drawNpc(ctx, npc.id, sx, sy, T);
        if (!ok) {
          const glyph = npc.boss ? GameData.enemies[npc.boss].sprite : (GameData.npcs[npc.id] || {}).icon;
          ctx.font = `${T - 6}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(glyph || "❓", sx + T / 2, sy + T / 2);
        }
        World.drawNpcMarker(ctx, npc, sx, sy, T);
      },
    });
  });

  if (typeof Net !== "undefined" && Net.others && Net.others.length) {
    Net.others.forEach((o) => {
      const ox = (o.x + 0.5 - camX) * T - T / 2, oy = (o.y + 0.5 - camY) * T - T / 2;
      if (ox < -T * 1.5 || oy < -T * 1.5 || ox > vpW || oy > vpH) return;
      ents.push({
        z: o.y + 1,
        draw: () => {
          if (spr && !Sprites.drawHero(ctx, o.cls || "warrior", "down", ox, oy, T, false, { hand_r: o.weapon, body: o.armor, head: o.head, hand_l: o.offhand, legs: o.legs, boots: o.boots })) {
            ctx.font = `${T - 6}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("🧑", ox + T / 2, oy + T / 2);
          }
          ctx.font = "600 11px Kanit, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
          const nm = o.name || "?"; const w = ctx.measureText(nm).width + 10;
          ctx.fillStyle = "rgba(10,9,22,0.78)"; ctx.fillRect(ox + T / 2 - w / 2, oy - 15, w, 15);
          ctx.fillStyle = "#a68bff"; ctx.fillText(nm, ox + T / 2, oy - 3);
        },
      });
    });
  }

  const psx = (p.fx - camX) * T - T / 2, psy = (p.fy - camY) * T - T / 2;
  const moving = World.movingNow;
  ents.push({
    z: p.fy + 0.5,          // เท้าผู้เล่น
    draw: () => {
      if (spr) Sprites.drawHero(ctx, p.classId, World.facing, psx, psy, T, moving, p.equip);
      else {
        const cls = GameData.classes.find((c) => c.id === p.classId);
        ctx.font = `${T - 4}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(cls.icon, psx + T / 2, psy + T / 2);
      }
    },
  });

  // สัตว์เลี้ยงคู่หู (เดินตามหลัง)
  const activePet = (typeof Pets !== "undefined") ? Pets.active(p) : null;
  if (activePet && World.petPos) {
    const petSize = T * 0.8;
    const pxx = (World.petPos.x - camX) * T - petSize / 2;
    const pyy = (World.petPos.y - camY) * T - petSize / 2;
    ents.push({
      z: World.petPos.y + 0.45,
      draw: () => {
        let ok = false;
        if (spr && Sprites.drawPet) ok = Sprites.drawPet(ctx, activePet.species, pxx, pyy, petSize);
        if (!ok) {
          ctx.font = `${petSize}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText((Pets.SPECIES[activePet.species] || {}).icon || "🐾", pxx + petSize / 2, pyy + petSize / 2);
        }
      },
    });
  }

  // ต้นไม้เป็นวัตถุสูง (canopy ยื่นขึ้นเหนือช่อง + โยกเบาๆ) — y-sort ร่วมกับตัวละคร
  if (spr) {
    const tw = T * 1.4, th = T * 1.5;   // ต้นไม้สูงกว่าช่องเล็กน้อย
    treeCells.forEach((tc) => {
      const sway = Math.sin(now / 1600 + tc.col * 0.7 + tc.row * 0.4) * (T * 0.035);
      const dx = tc.sx - (tw - T) / 2 + sway;
      const dy = tc.sy + T - th;         // ยึดฐานไว้ที่ก้นช่อง แล้วยื่นขึ้น
      ents.push({ z: tc.row + 0.98, draw: () => Sprites.drawTileSized(ctx, "tree", dx, dy, tw, th) });
    });
  }

  ents.sort((a, b) => a.z - b.z);
  ents.forEach((e) => e.draw());

  // ---- PASS 3: ฟองแชทเหนือหัว (บนสุดเสมอ) ----
  if (typeof Net !== "undefined" && Net.bubblesFor) {
    const mine = Net.bubblesFor(Net.id);
    if (mine) World.drawBubbles(ctx, (p.fx - camX) * T, (p.fy - camY) * T - T * 0.85, mine);
    if (Net.others) Net.others.forEach((o) => {
      const ob = Net.bubblesFor(o.id);
      if (!ob) return;
      World.drawBubbles(ctx, (o.x + 0.5 - camX) * T, (o.y + 0.5 - camY) * T - T * 0.85 - 16, ob);
    });
  }

  const mn = UI.$("#map-name"); if (mn) mn.textContent = map.name;
};

/* วาดสแต็กฟองแชทเหนือหัว: ใหม่สุดอยู่ล่าง (ติดหัว), เก่าดันขึ้นบน, จางตอนใกล้หมดเวลา */
World.drawBubbles = function (ctx, cx, bottomY, list) {
  ctx.save();
  ctx.font = "600 12px Kanit, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const H = 20, GAP = 4, PADX = 9, MAXW = 200, now = performance.now();
  let y = bottomY;
  for (let i = list.length - 1; i >= 0; i--) {
    const b = list[i];
    let txt = b.text;
    if (ctx.measureText(txt).width + PADX * 2 > MAXW) {   // ยาวเกิน -> ตัดด้วย …
      while (txt.length > 1 && ctx.measureText(txt + "…").width + PADX * 2 > MAXW) txt = txt.slice(0, -1);
      txt += "…";
    }
    const bw = ctx.measureText(txt).width + PADX * 2, x = cx - bw / 2, top = y - H;
    ctx.globalAlpha = Math.max(0, Math.min(1, (b.exp - now) / 500));  // จางใน 0.5 วิสุดท้าย
    ctx.fillStyle = "rgba(18,15,38,0.9)";
    World._roundRect(ctx, x, top, bw, H, 8); ctx.fill();
    ctx.strokeStyle = "rgba(166,139,255,0.55)"; ctx.lineWidth = 1; ctx.stroke();
    if (i === list.length - 1) {   // หางฟองเฉพาะอันล่างสุด (ชี้ลงหัว)
      ctx.beginPath();
      ctx.moveTo(cx - 5, top + H - 1); ctx.lineTo(cx + 5, top + H - 1); ctx.lineTo(cx, top + H + 5);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = "#ece9ff";
    ctx.fillText(txt, cx, top + H / 2 + 0.5);
    y = top - GAP;
  }
  ctx.restore();
};

World._roundRect = function (ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
};

/* เครื่องหมายเหนือ NPC: ! เควสใหม่ · ? กำลังทำ · 🛒 ร้าน */
World.drawNpcMarker = function (ctx, npc, sx, sy, T) {
  if (npc.boss || typeof Story === "undefined") return;
  const p = State.player, st = Story.stage(p);
  let mark = null, color = "#ffcc55";
  const def = GameData.npcs[npc.id] || {};
  if (st && st.giver === npc.id) {
    if (!p.stageAccepted) { mark = "!"; color = "#ffcc55"; }
    else if (Story.complete(p, st)) { mark = "!"; color = "#6ee787"; }
    else { mark = "?"; color = "#a68bff"; }
  } else if (def.shop) { mark = "$"; color = "#ffcc55"; }
  if (!mark) return;
  const bob = Math.sin(performance.now() / 300) * 3;
  ctx.save();
  ctx.font = "700 " + Math.round(T * 0.42) + "px Kanit, sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(10,9,22,.6)";
  ctx.beginPath(); ctx.arc(sx + T / 2, sy - 8 + bob, T * 0.24, 0, 7); ctx.fill();
  ctx.fillStyle = color;
  ctx.fillText(mark, sx + T / 2, sy - 7 + bob);
  ctx.restore();
};

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
    World.draw();
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
