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
    name: "ซามูไร",
    icon: "⚔️",
    desc: "พลังดาบและ HP สูง เหมาะกับสายบุกประจัญบาน",
    base: { maxHp: 60, maxMp: 12, atk: 12, def: 8, spd: 6 },
    skill: "power_strike",
  },
  {
    id: "mage",
    name: "อนเมียวจิ",
    icon: "🔮",
    desc: "เวทหยินหยางรุนแรง MP สูง แต่ตัวบาง",
    base: { maxHp: 40, maxMp: 30, atk: 7, def: 5, spd: 7 },
    skill: "fireball",
  },
  {
    id: "archer",
    name: "นินจา",
    icon: "🏹",
    desc: "คล่องแคล่ว ว่องไว โจมตีแม่นยำจากเงามืด",
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
  town_scroll: { id: "town_scroll", name: "โอฟุดะเรียกกลับ", icon: "🎴", type: "consume", warp: "town", price: 60, desc: "ฉีกแล้ววาปกลับหมู่บ้านที่ใกล้ที่สุดทันที" },

  wood_sword:  { id: "wood_sword",  name: "โบคุโต (ดาบไม้)", icon: "🗡️", type: "weapon", atk: 4,  price: 30,  desc: "ATK +4" },
  iron_sword:  { id: "iron_sword",  name: "คาตานะเหล็ก",  icon: "⚔️", type: "weapon", atk: 10, price: 120, desc: "ATK +10" },
  mythril_bow: { id: "mythril_bow", name: "ยูมิเงินแท้",  icon: "🏹", type: "weapon", atk: 14, price: 220, desc: "ATK +14" },

  leather_armor:{ id: "leather_armor", name: "เกราะหนัง", icon: "🦺", type: "armor", def: 5,  price: 50,  desc: "DEF +5" },
  iron_armor:  { id: "iron_armor",  name: "เกราะเหล็ก",  icon: "🛡️", type: "armor", def: 12, price: 160, desc: "DEF +12" },

  slime_gel:   { id: "slime_gel",   name: "เจลสไลม์",    icon: "🫧", type: "material", price: 5,  desc: "วัตถุดิบ ดรอปจากสไลม์" },
  wolf_fang:   { id: "wolf_fang",   name: "เขี้ยวหมาป่า", icon: "🦷", type: "material", price: 12, desc: "วัตถุดิบ ดรอปจากหมาป่า" },
  fire_crystal:{ id: "fire_crystal",name: "ผลึกไฟ",      icon: "🔥", type: "material", price: 20, desc: "วัตถุดิบร้อนแรง ดรอปจากภูตไฟ" },

  // อาวุธ/เกราะระดับสูง (ดรอปจากบอส/ปลายเกม)
  flame_blade: { id: "flame_blade", name: "คาตานะเพลิงคากุ", icon: "🗡️", type: "weapon", atk: 22, price: 500, desc: "ATK +22 · อบด้วยไฟมังกร" },
  frost_edge:  { id: "frost_edge",  name: "ยูกิ-คิบะ (เขี้ยวหิมะ)", icon: "❄️", type: "weapon", atk: 30, price: 800, desc: "ATK +30" },
  dragon_mail: { id: "dragon_mail", name: "เกราะเกล็ดมังกร", icon: "🐲", type: "armor", def: 20, price: 600, desc: "DEF +20" },
  aether_robe: { id: "aether_robe", name: "อาภรณ์ศักดิ์สิทธิ์", icon: "✨", type: "armor", def: 28, price: 900, desc: "DEF +28" },

  // ---- อุปกรณ์สวมใส่ตามช่อง (หัว/มือซ้าย/ขา/เท้า/เครื่องประดับ) ----
  leather_cap:  { id: "leather_cap",  name: "หมวกหนัง",    icon: "🧢", type: "helmet",   slot: "head",     def: 3,  price: 40,  desc: "DEF +3" },
  iron_helm:    { id: "iron_helm",    name: "หมวกเหล็ก",   icon: "🪖", type: "helmet",   slot: "head",     def: 8,  price: 150, desc: "DEF +8" },
  wooden_shield:{ id: "wooden_shield",name: "โล่ไม้",      icon: "🛡️", type: "shield",   slot: "hand_l",   def: 5,  price: 60,  desc: "DEF +5 (มือซ้าย)" },
  tower_shield: { id: "tower_shield", name: "โล่หอคอย",    icon: "🛡️", type: "shield",   slot: "hand_l",   def: 12, price: 220, desc: "DEF +12 (มือซ้าย)" },
  padded_legs:  { id: "padded_legs",  name: "เกราะขาผ้า",  icon: "👖", type: "legs",     slot: "legs",     def: 4,  price: 55,  desc: "DEF +4" },
  iron_greaves: { id: "iron_greaves", name: "สนับขาเหล็ก", icon: "🦿", type: "legs",     slot: "legs",     def: 10, price: 190, desc: "DEF +10" },
  leather_boots:{ id: "leather_boots",name: "รองเท้าหนัง", icon: "🥾", type: "boots",    slot: "boots",    def: 1, spd: 2, price: 45, desc: "DEF +1 · SPD +2" },
  swift_boots:  { id: "swift_boots",  name: "รองเท้าลมกรด",icon: "👢", type: "boots",    slot: "boots",    spd: 5,  price: 170, desc: "SPD +5" },
  guard_amulet: { id: "guard_amulet", name: "สร้อยพิทักษ์",icon: "📿", type: "necklace", slot: "necklace", def: 5,  price: 130, desc: "DEF +5" },
  power_amulet: { id: "power_amulet", name: "สร้อยพลัง",   icon: "📿", type: "necklace", slot: "necklace", atk: 5,  price: 150, desc: "ATK +5" },
  power_ring:   { id: "power_ring",   name: "แหวนพลัง",    icon: "💍", type: "ring",     slot: "ring",     atk: 4,  price: 140, desc: "ATK +4" },
  guard_ring:   { id: "guard_ring",   name: "แหวนป้องกัน", icon: "💍", type: "ring",     slot: "ring",     def: 4,  price: 140, desc: "DEF +4" },
  swift_ring:   { id: "swift_ring",   name: "แหวนคล่องแคล่ว",icon:"💍", type: "ring",     slot: "ring",     spd: 3,  price: 140, desc: "SPD +3" },
  keen_earring: { id: "keen_earring", name: "ตุ้มหูเฉียบคม",icon:"💠",  type: "earring",  slot: "earring",  atk: 2, spd: 1, price: 100, desc: "ATK +2 · SPD +1" },
  ward_earring: { id: "ward_earring", name: "ตุ้มหูพิทักษ์",icon: "💠",  type: "earring",  slot: "earring",  def: 3,  price: 100, desc: "DEF +3" },

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

  // เศษกระจกยาตะ (ไอเทมเนื้อเรื่อง)
  shard1: { id: "shard1", name: "เศษกระจกยาตะ I",  icon: "🔷", type: "key", price: 0, desc: "เศษกระจกศักดิ์สิทธิ์ — จากป่าโยไก" },
  shard2: { id: "shard2", name: "เศษกระจกยาตะ II", icon: "🔶", type: "key", price: 0, desc: "เศษกระจกศักดิ์สิทธิ์ — จากภูเขาไฟคาซัน" },
  shard3: { id: "shard3", name: "เศษกระจกยาตะ III",icon: "🟣", type: "key", price: 0, desc: "เศษกระจกศักดิ์สิทธิ์ — จากบึงยูเรอิ" },
  shard4: { id: "shard4", name: "เศษกระจกยาตะ IV", icon: "🟢", type: "key", price: 0, desc: "เศษกระจกศักดิ์สิทธิ์ — จากยอดเขายูกิ" },
};

/* ---------- มอนสเตอร์ (Enemies) — ธีมโยไคญี่ปุ่น ---------- */
GameData.enemies = {
  slime:  { id: "slime",  name: "สไลม์โคลน",   sprite: "🟢", lv: 1,  hp: 22,  atk: 6,  def: 2,  exp: 8,   gold: 6,  drop: { item: "slime_gel", rate: 0.6 } },
  bat:    { id: "bat",    name: "เมทสึไอ (ตาลอย)", sprite: "🦇", lv: 2, hp: 18,  atk: 8,  def: 1,  exp: 10,  gold: 8,  drop: null, drop2: { item: "pet_berry", rate: 0.25 } },
  wolf:   { id: "wolf",   name: "อินุงามิ",     sprite: "🐺", lv: 3,  hp: 35,  atk: 12, def: 4,  exp: 18,  gold: 14, drop: { item: "wolf_fang", rate: 0.5 }, drop2: { item: "pet_meat", rate: 0.3 } },
  goblin: { id: "goblin", name: "คัปปะจอมโจร",  sprite: "👺", lv: 8,  hp: 110, atk: 26, def: 13, exp: 55, gold: 60, drop: { item: "hi_potion", rate: 0.4 }, drop2: { item: "iron_sword", rate: 0.1 } },
  golem:  { id: "golem",  name: "ยักษ์ตาเดียว", sprite: "🗿", lv: 7,  hp: 90,  atk: 20, def: 14, exp: 55,  gold: 60, drop: { item: "iron_armor", rate: 0.15 } },
  drake:  { id: "drake",  name: "มังกรเพลิง",   sprite: "🐉", lv: 12, hp: 160, atk: 30, def: 12, exp: 120, gold: 150, boss: true, drop: { item: "mythril_bow", rate: 1.0 } },

  // ---- มอนสเตอร์เนื้อเรื่อง (สเตตัสไล่ระดับตามองก์) ----
  goblin_chief: { id: "goblin_chief", name: "คัปปะจ่าฝูง",  sprite: "👺", spr: "goblin", lv: 5,  hp: 120, atk: 18, def: 8, exp: 60, gold: 80, boss: true, drop: { item: "iron_sword", rate: 1.0 }, book: "book_guard_break", petEgg: { item: "egg_rare", rate: 0.5 } },
  dire_wolf:   { id: "dire_wolf",   name: "อินุงามิดุร้าย", sprite: "🐺", spr: "wolf", lv: 6,  hp: 60,  atk: 18, def: 6,  exp: 24, gold: 18, drop: { item: "wolf_fang", rate: 0.5 }, drop2: { item: "pet_meat", rate: 0.35 } },
  treant:      { id: "treant",      name: "โคดามะผุ",     sprite: "🌳", lv: 7,  hp: 75,  atk: 20, def: 10, exp: 30, gold: 20, drop: null },
  bramblewrath:{ id: "bramblewrath",name: "ทานุกิยักษ์เฒ่า", sprite: "🦝", lv: 9, hp: 260, atk: 26, def: 12, exp: 220, gold: 180, boss: true, drop: { item: "leather_armor", rate: 1.0 }, book: "book_multi_slash", petEgg: { item: "egg_rare", rate: 0.6 } },
  fire_imp:    { id: "fire_imp",    name: "โอนิบิ (ภูตไฟ)", sprite: "🔥", lv: 10, hp: 70,  atk: 24, def: 8,  exp: 34, gold: 24, drop: { item: "fire_crystal", rate: 0.7 } },
  magma_golem: { id: "magma_golem", name: "ยักษ์ลาวา",     sprite: "🪨", spr: "golem", lv: 11, hp: 140, atk: 30, def: 18, exp: 60, gold: 50, drop: { item: "fire_crystal", rate: 0.5 } },
  ignathor:    { id: "ignathor",    name: "คากุ-ริว มังกรเพลิง", sprite: "🐲", spr: "drake", lv: 14, hp: 420, atk: 38, def: 16, exp: 380, gold: 300, boss: true, drop: { item: "flame_blade", rate: 1.0 }, book: "book_ice_lance", petEgg: { item: "egg_epic", rate: 0.5 } },
  bog_lurker:  { id: "bog_lurker",  name: "คัปปะบึงเน่า",  sprite: "🐊", lv: 15, hp: 110, atk: 34, def: 12, exp: 48, gold: 34, drop: null },
  will_o_wisp: { id: "will_o_wisp", name: "ฮิโตดามะ (แสงวิญญาณ)", sprite: "🟡", spr: "bat", lv: 16, hp: 80,  atk: 40, def: 6,  exp: 52, gold: 40, drop: null },
  bog_horror:  { id: "bog_horror",  name: "กามะยักษ์บึงยูเรอิ", sprite: "🐸", lv: 17, hp: 620, atk: 46, def: 18, exp: 620, gold: 450, boss: true, drop: { item: "dragon_mail", rate: 1.0 }, book: "book_life_drain", petEgg: { item: "egg_epic", rate: 0.5 } },
  frost_wraith:{ id: "frost_wraith",name: "ยูเรอิเยือกแข็ง", sprite: "👻", spr: "bat", lv: 19, hp: 120, atk: 44, def: 12, exp: 66, gold: 46, drop: null },
  ice_golem:   { id: "ice_golem",   name: "ยักษ์น้ำแข็ง",  sprite: "🧊", spr: "golem", lv: 20, hp: 220, atk: 48, def: 26, exp: 90, gold: 70, drop: { item: "frost_edge", rate: 0.2 } },
  nyx_duel:    { id: "nyx_duel",    name: "เทงงุคะรัส",    sprite: "🥷", lv: 22, hp: 780, atk: 54, def: 22, exp: 900, gold: 600, boss: true, drop: { item: "frost_edge", rate: 1.0 }, book: "book_arrow_rain", petEgg: { item: "egg_epic", rate: 1.0 } },
  ashen_knight:{ id: "ashen_knight",name: "ซามูไรเถ้าถ่าน", sprite: "⚔️", lv: 24, hp: 200, atk: 56, def: 30, exp: 100, gold: 80, drop: null },
  wraith:      { id: "wraith",      name: "โอนเรียว (วิญญาณอาฆาต)", sprite: "👻", spr: "bat", lv: 25, hp: 160, atk: 60, def: 16, exp: 110, gold: 90, drop: null },
  vheron:      { id: "vheron",      name: "โชกุนอสูร คุโรกาเนะ", sprite: "👹", lv: 28, hp: 1200, atk: 68, def: 30, exp: 1500, gold: 1000, boss: true, drop: { item: "aether_robe", rate: 1.0 }, book: "book_thunderbolt", petEgg: { item: "egg_legend", rate: 0.5 } },
  the_hollow:  { id: "the_hollow",  name: "อุตสึโระ (ความว่างเปล่า)", sprite: "⚫", lv: 32, hp: 1800, atk: 76, def: 34, exp: 3000, gold: 1500, boss: true, drop: null, book: "book_meteor", petEgg: { item: "egg_legend", rate: 1.0 } },

  // ---- มอนสเตอร์โซนแตกแขนง (ใช้สไปรต์เดิม) ----
  kodama:        { id: "kodama",        name: "โคดามะน้อย",   sprite: "🟢", spr: "slime", lv: 2,  hp: 26,  atk: 7,  def: 3,  exp: 9,  gold: 7,  drop: { item: "slime_gel", rate: 0.5 }, drop2: { item: "pet_berry", rate: 0.3 } },
  bamboo_tanuki: { id: "bamboo_tanuki", name: "ทานุกิป่าไผ่",  sprite: "🦝", spr: "wolf",  lv: 4,  hp: 42,  atk: 13, def: 5,  exp: 20, gold: 16, drop: { item: "wolf_fang", rate: 0.5 } },
  cave_moth:     { id: "cave_moth",     name: "ผีเสื้อราตรี",  sprite: "🦋", spr: "bat",   lv: 5,  hp: 30,  atk: 15, def: 3,  exp: 22, gold: 16, drop: { item: "pet_berry", rate: 0.3 } },
  stone_ari:     { id: "stone_ari",     name: "มดหินยักษ์",   sprite: "🪨", spr: "golem", lv: 6,  hp: 85,  atk: 18, def: 13, exp: 42, gold: 32, drop: { item: "iron_armor", rate: 0.1 } },
  kitsune:       { id: "kitsune",       name: "คิสึเนะเก้าหาง", sprite: "🦊", spr: "drake", lv: 9,  hp: 240, atk: 26, def: 11, exp: 200, gold: 160, boss: true, drop: { item: "mythril_bow", rate: 0.6 }, drop2: { item: "town_scroll", rate: 1.0 }, petEgg: { item: "egg_rare", rate: 0.4 } },
};

/* ---------- เควส (Quests) ---------- */
// เควสเดิมถูกแทนที่ด้วยระบบเนื้อเรื่อง (src/story.js)
GameData.quests = {};

/* ---------- NPC ---------- */
GameData.npcs = {
  elder:    { id: "elder",    name: "อาจารย์เก็นโซ",   icon: "🧙", story: true },
  guard:    { id: "guard",    name: "หัวหน้าองครักษ์ทาเคชิ", icon: "💂", story: true },
  merchant: { id: "merchant", name: "พ่อค้าโกโร่",     icon: "🧑‍🌾", shop: ["potion", "hi_potion", "ether", "antidote", "town_scroll", "wood_sword", "iron_sword", "mythril_bow", "leather_armor", "iron_armor", "dragon_mail", "leather_cap", "iron_helm", "wooden_shield", "tower_shield", "padded_legs", "iron_greaves", "leather_boots", "swift_boots", "guard_amulet", "power_amulet", "power_ring", "guard_ring", "swift_ring", "keen_earring", "ward_earring", "book_greater_heal", "book_guard_break", "egg_common", "egg_rare", "pet_berry", "pet_meat", "pet_jelly"] },
  healer:   { id: "healer",   name: "มิโกะฮารุ",       icon: "⛩️", heal: true },
  pip:      { id: "pip",      name: "เด็กชายคินตะ",    icon: "🧒", story: true },
  isolde:   { id: "isolde",   name: "คุนอิจิอายาเมะ",   icon: "🏹", story: true },
  grimm:    { id: "grimm",    name: "นักดาบจิน",       icon: "🧔", story: true },
  maeve:    { id: "maeve",    name: "โอราคุรุยูบา",     icon: "🔮", story: true },
  nyx:      { id: "nyx",      name: "คุนอิจิชิซึกะ",    icon: "🥷", story: true },
  vheron:   { id: "vheron",   name: "โชกุนอสูร คุโรกาเนะ", icon: "👹", story: true },
  // ---- NPC เควสย่อยในหมู่บ้าน ----
  taro:     { id: "taro",     name: "ชาวนาทาโร่",      icon: "🧑‍🌾", side: true },
  hana:     { id: "hana",     name: "แม่ค้าฮานะ",      icon: "👩", side: true },
  kenji:    { id: "kenji",    name: "ช่างตีดาบเคนจิ",   icon: "🧔‍♂️", side: true },
  yuki:     { id: "yuki",     name: "เด็กหญิงยูกิจัง",  icon: "👧", side: true },
  board:    { id: "board",    name: "กระดานเควส",      icon: "📋", side: true },
  // ---- เมืองชายฝั่ง + โซนแตกแขนง ----
  fisher:   { id: "fisher",   name: "ชาวประมงริว",     icon: "🎣", shop: ["potion", "hi_potion", "ether", "antidote", "town_scroll", "leather_boots", "swift_boots", "wooden_shield", "pet_berry", "pet_meat", "egg_common"] },
  miko2:    { id: "miko2",    name: "มิโกะโคฮารุ",     icon: "⛩️", heal: true },
  sora:     { id: "sora",     name: "กะลาสีโซระ",      icon: "🧑‍✈️", side: true },
  board2:   { id: "board2",   name: "กระดานเควสชายฝั่ง", icon: "📋", side: true },
  kaede:    { id: "kaede",    name: "นักสะสมคาเอเดะ",   icon: "🧓", side: true },
  inari:    { id: "inari",    name: "นักบวชศาลเจ้าอินาริ", icon: "🦊", side: true },
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

// helper: แปลง string map เป็น grid ตัวเลข (คงไว้เผื่อใช้)
function parseMap(rows) {
  return rows.map((r) => r.split("").map((c) => parseInt(c, 10)));
}

/* ============================================================
 * ตัวสร้างแผนที่แบบ deterministic (seeded) — ใหญ่ + มีฉากหลากหลาย
 * การันตีเดินถึง: force ช่อง anchor เป็นพื้นเดินได้ แล้ว carve เส้นทาง
 * จาก spawn ไปยังทุกประตู/NPC (ผ่านสิ่งกีดขวางได้เสมอ)
 * ---------------------------------------------------------- */
function _rng(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* ตัวสร้างแผนที่: ฉากแบบกลุ่มก้อนออร์แกนิก (ป่า/บ่อน้ำ/หิน) + พื้นแต่งเบา ๆ
 * โครงสร้างจงใจ (อาคาร/เสา) วางเป็น rects · การันตีเดินถึงด้วยการ carve เส้นทาง */
function buildMap(spec) {
  const W = spec.W, H = spec.H, base = spec.base, border = spec.border;
  const g = [];
  for (let y = 0; y < H; y++) {
    const r = [];
    for (let x = 0; x < W; x++) r.push((x === 0 || y === 0 || x === W - 1 || y === H - 1) ? border : base);
    g.push(r);
  }
  const setb = (x, y, t) => { if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = t; };
  const keep = new Set((spec.clear || []).map((c) => c[0] + "," + c[1]));
  const rnd = _rng(spec.seed || 1);
  // โครงสร้างจงใจ (อาคาร/น้ำพุ/เสา)
  (spec.rects || []).forEach(([x0, y0, x1, y1, t]) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!keep.has(x + "," + y)) setb(x, y, t);
  });
  // กลุ่มก้อนออร์แกนิก (ต้นไม้เป็นดง, บ่อน้ำ, หย่อมหิน/ลาวา/น้ำแข็ง)
  (spec.clusters || []).forEach((cl) => {
    for (let b = 0; b < cl.blobs; b++) {
      const bx = 2 + Math.floor(rnd() * (W - 4)), by = 2 + Math.floor(rnd() * (H - 4)), rad = cl.radius;
      for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
        const x = bx + dx, y = by + dy;
        if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1 || keep.has(x + "," + y)) continue;
        if (Math.hypot(dx, dy) <= rad - rnd() * 1.3) setb(x, y, cl.tile);
      }
    }
  });
  // แต่งพื้นเดินได้เบา ๆ (หย่อมหญ้า/ดอกไม้) เฉพาะช่องที่ยังเป็นพื้นฐาน
  (spec.ground || []).forEach(([t, dens]) => {
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (keep.has(x + "," + y) || g[y][x] !== base) continue;
      if (rnd() < dens) setb(x, y, t);
    }
  });
  // บังคับ anchor เดินได้ + carve เส้นทางจาก spawn (การันตีเดินถึง)
  (spec.clear || []).forEach(([x, y]) => setb(x, y, base));
  const carve = (x0, y0, x1, y1) => {
    let x = x0, y = y0;
    while (x !== x1) { setb(x, y, base); x += x1 > x ? 1 : -1; }
    while (y !== y1) { setb(x, y, base); y += y1 > y ? 1 : -1; }
    setb(x1, y1, base);
  };
  const sp = spec.spawn;
  (spec.connect || []).forEach((c) => carve(sp[0], sp[1], c[0], c[1]));
  return g;
}

GameData.maps = {
  town: {
    id: "town", name: "หมู่บ้านฮารุคาเซะ", town: true, encounters: [],
    grid: buildMap({
      W: 32, H: 24, base: 3, border: 6, seed: 11,
      rects: [
        [3, 3, 8, 7, 6], [24, 3, 29, 7, 6], [3, 16, 8, 20, 6], [24, 16, 29, 20, 6],
        [15, 10, 17, 12, 2],
      ],
      clusters: [{ tile: 1, blobs: 7, radius: 1 }],
      ground: [[0, 0.06]],
      spawn: [16, 20],
      clear: [[16, 20], [16, 22], [16, 21], [11, 6], [21, 6], [21, 17], [11, 17], [16, 10],
        [6, 10], [26, 10], [10, 20], [22, 20], [13, 14], [1, 12], [30, 12], [2, 12], [29, 12]],
      connect: [[16, 22], [16, 21], [11, 6], [21, 6], [21, 17], [11, 17], [16, 10],
        [6, 10], [26, 10], [10, 20], [22, 20], [13, 14], [1, 12], [30, 12]],
    }),
    npcs: [
      { id: "elder", x: 11, y: 6 }, { id: "merchant", x: 21, y: 6 },
      { id: "guard", x: 21, y: 17 }, { id: "healer", x: 11, y: 17 }, { id: "pip", x: 16, y: 10 },
      { id: "board", x: 13, y: 14 }, { id: "taro", x: 6, y: 10 }, { id: "hana", x: 26, y: 10 },
      { id: "kenji", x: 10, y: 20 }, { id: "yuki", x: 22, y: 20 },
    ],
    portals: [
      { x: 16, y: 22, to: "field", tx: 16, ty: 2 },
      { x: 30, y: 12, to: "bamboo", tx: 2, ty: 12 },
      { x: 1, y: 12, to: "coast", tx: 29, ty: 12 },
    ],
    spawn: { x: 16, y: 20 },
  },

  field: {
    id: "field", name: "ทุ่งอาโอบะ",
    encounters: [
      { enemy: "slime", weight: 5 }, { enemy: "bat", weight: 3 }, { enemy: "wolf", weight: 2 },
    ],
    grid: buildMap({
      W: 32, H: 24, base: 4, border: 1, seed: 22,
      clusters: [{ tile: 1, blobs: 9, radius: 2 }, { tile: 2, blobs: 3, radius: 2 }],
      ground: [[0, 0.06]],
      spawn: [16, 2],
      clear: [[16, 1], [16, 2], [16, 22], [16, 21], [9, 18], [23, 9], [30, 12], [29, 12]],
      connect: [[16, 1], [16, 22], [16, 21], [9, 18], [23, 9], [30, 12]],
    }),
    npcs: [
      { id: "isolde", x: 9, y: 18 },
      { id: "goblin_chief_boss", x: 23, y: 9, boss: "goblin_chief" },
    ],
    portals: [
      { x: 16, y: 1, to: "town", tx: 16, ty: 21 },
      { x: 16, y: 22, to: "forest", tx: 16, ty: 2, lock: { flag: "thornwood_open", level: 5, msg: "ประตูป่าโยไกถูกผนึก — คุยกับคุนอิจิอายาเมะเพื่อขออนุญาตเข้า" } },
      { x: 30, y: 12, to: "cave", tx: 2, ty: 12 },
    ],
    spawn: { x: 16, y: 2 },
  },

  forest: {
    id: "forest", name: "ป่าโยไก",
    encounters: [{ enemy: "dire_wolf", weight: 4 }, { enemy: "treant", weight: 3 }],
    grid: buildMap({
      W: 32, H: 24, base: 4, border: 1, seed: 33,
      clusters: [{ tile: 1, blobs: 16, radius: 2 }, { tile: 2, blobs: 2, radius: 1 }],
      ground: [[0, 0.05]],
      spawn: [16, 2],
      clear: [[16, 1], [16, 2], [16, 6], [16, 19], [30, 12], [29, 12]],
      connect: [[16, 1], [16, 6], [16, 19], [30, 12]],
    }),
    npcs: [
      { id: "isolde", x: 16, y: 6 },
      { id: "bramblewrath_boss", x: 16, y: 19, boss: "bramblewrath" },
    ],
    portals: [
      { x: 16, y: 1, to: "field", tx: 16, ty: 21 },
      { x: 30, y: 12, to: "emberpeak", tx: 2, ty: 12, lock: { flag: "emberpeak_open", level: 9, msg: "ช่องเขาคาซันร้อนระอุ — ต้องได้ตราจากอายาเมะก่อน" } },
    ],
    spawn: { x: 16, y: 2 },
  },

  emberpeak: {
    id: "emberpeak", name: "ภูเขาไฟคาซัน",
    encounters: [{ enemy: "fire_imp", weight: 4 }, { enemy: "magma_golem", weight: 2 }],
    grid: buildMap({
      W: 32, H: 24, base: 5, border: 6, seed: 44,
      clusters: [{ tile: 9, blobs: 7, radius: 2 }, { tile: 6, blobs: 5, radius: 1 }],
      spawn: [2, 12],
      clear: [[1, 12], [2, 12], [16, 22], [16, 21], [16, 6], [16, 19]],
      connect: [[1, 12], [16, 22], [16, 21], [16, 6], [16, 19]],
    }),
    npcs: [
      { id: "grimm", x: 16, y: 6 },
      { id: "ignathor_boss", x: 16, y: 19, boss: "ignathor" },
    ],
    portals: [
      { x: 1, y: 12, to: "forest", tx: 29, ty: 12 },
      { x: 16, y: 22, to: "mistfen", tx: 16, ty: 2, lock: { flag: "mistfen_open", level: 14, msg: "หมอกพิษบึงยูเรอิหนาแน่น — ต้องมีตะเกียงหมอกจากจิน" } },
    ],
    spawn: { x: 2, y: 12 },
  },

  mistfen: {
    id: "mistfen", name: "บึงยูเรอิ",
    encounters: [
      { enemy: "bog_lurker", weight: 4 }, { enemy: "will_o_wisp", weight: 3 }, { enemy: "dire_wolf", weight: 1 },
    ],
    grid: buildMap({
      W: 32, H: 24, base: 4, border: 1, seed: 55,
      clusters: [{ tile: 2, blobs: 13, radius: 2 }, { tile: 1, blobs: 4, radius: 1 }],
      ground: [[0, 0.04]],
      spawn: [16, 2],
      clear: [[16, 1], [16, 2], [16, 6], [16, 19], [30, 12], [29, 12]],
      connect: [[16, 1], [16, 6], [16, 19], [30, 12]],
    }),
    npcs: [
      { id: "maeve", x: 16, y: 6 },
      { id: "bog_horror_boss", x: 16, y: 19, boss: "bog_horror" },
    ],
    portals: [
      { x: 16, y: 1, to: "emberpeak", tx: 16, ty: 21 },
      { x: 30, y: 12, to: "frostspire", tx: 2, ty: 12, lock: { flag: "frostspire_open", level: 18, msg: "พายุหิมะปิดทางยอดเขายูกิ — ต้องรู้ความจริงจากอาจารย์เก็นโซก่อน" } },
    ],
    spawn: { x: 16, y: 2 },
  },

  frostspire: {
    id: "frostspire", name: "ยอดเขายูกิ",
    encounters: [{ enemy: "frost_wraith", weight: 4 }, { enemy: "ice_golem", weight: 2 }],
    grid: buildMap({
      W: 32, H: 24, base: 7, border: 6, seed: 66,
      clusters: [{ tile: 8, blobs: 9, radius: 2 }, { tile: 6, blobs: 3, radius: 1 }],
      spawn: [2, 12],
      clear: [[1, 12], [2, 12], [16, 22], [16, 21], [16, 6], [16, 19]],
      connect: [[1, 12], [16, 22], [16, 21], [16, 6], [16, 19]],
    }),
    npcs: [
      { id: "nyx", x: 16, y: 6 },
      { id: "nyx_boss", x: 16, y: 19, boss: "nyx_duel" },
    ],
    portals: [
      { x: 1, y: 12, to: "mistfen", tx: 29, ty: 12 },
      { x: 16, y: 22, to: "citadel", tx: 16, ty: 2, lock: { flag: "citadel_open", level: 24, msg: "ประตูปราสาทโอนิปิดสนิท — ต้องรวมเศษกระจกครบทั้งสี่ก่อน" } },
    ],
    spawn: { x: 2, y: 12 },
  },

  citadel: {
    id: "citadel", name: "ปราสาทโอนิคุโรกาเนะ",
    encounters: [{ enemy: "ashen_knight", weight: 3 }, { enemy: "wraith", weight: 3 }],
    grid: buildMap({
      W: 32, H: 24, base: 5, border: 6, seed: 77,
      rects: [
        [6, 6, 7, 7, 6], [11, 6, 12, 7, 6], [19, 6, 20, 7, 6], [24, 6, 25, 7, 6],
        [6, 11, 7, 12, 6], [24, 11, 25, 12, 6],
        [6, 16, 7, 17, 6], [11, 16, 12, 17, 6], [19, 16, 20, 17, 6], [24, 16, 25, 17, 6],
      ],
      clusters: [{ tile: 9, blobs: 2, radius: 1 }],
      spawn: [16, 2],
      clear: [[16, 1], [16, 2], [16, 18]],
      connect: [[16, 1], [16, 18]],
    }),
    npcs: [{ id: "vheron", x: 16, y: 18, boss: "vheron" }],
    portals: [{ x: 16, y: 1, to: "frostspire", tx: 16, ty: 21 }],
    spawn: { x: 16, y: 2 },
  },

  /* ===== โซนแตกแขนงจากหมู่บ้าน/ทุ่ง ===== */
  bamboo: {
    id: "bamboo", name: "ป่าไผ่ซาซะ",
    encounters: [{ enemy: "kodama", weight: 5 }, { enemy: "bamboo_tanuki", weight: 3 }],
    grid: buildMap({
      W: 32, H: 24, base: 4, border: 1, seed: 88,
      clusters: [{ tile: 1, blobs: 18, radius: 2 }],
      ground: [[0, 0.05]],
      spawn: [2, 12],
      clear: [[1, 12], [2, 12], [30, 12], [29, 12], [10, 8], [24, 16]],
      connect: [[1, 12], [30, 12], [10, 8], [24, 16]],
    }),
    npcs: [{ id: "kaede", x: 10, y: 8 }],
    portals: [
      { x: 1, y: 12, to: "town", tx: 29, ty: 12 },
      { x: 30, y: 12, to: "shrine", tx: 2, ty: 12 },
    ],
    spawn: { x: 2, y: 12 },
  },

  shrine: {
    id: "shrine", name: "ศาลเจ้าอินาริ",
    encounters: [{ enemy: "cave_moth", weight: 4 }, { enemy: "kodama", weight: 2 }],
    grid: buildMap({
      W: 30, H: 22, base: 0, border: 1, seed: 99,
      rects: [[12, 4, 17, 8, 6], [6, 13, 9, 15, 6], [20, 12, 23, 14, 6]],
      clusters: [{ tile: 1, blobs: 10, radius: 2 }],
      ground: [[4, 0.05]],
      spawn: [2, 11],
      clear: [[1, 11], [2, 11], [15, 6], [15, 11], [10, 13], [21, 13]],
      connect: [[1, 11], [15, 6], [15, 11], [10, 13], [21, 13]],
    }),
    npcs: [
      { id: "inari", x: 10, y: 13 },
      { id: "kitsune_boss", x: 15, y: 6, boss: "kitsune" },
    ],
    portals: [{ x: 1, y: 11, to: "bamboo", tx: 29, ty: 12 }],
    spawn: { x: 2, y: 11 },
  },

  cave: {
    id: "cave", name: "ถ้ำหินคุระ",
    encounters: [{ enemy: "cave_moth", weight: 4 }, { enemy: "stone_ari", weight: 2 }],
    grid: buildMap({
      W: 32, H: 24, base: 5, border: 6, seed: 111,
      clusters: [{ tile: 6, blobs: 12, radius: 2 }],
      spawn: [2, 12],
      clear: [[1, 12], [2, 12], [16, 12], [24, 6], [8, 18]],
      connect: [[1, 12], [16, 12], [24, 6], [8, 18]],
    }),
    npcs: [{ id: "sora", x: 24, y: 6 }],
    portals: [{ x: 1, y: 12, to: "field", tx: 29, ty: 12 }],
    spawn: { x: 2, y: 12 },
  },

  coast: {
    id: "coast", name: "หมู่บ้านชายฝั่งอิโซนามิ", town: true, encounters: [],
    grid: buildMap({
      W: 32, H: 24, base: 3, border: 6, seed: 122,
      rects: [[3, 3, 8, 6, 6], [24, 3, 29, 6, 6], [2, 18, 30, 22, 2]],
      clusters: [{ tile: 2, blobs: 4, radius: 2 }],
      ground: [[0, 0.05]],
      spawn: [28, 12],
      clear: [[29, 12], [28, 12], [30, 12], [11, 6], [21, 6], [16, 12], [8, 15], [24, 15]],
      connect: [[29, 12], [11, 6], [21, 6], [16, 12], [8, 15], [24, 15]],
    }),
    npcs: [
      { id: "fisher", x: 11, y: 6 }, { id: "miko2", x: 21, y: 6 },
      { id: "sora", x: 16, y: 12 }, { id: "board2", x: 8, y: 15 },
    ],
    portals: [{ x: 30, y: 12, to: "town", tx: 2, ty: 12 }],
    spawn: { x: 28, y: 12 },
  },
};

// ค่าเลเวลอัพ: EXP ที่ต้องใช้ต่อเลเวล
GameData.expForLevel = function (level) {
  return Math.floor(20 * Math.pow(level, 1.5));
};

window.GameData = GameData;
