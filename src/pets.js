/* ============================================================
 * Aetheria RPG — Pet System
 * สัตว์เลี้ยง: ฟักจากไข่ (สุ่มตามความหายาก), ให้อาหารอัพเลเวล,
 * สลับใช้ทีละตัว, โบนัสสเตตัส/เพิร์ค/สกิล, เดินตาม + ช่วยต่อสู้
 * ========================================================== */

const Pets = {};

/* ---------- สายพันธุ์ (น่ารักทุกตัว) ---------- */
Pets.SPECIES = {
  slime_pet:  { name: "สไลม์มิ้นท์",    icon: "🟢" },
  bat_pet:    { name: "ค้างคาวโกโก้",   icon: "🦇" },
  ghost_pet:  { name: "ผีน้อยมัลโลว์",  icon: "👻" },
  spider_pet: { name: "แมงมุมจิ๋ว",     icon: "🕷️" },
  snake_pet:  { name: "งูน้อยเลม่อน",   icon: "🐍" },
  rat_pet:    { name: "หนูภูเขา",       icon: "🐭" },
  snowman_pet:{ name: "สโนว์บอล",       icon: "⛄" },
  yeti_pet:   { name: "เยติจูเนียร์",   icon: "🦍" },
};

/* ---------- ระดับความหายาก ---------- */
Pets.RARITIES = {
  common: { name: "ทั่วไป",  color: "#9aa3b2", order: 0, lines: 1, statMin: 2,  statMax: 4,  perkChance: 0.25 },
  rare:   { name: "หายาก",  color: "#4aa8ff", order: 1, lines: 2, statMin: 4,  statMax: 7,  perkChance: 1.0 },
  epic:   { name: "อีพิค",   color: "#c98bff", order: 2, lines: 2, statMin: 7,  statMax: 11, perkChance: 1.0 },
  legend: { name: "ตำนาน",  color: "#ffcc55", order: 3, lines: 3, statMin: 11, statMax: 16, perkChance: 1.0 },
};
Pets.RARITY_ORDER = ["common", "rare", "epic", "legend"];

/* เพิร์คที่สุ่มได้ (คุณภาพขึ้นกับความหายาก) */
Pets.PERKS = {
  exp_boost:  { name: "ขยันเรียนรู้",  desc: (v) => `EXP จากการต่อสู้ +${v}%` },
  gold_boost: { name: "จมูกหาสมบัติ", desc: (v) => `ทองจากการต่อสู้ +${v}%` },
  heal_after: { name: "พยาบาลน้อย",   desc: (v) => `ฟื้น HP ${v}% หลังชนะ` },
  assist:     { name: "จู่โจมช่วย",    desc: (v) => `มีโอกาสช่วยโจมตี (พลัง ${v})` },
};
/* สกิลที่สัตว์ระดับตำนานมอบให้ (ขณะเป็นคู่หู) */
Pets.GRANT_SKILLS = ["ice_lance", "life_drain", "guard_break", "greater_heal"];

Pets.MAX_LEVEL = 10;
Pets.expForLevel = function (lv) { return Math.floor(30 * Math.pow(lv, 1.6)); };
/* ตัวคูณโบนัสตามเลเวลสัตว์ */
Pets.scale = function (pet) { return 1 + (pet.level - 1) * 0.15; };

/* ---------- สุ่มฟักไข่ ---------- */
Pets.rollRarity = function (baseRarity) {
  // มีโอกาส 10% อัพเกรดขึ้น 1 ขั้นจากระดับไข่
  let idx = Pets.RARITY_ORDER.indexOf(baseRarity);
  if (idx < 0) idx = 0;
  if (idx < 3 && Math.random() < 0.10) idx++;
  return Pets.RARITY_ORDER[idx];
};

Pets.hatch = function (baseRarity) {
  const rarity = Pets.rollRarity(baseRarity);
  const R = Pets.RARITIES[rarity];
  const speciesIds = Object.keys(Pets.SPECIES);
  const species = speciesIds[Math.floor(Math.random() * speciesIds.length)];

  // สุ่มสเตตัส (ATK/DEF/SPD) ตามจำนวน line ของระดับ
  const stats = { atk: 0, def: 0, spd: 0 };
  const keys = ["atk", "def", "spd"];
  for (let i = 0; i < R.lines; i++) {
    const k = keys[Math.floor(Math.random() * keys.length)];
    stats[k] += R.statMin + Math.floor(Math.random() * (R.statMax - R.statMin + 1));
  }

  // สุ่มเพิร์ค
  let perk = null;
  if (Math.random() < R.perkChance) {
    const pk = Object.keys(Pets.PERKS)[Math.floor(Math.random() * 4)];
    const q = R.order; // 0..3
    let value = 0;
    if (pk === "exp_boost")  value = 5 + q * 5 + Math.floor(Math.random() * 6);        // 5–26%
    if (pk === "gold_boost") value = 5 + q * 6 + Math.floor(Math.random() * 8);        // 5–30%
    if (pk === "heal_after") value = 8 + q * 6 + Math.floor(Math.random() * 6);        // 8–31%
    if (pk === "assist")     value = 8 + q * 8 + Math.floor(Math.random() * 8);        // 8–39
    perk = { type: pk, value };
  }

  // ระดับตำนาน: มอบสกิลพิเศษขณะเป็นคู่หู
  let skill = null;
  if (rarity === "legend") {
    skill = Pets.GRANT_SKILLS[Math.floor(Math.random() * Pets.GRANT_SKILLS.length)];
  }

  return {
    uid: "pet_" + Date.now() + "_" + Math.floor(Math.random() * 9999),
    species, rarity, level: 1, exp: 0,
    name: Pets.SPECIES[species].name,
    stats, perk, skill,
  };
};

/* ---------- ตัวช่วยเข้าถึง ---------- */
Pets.active = function (p) {
  if (!p || !p.pets || !p.activePet) return null;
  return p.pets.find((x) => x.uid === p.activePet) || null;
};
Pets.stat = function (p, key) {
  const pet = Pets.active(p);
  if (!pet) return 0;
  return Math.round((pet.stats[key] || 0) * Pets.scale(pet));
};
Pets.perkValue = function (p, type) {
  const pet = Pets.active(p);
  if (!pet || !pet.perk || pet.perk.type !== type) return 0;
  return Math.round(pet.perk.value * Pets.scale(pet));
};
Pets.expMult = function (p) { return 1 + Pets.perkValue(p, "exp_boost") / 100; };
Pets.goldMult = function (p) { return 1 + Pets.perkValue(p, "gold_boost") / 100; };
Pets.grantedSkill = function (p) {
  const pet = Pets.active(p);
  return (pet && pet.skill) ? pet.skill : null;
};

/* ---------- ให้อาหาร ---------- */
Pets.feed = function (p, pet, foodItemId) {
  const it = GameData.items[foodItemId];
  if (!it || it.type !== "petfood") return { ok: false };
  if (State.countItem(p, foodItemId) <= 0) return { ok: false };
  if (pet.level >= Pets.MAX_LEVEL) return { ok: false, maxed: true };
  State.removeItem(p, foodItemId, 1);
  pet.exp += it.petExp || 10;
  let ups = 0;
  let need = Pets.expForLevel(pet.level);
  while (pet.exp >= need && pet.level < Pets.MAX_LEVEL) {
    pet.exp -= need; pet.level++; ups++;
    need = Pets.expForLevel(pet.level);
  }
  if (pet.level >= Pets.MAX_LEVEL) pet.exp = 0;
  return { ok: true, ups };
};

/* ---------- ไอคอน sprite (CSS) ---------- */
Pets.iconHtml = function (species, px) {
  px = px || 40;
  if (typeof Sprites === "undefined" || !Sprites.ready || !Sprites.man.pets)
    return `<span style="font-size:${px * 0.7}px">${(Pets.SPECIES[species] || {}).icon || "🐾"}</span>`;
  const P = Sprites.man.pets;
  const row = P.rows[species];
  if (row === undefined) return "🐾";
  const scale = px / P.cell;
  return `<span class="pet-ic" style="display:inline-block;width:${px}px;height:${px}px;` +
    `background-image:url('assets/sprites/pets.png');` +
    `background-size:${P.frames * P.cell * scale}px ${Object.keys(P.rows).length * P.cell * scale}px;` +
    `background-position:0 -${row * P.cell * scale}px;image-rendering:pixelated;"></span>`;
};

/* ============================================================
 * UI — เมนูสัตว์เลี้ยง
 * ========================================================== */
Pets.openMenu = function () {
  const p = State.player;
  if (!p.pets) p.pets = [];
  let rows = p.pets.map((pet) => {
    const R = Pets.RARITIES[pet.rarity];
    const isActive = p.activePet === pet.uid;
    const need = Pets.expForLevel(pet.level);
    const maxed = pet.level >= Pets.MAX_LEVEL;
    const statTxt = ["atk", "def", "spd"].filter((k) => pet.stats[k] > 0)
      .map((k) => `${k.toUpperCase()} +${Math.round(pet.stats[k] * Pets.scale(pet))}`).join(" · ") || "—";
    const perkTxt = pet.perk ? `✦ ${Pets.PERKS[pet.perk.type].name}: ${Pets.PERKS[pet.perk.type].desc(Math.round(pet.perk.value * Pets.scale(pet)))}` : "";
    const skillTxt = pet.skill ? `📖 มอบสกิล: ${GameData.skills[pet.skill].name}` : "";
    return `<div class="pet-card ${isActive ? "active" : ""}" style="--rc:${R.color}">
      <div class="pet-top">
        ${Pets.iconHtml(pet.species, 44)}
        <div class="pet-info">
          <b>${pet.name}</b> <span class="pet-rarity">${R.name}</span>
          <small>Lv.${pet.level}${maxed ? " (MAX)" : ` · EXP ${pet.exp}/${need}`}</small>
        </div>
        ${isActive ? '<span class="badge ok">คู่หู</span>' : ""}
      </div>
      <div class="pet-bonus">${statTxt}${perkTxt ? "<br>" + perkTxt : ""}${skillTxt ? "<br>" + skillTxt : ""}</div>
      <div class="pet-actions">
        ${isActive
          ? `<button class="btn tiny" data-rest="${pet.uid}">พักผ่อน</button>`
          : `<button class="btn tiny" data-equip-pet="${pet.uid}">ตั้งเป็นคู่หู</button>`}
        <button class="btn tiny ${maxed ? "disabled" : ""}" data-feed="${pet.uid}" ${maxed ? "disabled" : ""}>ให้อาหาร</button>
      </div>
    </div>`;
  }).join("");
  if (!rows) rows = '<p class="empty">ยังไม่มีสัตว์เลี้ยง — หา "ไข่ปริศนา" จากบอสหรือร้านค้า แล้วกด "ฟัก" ในกระเป๋า</p>';

  UI.openOverlay(`<h2>🐾 สัตว์เลี้ยง</h2>
    <p class="sub">คู่หูให้โบนัสสเตตัส/ความสามารถ · เดินตามและช่วยในการต่อสู้</p>
    ${rows}`);

  UI.$$("[data-equip-pet]").forEach((b) => b.addEventListener("click", () => {
    p.activePet = b.dataset.equipPet;
    if (typeof SFX !== "undefined") SFX.play("select");
    UI.toast("🐾 " + (p.pets.find((x) => x.uid === p.activePet) || {}).name + " มาเป็นคู่หูแล้ว!");
    if (typeof World !== "undefined") World.resetPet && World.resetPet();
    UI.updateHud(); Pets.openMenu();
    if (typeof Game !== "undefined" && Game.autosave) Game.autosave("pet");
  }));
  UI.$$("[data-rest]").forEach((b) => b.addEventListener("click", () => {
    p.activePet = null;
    UI.toast("ให้คู่หูพักผ่อน");
    UI.updateHud(); Pets.openMenu();
  }));
  UI.$$("[data-feed]").forEach((b) => b.addEventListener("click", () => Pets.openFeed(b.dataset.feed)));
};

/* เลือกอาหารให้สัตว์ */
Pets.openFeed = function (uid) {
  const p = State.player;
  const pet = p.pets.find((x) => x.uid === uid);
  if (!pet) return;
  const foods = p.inventory.filter((s) => {
    const it = GameData.items[s.id];
    return it && it.type === "petfood";
  });
  let rows = foods.map((s) => {
    const it = GameData.items[s.id];
    return `<li>
      <span class="it-ic">${it.icon}</span>
      <span class="it-name">${it.name}<small>+${it.petExp} EXP สัตว์เลี้ยง</small></span>
      <span class="it-qty">x${s.qty}</span>
      <button class="btn tiny" data-give="${s.id}">ป้อน</button>
    </li>`;
  }).join("");
  if (!rows) rows = '<li class="empty">ไม่มีอาหารสัตว์ — ซื้อจากร้านค้า หรือดรอปจากมอนสเตอร์</li>';
  const need = Pets.expForLevel(pet.level);
  UI.openOverlay(`<h2>🍖 ให้อาหาร ${pet.name}</h2>
    <p class="sub">Lv.${pet.level} · EXP ${pet.exp}/${need}</p>
    <ul class="item-list">${rows}</ul>
    <button class="btn wide" id="feed-back">◂ กลับ</button>`);
  UI.$$("[data-give]").forEach((b) => b.addEventListener("click", () => {
    const r = Pets.feed(p, pet, b.dataset.give);
    if (r.maxed) { UI.toast("เลเวลสูงสุดแล้ว"); return; }
    if (!r.ok) return;
    if (typeof SFX !== "undefined") SFX.play(r.ups ? "levelup" : "heal");
    if (r.ups) UI.toast(`🎉 ${pet.name} เลเวลอัพ! Lv.${pet.level}`);
    Pets.openFeed(uid);
  }));
  UI.$("#feed-back").addEventListener("click", Pets.openMenu);
};

/* ---------- ฟักไข่ (เรียกจากกระเป๋า) ---------- */
Pets.hatchEgg = function (eggItemId) {
  const p = State.player;
  const it = GameData.items[eggItemId];
  if (!it || it.type !== "petegg") return;
  if (State.countItem(p, eggItemId) <= 0) return;
  State.removeItem(p, eggItemId, 1);
  if (!p.pets) p.pets = [];
  const pet = Pets.hatch(it.rarity);
  p.pets.push(pet);
  const R = Pets.RARITIES[pet.rarity];
  if (typeof SFX !== "undefined") SFX.play(pet.rarity === "legend" || pet.rarity === "epic" ? "victory" : "levelup");
  if (typeof FX !== "undefined") FX.flash(R.color);
  const statTxt = ["atk", "def", "spd"].filter((k) => pet.stats[k] > 0).map((k) => `${k.toUpperCase()} +${pet.stats[k]}`).join(" · ");
  const perkTxt = pet.perk ? `<p>✦ ${Pets.PERKS[pet.perk.type].name} — ${Pets.PERKS[pet.perk.type].desc(pet.perk.value)}</p>` : "";
  const skillTxt = pet.skill ? `<p>📖 มอบสกิล: <b>${GameData.skills[pet.skill].name}</b> ขณะเป็นคู่หู!</p>` : "";
  UI.openOverlay(`<h2>🥚 ไข่ฟักแล้ว!</h2>
    <div class="pet-hatch" style="--rc:${R.color}">
      ${Pets.iconHtml(pet.species, 72)}
      <h3>${pet.name}</h3>
      <span class="pet-rarity big">${R.name}</span>
      <p>${statTxt}</p>${perkTxt}${skillTxt}
    </div>
    <button class="btn btn-primary wide" id="hatch-ok">เยี่ยมเลย!</button>`);
  UI.$("#hatch-ok").addEventListener("click", () => { UI.closeOverlay(); Pets.openMenu(); });
  if (typeof Game !== "undefined" && Game.autosave) Game.autosave("hatch");
};

window.Pets = Pets;
