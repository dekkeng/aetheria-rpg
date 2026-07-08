/* ============================================================
 * Aetheria RPG — Sprite Engine (Flare art)
 * โหลด sprite sheet จาก assets/sprites/flare (โลก isometric ใช้
 * Phaser ใน iso.js — โมดูลนี้ให้บริการฉากต่อสู้ + portrait DOM
 * + ไอคอนไอเทม (items.png pixel เดิม)
 * ========================================================== */

const Sprites = {
  ready: false,
  man: null,          // manifest เดิม (items/pets ยังใช้)
  FM: null,           // FLARE_MANIFEST
  img: {},            // ชื่อไฟล์ -> HTMLImageElement
  t0: performance.now(),
};

Sprites.now = function () { return performance.now() - Sprites.t0; };

/* ---------- โหลดทุก sheet ---------- */
Sprites.load = function (done) {
  Sprites.man = window.SPRITE_MANIFEST;
  Sprites.FM = window.FLARE_MANIFEST;
  const FM = Sprites.FM;
  const files = ["items"];                       // ไอคอนไอเทม pixel เดิม
  const flare = [];
  if (FM) {
    Object.values(FM.heroes).forEach((h) => flare.push(h.file));
    Object.values(FM.gear).forEach((g) => flare.push(g.file));
    Object.values(FM.enemies).forEach((e) => flare.push(e.file));
    Object.values(FM.npcs).forEach((n) => flare.push(n.file));
  }
  let left = files.length + flare.length;
  const one = () => { if (--left === 0) { Sprites.ready = true; done && done(); } };
  files.forEach((name) => {
    const im = new Image();
    im.onload = one; im.onerror = one;
    im.src = "assets/sprites/" + name + ".png";
    Sprites.img[name] = im;
  });
  flare.forEach((f) => {
    const im = new Image();
    im.onload = one; im.onerror = one;
    im.src = "assets/sprites/flare/" + f;
    Sprites.img[f] = im;
  });
};

/* ---------- เฟรม animation (stance หายใจ) ---------- */
Sprites.flFrame = function (secs, sec, phase) {
  const s = secs[sec] || secs.stance;
  const ms = sec === "run" ? 533 : 800;
  const f = Math.floor(Sprites.now() / (ms / s.frames) + (phase || 0)) % s.frames;
  return s.start + f;
};

/* วาดเฟรมจาก sheet flare ลง canvas: fit ลงกล่อง size (คงสัดส่วน, เท้าอยู่ล่าง) */
Sprites.drawFlareCell = function (ctx, file, cw, ch, dir, col, dx, dy, size) {
  const img = Sprites.img[file];
  if (!img || !img.complete || !img.naturalWidth) return false;
  const scale = size / Math.max(cw, ch);
  const w = cw * scale, h = ch * scale;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, col * cw, dir * ch, cw, ch,
    dx + (size - w) / 2, dy + size - h, w, h);
  return true;
};

/* ---------- ศัตรู (ฉากต่อสู้ + ทั่วไป) — คืน true ถ้าวาดได้ ---------- */
Sprites.drawEnemy = function (ctx, enemyId, dx, dy, size) {
  if (!Sprites.ready || !Sprites.FM) return false;
  const en = (typeof GameData !== "undefined") ? GameData.enemies[enemyId] : null;
  const kind = (en && en.spr) ? en.spr : enemyId;
  const meta = Sprites.FM.enemies[kind] || Sprites.FM.enemies[enemyId];
  if (!meta) return false;
  const col = Sprites.flFrame(meta.secs, "stance", 0);
  // ทิศ 0 (ตะวันตก) = หันเข้าหาฮีโร่ที่อยู่ฝั่งซ้ายของจอต่อสู้
  return Sprites.drawFlareCell(ctx, meta.file, meta.w, meta.h, 0, col, dx, dy, size);
};

/* ---------- ฮีโร่ในฉากต่อสู้ (หันขวาเข้าหาศัตรู + อุปกรณ์ครบ) ---------- */
Sprites.GEAR_ORDER = ["legs", "boots", "body", "hand_r", "hand_l", "head"];
Sprites.drawHeroBattle = function (ctx, cls, dir, size, equip) {
  if (!Sprites.ready || !Sprites.FM) return;
  const FM = Sprites.FM;
  const hc = FM.heroCell;
  const hero = FM.heroes[cls] || FM.heroes.warrior;
  const fdir = 5;                                    // SE — หันเข้าหาศัตรูฝั่งขวา
  const col = Sprites.flFrame(hc.secs, "stance", 0);
  Sprites.drawFlareCell(ctx, hero.file, hc.w, hc.h, fdir, col, 0, 0, size);
  const eq = equip || {};
  Sprites.GEAR_ORDER.forEach((slot) => {
    const g = FM.gear[eq[slot]];
    if (g) Sprites.drawFlareCell(ctx, g.file, hc.w, hc.h, fdir, col, 0, 0, size);
  });
};

/* ---------- สัตว์เลี้ยง (ใช้ sheet ศัตรูย่อ) ---------- */
Sprites.drawPet = function (ctx, species, dx, dy, size) {
  if (!Sprites.ready || !Sprites.FM) return false;
  const eid = Sprites.FM.pets[species];
  const meta = eid && Sprites.FM.enemies[eid];
  if (!meta) return false;
  const col = Sprites.flFrame(meta.secs, "stance", 1);
  return Sprites.drawFlareCell(ctx, meta.file, meta.w, meta.h, 6, col, dx, dy, size);
};

/* วาด emoji แทนสไปรต์ (fallback) พร้อมขยับเบาๆ ให้ดูมีชีวิต */
Sprites.drawEmoji = function (ctx, glyph, cx, cy, fontPx) {
  const bob = Math.sin(Sprites.now() / 360) * (fontPx * 0.04);
  ctx.font = `${fontPx}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(glyph, cx, cy + bob);
};

/* ---------- CSS style พอร์เทรต (HUD + กล่องสนทนา) ----------
 * ครอปช่วงหัว-ลำตัวของเฟรม stance ทิศหน้า (dir 6) */
Sprites.flarePortraitStyle = function (file, cw, ch, px, zoomTop) {
  // แสดงเฉพาะส่วนบนของเฟรม (หัวถึงเอว) ให้เต็มกรอบสี่เหลี่ยม px
  const crop = ch * (zoomTop || 0.62);               // สูงของช่วงที่โชว์
  const scale = px / crop;
  const dir = 6, col = 0;
  return `background-image:url('assets/sprites/flare/${file}');` +
    `background-repeat:no-repeat;` +
    `background-size:${Math.round(cw * 12 * scale)}px auto;` +
    `background-position:${-Math.round((col * cw + cw / 2 - px / scale / 2) * scale)}px ` +
    `${-Math.round((dir * ch + ch * 0.08) * scale)}px;`;
};

Sprites.heroPortraitStyle = function (classId, px) {
  if (!Sprites.FM || !Sprites.FM.heroes[classId]) return "";
  const hc = Sprites.FM.heroCell;
  return Sprites.flarePortraitStyle(Sprites.FM.heroes[classId].file, hc.w, hc.h, px || 48);
};

Sprites.npcPortraitStyle = function (npcId, px) {
  if (!Sprites.FM || !Sprites.FM.npcs[npcId]) return "";
  const m = Sprites.FM.npcs[npcId];
  px = px || 56;
  return `width:${px}px;height:${px}px;` +
    Sprites.flarePortraitStyle(m.file, m.w, m.h, px, 0.55);
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

/* ---------- ลูป animation ฉากต่อสู้ ----------
 * (โลก isometric มีลูปของ Phaser เอง — ที่นี่ดูแลเฉพาะ battle) */
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
