/* ============================================================
 * Aetheria RPG — Game Data
 * ข้อมูลทั้งหมดของเกม: อาชีพ, ไอเทม, มอนสเตอร์, เควส, NPC, แผนที่
 * โค้ดต้นฉบับทั้งหมด
 * ========================================================== */

const GameData = {};

/* ---------- อาชีพ (Classes) ---------- */
GameData.classes = [
  {
    id: "warrior",
    name: "นักรบ",
    icon: "⚔️",
    desc: "พลังโจมตีและ HP สูง เหมาะกับสายบุกตะลุย",
    base: { maxHp: 60, maxMp: 12, atk: 12, def: 8, spd: 6 },
    skill: "power_strike",
  },
  {
    id: "mage",
    name: "จอมเวท",
    icon: "🔮",
    desc: "เวทมนตร์รุนแรง MP สูง แต่ตัวบาง",
    base: { maxHp: 40, maxMp: 30, atk: 7, def: 5, spd: 7 },
    skill: "fireball",
  },
  {
    id: "archer",
    name: "นักธนู",
    icon: "🏹",
    desc: "คล่องแคล่ว ความเร็วสูง โจมตีแม่นยำ",
    base: { maxHp: 48, maxMp: 18, atk: 10, def: 6, spd: 10 },
    skill: "double_shot",
  },
];

/* ---------- สกิล (Skills) ----------
 * power/heal จะแรงขึ้นตามเลเวลสกิล (maxLv). อัพด้วยแต้มสกิล, ปลดล็อกด้วยตำรา
 * ---------------------------------- */
GameData.skills = {
  // สกิลเริ่มต้นประจำอาชีพ
  power_strike: { name: "ฟันทรงพลัง", mp: 6,  power: 2.0, type: "phys",  maxLv: 5, sfx: "power_strike", desc: "โจมตีกายภาพแรง" },
  fireball:     { name: "ลูกไฟ",       mp: 8,  power: 2.4, type: "magic", maxLv: 5, sfx: "fireball",     desc: "เวทไฟพลังสูง" },
  double_shot:  { name: "ยิงคู่",       mp: 5,  power: 1.4, hits: 2, type: "phys", maxLv: 5, sfx: "double_shot", desc: "ยิงธนู 2 ครั้ง" },
  heal_spell:   { name: "รักษา",        mp: 7,  heal: 30, type: "heal",  maxLv: 5, sfx: "heal", desc: "ฟื้น HP" },
  // สกิลที่ต้องปลดล็อก (จากตำรา/ดรอป/เควส/บอส)
  guard_break:  { name: "ทลายเกราะ",   mp: 10, power: 2.8, type: "phys",  maxLv: 5, sfx: "power_strike", desc: "ฟันทะลวงเกราะ ดาเมจสูง" },
  multi_slash:  { name: "รัวดาบ",       mp: 12, power: 1.3, hits: 3, type: "phys", maxLv: 5, sfx: "double_shot", desc: "ฟัน 3 ครั้งรวด" },
  arrow_rain:   { name: "ห่าธนู",       mp: 14, power: 1.1, hits: 4, type: "phys", maxLv: 5, sfx: "double_shot", desc: "ยิงธนูใส่ 4 ครั้ง" },
  ice_lance:    { name: "หอกน้ำแข็ง",   mp: 9,  power: 2.6, type: "magic", maxLv: 5, sfx: "fireball", desc: "หอกน้ำแข็งเจาะทะลุ" },
  thunderbolt:  { name: "สายฟ้า",       mp: 14, power: 3.2, type: "magic", maxLv: 5, sfx: "skill", desc: "อสุนีบาตพลังสูง" },
  meteor:       { name: "อุกกาบาต",     mp: 22, power: 4.2, type: "magic", maxLv: 5, sfx: "fireball", desc: "เรียกอุกกาบาตถล่ม" },
  life_drain:   { name: "ดูดพลังชีวิต", mp: 12, power: 2.0, drain: 0.5, type: "magic", maxLv: 5, sfx: "skill", desc: "ทำดาเมจ + ฟื้น HP ครึ่งหนึ่งของดาเมจ" },
  greater_heal: { name: "รักษาชั้นสูง", mp: 14, heal: 70, type: "heal",  maxLv: 5, sfx: "heal", desc: "ฟื้น HP มาก" },
};

/* ---------- ไอเทม (Items) ---------- */
GameData.items = {
  potion:      { id: "potion",      name: "ยาฟื้น HP",   icon: "🧪", type: "consume", heal: 30,  price: 25,  desc: "ฟื้น HP 30" },
  hi_potion:   { id: "hi_potion",   name: "ยาฟื้น HP+",  icon: "🍶", type: "consume", heal: 80,  price: 70,  desc: "ฟื้น HP 80" },
  ether:       { id: "ether",       name: "ยาฟื้น MP",   icon: "💧", type: "consume", mp: 25,    price: 40,  desc: "ฟื้น MP 25" },
  antidote:    { id: "antidote",    name: "ยาถอนพิษ",    icon: "🌿", type: "consume", cure: true, price: 15, desc: "รักษาสถานะพิษ" },

  wood_sword:  { id: "wood_sword",  name: "ดาบไม้",      icon: "🗡️", type: "weapon", atk: 4,  price: 30,  desc: "ATK +4" },
  iron_sword:  { id: "iron_sword",  name: "ดาบเหล็ก",    icon: "⚔️", type: "weapon", atk: 10, price: 120, desc: "ATK +10" },
  mythril_bow: { id: "mythril_bow", name: "ธนูมิธริล",   icon: "🏹", type: "weapon", atk: 14, price: 220, desc: "ATK +14" },

  leather_armor:{ id: "leather_armor", name: "เกราะหนัง", icon: "🦺", type: "armor", def: 5,  price: 50,  desc: "DEF +5" },
  iron_armor:  { id: "iron_armor",  name: "เกราะเหล็ก",  icon: "🛡️", type: "armor", def: 12, price: 160, desc: "DEF +12" },

  slime_gel:   { id: "slime_gel",   name: "เจลสไลม์",    icon: "🫧", type: "material", price: 5,  desc: "วัตถุดิบ ดรอปจากสไลม์" },
  wolf_fang:   { id: "wolf_fang",   name: "เขี้ยวหมาป่า", icon: "🦷", type: "material", price: 12, desc: "วัตถุดิบ ดรอปจากหมาป่า" },
  fire_crystal:{ id: "fire_crystal",name: "ผลึกไฟ",      icon: "🔥", type: "material", price: 20, desc: "วัตถุดิบร้อนแรง ดรอปจากภูตไฟ" },

  // อาวุธ/เกราะระดับสูง (ดรอปจากบอส/ปลายเกม)
  flame_blade: { id: "flame_blade", name: "ดาบเปลวเพลิง", icon: "🗡️", type: "weapon", atk: 22, price: 500, desc: "ATK +22 · อบด้วยไฟมังกร" },
  frost_edge:  { id: "frost_edge",  name: "คมน้ำแข็ง",   icon: "❄️", type: "weapon", atk: 30, price: 800, desc: "ATK +30" },
  dragon_mail: { id: "dragon_mail", name: "เกราะเกล็ดมังกร", icon: "🐲", type: "armor", def: 20, price: 600, desc: "DEF +20" },
  aether_robe: { id: "aether_robe", name: "อาภรณ์อีเธอร์", icon: "✨", type: "armor", def: 28, price: 900, desc: "DEF +28" },

  // ตำราสกิล (ใช้เพื่อเรียนรู้/อัพสกิล)
  book_guard_break: { id: "book_guard_break", name: "ตำรา: ทลายเกราะ", icon: "📕", type: "skillbook", skill: "guard_break", price: 200, desc: "เรียนรู้/อัพสกิล ทลายเกราะ" },
  book_multi_slash: { id: "book_multi_slash", name: "ตำรา: รัวดาบ",     icon: "📕", type: "skillbook", skill: "multi_slash", price: 260, desc: "เรียนรู้/อัพสกิล รัวดาบ" },
  book_arrow_rain:  { id: "book_arrow_rain",  name: "ตำรา: ห่าธนู",     icon: "📗", type: "skillbook", skill: "arrow_rain", price: 300, desc: "เรียนรู้/อัพสกิล ห่าธนู" },
  book_ice_lance:   { id: "book_ice_lance",   name: "ตำรา: หอกน้ำแข็ง", icon: "📘", type: "skillbook", skill: "ice_lance", price: 240, desc: "เรียนรู้/อัพสกิล หอกน้ำแข็ง" },
  book_thunderbolt: { id: "book_thunderbolt", name: "ตำรา: สายฟ้า",     icon: "📘", type: "skillbook", skill: "thunderbolt", price: 360, desc: "เรียนรู้/อัพสกิล สายฟ้า" },
  book_meteor:      { id: "book_meteor",      name: "ตำรา: อุกกาบาต",   icon: "📙", type: "skillbook", skill: "meteor", price: 600, desc: "เรียนรู้/อัพสกิล อุกกาบาต" },
  book_life_drain:  { id: "book_life_drain",  name: "ตำรา: ดูดพลังชีวิต", icon: "📓", type: "skillbook", skill: "life_drain", price: 320, desc: "เรียนรู้/อัพสกิล ดูดพลังชีวิต" },
  book_greater_heal:{ id: "book_greater_heal",name: "ตำรา: รักษาชั้นสูง", icon: "📔", type: "skillbook", skill: "greater_heal", price: 280, desc: "เรียนรู้/อัพสกิล รักษาชั้นสูง" },

  // ไข่สัตว์เลี้ยง (ฟักแล้วสุ่มสายพันธุ์+ความสามารถตามระดับ)
  egg_common: { id: "egg_common", name: "ไข่ปริศนา",       icon: "🥚", type: "petegg", rarity: "common", price: 800,  desc: "ฟักได้สัตว์เลี้ยง (ระดับทั่วไป มีลุ้นอัพเกรด)" },
  egg_rare:   { id: "egg_rare",   name: "ไข่เงิน",          icon: "🪺", type: "petegg", rarity: "rare",   price: 2500, desc: "ฟักได้สัตว์เลี้ยง (ระดับหายากขึ้นไป)" },
  egg_epic:   { id: "egg_epic",   name: "ไข่คริสตัล",       icon: "💠", type: "petegg", rarity: "epic",   price: 0,    desc: "ฟักได้สัตว์เลี้ยง (ระดับอีพิคขึ้นไป) — จากบอสเท่านั้น" },
  egg_legend: { id: "egg_legend", name: "ไข่ทองคำโบราณ",   icon: "🌟", type: "petegg", rarity: "legend", price: 0,    desc: "ฟักได้สัตว์เลี้ยงระดับตำนาน — หายากที่สุด" },

  // อาหารสัตว์เลี้ยง (อัพเลเวลสัตว์)
  pet_berry: { id: "pet_berry", name: "เบอร์รี่ป่า",   icon: "🫐", type: "petfood", petExp: 15,  price: 40,  desc: "อาหารสัตว์เลี้ยง +15 EXP" },
  pet_meat:  { id: "pet_meat",  name: "เนื้อย่างหอม",  icon: "🍖", type: "petfood", petExp: 40,  price: 120, desc: "อาหารสัตว์เลี้ยง +40 EXP" },
  pet_jelly: { id: "pet_jelly", name: "รอยัลเจลลี่",   icon: "🍯", type: "petfood", petExp: 150, price: 350, desc: "อาหารสัตว์เลี้ยงชั้นเลิศ +150 EXP" },

  // เสี้ยวมงกุฎ (ไอเทมเนื้อเรื่อง)
  shard1: { id: "shard1", name: "เสี้ยวมงกุฎ I",  icon: "🔷", type: "key", price: 0, desc: "เสี้ยวมงกุฎอีเธอร์ — จากป่าธอร์นวูด" },
  shard2: { id: "shard2", name: "เสี้ยวมงกุฎ II", icon: "🔶", type: "key", price: 0, desc: "เสี้ยวมงกุฎอีเธอร์ — จากโพรงมังกร" },
  shard3: { id: "shard3", name: "เสี้ยวมงกุฎ III",icon: "🟣", type: "key", price: 0, desc: "เสี้ยวมงกุฎอีเธอร์ — จากบึงมิสท์เฟน" },
  shard4: { id: "shard4", name: "เสี้ยวมงกุฎ IV", icon: "🟢", type: "key", price: 0, desc: "เสี้ยวมงกุฎอีเธอร์ — จากยอดฟรอสต์สไปร์" },
};

/* ---------- มอนสเตอร์ (Enemies) ---------- */
GameData.enemies = {
  slime:  { id: "slime",  name: "สไลม์",       sprite: "🟢", hp: 22,  atk: 6,  def: 2,  exp: 8,   gold: 6,  drop: { item: "slime_gel", rate: 0.6 } },
  bat:    { id: "bat",    name: "ค้างคาว",     sprite: "🦇", hp: 18,  atk: 8,  def: 1,  exp: 10,  gold: 8,  drop: null, drop2: { item: "pet_berry", rate: 0.25 } },
  wolf:   { id: "wolf",   name: "หมาป่า",       sprite: "🐺", hp: 35,  atk: 12, def: 4,  exp: 18,  gold: 14, drop: { item: "wolf_fang", rate: 0.5 }, drop2: { item: "pet_meat", rate: 0.3 } },
  goblin: { id: "goblin", name: "ก็อบลินจอมโจร", sprite: "👺", hp: 110, atk: 26, def: 13, exp: 55, gold: 60, drop: { item: "hi_potion", rate: 0.4 }, drop2: { item: "iron_sword", rate: 0.1 } },
  golem:  { id: "golem",  name: "โกเลมหิน",     sprite: "🗿", hp: 90,  atk: 20, def: 14, exp: 55,  gold: 60, drop: { item: "iron_armor", rate: 0.15 } },
  drake:  { id: "drake",  name: "เดรกไฟ",       sprite: "🐉", hp: 160, atk: 30, def: 12, exp: 120, gold: 150, boss: true, drop: { item: "mythril_bow", rate: 1.0 } },

  // ---- มอนสเตอร์เนื้อเรื่อง (สเตตัสไล่ระดับตามองก์) ----
  goblin_chief: { id: "goblin_chief", name: "หัวหน้าก็อบลิน", sprite: "👺", spr: "goblin", hp: 120, atk: 18, def: 8, exp: 60, gold: 80, boss: true, drop: { item: "iron_sword", rate: 1.0 }, book: "book_guard_break", petEgg: { item: "egg_rare", rate: 0.5 } },
  dire_wolf:   { id: "dire_wolf",   name: "หมาป่าอมตะ",   sprite: "🐺", spr: "wolf", hp: 60,  atk: 18, def: 6,  exp: 24, gold: 18, drop: { item: "wolf_fang", rate: 0.5 }, drop2: { item: "pet_meat", rate: 0.35 } },
  treant:      { id: "treant",      name: "ทรีนต์ผุ",     sprite: "🌳", hp: 75,  atk: 20, def: 10, exp: 30, gold: 20, drop: null },
  bramblewrath:{ id: "bramblewrath",name: "แบรมเบิลราธเฒ่า", sprite: "🌲", hp: 260, atk: 26, def: 12, exp: 220, gold: 180, boss: true, drop: { item: "leather_armor", rate: 1.0 }, book: "book_multi_slash", petEgg: { item: "egg_rare", rate: 0.6 } },
  fire_imp:    { id: "fire_imp",    name: "ภูตไฟ",        sprite: "🔥", hp: 70,  atk: 24, def: 8,  exp: 34, gold: 24, drop: { item: "fire_crystal", rate: 0.7 } },
  magma_golem: { id: "magma_golem", name: "โกเลมลาวา",    sprite: "🪨", spr: "golem", hp: 140, atk: 30, def: 18, exp: 60, gold: 50, drop: { item: "fire_crystal", rate: 0.5 } },
  ignathor:    { id: "ignathor",    name: "อิกนาธอร์",     sprite: "🐲", spr: "drake", hp: 420, atk: 38, def: 16, exp: 380, gold: 300, boss: true, drop: { item: "flame_blade", rate: 1.0 }, book: "book_ice_lance", petEgg: { item: "egg_epic", rate: 0.5 } },
  bog_lurker:  { id: "bog_lurker",  name: "อสูรหนอง",     sprite: "🐊", hp: 110, atk: 34, def: 12, exp: 48, gold: 34, drop: null },
  will_o_wisp: { id: "will_o_wisp", name: "แสงหลอน",      sprite: "🟡", spr: "bat", hp: 80,  atk: 40, def: 6,  exp: 52, gold: 40, drop: null },
  bog_horror:  { id: "bog_horror",  name: "อสูรบึงเน่า",   sprite: "🦑", hp: 620, atk: 46, def: 18, exp: 620, gold: 450, boss: true, drop: { item: "dragon_mail", rate: 1.0 }, book: "book_life_drain", petEgg: { item: "egg_epic", rate: 0.5 } },
  frost_wraith:{ id: "frost_wraith",name: "วิญญาณเหน็บ",  sprite: "👻", spr: "bat", hp: 120, atk: 44, def: 12, exp: 66, gold: 46, drop: null },
  ice_golem:   { id: "ice_golem",   name: "โกเลมน้ำแข็ง",  sprite: "🧊", spr: "golem", hp: 220, atk: 48, def: 26, exp: 90, gold: 70, drop: { item: "frost_edge", rate: 0.2 } },
  nyx_duel:    { id: "nyx_duel",    name: "นิกซ์",         sprite: "🥷", hp: 780, atk: 54, def: 22, exp: 900, gold: 600, boss: true, drop: { item: "frost_edge", rate: 1.0 }, book: "book_arrow_rain", petEgg: { item: "egg_epic", rate: 1.0 } },
  ashen_knight:{ id: "ashen_knight",name: "อัศวินเถ้า",   sprite: "⚔️", hp: 200, atk: 56, def: 30, exp: 100, gold: 80, drop: null },
  wraith:      { id: "wraith",      name: "ภูตวิญญาณ",    sprite: "👻", spr: "bat", hp: 160, atk: 60, def: 16, exp: 110, gold: 90, drop: null },
  vheron:      { id: "vheron",      name: "วีรอน ราชันเถ้าธุลี", sprite: "👑", hp: 1200, atk: 68, def: 30, exp: 1500, gold: 1000, boss: true, drop: { item: "aether_robe", rate: 1.0 }, book: "book_thunderbolt", petEgg: { item: "egg_legend", rate: 0.5 } },
  the_hollow:  { id: "the_hollow",  name: "ความว่างเปล่า", sprite: "⚫", hp: 1800, atk: 76, def: 34, exp: 3000, gold: 1500, boss: true, drop: null, book: "book_meteor", petEgg: { item: "egg_legend", rate: 1.0 } },
};

/* ---------- เควส (Quests) ---------- */
// เควสเดิมถูกแทนที่ด้วยระบบเนื้อเรื่อง (src/story.js)
GameData.quests = {};

/* ---------- NPC ---------- */
GameData.npcs = {
  elder:    { id: "elder",    name: "อาจารย์โรวัน",   icon: "🧙", story: true },
  guard:    { id: "guard",    name: "กัปตันโดรัน",     icon: "💂", story: true },
  merchant: { id: "merchant", name: "เมอร์ริคมือทองแดง", icon: "🧑‍🌾", shop: ["potion", "hi_potion", "ether", "antidote", "wood_sword", "iron_sword", "mythril_bow", "leather_armor", "iron_armor", "dragon_mail", "book_greater_heal", "book_guard_break", "egg_common", "egg_rare", "pet_berry", "pet_meat", "pet_jelly"] },
  healer:   { id: "healer",   name: "บาทหลวงอันเซล์ม", icon: "⛪", heal: true },
  pip:      { id: "pip",      name: "พิพ",            icon: "🧒", story: true },
  isolde:   { id: "isolde",   name: "เลดี้อิโซลด์",    icon: "🏹", story: true },
  grimm:    { id: "grimm",    name: "กริมม์",          icon: "🧔", story: true },
  maeve:    { id: "maeve",    name: "แม่มดพยากรณ์เมฟ",  icon: "🔮", story: true },
  nyx:      { id: "nyx",      name: "นิกซ์",           icon: "🥷", story: true },
  vheron:   { id: "vheron",   name: "วีรอน ราชันเถ้าธุลี", icon: "👑", story: true },
};

/* ---------- แผนที่ (Maps) ----------
 * ตัวเลขในกริด = ประเภทช่อง
 * 0 พื้นเดินได้ (หญ้า) | 1 กำแพง/ต้นไม้ | 2 น้ำ (เดินไม่ได้)
 * 3 ทางเดิน (พื้นเมือง) | 4 โซนมอนสเตอร์ (มีโอกาสเจอศัตรู)
 * ---------------------------------- */
GameData.tiles = {
  0: { name: "grass", color: "#3f7d3f", walk: true },
  1: { name: "tree",  color: "#1f4d24", walk: false, deco: "🌲" },
  2: { name: "water", color: "#2f6fb0", walk: false, deco: "🌊" },
  3: { name: "floor", color: "#b79b6e", walk: true },
  4: { name: "wild",  color: "#5a7d3a", walk: true, encounter: true },
  5: { name: "cave",  color: "#3a3340", walk: true, encounter: true },
  6: { name: "wall",  color: "#5b5b6b", walk: false, deco: "🧱" },
  7: { name: "snow",  color: "#cdd8e6", walk: true, encounter: true },      // ฟรอสต์สไปร์
  8: { name: "ice",   color: "#8fb8d8", walk: false, deco: "🧊" },          // น้ำแข็งกั้นทาง
  9: { name: "lava",  color: "#d1471f", walk: false, deco: "🌋" },          // ลาวา (เอมเบอร์พีค)
};

// helper: แปลง string map เป็น grid ตัวเลข
function parseMap(rows) {
  return rows.map((r) => r.split("").map((c) => parseInt(c, 10)));
}

GameData.maps = {
  town: {
    id: "town",
    name: "หมู่บ้านเอลดาร์",
    encounters: [],
    grid: parseMap([
      "1111111111111111",
      "1333333333333331",
      "1300030003000031",
      "1303330333033031",
      "1300030003000031",
      "1333333333333331",
      "1303303333033031",
      "1300000000000031",
      "1333333333333331",
      "1300030003000031",
      "1303330333033031",
      "1300030003000031",
      "1333333333333331",
      "1300000000000031",
      "1333333333330331",
      "1111111111101111",
    ]),
    npcs: [
      { id: "elder", x: 3, y: 2 },
      { id: "merchant", x: 8, y: 2 },
      { id: "guard", x: 12, y: 8 },
      { id: "healer", x: 6, y: 10 },
      { id: "pip", x: 9, y: 13 },
    ],
    portals: [
      { x: 11, y: 15, to: "field", tx: 8, ty: 1 }, // ประตูออกเมือง (ล่าง)
    ],
    spawn: { x: 8, y: 8 },
  },

  field: {
    id: "field",
    name: "ทุ่งกรีนฟิลด์ส",
    encounters: [
      { enemy: "slime", weight: 5 },
      { enemy: "bat", weight: 3 },
      { enemy: "wolf", weight: 2 },
    ],
    grid: parseMap([
      "1111111100111111",
      "4444444004444441",
      "4404444444440441",
      "4444004444004441",
      "1444444444444441",
      "1444004444444441",
      "2244444444004441",
      "2244044444444441",
      "1444444444444441",
      "1444004444044441",
      "1444444444444441",
      "1440044444444421",
      "1444444004444422",
      "1444444444444421",
      "1114444444444111",
      "1111110011111111",
    ]),
    npcs: [
      { id: "isolde", x: 8, y: 13 },                       // ผู้พิทักษ์เฝ้าประตูป่า
      { id: "goblin_chief_boss", x: 2, y: 8, boss: "goblin_chief" }, // ซากปรัก
    ],
    portals: [
      { x: 8, y: 0, to: "town", tx: 11, ty: 14 },   // กลับเมือง
      { x: 8, y: 15, to: "forest", tx: 8, ty: 1, lock: { flag: "thornwood_open", level: 5, msg: "ประตูป่าธอร์นวูดถูกผนึก — คุยกับเลดี้อิโซลด์เพื่อขออนุญาตเข้า" } },
    ],
    spawn: { x: 8, y: 1 },
  },

  forest: {
    id: "forest",
    name: "ป่าธอร์นวูด",
    encounters: [
      { enemy: "dire_wolf", weight: 4 },
      { enemy: "treant", weight: 3 },
    ],
    grid: parseMap([
      "1111111001111111",
      "1444114444114441",
      "1441144444114441",
      "1444444004444441",
      "1141144441144141",
      "1444444444444441",
      "1444114400114441",
      "1141144444114141",
      "1444444444444441",
      "1444004411044441",
      "1141144444114141",
      "1444444444444441",
      "1444114444114441",
      "1441144004114441",
      "1114444444444111",
      "1111110011111111",
    ]),
    npcs: [
      { id: "isolde", x: 8, y: 2 },                       // ผู้นำทางในป่า
      { id: "bramblewrath_boss", x: 8, y: 12, boss: "bramblewrath" },
    ],
    portals: [
      { x: 8, y: 0, to: "field", tx: 8, ty: 14 },  // กลับทุ่ง
      { x: 8, y: 15, to: "emberpeak", tx: 5, ty: 1, lock: { flag: "emberpeak_open", level: 9, msg: "ช่องเขาเอมเบอร์พีคร้อนระอุ — ต้องได้ตราจากอิโซลด์ก่อน" } },
    ],
    spawn: { x: 8, y: 1 },
  },

  // ================= องก์ 3: เอมเบอร์พีค =================
  emberpeak: {
    id: "emberpeak",
    name: "ภูเขาไฟเอมเบอร์พีค",
    encounters: [
      { enemy: "fire_imp", weight: 4 },
      { enemy: "magma_golem", weight: 2 },
    ],
    grid: parseMap([
      "6666666666666666",
      "6555559955555556",
      "6559955595599556",
      "6555555555555556",
      "6595566665665956",
      "6555555555555556",
      "6555995555995556",
      "6559955555559956",
      "6555555555555556",
      "6595566655665956",
      "6555559955555556",
      "6555555555555556",
      "6559955555599556",
      "6555555555555556",
      "6665555555555666",
      "6666665556666666",
    ]),
    npcs: [
      { id: "grimm", x: 8, y: 2 },
      { id: "ignathor_boss", x: 8, y: 13, boss: "ignathor" },
    ],
    portals: [
      { x: 5, y: 0, to: "forest", tx: 8, ty: 14 },
      { x: 8, y: 15, to: "mistfen", tx: 8, ty: 1, lock: { flag: "mistfen_open", level: 14, msg: "หมอกพิษบึงมิสท์เฟนหนาแน่น — ต้องมีตะเกียงหมอกจากกริมม์" } },
    ],
    spawn: { x: 8, y: 1 },
  },

  // ================= องก์ 4: บึงมิสท์เฟน =================
  mistfen: {
    id: "mistfen",
    name: "บึงมิสท์เฟน",
    encounters: [
      { enemy: "bog_lurker", weight: 4 },
      { enemy: "will_o_wisp", weight: 3 },
      { enemy: "dire_wolf", weight: 1 },
    ],
    grid: parseMap([
      "1111111001111111",
      "1444224444224441",
      "1442244444422441",
      "1444444224444441",
      "1424424444242441",
      "1444444444444441",
      "1442244422244441",
      "1424442444424241",
      "1444444444444441",
      "1442244244224441",
      "1444422444224441",
      "1424444444444241",
      "1444224444224441",
      "1444444444444441",
      "1114444444444111",
      "1111110011111111",
    ]),
    npcs: [
      { id: "maeve", x: 8, y: 2 },
      { id: "bog_horror_boss", x: 8, y: 12, boss: "bog_horror" },
    ],
    portals: [
      { x: 8, y: 0, to: "emberpeak", tx: 8, ty: 14 },
      { x: 8, y: 15, to: "frostspire", tx: 8, ty: 1, lock: { flag: "frostspire_open", level: 18, msg: "พายุหิมะปิดทางฟรอสต์สไปร์ — ต้องรู้ความจริงจากอาจารย์โรวันก่อน" } },
    ],
    spawn: { x: 8, y: 1 },
  },

  // ================= องก์ 5: เทือกเขาฟรอสต์สไปร์ =================
  frostspire: {
    id: "frostspire",
    name: "เทือกเขาฟรอสต์สไปร์",
    encounters: [
      { enemy: "frost_wraith", weight: 4 },
      { enemy: "ice_golem", weight: 2 },
    ],
    grid: parseMap([
      "6666666666666666",
      "6777788777887776",
      "6778877777778876",
      "6777777887777776",
      "6787788778877876",
      "6777777777777776",
      "6778877887788776",
      "6787777777777876",
      "6777788777887776",
      "6778877777778876",
      "6777777887777776",
      "6787788778877876",
      "6777777777777776",
      "6667777777777666",
      "6666677777766666",
      "6666666776666666",
    ]),
    npcs: [
      { id: "nyx", x: 8, y: 2 },
      { id: "nyx_boss", x: 8, y: 12, boss: "nyx_duel" },
    ],
    portals: [
      { x: 8, y: 0, to: "mistfen", tx: 8, ty: 14 },
      { x: 8, y: 15, to: "citadel", tx: 8, ty: 1, lock: { flag: "citadel_open", level: 24, msg: "ประตูป้อมเถ้าธุลีปิดสนิท — ต้องรวมเสี้ยวครบทั้งสี่ก่อน" } },
    ],
    spawn: { x: 8, y: 1 },
  },

  // ================= องก์ 6: ป้อมเถ้าธุลี =================
  citadel: {
    id: "citadel",
    name: "ป้อมเถ้าธุลี",
    encounters: [
      { enemy: "ashen_knight", weight: 3 },
      { enemy: "wraith", weight: 3 },
    ],
    grid: parseMap([
      "6666666666666666",
      "6555556556555556",
      "6565556556555656",
      "6555556666655556",
      "6556665555666556",
      "6555555555555556",
      "6555665665665556",
      "6565555555555656",
      "6555556556555556",
      "6556665665666556",
      "6555555555555556",
      "6565566666655656",
      "6555556556555556",
      "6655555555555566",
      "6665555555556666",
      "6666665556666666",
    ]),
    npcs: [
      { id: "vheron", x: 8, y: 12, boss: "vheron" },
    ],
    portals: [
      { x: 8, y: 0, to: "frostspire", tx: 8, ty: 14 },
    ],
    spawn: { x: 8, y: 1 },
  },
};

// ค่าเลเวลอัพ: EXP ที่ต้องใช้ต่อเลเวล
GameData.expForLevel = function (level) {
  return Math.floor(20 * Math.pow(level, 1.5));
};

window.GameData = GameData;
