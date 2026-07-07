/* ============================================================
 * Aetheria RPG — Sprite Engine
 * โหลด sprite sheet, จัดการ animation (idle หายใจ / เดิน),
 * วาดฮีโร่/มอนสเตอร์/ทายล์ลง canvas, และไอคอนไอเทมใน DOM
 * ========================================================== */

const Sprites = {
  ready: false,
  man: null,          // manifest
  img: {},            // ชื่อ -> HTMLImageElement
  t0: performance.now(),
  loopCb: null,
};

Sprites.now = function () { return performance.now() - Sprites.t0; };

/* เฟรม idle: สลับช้าๆ (หายใจ) */
Sprites.idleFrame = function (frames) {
  const seq = frames || [0, 1];
  const i = Math.floor(Sprites.now() / 480) % seq.length;
  return seq[i];
};
/* เฟรมเดิน: สลับเร็ว */
Sprites.walkFrame = function (frames) {
  const seq = frames || [2, 0, 3, 0];
  const i = Math.floor(Sprites.now() / 130) % seq.length;
  return seq[i];
};

/* โหลด sheet ทั้งหมด */
Sprites.load = function (done) {
  Sprites.man = window.SPRITE_MANIFEST;
  const files = ["heroes", "enemies", "items", "tiles", "npcs", "pets"];
  let left = files.length;
  files.forEach((name) => {
    const im = new Image();
    im.onload = () => { if (--left === 0) { Sprites.ready = true; done && done(); } };
    im.onerror = () => { if (--left === 0) { Sprites.ready = true; done && done(); } };
    im.src = "assets/sprites/" + name + ".png";
    Sprites.img[name] = im;
  });
};

/* ---------- วาดฮีโร่ลง canvas ----------
 * ctx, class, dir, dx, dy (มุมซ้ายบนของช่อง), size, moving */
Sprites.drawHero = function (ctx, cls, dir, dx, dy, size, moving) {
  if (!Sprites.ready) return false;
  const H = Sprites.man.heroes;
  const row = H.rows[cls + "_" + dir];
  if (row === undefined) return false;
  const frame = moving ? Sprites.walkFrame(H.walk) : Sprites.idleFrame(H.idle);
  const c = H.cell;
  ctx.imageSmoothingEnabled = false;
  // ฮีโร่สูงกว่า tile เล็กน้อย จัดให้เท้าอยู่ล่างของช่อง
  const drawSize = size * 1.5;
  const ox = dx + (size - drawSize) / 2;
  const oy = dy + size - drawSize + size * 0.18;
  ctx.drawImage(Sprites.img.heroes, frame * c, row * c, c, c, ox, oy, drawSize, drawSize);
  return true;   // คืน true เพื่อให้ผู้เรียกรู้ว่าวาด sprite สำเร็จ (ไม่ต้อง fallback emoji)
};

/* วาดฮีโร่แบบเต็มช่อง (ใช้ในฉากต่อสู้ — เติมเต็ม canvas) */
Sprites.drawHeroBattle = function (ctx, cls, dir, size) {
  if (!Sprites.ready) return;
  const H = Sprites.man.heroes;
  const row = H.rows[cls + "_" + (dir || "right")];
  if (row === undefined) return;
  const frame = Sprites.idleFrame(H.idle);   // หายใจอยู่กับที่
  const c = H.cell;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(Sprites.img.heroes, frame * c, row * c, c, c, 0, 0, size, size);
};

/* วาดมอนสเตอร์ (idle) — ใช้ทั้งบนแผนที่และในฉากต่อสู้
 * enemyId จะ map ผ่าน enemy.spr ถ้ามี, ไม่งั้นลองใช้ id ตรงๆ
 * คืน true ถ้าวาด pixel sprite ได้ (false = ให้ผู้เรียก fallback เป็น emoji) */
Sprites.drawEnemy = function (ctx, enemyId, dx, dy, size) {
  if (!Sprites.ready) return false;
  const E = Sprites.man.enemies;
  const en = (typeof GameData !== "undefined") ? GameData.enemies[enemyId] : null;
  const kind = (en && en.spr) ? en.spr : enemyId;
  const row = E.rows[kind];
  if (row === undefined) return false;
  const frame = Sprites.idleFrame(E.idle);
  const c = E.cell;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(Sprites.img.enemies, frame * c, row * c, c, c, dx, dy, size, size);
  return true;
};

/* วาด emoji แทนสไปรต์ (fallback) พร้อมขยับเบาๆ ให้ดูมีชีวิต */
Sprites.drawEmoji = function (ctx, glyph, cx, cy, fontPx) {
  const bob = Math.sin(Sprites.now() / 360) * (fontPx * 0.04);
  ctx.font = `${fontPx}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(glyph, cx, cy + bob);
};

/* วาด NPC ลง canvas (idle) — คืน true ถ้าวาดสำเร็จ */
Sprites.drawNpc = function (ctx, npcId, dx, dy, size) {
  if (!Sprites.ready || !Sprites.man.npcs || !Sprites.img.npcs) return false;
  const N = Sprites.man.npcs;
  const row = N.rows[npcId];
  if (row === undefined) return false;
  const frame = Sprites.idleFrame(N.idle);
  const c = N.cell;
  ctx.imageSmoothingEnabled = false;
  const drawSize = size * 1.5;
  const ox = dx + (size - drawSize) / 2;
  const oy = dy + size - drawSize + size * 0.18;
  ctx.drawImage(Sprites.img.npcs, frame * c, row * c, c, c, ox, oy, drawSize, drawSize);
  return true;
};

/* CSS background style สำหรับพอร์เทรตฮีโร่ (ใช้ใน HUD) */
Sprites.heroPortraitStyle = function (classId, px) {
  if (!Sprites.man || !Sprites.man.heroes) return "";
  const H = Sprites.man.heroes;
  const row = H.rows[classId + "_down"];
  if (row === undefined) return "";
  px = px || 48;
  const scale = px / H.cell;
  const sheetW = H.frames * H.cell * scale;
  const sheetH = Object.keys(H.rows).length * H.cell * scale;
  return `background-image:url('assets/sprites/heroes.png');` +
    `background-size:${sheetW}px ${sheetH}px;` +
    `background-position:0 -${row * H.cell * scale}px;` +
    `image-rendering:pixelated;`;
};

/* CSS background style สำหรับพอร์เทรต NPC (ใช้ในกล่องบทสนทนา) */
Sprites.npcPortraitStyle = function (npcId, px) {
  if (!Sprites.man || !Sprites.man.npcs) return "";
  const N = Sprites.man.npcs;
  const row = N.rows[npcId];
  if (row === undefined) return "";
  px = px || 56;
  const scale = px / N.cell;
  const sheetW = N.frames * N.cell * scale;
  const sheetH = Object.keys(N.rows).length * N.cell * scale;
  return `width:${px}px;height:${px}px;` +
    `background-image:url('assets/sprites/npcs.png');` +
    `background-size:${sheetW}px ${sheetH}px;` +
    `background-position:0 -${row * N.cell * scale}px;` +
    `image-rendering:pixelated;`;
};

/* วาดทายล์แบบกำหนดกว้าง/สูงเอง (สำหรับต้นไม้ที่สูงเกินช่อง) */
Sprites.drawTileSized = function (ctx, kind, dx, dy, w, h) {
  if (!Sprites.ready || !Sprites.man.tiles || !Sprites.img.tiles) return false;
  const Tt = Sprites.man.tiles;
  const idx = Tt.map[kind];
  if (idx === undefined) return false;
  const c = Tt.cell;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(Sprites.img.tiles, idx * c, 0, c, c, dx, dy, w, h);
  return true;
};

/* วาดสัตว์เลี้ยง (idle 2 เฟรม) — คืน true ถ้าวาดสำเร็จ */
Sprites.drawPet = function (ctx, species, dx, dy, size) {
  if (!Sprites.ready || !Sprites.man.pets || !Sprites.img.pets) return false;
  const P = Sprites.man.pets;
  const row = P.rows[species];
  if (row === undefined) return false;
  const frame = Sprites.idleFrame(P.idle);
  const c = P.cell;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(Sprites.img.pets, frame * c, row * c, c, c, dx, dy, size, size);
  return true;
};

/* วาดทายล์ */
Sprites.drawTile = function (ctx, kind, dx, dy, size) {
  if (!Sprites.ready) return false;
  const Tt = Sprites.man.tiles;
  const idx = Tt.map[kind];
  if (idx === undefined) return false;
  const c = Tt.cell;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(Sprites.img.tiles, idx * c, 0, c, c, dx, dy, size, size);
  return true;
};

/* คืน CSS background style สำหรับไอคอนไอเทมใน DOM */
Sprites.itemIconStyle = function (itemId, px) {
  const It = Sprites.man.items;
  const pos = It.map[itemId];
  if (!pos) return "";
  px = px || 32;
  const scale = px / It.cell;
  const sheetW = It.cols * It.cell * scale;
  const rows = 2; // items.png มี 2 แถว
  const sheetH = rows * It.cell * scale;
  return `display:inline-block;width:${px}px;height:${px}px;` +
    `background-image:url('assets/sprites/items.png');` +
    `background-size:${sheetW}px ${sheetH}px;` +
    `background-position:-${pos[0]*It.cell*scale}px -${pos[1]*It.cell*scale}px;` +
    `image-rendering:pixelated;vertical-align:middle;`;
};
Sprites.itemIcon = function (itemId, px) {
  return `<span class="spr-item" style="${Sprites.itemIconStyle(itemId, px)}"></span>`;
};

/* ---------- ลูป animation กลาง ----------
 * เรียก render callback ตามหน้าจอปัจจุบัน เพื่อให้ idle ขยับตลอด */
Sprites.startLoop = function () {
  let last = performance.now();
  function frame(now) {
    const dt = now - last; last = now;
    if (State.screen === "world" && typeof World !== "undefined") {
      World.tick ? World.tick(dt) : World.draw();
    } else if (State.screen === "battle" && typeof Battle !== "undefined" && Battle.drawSprites) {
      Battle.drawSprites();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};

window.Sprites = Sprites;
