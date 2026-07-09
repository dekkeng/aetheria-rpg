/* ============================================================
 * Aetheria RPG — Sprite Engine (Ninja Adventure art)
 * โลก top-down ใช้ Phaser (iso.js) — โมดูลนี้ดูแลฉากต่อสู้ (canvas)
 * + พอร์เทรตหน้า (Faceset) + ไอคอนไอเทม (items.png pixel เดิม)
 * ========================================================== */

const Sprites = {
  ready: false,
  man: null,          // manifest เดิม (items/pets icon เมนูยังใช้)
  TD: null,           // TD_MANIFEST
  img: {},            // key -> HTMLImageElement
  t0: performance.now(),
};

Sprites.now = function () { return performance.now() - Sprites.t0; };

/* ---------- โหลด sheet ที่ฉากต่อสู้ใช้ ---------- */
Sprites.load = function (done) {
  Sprites.man = window.SPRITE_MANIFEST;
  Sprites.TD = window.TD_MANIFEST;
  const TD = Sprites.TD;
  const jobs = [["items", "assets/sprites/items.png"]];
  if (TD) {
    Object.keys(TD.heroes).forEach((c) =>
      jobs.push(["hero_" + c, "assets/sprites/td/" + TD.heroes[c].file]));
    Object.keys(TD.enemies).forEach((e) =>
      jobs.push(["enemy_" + e, "assets/sprites/td/" + TD.enemies[e].file]));
    Object.keys(TD.pets).forEach((p) =>
      jobs.push(["pet_" + p, "assets/sprites/td/" + TD.pets[p].file]));
  }
  let left = jobs.length;
  const one = () => { if (--left === 0) { Sprites.ready = true; done && done(); } };
  jobs.forEach(([key, src]) => {
    const im = new Image();
    im.onload = one; im.onerror = one;
    im.src = src;
    Sprites.img[key] = im;
  });
};

/* วาดเฟรมจาก sheet ลง canvas ให้พอดีกล่อง size (คงสัดส่วน, กึ่งกลาง-ล่าง) */
Sprites.drawCell = function (ctx, key, cell, col, row, dx, dy, size) {
  const img = Sprites.img[key];
  if (!img || !img.complete || !img.naturalWidth) return false;
  const scale = size / cell;
  const w = cell * scale, h = cell * scale;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, col * cell, row * cell, cell, cell,
    dx + (size - w) / 2, dy + size - h, w, h);
  return true;
};

/* ---------- ศัตรูในฉากต่อสู้ — คืน true ถ้าวาดได้ ---------- */
Sprites.drawEnemy = function (ctx, enemyId, dx, dy, size) {
  if (!Sprites.ready || !Sprites.TD) return false;
  const meta = Sprites.TD.enemies[enemyId];
  if (!meta) return false;
  const key = "enemy_" + enemyId;
  if (meta.boss) {
    // บอส: แถวเดียว วนเฟรม
    const f = Math.floor(Sprites.now() / 240) % meta.frames;
    return Sprites.drawCell(ctx, key, meta.cell, f, 0, dx, dy, size);
  }
  // มอนสเตอร์: 4 ทิศ x 4 เฟรม — หันซ้าย (col 2) เข้าหาฮีโร่, วนเฟรมช้า
  const row = Math.floor(Sprites.now() / 320) % 4;
  return Sprites.drawCell(ctx, key, meta.cell, 2, row, dx, dy, size);
};

/* ---------- ฮีโร่ในฉากต่อสู้ (หันขวาเข้าหาศัตรู) ---------- */
Sprites.drawHeroBattle = function (ctx, cls, dir, size, equip) {
  if (!Sprites.ready || !Sprites.TD) return;
  const TD = Sprites.TD;
  const key = "hero_" + (TD.heroes[cls] ? cls : "warrior");
  // เฟรม idle (แถว 0) ทิศขวา (col 3) + ก้าวเท้าเบาๆ เป็นจังหวะหายใจ
  const step = Math.floor(Sprites.now() / 640) % 2;
  const row = step === 0 ? 0 : 1;
  Sprites.drawCell(ctx, key, TD.cell, 3, row, 0, 0, size);
};

/* ---------- สัตว์เลี้ยงในฉากต่อสู้ ---------- */
Sprites.drawPet = function (ctx, species, dx, dy, size) {
  if (!Sprites.ready || !Sprites.TD) return false;
  const meta = Sprites.TD.pets[species];
  if (!meta) return false;
  const row = Math.floor(Sprites.now() / 300) % 4;
  return Sprites.drawCell(ctx, "pet_" + species, meta.cell, 3, row, dx, dy, size);
};

/* วาด emoji แทนสไปรต์ (fallback) */
Sprites.drawEmoji = function (ctx, glyph, cx, cy, fontPx) {
  const bob = Math.sin(Sprites.now() / 360) * (fontPx * 0.04);
  ctx.font = `${fontPx}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(glyph, cx, cy + bob);
};

/* ---------- พอร์เทรตหน้า (Faceset ของ Ninja Adventure) ---------- */
Sprites.faceStyle = function (file, px) {
  return `background-image:url('assets/sprites/td/faces/${file}.png');` +
    `background-size:cover;background-position:center;image-rendering:pixelated;`;
};

Sprites.heroPortraitStyle = function (classId, px) {
  if (!Sprites.TD || !Sprites.TD.heroes[classId]) return "";
  return Sprites.faceStyle("hero_" + classId, px || 48);
};

Sprites.npcPortraitStyle = function (npcId, px) {
  if (!Sprites.TD || !Sprites.TD.npcs[npcId]) return "";
  px = px || 56;
  return `width:${px}px;height:${px}px;` + Sprites.faceStyle("npc_" + npcId, px);
};

/* ---------- ไอคอนไอเทมใน DOM (pixel เดิม) ---------- */
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

/* ---------- ลูป animation ฉากต่อสู้ ---------- */
Sprites.startLoop = function () {
  function frame() {
    if (State.screen === "battle" && typeof Battle !== "undefined" && Battle.drawSprites) {
      Battle.drawSprites();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};

window.Sprites = Sprites;
