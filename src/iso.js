/* ============================================================
 * Aetheria RPG — Isometric Renderer (Phaser 3)
 * โลก isometric สไตล์ chibi สดใส: พื้นจาก tiles.png (gen_iso_cute.py)
 * ตัวละคร = สไปรต์ pixel chibi เดิม (heroes/enemies/npcs/pets 4 ทิศ
 * + เลเยอร์อุปกรณ์ weapons/armor/helmets/shields/legs/boots)
 * — เป็น "จอแสดงผล" เท่านั้น: logic เกมอยู่ใน world.js เหมือนเดิม
 * ========================================================== */

const Iso = {
  game: null,
  scene: null,
  ready: false,        // โหลด texture ครบหรือยัง
  builtMap: null,      // id แผนที่ที่สร้าง layer ไว้แล้ว
  TILE_W: 128, TILE_H: 64,
  CHAR_SCALE: 2.3,     // 48px chibi -> ~110px บนจอ
  t0: performance.now(),
};

/* grid (หน่วยช่อง, ทศนิยม) -> พิกัดโลกของ Phaser */
Iso.toScreen = function (gx, gy) {
  return { x: (gx - gy) * (Iso.TILE_W / 2), y: (gx + gy) * (Iso.TILE_H / 2) };
};

Iso.now = function () { return performance.now() - Iso.t0; };

/* เฟรม idle (หายใจช้า) / เดิน (สลับเร็ว) — จังหวะเดียวกับ sprites.js เดิม */
Iso.animCol = function (moving, man, phase) {
  const seq = moving ? (man.walk || [2, 0, 3, 0]) : (man.idle || [0, 1]);
  const ms = moving ? 130 : 480;
  return seq[Math.floor(Iso.now() / ms + (phase || 0)) % seq.length];
};

/* ---------- bootstrap ---------- */
Iso.init = function () {
  if (typeof Phaser === "undefined" || typeof FLARE_MANIFEST === "undefined"
    || typeof SPRITE_MANIFEST === "undefined") return;
  Iso.FM = FLARE_MANIFEST;       // ใช้เฉพาะส่วน tiles
  Iso.SM = SPRITE_MANIFEST;      // ตัวละคร chibi
  Iso.TILE_W = Iso.FM.tiles.tileW; Iso.TILE_H = Iso.FM.tiles.tileH;

  class WorldScene extends Phaser.Scene {
    preload() {
      const SM = Iso.SM;
      const sheet = (key, file, cell) =>
        this.load.spritesheet(key, "assets/sprites/" + file + ".png",
          { frameWidth: cell, frameHeight: cell });
      sheet("sh_heroes", "heroes", SM.heroes.cell);
      ["weapons", "armor", "helmets", "shields", "legs", "boots"].forEach(
        (k) => sheet("sh_" + k, k, SM[k].cell));
      sheet("sh_enemies", "enemies", SM.enemies.cell);
      sheet("sh_npcs", "npcs", SM.npcs.cell);
      sheet("sh_pets", "pets", SM.pets.cell);
      this.load.image("tiles_atlas", "assets/sprites/flare/" + Iso.FM.tiles.file);
    }
    create() {
      // ตัดเฟรมทายล์จาก atlas ตาม manifest
      const tex = this.textures.get("tiles_atlas");
      Object.keys(Iso.FM.tiles.map).forEach((kind) => {
        Iso.FM.tiles.map[kind].forEach((e, i) => {
          tex.add(kind + ":" + i, 0, e.x, e.y, e.w, e.h);
        });
      });
      Iso.scene = this;
      Iso.ready = true;
      Iso.layers = { floor: this.add.group() };
      Iso.ent = { npcs: new Map(), others: new Map(), portals: [], objects: [] };
      Iso.playerGroup = null;
      Iso.petSprite = null;
      Iso.bubblePool = new Map();
      this.cameras.main.setRoundPixels(true);
      this.scale.on("resize", () => Iso.applyZoom());
    }
    update(_time, dt) {
      Iso.tick(dt);
    }
  }

  // Renderer: Canvas2D — art เป็น pixel ทั้งหมด และเลี่ยงปัญหา WebGL ใน webview
  const rnd = new URLSearchParams(location.search).get("rnd");
  const rtype = rnd === "webgl" ? Phaser.WEBGL : Phaser.CANVAS;
  Iso.game = new Phaser.Game({
    type: rtype,
    parent: "world-stage",
    scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
    transparent: true,               // ให้เห็นพื้นหลังโทนโซน (Art.applyZoneMood)
    scene: WorldScene,
    render: { pixelArt: true },      // ขยายพิกเซลคม ไม่เบลอ
    audio: { noAudio: true },
    banner: false,
    fps: { forceSetTimeOut: document.hidden, target: 60 },
  });
  // Watchdog: บูตในแท็บ hidden (ตัวทดสอบอัตโนมัติ) TextureManager
  // อาจไม่ยิง ready เพราะ browser หน่วง decode ภาพ — ดันบูตต่อเอง
  setTimeout(() => {
    const g = Iso.game;
    if (g && !g.isRunning) {
      try {
        g.loop.forceSetTimeOut = true;
        g.events.removeAllListeners(Phaser.Core.Events.HIDDEN);
        if (g.texturesReady) g.texturesReady(); else g.start();
      } catch (e) { /* ปล่อยให้บูตปกติเมื่อแท็บแสดง */ }
    }
  }, 1200);
};

/* เรียกตอนสลับมาหน้า world (จอเพิ่งแสดง ขนาด parent เพิ่งถูกต้อง) */
Iso.onShow = function () {
  if (Iso.game) setTimeout(() => { try { Iso.game.scale.refresh(); } catch (e) {} }, 30);
};

/* ---------- อัปเดตต่อเฟรม ---------- */
Iso.tick = function (dt) {
  if (!Iso.ready || State.screen !== "world" || !State.player) return;
  if (typeof World !== "undefined") {
    if (!World.locked) World.update(dt);
  }
  const p = State.player;
  if (Iso.builtMap !== p.map) Iso.buildMap();
  Iso.syncPlayer(dt);
  Iso.syncNpcs();
  Iso.syncOthers(dt);
  Iso.syncPet();
  Iso.syncPortals();
  Iso.syncBubbles();
  const mn = document.getElementById("map-name");
  const map = GameData.maps[p.map];
  if (mn && map && mn.textContent !== map.name) mn.textContent = map.name;
  if (typeof Minimap !== "undefined") Minimap.tick();
};

/* ---------- สร้าง layer แผนที่ (ครั้งเดียวต่อแมพ) ---------- */
Iso.pickVariant = function (kind, col, row) {
  const list = Iso.FM.tiles.map[kind];
  if (!list) return null;
  const h = (((col * 73856093) ^ (row * 19349663)) >>> 0) % list.length;
  return kind + ":" + h;
};

Iso.buildMap = function () {
  const sc = Iso.scene;
  const p = State.player;
  const map = GameData.maps[p.map];
  if (!map) return;
  Iso.builtMap = p.map;

  // ล้างของเก่า
  Iso.layers.floor.clear(true, true);
  Iso.ent.objects.forEach((o) => o.destroy());
  Iso.ent.objects = [];
  Iso.ent.portals.forEach((o) => o.destroy());
  Iso.ent.portals = [];
  Iso.ent.npcs.forEach((o) => o.destroy());
  Iso.ent.npcs.clear();
  Iso.ent.others.forEach((o) => o.destroy());
  Iso.ent.others.clear();
  if (Iso.playerGroup) { Iso.playerGroup.destroy(); Iso.playerGroup = null; }
  if (Iso.petSprite) { Iso.petSprite.destroy(); Iso.petSprite = null; }
  Iso.bubblePool.forEach((b) => b.root.destroy());
  Iso.bubblePool.clear();

  const rows = map.grid.length, cols = map.grid[0].length;

  // หา "พื้นฐาน" ของแมพ (ทายล์เดินได้ที่พบมากสุด) ไว้รองใต้วัตถุ
  const count = {};
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const t = GameData.tiles[map.grid[r][c]];
    if (t && t.walk) count[t.name] = (count[t.name] || 0) + 1;
  }
  const baseKind = Object.keys(count).sort((a, b) => count[b] - count[a])[0] || "grass";

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = GameData.tiles[map.grid[r][c]];
      if (!tile) continue;
      const kind = tile.name;
      const cx = c + 0.5, cy = r + 0.5;
      const pos = Iso.toScreen(cx, cy);
      const isObject = (kind === "tree" || kind === "wall");
      const floorKind = isObject ? baseKind : kind;
      const fkey = Iso.pickVariant(floorKind, c, r);
      if (fkey) {
        const e = Iso.FM.tiles.map[floorKind][parseInt(fkey.split(":")[1], 10)];
        const img = sc.add.image(pos.x - e.ox + e.w / 2, pos.y - e.oy + e.h / 2, "tiles_atlas", fkey);
        img.setDepth((c + r));
        Iso.layers.floor.add(img);
      }
      if (isObject) {
        const h = (((c * 40503) ^ (r * 24593)) >>> 0);
        // กำแพง: สลับหิน/ตอไม้แห้ง/พุ่ม แทนกำแพงทึบ (ดูเป็นแนวธรรมชาติ)
        const okind = (kind === "tree")
          ? (h % 5 === 0 ? "pine" : "tree")
          : ["rock", "rock", "deadtree", "bush"][h % 4];
        const okey = Iso.pickVariant(okind, c, r);
        if (okey) {
          const e = Iso.FM.tiles.map[okind][parseInt(okey.split(":")[1], 10)];
          const img = sc.add.image(pos.x - e.ox + e.w / 2, pos.y - e.oy + e.h / 2, "tiles_atlas", okey);
          if (kind === "wall" && okind === "rock") img.setScale(1.5);
          img.setDepth(1000 + (cx + cy) * 10);
          Iso.ent.objects.push(img);
        }
      }
    }
  }

  // พอร์ทัล: วงแหวนเรืองแสง (ล็อก = วงเดียวกันแต่หรี่เทา ไม่กะพริบ)
  (map.portals || []).forEach((pt) => {
    const pos = Iso.toScreen(pt.x + 0.5, pt.y + 0.5);
    const kind = pt.lock ? "shrine" : "portal";
    const e = Iso.FM.tiles.map[kind][0];
    const img = sc.add.image(pos.x - e.ox + e.w / 2, pos.y - e.oy + e.h / 2, "tiles_atlas", kind + ":0");
    img.setDepth(pt.x + pt.y + 0.5);
    img._pulse = !pt.lock;
    Iso.ent.portals.push(img);
  });

  // ขอบเขตกล้อง: ครอบทั้ง diamond ของแมพ
  const corners = [Iso.toScreen(0, 0), Iso.toScreen(cols, 0), Iso.toScreen(0, rows), Iso.toScreen(cols, rows)];
  const xs = corners.map((v) => v.x), ys = corners.map((v) => v.y);
  const M = 200;
  sc.cameras.main.setBounds(Math.min(...xs) - M, Math.min(...ys) - M - 120,
    Math.max(...xs) - Math.min(...xs) + M * 2, Math.max(...ys) - Math.min(...ys) + M * 2 + 120);
  Iso.applyZoom();
  if (typeof Minimap !== "undefined") Minimap.build(map);
};

Iso.applyZoom = function () {
  const sc = Iso.scene;
  const w = sc.scale.width, h = sc.scale.height;
  // ให้เห็นราว 7 ช่องตามแนวกว้าง
  const z = Math.max(0.55, Math.min(1.35, Math.min(w, h) / (Iso.TILE_W * 4.4)));
  sc.cameras.main.setZoom(z);
};

/* ---------- ฮีโร่ chibi + เลเยอร์อุปกรณ์ ----------
 * slot -> sheet: hand_r=weapons hand_l=shields body=armor head=helmets */
Iso.GEAR = [
  ["legs", "legs"], ["boots", "boots"], ["body", "armor"],
  ["hand_r", "weapons"], ["hand_l", "shields"], ["head", "helmets"],
];

Iso.heroFrame = function (cls, dir, col) {
  const H = Iso.SM.heroes;
  const row = H.rows[cls + "_" + dir];
  if (row === undefined) return 0;
  return row * H.frames + col;
};
Iso.gearFrame = function (sheet, itemId, dir, col) {
  const G = Iso.SM[sheet];
  const row = G.rows[itemId + "_" + dir];
  if (row === undefined) return null;
  return row * G.frames + col;
};

Iso.makeHeroGroup = function (cls, equip) {
  const sc = Iso.scene;
  const cont = sc.add.container(0, 0);
  const mk = (key) => {
    const s = sc.add.sprite(0, 0, key, 0);
    s.setOrigin(0.5, 0.93);                       // เท้าอยู่ล่างเซลล์
    s.setScale(Iso.CHAR_SCALE);
    cont.add(s);
    return s;
  };
  cont._base = mk("sh_heroes");
  cont._gear = {};
  Iso.GEAR.forEach(([slot, sheet]) => {
    cont._gear[slot] = (equip && equip[slot]) ? mk("sh_" + sheet) : null;
  });
  cont._equipSig = JSON.stringify(equip || {});
  cont._cls = cls;
  return cont;
};

/* ตั้งเฟรมฮีโร่+อุปกรณ์ตามทิศ/การเดิน (เลเยอร์ไหนไม่มีภาพ -> ซ่อน) */
Iso.setHeroFrame = function (cont, cls, dir, moving, equip, phase) {
  const col = Iso.animCol(moving, Iso.SM.heroes, phase);
  cont._base.setFrame(Iso.heroFrame(cls, dir, col));
  const eq = equip || {};
  Iso.GEAR.forEach(([slot, sheet]) => {
    const s = cont._gear[slot];
    if (!s) return;
    const f = eq[slot] ? Iso.gearFrame(sheet, eq[slot], dir, col) : null;
    if (f === null) { s.setVisible(false); return; }
    s.setVisible(true);
    s.setFrame(f);
  });
};

/* อัปเดตเลเยอร์อุปกรณ์เมื่อสวม/ถอด/เปลี่ยนอาชีพ */
Iso.refreshHeroGear = function (cont, cls, equip) {
  const sig = JSON.stringify(equip || {});
  if (cont._equipSig === sig && cont._cls === cls) return cont;
  const sc = Iso.scene;
  cont._cls = cls;
  Iso.GEAR.forEach(([slot, sheet]) => {
    const has = equip && equip[slot];
    if (cont._gear[slot] && !has) { cont._gear[slot].destroy(); cont._gear[slot] = null; }
    if (has && !cont._gear[slot]) {
      const s = sc.add.sprite(0, 0, "sh_" + sheet, 0);
      s.setOrigin(0.5, 0.93);
      s.setScale(Iso.CHAR_SCALE);
      cont.add(s);
      cont._gear[slot] = s;
    }
  });
  cont._equipSig = sig;
  return cont;
};

Iso.syncPlayer = function (dt) {
  const p = State.player;
  World.ensurePos(p);
  if (!Iso.playerGroup) Iso.playerGroup = Iso.makeHeroGroup(p.classId, p.equip);
  const g = Iso.refreshHeroGear(Iso.playerGroup, p.classId, p.equip);
  const moving = World.movingNow && !World.locked;
  Iso.setHeroFrame(g, p.classId, World.facing || "down", moving, p.equip, 0);
  const pos = Iso.toScreen(p.fx, p.fy);
  g.setPosition(pos.x, pos.y);
  g.setDepth(1000 + (p.fx + p.fy) * 10);
  const cam = Iso.scene.cameras.main;
  if (cam._followTarget !== g) { cam.startFollow(g, true, 0.12, 0.12); cam._followTarget = g; }
};

/* ---------- NPC + บอสบนแมพ ---------- */
Iso.charTopY = function () { return Iso.SM.heroes.cell * Iso.CHAR_SCALE * 0.93; };

Iso.syncNpcs = function () {
  const sc = Iso.scene;
  const map = GameData.maps[State.player.map];
  (map.npcs || []).forEach((npc) => {
    const key = npc.id + "@" + npc.x + "," + npc.y;
    let ent = Iso.ent.npcs.get(key);
    if (!ent) {
      const cont = sc.add.container(0, 0);
      let sheet, man, row, scale = Iso.CHAR_SCALE;
      if (npc.boss && Iso.SM.enemies.rows[Iso.enemyKind(npc.boss)] !== undefined) {
        sheet = "sh_enemies"; man = Iso.SM.enemies; row = Iso.SM.enemies.rows[Iso.enemyKind(npc.boss)];
        scale = Iso.CHAR_SCALE * 1.25;
      } else if (Iso.SM.npcs.rows[npc.id] !== undefined) {
        sheet = "sh_npcs"; man = Iso.SM.npcs; row = Iso.SM.npcs.rows[npc.id];
      } else {
        sheet = "sh_npcs"; man = Iso.SM.npcs; row = 0;
      }
      const s = sc.add.sprite(0, 0, sheet, row * man.frames);
      s.setOrigin(0.5, 0.93);
      s.setScale(scale);
      cont.add(s);
      const mark = sc.add.text(0, 0, "", {
        fontFamily: "Kanit, sans-serif", fontSize: "26px", fontStyle: "700",
        stroke: "#0a0916", strokeThickness: 5,
      }).setOrigin(0.5, 1);
      cont.add(mark);
      const pos = Iso.toScreen(npc.x + 0.5, npc.y + 0.5);
      cont.setPosition(pos.x, pos.y);
      cont.setDepth(1000 + (npc.x + npc.y + 1) * 10);
      ent = { root: cont, spr: s, mark, man, row, npc, phase: (npc.x * 7 + npc.y * 13) % 4 };
      Iso.ent.npcs.set(key, ent);
      ent.destroy = () => cont.destroy();
    }
    // เฟรมหายใจ + เครื่องหมายเควส
    ent.spr.setFrame(ent.row * ent.man.frames + Iso.animCol(false, ent.man, ent.phase));
    const m = Iso.npcMark(npc);
    if (m) {
      ent.mark.setText(m.mark);
      ent.mark.setColor(m.color);
      const bob = Math.sin(Iso.now() / 300) * 4;
      ent.mark.setY(-Iso.charTopY() - 4 + bob);
      ent.mark.setVisible(true);
    } else ent.mark.setVisible(false);
  });
};

Iso.enemyKind = function (enemyId) {
  const en = GameData.enemies[enemyId];
  return (en && en.spr) ? en.spr : enemyId;
};

Iso.npcMark = function (npc) {
  if (npc.boss || typeof Story === "undefined") return null;
  const p = State.player, st = Story.stage(p);
  const def = GameData.npcs[npc.id] || {};
  if (st && st.giver === npc.id) {
    if (!p.stageAccepted) return { mark: "!", color: "#ffcc55" };
    if (Story.complete(p, st)) return { mark: "!", color: "#6ee787" };
    return { mark: "?", color: "#a68bff" };
  }
  if (def.shop) return { mark: "$", color: "#ffcc55" };
  return null;
};

/* ---------- ผู้เล่นคนอื่น (multiplayer) ---------- */
Iso.syncOthers = function (dt) {
  const sc = Iso.scene;
  const seen = new Set();
  const list = (typeof Net !== "undefined" && Net.others) ? Net.others : [];
  list.forEach((o) => {
    seen.add(o.id);
    let ent = Iso.ent.others.get(o.id);
    if (!ent) {
      const cont = Iso.makeHeroGroup(o.cls || "warrior", Iso.netEquip(o));
      const label = sc.add.text(0, -Iso.charTopY() - 2, o.name || "?", {
        fontFamily: "Kanit, sans-serif", fontSize: "15px", fontStyle: "600",
        color: "#c9bfff", backgroundColor: "rgba(10,9,22,0.72)", padding: { x: 6, y: 2 },
      }).setOrigin(0.5, 1);
      cont.add(label);
      const start = Iso.toScreen(o.x + 0.5, o.y + 0.5);
      ent = { root: cont, label, dx: o.x + 0.5, dy: o.y + 0.5, dir: "down", lastX: o.x, lastY: o.y };
      cont.setPosition(start.x, start.y);
      Iso.ent.others.set(o.id, ent);
      ent.destroy = () => cont.destroy();
    }
    Iso.refreshHeroGear(ent.root, o.cls || "warrior", Iso.netEquip(o));
    // lerp ตำแหน่ง + หันตามการเคลื่อนที่ (แกนจอเด่นสุด)
    const tx = o.x + 0.5, ty = o.y + 0.5;
    if (o.x !== ent.lastX || o.y !== ent.lastY) {
      const sdx = (o.x - ent.lastX) - (o.y - ent.lastY);
      const sdy = (o.x - ent.lastX) + (o.y - ent.lastY);
      ent.dir = Math.abs(sdx) * 2 >= Math.abs(sdy)
        ? (sdx > 0 ? "right" : "left")
        : (sdy > 0 ? "down" : "up");
      ent.lastX = o.x; ent.lastY = o.y;
    }
    const k = Math.min(1, dt / 140);
    ent.dx += (tx - ent.dx) * k; ent.dy += (ty - ent.dy) * k;
    const moving = Math.abs(tx - ent.dx) + Math.abs(ty - ent.dy) > 0.05;
    Iso.setHeroFrame(ent.root, o.cls || "warrior", ent.dir, moving, Iso.netEquip(o), 1);
    const pos = Iso.toScreen(ent.dx, ent.dy);
    ent.root.setPosition(pos.x, pos.y);
    ent.root.setDepth(1000 + (ent.dx + ent.dy) * 10);
  });
  Iso.ent.others.forEach((ent, id) => {
    if (!seen.has(id)) { ent.destroy(); Iso.ent.others.delete(id); }
  });
};
Iso.netEquip = function (o) {
  return { hand_r: o.weapon, body: o.armor, head: o.head, hand_l: o.offhand, legs: o.legs, boots: o.boots };
};

/* ---------- สัตว์เลี้ยงคู่หู ---------- */
Iso.syncPet = function () {
  const p = State.player;
  const pet = (typeof Pets !== "undefined") ? Pets.active(p) : null;
  if (!pet || !World.petPos) {
    if (Iso.petSprite) { Iso.petSprite.destroy(); Iso.petSprite = null; }
    return;
  }
  const P = Iso.SM.pets;
  const row = P.rows[pet.species];
  if (row === undefined) return;
  if (!Iso.petSprite || Iso.petSprite._species !== pet.species) {
    if (Iso.petSprite) Iso.petSprite.destroy();
    const s = Iso.scene.add.sprite(0, 0, "sh_pets", row * P.frames);
    s.setOrigin(0.5, 0.9);
    s.setScale(Iso.CHAR_SCALE * 1.6);              // เซลล์ 16px -> ~38px
    s._species = pet.species;
    Iso.petSprite = s;
  }
  Iso.petSprite.setFrame(row * P.frames + Iso.animCol(false, P, 1));
  const pos = Iso.toScreen(World.petPos.x, World.petPos.y);
  Iso.petSprite.setPosition(pos.x, pos.y);
  Iso.petSprite.setDepth(1000 + (World.petPos.x + World.petPos.y) * 10 - 1);
};

/* ---------- พอร์ทัลกะพริบ ---------- */
Iso.syncPortals = function () {
  const a = 0.7 + 0.3 * Math.sin(Iso.now() / 320);
  Iso.ent.portals.forEach((img) => { if (img._pulse) img.setAlpha(a); });
};

/* ---------- ฟองแชทเหนือหัว ---------- */
Iso.syncBubbles = function () {
  if (typeof Net === "undefined" || !Net.bubblesFor) return;
  const sc = Iso.scene;
  const p = State.player;
  const jobs = [];
  const mine = Net.bubblesFor(Net.id);
  if (mine && mine.length) jobs.push({ id: "me", list: mine, gx: p.fx, gy: p.fy, top: Iso.charTopY() });
  (Net.others || []).forEach((o) => {
    const ob = Net.bubblesFor(o.id);
    if (ob && ob.length) jobs.push({ id: o.id, list: ob, gx: o.x + 0.5, gy: o.y + 0.5, top: Iso.charTopY() + 26 });
  });

  const seen = new Set();
  const now = performance.now();
  jobs.forEach((j) => {
    seen.add(j.id);
    let b = Iso.bubblePool.get(j.id);
    const sig = j.list.map((x) => x.text).join("\n");
    if (!b || b.sig !== sig) {
      if (b) b.root.destroy();
      const cont = sc.add.container(0, 0);
      let y = 0;
      for (let i = j.list.length - 1; i >= 0; i--) {
        const t = sc.add.text(0, y, j.list[i].text, {
          fontFamily: "Kanit, sans-serif", fontSize: "15px", fontStyle: "600",
          color: "#ece9ff", backgroundColor: "rgba(18,15,38,0.92)",
          padding: { x: 8, y: 3 },
        }).setOrigin(0.5, 1);
        cont.add(t);
        y -= t.height + 4;
      }
      b = { root: cont, sig, exps: j.list.map((x) => x.exp) };
      Iso.bubblePool.set(j.id, b);
    }
    b.exps = j.list.map((x) => x.exp);
    const pos = Iso.toScreen(j.gx, j.gy);
    b.root.setPosition(pos.x, pos.y - j.top - 8);
    b.root.setDepth(90000);
    const soonest = Math.min(...b.exps);
    b.root.setAlpha(Math.max(0, Math.min(1, (soonest - now) / 500)));
  });
  Iso.bubblePool.forEach((b, id) => {
    if (!seen.has(id)) { b.root.destroy(); Iso.bubblePool.delete(id); }
  });
};

window.Iso = Iso;
