/* ============================================================
 * Aetheria RPG — World Renderer (Phaser 3, top-down)
 * สไตล์ Zelda-like: พื้นช่องสี่เหลี่ยม (Zelda-like tileset, CC0)
 * ตัวละคร/มอนสเตอร์/NPC จาก Ninja Adventure (CC0)
 * — เป็น "จอแสดงผล" เท่านั้น: logic เกมอยู่ใน world.js เหมือนเดิม
 * (ชื่อโมดูล Iso คงไว้เพื่อไม่ให้กระทบโค้ดส่วนอื่น)
 * ========================================================== */

const Iso = {
  game: null,
  scene: null,
  ready: false,
  builtMap: null,
  TILE: 48,
  t0: performance.now(),
};

/* grid (หน่วยช่อง, ทศนิยม) -> พิกัดโลกของ Phaser */
Iso.toScreen = function (gx, gy) {
  return { x: gx * Iso.TILE, y: gy * Iso.TILE };
};

Iso.now = function () { return performance.now() - Iso.t0; };

/* ทิศของ Ninja Adventure: คอลัมน์ 0=ลง 1=ขึ้น 2=ซ้าย 3=ขวา */
Iso.DIR_COL = { down: 0, up: 1, left: 2, right: 3 };

/* เฟรมตัวละคร: แถว 0 = idle, แถว 1-4 = เดิน */
Iso.charFrame = function (dir, moving, phase) {
  const col = Iso.DIR_COL[dir] !== undefined ? Iso.DIR_COL[dir] : 0;
  if (!moving) return col;                       // idle row 0
  const M = Iso.TD.anims;
  const step = Math.floor(Iso.now() / M.walkMs + (phase || 0)) % M.walkRows.length;
  return M.walkRows[step] * 4 + col;
};

/* ---------- bootstrap ---------- */
Iso.init = function () {
  if (typeof Phaser === "undefined" || typeof TD_MANIFEST === "undefined") return;
  Iso.TD = TD_MANIFEST;
  Iso.TILE = Iso.TD.cell;

  class WorldScene extends Phaser.Scene {
    preload() {
      const TD = Iso.TD;
      const base = "assets/sprites/td/";
      Object.keys(TD.heroes).forEach((cls) =>
        this.load.spritesheet("hero_" + cls, base + TD.heroes[cls].file,
          { frameWidth: TD.cell, frameHeight: TD.cell }));
      Object.keys(TD.npcs).forEach((n) =>
        this.load.spritesheet("npc_" + n, base + TD.npcs[n].file,
          { frameWidth: TD.cell, frameHeight: TD.cell }));
      Object.keys(TD.enemies).forEach((e) => {
        const m = TD.enemies[e];
        this.load.spritesheet("enemy_" + e, base + m.file,
          { frameWidth: m.cell, frameHeight: m.cell });
      });
      Object.keys(TD.pets).forEach((p) => {
        const m = TD.pets[p];
        this.load.spritesheet("pet_" + p, base + m.file,
          { frameWidth: m.cell, frameHeight: m.cell });
      });
      this.load.image("tiles_atlas", base + "tiles.png");
    }
    create() {
      const tex = this.textures.get("tiles_atlas");
      const addFrames = (group) => {
        Object.keys(group).forEach((kind) => {
          group[kind].forEach((e, i) => {
            tex.add(kind + ":" + i, 0, e.x, e.y, e.w, e.h);
          });
        });
      };
      addFrames(Iso.TD.tiles);
      addFrames(Iso.TD.objects);
      Iso.scene = this;
      Iso.ready = true;
      Iso.layers = { floor: this.add.group() };
      Iso.ent = { npcs: new Map(), others: new Map(), portals: [], objects: [] };
      Iso.playerSpr = null;
      Iso.petSprite = null;
      Iso.bubblePool = new Map();
      Iso.hintText = null;
      this.cameras.main.setRoundPixels(true);
      this.scale.on("resize", () => Iso.applyZoom());
    }
    update(_time, dt) {
      Iso.tick(dt);
    }
  }

  const rnd = new URLSearchParams(location.search).get("rnd");
  const rtype = rnd === "webgl" ? Phaser.WEBGL : Phaser.CANVAS;
  Iso.game = new Phaser.Game({
    type: rtype,
    parent: "world-stage",
    scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
    transparent: true,
    scene: WorldScene,
    render: { pixelArt: true },
    audio: { noAudio: true },
    banner: false,
    fps: { forceSetTimeOut: document.hidden, target: 60 },
  });
  // Watchdog: บูตในแท็บ hidden (ตัวทดสอบ) — TextureManager อาจไม่ยิง ready
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
  Iso.syncHint();
  const mn = document.getElementById("map-name");
  const map = GameData.maps[p.map];
  if (mn && map && mn.textContent !== map.name) mn.textContent = map.name;
  if (typeof Minimap !== "undefined") Minimap.tick();
};

/* ---------- สร้าง layer แผนที่ ---------- */
Iso.pickVariant = function (group, kind, col, row) {
  const list = group[kind];
  if (!list || !list.length) return null;
  return (((col * 73856093) ^ (row * 19349663)) >>> 0) % list.length;
};

Iso.buildMap = function () {
  const sc = Iso.scene;
  const p = State.player;
  const map = GameData.maps[p.map];
  if (!map) return;
  Iso.builtMap = p.map;
  const T = Iso.TILE;

  Iso.layers.floor.clear(true, true);
  Iso.ent.objects.forEach((o) => o.destroy());
  Iso.ent.objects = [];
  Iso.ent.portals.forEach((o) => o.destroy());
  Iso.ent.portals = [];
  Iso.ent.npcs.forEach((o) => o.destroy());
  Iso.ent.npcs.clear();
  Iso.ent.others.forEach((o) => o.destroy());
  Iso.ent.others.clear();
  if (Iso.playerSpr) { Iso.playerSpr.destroy(); Iso.playerSpr = null; }
  if (Iso.petSprite) { Iso.petSprite.destroy(); Iso.petSprite = null; }
  Iso.bubblePool.forEach((b) => b.root.destroy());
  Iso.bubblePool.clear();

  const rows = map.grid.length, cols = map.grid[0].length;

  // พื้นฐานของแมพ (ทายล์เดินได้ที่พบมากสุด) รองใต้ต้นไม้/วัตถุ
  const count = {};
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const t = GameData.tiles[map.grid[r][c]];
    if (t && t.walk) count[t.name] = (count[t.name] || 0) + 1;
  }
  const baseKind = Object.keys(count).sort((a, b) => count[b] - count[a])[0] || "grass";

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tileDef = GameData.tiles[map.grid[r][c]];
      if (!tileDef) continue;
      const kind = tileDef.name;
      const isTree = kind === "tree";
      const isWall = kind === "wall";
      // พื้น: ต้นไม้รองด้วยพื้นฐานแมพ / กำแพงคือทายล์เต็มช่อง / อื่นๆ ตามชนิด
      const floorKind = isTree ? baseKind : (Iso.TD.tiles[kind] ? kind : baseKind);
      const vi = Iso.pickVariant(Iso.TD.tiles, floorKind, c, r);
      if (vi !== null) {
        const img = sc.add.image(c * T + T / 2, r * T + T / 2, "tiles_atlas", floorKind + ":" + vi);
        img.setDisplaySize(T + 1, T + 1);        // กันร่องขาวตอนซูม
        img.setDepth(0);
        Iso.layers.floor.add(img);
      }
      if (isTree) {
        const h = (((c * 40503) ^ (r * 24593)) >>> 0);
        const okind = h % 6 === 0 ? "bush" : "tree";
        const ov = Iso.pickVariant(Iso.TD.objects, okind, c, r);
        const e = Iso.TD.objects[okind][ov];
        const img = sc.add.image(c * T + T / 2, r * T + T - e.h / 2, "tiles_atlas", okind + ":" + ov);
        img.setDepth(1000 + (r + 1) * 10);      // depth ตามแถวฐาน
        Iso.ent.objects.push(img);
      }
    }
  }

  // พอร์ทัล: วงแหวนเรืองแสงบนพื้น (ล็อก = เทาหรี่)
  (map.portals || []).forEach((pt) => {
    const img = sc.add.image(pt.x * T + T / 2, pt.y * T + T / 2, "tiles_atlas", "portal:0");
    img.setDepth(1);
    if (pt.lock) { img.setTint(0x9090a8); img.setAlpha(0.75); }
    img._pulse = !pt.lock;
    Iso.ent.portals.push(img);
  });

  sc.cameras.main.setBounds(-T, -T, cols * T + T * 2, rows * T + T * 2);
  Iso.applyZoom();
  if (typeof Minimap !== "undefined") Minimap.build(map);
};

Iso.applyZoom = function () {
  const sc = Iso.scene;
  const w = sc.scale.width, h = sc.scale.height;
  // เห็นราว 9-10 ช่องตามแนวแคบของจอ (ฟีลใกล้เกม Zelda)
  const z = Math.max(1.0, Math.min(2.4, Math.min(w, h) / (Iso.TILE * 9)));
  sc.cameras.main.setZoom(z);
};

/* ---------- ผู้เล่น ---------- */
Iso.syncPlayer = function (dt) {
  const p = State.player;
  World.ensurePos(p);
  const sc = Iso.scene;
  if (!Iso.playerSpr) {
    const key = "hero_" + (Iso.TD.heroes[p.classId] ? p.classId : "warrior");
    Iso.playerSpr = sc.add.sprite(0, 0, key, 0).setOrigin(0.5, 0.78);
    Iso.playerSpr._cls = p.classId;
  }
  if (Iso.playerSpr._cls !== p.classId && Iso.TD.heroes[p.classId]) {
    Iso.playerSpr.setTexture("hero_" + p.classId);
    Iso.playerSpr._cls = p.classId;
  }
  const moving = World.movingNow && !World.locked;
  Iso.playerSpr.setFrame(Iso.charFrame(World.facing || "down", moving, 0));
  const pos = Iso.toScreen(p.fx, p.fy);
  Iso.playerSpr.setPosition(pos.x, pos.y);
  Iso.playerSpr.setDepth(1000 + p.fy * 10);
  const cam = Iso.scene.cameras.main;
  if (cam._followTarget !== Iso.playerSpr) {
    cam.startFollow(Iso.playerSpr, true, 0.12, 0.12);
    cam._followTarget = Iso.playerSpr;
  }
};

/* ---------- NPC + บอสบนแมพ ---------- */
Iso.syncNpcs = function () {
  const sc = Iso.scene;
  const T = Iso.TILE;
  const map = GameData.maps[State.player.map];
  (map.npcs || []).forEach((npc) => {
    const key = npc.id + "@" + npc.x + "," + npc.y;
    let ent = Iso.ent.npcs.get(key);
    if (!ent) {
      const cont = sc.add.container(0, 0);
      let spr, meta = null;
      if (npc.boss && Iso.TD.enemies[npc.boss]) {
        meta = Iso.TD.enemies[npc.boss];
        spr = sc.add.sprite(0, 0, "enemy_" + npc.boss, 0);
        spr.setOrigin(0.5, 0.8);
      } else {
        const nid = Iso.TD.npcs[npc.id] ? npc.id : "elder";
        spr = sc.add.sprite(0, 0, "npc_" + nid, 0);
        spr.setOrigin(0.5, 0.78);
      }
      cont.add(spr);
      const mark = sc.add.text(0, 0, "", {
        fontFamily: "Kanit, sans-serif", fontSize: "22px", fontStyle: "700",
        stroke: "#0a0916", strokeThickness: 5,
      }).setOrigin(0.5, 1);
      cont.add(mark);
      cont.setPosition(npc.x * T + T / 2, npc.y * T + T / 2);
      cont.setDepth(1000 + (npc.y + 0.5) * 10);
      ent = { root: cont, spr, mark, meta, npc, phase: (npc.x * 7 + npc.y * 13) % 4 };
      Iso.ent.npcs.set(key, ent);
      ent.destroy = () => cont.destroy();
    }
    if (ent.meta) {
      // บอส: วนเฟรม idle ของบอส
      const f = Math.floor(Iso.now() / 240 + ent.phase) % ent.meta.frames;
      ent.spr.setFrame(f);
    } else {
      // NPC: เฟรม idle + โยกเล็กน้อยให้มีชีวิต
      ent.spr.setFrame(0);
      ent.spr.setY(Math.sin(Iso.now() / 480 + ent.phase) > 0.6 ? -1 : 0);
    }
    const m = Iso.npcMark(npc);
    if (m) {
      ent.mark.setText(m.mark);
      ent.mark.setColor(m.color);
      const bob = Math.sin(Iso.now() / 300) * 3;
      ent.mark.setY(-Iso.TILE * 0.9 + bob);
      ent.mark.setVisible(true);
    } else ent.mark.setVisible(false);
  });
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
  const T = Iso.TILE;
  const seen = new Set();
  const list = (typeof Net !== "undefined" && Net.others) ? Net.others : [];
  list.forEach((o) => {
    seen.add(o.id);
    let ent = Iso.ent.others.get(o.id);
    if (!ent) {
      const cont = sc.add.container(0, 0);
      const key = "hero_" + (Iso.TD.heroes[o.cls] ? o.cls : "warrior");
      const spr = sc.add.sprite(0, 0, key, 0).setOrigin(0.5, 0.78);
      cont.add(spr);
      const label = sc.add.text(0, -T * 0.95, o.name || "?", {
        fontFamily: "Kanit, sans-serif", fontSize: "13px", fontStyle: "600",
        color: "#c9bfff", backgroundColor: "rgba(10,9,22,0.72)", padding: { x: 5, y: 2 },
      }).setOrigin(0.5, 1);
      cont.add(label);
      ent = { root: cont, spr, label, dx: o.x + 0.5, dy: o.y + 0.5, dir: "down", lastX: o.x, lastY: o.y };
      cont.setPosition(ent.dx * T, ent.dy * T);
      Iso.ent.others.set(o.id, ent);
      ent.destroy = () => cont.destroy();
    }
    const tx = o.x + 0.5, ty = o.y + 0.5;
    if (o.x !== ent.lastX || o.y !== ent.lastY) {
      const dx = o.x - ent.lastX, dy = o.y - ent.lastY;
      ent.dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
      ent.lastX = o.x; ent.lastY = o.y;
    }
    const k = Math.min(1, dt / 140);
    ent.dx += (tx - ent.dx) * k; ent.dy += (ty - ent.dy) * k;
    const moving = Math.abs(tx - ent.dx) + Math.abs(ty - ent.dy) > 0.05;
    ent.spr.setFrame(Iso.charFrame(ent.dir, moving, 1));
    ent.root.setPosition(ent.dx * T, ent.dy * T);
    ent.root.setDepth(1000 + ent.dy * 10);
  });
  Iso.ent.others.forEach((ent, id) => {
    if (!seen.has(id)) { ent.destroy(); Iso.ent.others.delete(id); }
  });
};

/* ---------- สัตว์เลี้ยงคู่หู ---------- */
Iso.syncPet = function () {
  const p = State.player;
  const T = Iso.TILE;
  const pet = (typeof Pets !== "undefined") ? Pets.active(p) : null;
  if (!pet || !World.petPos || !Iso.TD.pets[pet.species]) {
    if (Iso.petSprite) { Iso.petSprite.destroy(); Iso.petSprite = null; }
    return;
  }
  if (!Iso.petSprite || Iso.petSprite._species !== pet.species) {
    if (Iso.petSprite) Iso.petSprite.destroy();
    const s = Iso.scene.add.sprite(0, 0, "pet_" + pet.species, 0);
    s.setOrigin(0.5, 0.75);
    s.setScale(0.8);
    s._species = pet.species;
    Iso.petSprite = s;
  }
  // วนเฟรมเดินช้าๆ (ทิศลง) ให้ดูมีชีวิต
  const f = (Math.floor(Iso.now() / 260) % 4) * 4;
  Iso.petSprite.setFrame(f);
  Iso.petSprite.setPosition(World.petPos.x * T, World.petPos.y * T);
  Iso.petSprite.setDepth(1000 + World.petPos.y * 10 - 1);
};

/* ---------- พอร์ทัลกะพริบ ---------- */
Iso.syncPortals = function () {
  const a = 0.7 + 0.3 * Math.sin(Iso.now() / 320);
  Iso.ent.portals.forEach((img) => { if (img._pulse) img.setAlpha(a); });
};

/* ---------- ป้าย "กด SPACE" ใต้ NPC ในระยะคุย ---------- */
Iso.syncHint = function () {
  const sc = Iso.scene;
  const p = State.player;
  const T = Iso.TILE;
  if (!Iso.hintText) {
    Iso.hintText = sc.add.text(0, 0, "␣ กด SPACE", {
      fontFamily: "Kanit, sans-serif", fontSize: "13px", fontStyle: "600",
      color: "#ffd76a", backgroundColor: "rgba(10,9,22,0.82)",
      padding: { x: 7, y: 2 },
    }).setOrigin(0.5, 0).setDepth(95000).setVisible(false);
  }
  const map = GameData.maps[p.map];
  let best = null, bestD = 1.5 * 1.5;
  (map.npcs || []).forEach((n) => {
    const dx = (n.x + 0.5) - p.fx, dy = (n.y + 0.5) - p.fy, d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = n; }
  });
  const dlgOpen = (typeof UI !== "undefined" && UI.dialogOpen && UI.dialogOpen());
  if (!best || dlgOpen || World.locked) {
    Iso.hintText.setVisible(false);
    return;
  }
  const bob = Math.sin(Iso.now() / 320) * 2;
  Iso.hintText.setPosition(best.x * T + T / 2, best.y * T + T * 0.95 + bob);
  Iso.hintText.setVisible(true);
};

/* ---------- ฟองแชทเหนือหัว ---------- */
Iso.syncBubbles = function () {
  if (typeof Net === "undefined" || !Net.bubblesFor) return;
  const sc = Iso.scene;
  const p = State.player;
  const T = Iso.TILE;
  const jobs = [];
  const mine = Net.bubblesFor(Net.id);
  if (mine && mine.length) jobs.push({ id: "me", list: mine, gx: p.fx, gy: p.fy });
  (Net.others || []).forEach((o) => {
    const ob = Net.bubblesFor(o.id);
    if (ob && ob.length) jobs.push({ id: o.id, list: ob, gx: o.x + 0.5, gy: o.y + 0.5, extra: 18 });
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
          fontFamily: "Kanit, sans-serif", fontSize: "14px", fontStyle: "600",
          color: "#ece9ff", backgroundColor: "rgba(18,15,38,0.92)",
          padding: { x: 7, y: 3 },
        }).setOrigin(0.5, 1);
        cont.add(t);
        y -= t.height + 4;
      }
      b = { root: cont, sig, exps: j.list.map((x) => x.exp) };
      Iso.bubblePool.set(j.id, b);
    }
    b.exps = j.list.map((x) => x.exp);
    b.root.setPosition(j.gx * T, j.gy * T - T * 0.85 - (j.extra || 0));
    b.root.setDepth(90000);
    const soonest = Math.min(...b.exps);
    b.root.setAlpha(Math.max(0, Math.min(1, (soonest - now) / 500)));
  });
  Iso.bubblePool.forEach((b, id) => {
    if (!seen.has(id)) { b.root.destroy(); Iso.bubblePool.delete(id); }
  });
};

window.Iso = Iso;
