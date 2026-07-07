/* ============================================================
 * Aetheria RPG — Story Engine
 * เนื้อเรื่องหลัก 6 องก์ 14 ด่าน ปลดล็อกทีละโซน + หลายตอนจบ
 * บทสนทนาแบบ visual-novel · เนื้อเรื่องต้นฉบับทั้งหมด
 * ========================================================== */

const Story = {};

/* ชื่อผู้พูด (ใช้ซ้ำ) */
const SP = {
  narr: "★",
  rowan: "อาจารย์โรวัน",
  sera: "เซร่า",
  anselm: "บาทหลวงอันเซล์ม",
  doran: "กัปตันโดรัน",
  merric: "เมอร์ริค",
  isolde: "เลดี้อิโซลด์",
  grimm: "กริมม์",
  nyx: "นิกซ์",
  maeve: "แม่มดเมฟ",
  vheron: "วีรอน",
  hollow: "เสียงกระซิบ",
  pip: "พิพ",
};
function hero() { return State.player ? State.player.name : "ผู้กล้า"; }

/* ============================================================
 * นิยามด่านเนื้อเรื่อง (STAGES) — เรียงเป็นเส้นตรง 0..13
 * type: lore | hunt | collect | boss | reach | talk
 * ========================================================== */
Story.STAGES = [
  /* 0 */ {
    id: "s0_first_resonance", chapter: 1, title: "เสียงกังวานแรก",
    objective: "กำจัดสไลม์ในทุ่งกรีนฟิลด์ส 5 ตัว",
    giver: "elder", type: "hunt", target: "slime", need: 5, requireLevel: 1,
    reward: { exp: 40, gold: 40, item: "potion" },
    offer: () => [
      { s: SP.rowan, t: `${hero()}... เจ้าโตขึ้นมากนะ ข้ามีเรื่องรบกวน — สไลม์จากริ้วมลทินล้นเข้าทุ่งกรีนฟิลด์สแล้ว` },
      { s: SP.rowan, t: "ช่วยไปจัดการมันสัก 5 ตัวได้ไหม ระวังตัวด้วยล่ะ เจ้าหนู" },
      { s: SP.narr, t: "(ออกทางประตูใต้หมู่บ้านเพื่อไปทุ่งกรีนฟิลด์ส)" },
    ],
    nudge: () => [{ s: SP.rowan, t: "สไลม์ยังเหลืออยู่นะ กำจัดให้ครบ 5 ตัวก่อน" }],
    turnin: () => [
      { s: SP.narr, t: "สไลม์ตัวสุดท้ายแตกออก ทิ้ง 'เศษเรืองแสง' สีฟ้าไว้ เจ้าเอื้อมไปสัมผัส..." },
      { s: SP.hollow, t: "……เจ้า… ได้ยิน… เราสิ……" },
      { s: SP.narr, t: `เสียงกระซิบแล่นเข้ากระดูก เจ้าสะดุ้งถอย เศษนั้นสลายเป็นผงแสง` },
      { s: SP.rowan, t: "เจ้า... ได้ยินมันใช่ไหม บอกข้ามาตรงๆ" },
      { s: SP.rowan, t: "ไม่นะ... เป็นไปไม่ได้ สามร้อยปีแล้วแท้ๆ — เจ้าคือ 'ผู้กังวาน'" },
    ],
  },

  /* 1 */ {
    id: "s1_half_truth", chapter: 1, title: "ความจริงครึ่งเดียว",
    objective: "รับฟังตำนานมงกุฎจากอาจารย์โรวัน",
    giver: "elder", type: "lore", requireLevel: 1,
    reward: { exp: 20, gold: 0 },
    offer: () => [
      { s: SP.rowan, t: "นั่งลงก่อน ข้าจะเล่าเท่าที่เล่าได้ นานมาแล้ว แผ่นดินนี้เคยรวมเป็นหนึ่งใต้ 'มงกุฎอีเธอร์'" },
      { s: SP.rowan, t: "มันหล่อเลี้ยงชีวิตทุกอย่าง แต่แล้ววันหนึ่งมันถูกทุบแตกเป็นเสี้ยว กระจายหาย" },
      { s: SP.rowan, t: "เมื่อไร้ศูนย์รวม อีเธอร์ก็เน่าเป็น 'ริ้วมลทิน' ที่เจ้าเห็นทุกวันนี้" },
      { s: SP.rowan, t: "ผู้กังวานคือคนเดียวที่แตะเสี้ยวได้โดยไม่ถูกกลืน... เจ้าอาจเป็นความหวังเดียวของเรา" },
      { s: SP.rowan, t: "ไปหากัปตันโดรันสิ บอกว่าข้าส่งมา เขาจะเปิดทางให้เจ้าออกไปไกลกว่านี้" },
      { s: SP.narr, t: "(โรวันหลบสายตาเจ้าตอนพูดคำว่า 'ถูกทุบ'... เหมือนมีอะไรที่เขาไม่ได้บอก)" },
    ],
  },

  /* 2 */ {
    id: "s2_road_to_thornwood", chapter: 1, title: "ถนนสู่ธอร์นวูด",
    objective: "ล่าหมาป่าที่ปิดถนน 4 ตัว",
    giver: "guard", type: "hunt", target: "wolf", need: 4, requireLevel: 2,
    reward: { exp: 70, gold: 70, item: "leather_armor" },
    offer: () => [
      { s: SP.doran, t: "หืม? โรวันส่งเจ้ามาเหรอ เด็กตัวแค่นี้..." },
      { s: SP.doran, t: "ก็ได้ ถ้าอยากพิสูจน์ตัวเอง — ฝูงหมาป่ามลทินยึดถนนสู่ป่าธอร์นวูด ล่ามันสัก 4 ตัว" },
      { s: SP.doran, t: "อย่าตายล่ะ ข้าไม่อยากเขียนรายงานศพเด็ก" },
    ],
    nudge: () => [{ s: SP.doran, t: "หมาป่ายังเพ่นพ่านอยู่ ล่าให้ครบ 4 ตัวสิ" }],
    turnin: () => [
      { s: SP.doran, t: "...เจ้าทำได้จริงๆ ด้วย ข้าประเมินเจ้าต่ำไป ขอโทษด้วย" },
      { s: SP.doran, t: "ถนนโล่งแล้ว แต่ประตูป่าธอร์นวูดถูกผนึกโดยเลดี้อิโซลด์ ผู้พิทักษ์ป่า" },
      { s: SP.doran, t: "นางไม่ให้คนนอกเข้าเด็ดขาด ไปคุยกับนางเองที่หน้าประตูป่านะ" },
    ],
  },

  /* 3 */ {
    id: "s3_guardian_bow", chapter: 1, title: "ธนูของผู้พิทักษ์",
    objective: "ปราบหัวหน้าก็อบลิน ทวงธนูของอิโซลด์คืน",
    giver: "isolde", type: "boss", target: "goblin_chief", need: 1, requireLevel: 4,
    reward: { exp: 120, gold: 120 },
    setFlags: ["thornwood_open"],
    offer: () => [
      { s: SP.isolde, t: "หยุด คนนอก ป่านี้ไม่ต้อนรับเจ้า" },
      { s: SP.isolde, t: "...ผู้กังวานรึ ฮึ ข้าเคยได้ยินตำนาน แต่ตำนานไม่ได้พิสูจน์ฝีมือ" },
      { s: SP.isolde, t: "หัวหน้าก็อบลินขโมยธนูศักดิ์สิทธิ์ของข้าไปซ่อนในซากปรักทุ่งกรีนฟิลด์ส เอามันคืนมา แล้วข้าจะเปิดป่าให้" },
    ],
    nudge: () => [{ s: SP.isolde, t: "ธนูของข้ายังอยู่กับหัวหน้าก็อบลิน อย่ากลับมามือเปล่า" }],
    turnin: () => [
      { s: SP.narr, t: "เจ้ายื่นธนูศักดิ์สิทธิ์คืน อิโซลด์รับมันด้วยสายตาที่อ่อนลง" },
      { s: SP.isolde, t: "...เจ้ารักษาสัญญา น้อยคนนักที่ทำได้ ข้าขอถอนคำสบประมาท" },
      { s: SP.isolde, t: "ประตูธอร์นวูดเปิดแล้ว ตามข้ามา — แต่เตรียมใจไว้ ป่าลึกไม่ใช่ที่ของคนใจอ่อน" },
    ],
  },

  /* 4 */ {
    id: "s4_shadow_in_woods", chapter: 2, title: "เงาในพงไพร",
    objective: "ปราบทรีนต์เน่า 'แบรมเบิลราธเฒ่า' คว้าเสี้ยวที่ 1",
    giver: "isolde", type: "boss", target: "bramblewrath", need: 1, requireLevel: 6, autoTurnin: true,
    reward: { exp: 200, gold: 150 }, giveItem: "shard1", setFlags: ["shard1"],
    offer: () => [
      { s: SP.isolde, t: "รู้สึกไหม อากาศในนี้หนักอึ้ง ต้นตอคือทรีนต์เฒ่าที่ริ้วมลทินสิงร่าง" },
      { s: SP.isolde, t: "มันเฝ้าบางอย่างที่เรืองแสง... ข้าเชื่อว่าเป็นเสี้ยวมงกุฎ ระวังราก มันฟาดแรง" },
    ],
    nudge: () => [{ s: SP.isolde, t: "แบรมเบิลราธอยู่ลึกเข้าไปกลางป่า ไปจัดการมัน" }],
    turnin: () => [
      { s: SP.narr, t: "แบรมเบิลราธล้มครืน เผยเสี้ยวเรืองแสงในโพรงอก เจ้าคว้ามันไว้ — เสียงกระซิบดังขึ้นชั่วขณะ" },
      { s: SP.nyx, t: "หยุดตรงนั้น เสี้ยวนั้นไม่ใช่ของเล่นสำหรับเด็ก" },
      { s: SP.narr, t: "หญิงสาวคลุมฮู้ดปรากฏจากเงาไม้ ดวงตาเรืองแสงแบบเดียวกับเจ้า — เธอก็เป็นผู้กังวาน" },
      { s: SP.nyx, t: "เก็บมันไว้ก่อนก็ได้ แต่จำคำข้า — ยิ่งเจ้าเก็บเสี้ยวมากเท่าไร เจ้ายิ่งเข้าใกล้สิ่งที่ไม่ควรตื่น" },
      { s: SP.narr, t: "เธอสลายหายในหมอกก่อนเจ้าจะถามชื่อ" },
    ],
  },

  /* 5 */ {
    id: "s5_ember_awakens", chapter: 2, title: "เปลวไฟที่ตื่น",
    objective: "รับตราเปิดทางสู่เอมเบอร์พีคจากอิโซลด์",
    giver: "isolde", type: "lore", requireLevel: 8,
    reward: { exp: 60, gold: 30 }, setFlags: ["emberpeak_open"],
    offer: () => [
      { s: SP.isolde, t: "เสี้ยวหนึ่งแล้ว แต่ต้นตอริ้วมลทินอยู่ลึกกว่านั้น — ภูเขาไฟเอมเบอร์พีคกำลังตื่น" },
      { s: SP.isolde, t: "รับตรานี้ไป มันจะเปิดทางให้เจ้าผ่านช่องเขา หาช่างตีเหล็กชื่อกริมม์ เขาช่วยเจ้าได้" },
      { s: SP.isolde, t: "...ผู้หญิงคลุมฮู้ดที่เจ้าเล่าให้ฟัง ระวังนางไว้ ข้าไม่ชอบกลิ่นของคนที่ตามเงียบๆ" },
    ],
  },

  /* 6 */ {
    id: "s6_mountain_smith", chapter: 3, title: "ช่างเหล็กแห่งขุนเขา",
    objective: "เก็บผลึกไฟ 5 ชิ้น (ล่าภูตไฟ หรือช่วยกริมม์ตีเหล็ก)",
    giver: "grimm", type: "collect", target: "fire_crystal", need: 5, requireLevel: 9,
    reward: { exp: 150, gold: 80, item: "iron_sword" },
    minigame: { type: "smith", opts: { need: 5 }, give: { item: "fire_crystal", qty: 2 } },
    offer: () => [
      { s: SP.grimm, t: "คนนอก ที่นี่ร้อนพอจะย่างเจ้าทั้งเป็น อยากลงโพรงมังกรน่ะรึ" },
      { s: SP.grimm, t: "ข้าจะตีตะเกียงกันความร้อนให้ แลกกับผลึกไฟ 5 ชิ้นจากพวกภูตไฟ เอามาสิ ข้าไม่ทำงานฟรี" },
    ],
    nudge: () => [{ s: SP.grimm, t: "ผลึกไฟ 5 ชิ้น ยังไม่ครบ อย่ามากวนเวลาข้า" }],
    turnin: () => [
      { s: SP.grimm, t: "ครบพอดี ฝีมือใช้ได้นี่เด็กนอก" },
      { s: SP.narr, t: "กริมม์ตีเหล็กด้วยจังหวะหนักแน่น ยื่นตะเกียงเรืองแสงให้เจ้า" },
      { s: SP.grimm, t: "ลงไปได้แล้ว มังกรอิกนาธอร์เฝ้าเสี้ยวอยู่ก้นโพรง... อย่าตายง่ายๆ ล่ะ" },
    ],
  },

  /* 7 */ {
    id: "s7_dragon_in_flame", chapter: 3, title: "มังกรในเปลวเพลิง",
    objective: "ปราบมังกรไฟ 'อิกนาธอร์' คว้าเสี้ยวที่ 2",
    giver: "grimm", type: "boss", target: "ignathor", need: 1, requireLevel: 12, autoTurnin: true,
    reward: { exp: 350, gold: 250 }, giveItem: "shard2", setFlags: ["shard2", "mistfen_open"],
    offer: () => [{ s: SP.grimm, t: "ตะเกียงพร้อมแล้ว ลงโพรงมังกรได้เลย ระวังลมหายใจไฟของมัน" }],
    nudge: () => [{ s: SP.grimm, t: "อิกนาธอร์ยังคำรามอยู่ก้นโพรงนั่น" }],
    turnin: () => [
      { s: SP.narr, t: "อิกนาธอร์ทรุดลงในทะเลเปลวไฟ แต่หางมันฟาดกลับ! ทันใดนั้นเงาหนึ่งพุ่งมาปัดป้องเจ้า" },
      { s: SP.nyx, t: "เด็กโง่ อย่าเผลอตอนศัตรูยังหายใจสิ" },
      { s: SP.narr, t: "นิกซ์! คราวนี้เธอช่วยเจ้าปลิดชีพมังกร แล้วมองเสี้ยวที่ 2 ในมือเจ้า" },
      { s: SP.nyx, t: "ฟังนะ ก่อนที่เจ้าจะเชื่อทุกคำของคนแก่ในหมู่บ้าน — ถามอาจารย์ของเจ้าสิ" },
      { s: SP.nyx, t: "ถามเขาว่า 'ใครเป็นคนทุบมงกุฎ' แล้วดูสีหน้าเขา" },
      { s: SP.narr, t: "เธอทิ้งประโยคนั้นไว้ แล้วหายไปอีกครั้ง กริมม์ตีตะเกียงหมอกให้ — ทางสู่บึงมิสท์เฟนเปิดแล้ว" },
    ],
  },

  /* 8 */ {
    id: "s8_mists_of_mistfen", chapter: 4, title: "หมอกแห่งมิสท์เฟน",
    objective: "พบแม่มดเมฟ · ปราบอสูรบึง คว้าเสี้ยวที่ 3",
    giver: "maeve", type: "boss", target: "bog_horror", need: 1, requireLevel: 15, autoTurnin: true,
    reward: { exp: 500, gold: 300 }, giveItem: "shard3", setFlags: ["shard3"], visionGame: true,
    offer: () => [
      { s: SP.maeve, t: "ข้ารอเจ้าอยู่นาน ผู้กังวานผู้ถือสองเสี้ยว หลับตาสิ แล้วมองสิ่งที่ข้ามองเห็น" },
      { s: SP.narr, t: "นิมิตพุ่งเข้าหัวเจ้า — มงกุฎ, ผู้คนเจ็ดคนสวมเสื้อคลุม, และเปลวไฟ..." },
      { s: SP.maeve, t: "มงกุฎไม่ได้ถูกทุบโดยศัตรู เด็กเอ๋ย มันถูกทุบโดย 'ผู้พิทักษ์มงกุฎ' เจ็ดคน — เพื่อหยุดใครบางคน" },
      { s: SP.maeve, t: "ผู้กังวานคนแรก ผู้คลั่งเพราะพลังมงกุฎ ชื่อของเขาคือ 'วีรอน'" },
      { s: SP.maeve, t: "และหนึ่งในเจ็ดผู้พิทักษ์ที่ลงมือทุบ... ยังมีชีวิตอยู่ เจ้ารู้จักเขาดี" },
      { s: SP.maeve, t: "ไปเถอะ อสูรบึงเฝ้าเสี้ยวที่สาม จัดการมันก่อน แล้วค่อยกลับไปหาความจริง" },
    ],
    nudge: () => [{ s: SP.maeve, t: "อสูรบึงยังจมอยู่ในหนองลึก ตามแสงเรืองไป" }],
    turnin: () => [
      { s: SP.narr, t: "อสูรบึงจมลงในโคลน เสี้ยวที่ 3 ลอยขึ้นสู่มือเจ้า สามเสี้ยวแล้ว" },
      { s: SP.maeve, t: "กลับไปเถอะ ผู้กังวาน กลับไปถามคนที่เลี้ยงเจ้ามา ว่าเขาปิดบังอะไร" },
    ],
  },

  /* 9 */ {
    id: "s9_confession", chapter: 5, title: "คำสารภาพ",
    objective: "กลับไปเผชิญหน้าความจริงกับอาจารย์โรวัน",
    giver: "elder", type: "lore", requireLevel: 17,
    reward: { exp: 200, gold: 100 }, setFlags: ["frostspire_open"],
    offer: () => [
      { s: SP.rowan, t: "เจ้ากลับมา... และแววตานั้น เจ้ารู้แล้วสินะ" },
      { s: SP.narr, t: "โรวันถอนหายใจยาว ราวกับปลดภาระสามร้อยปีลงจากบ่า" },
      { s: SP.rowan, t: "ใช่ ข้าคือหนึ่งในผู้พิทักษ์มงกุฎ ผู้พิทักษ์คนสุดท้ายที่ยังมีลมหายใจ" },
      { s: SP.rowan, t: "เราทุบมงกุฎเพื่อหยุดวีรอนที่คลั่ง ข้ารู้ว่ามันทำให้แผ่นดินป่วย แต่ทางเลือกอื่นคือหายนะที่เลวร้ายกว่า" },
      { s: SP.rowan, t: "และยังมีอีกเรื่อง... หญิงคลุมฮู้ดที่ตามเจ้า นิกซ์น่ะ" },
      { s: SP.rowan, t: "นางคือลูกสาวข้าเอง ข้าทอดทิ้งนางเพื่อปกป้องนางจากชะตากรรมนี้ แต่นางไม่เคยให้อภัยข้า" },
      { s: SP.rowan, t: "นางขึ้นเทือกเขาฟรอสต์สไปร์ไปแล้ว ตามหาเสี้ยวสุดท้าย เจ้าต้องไปหานาง — ก่อนที่นางจะทำสิ่งที่ย้อนคืนไม่ได้" },
    ],
  },

  /* 10 */ {
    id: "s10_broken_blood", chapter: 5, title: "สายเลือดที่แตกหัก",
    objective: "ดวลกับนิกซ์บนยอดฟรอสต์สไปร์ คว้าเสี้ยวที่ 4",
    giver: "nyx", type: "boss", target: "nyx_duel", need: 1, requireLevel: 20, autoTurnin: true,
    reward: { exp: 700, gold: 400 }, giveItem: "shard4", setFlags: ["shard4"],
    offer: () => [
      { s: SP.nyx, t: "มาถึงจนได้ ท่านพ่อคงเล่าทุกอย่างแล้วสินะ เรื่องที่เขาทิ้งข้า เรื่องที่เขาทุบมงกุฎ" },
      { s: SP.nyx, t: "ข้าจะรวมเสี้ยวทั้งสี่ ฟื้นมงกุฎ แล้วซ่อมโลกที่พวกเขาทำพัง — ด้วยมือข้าเอง" },
      { s: SP.nyx, t: "เจ้าขวางทางข้ามาตลอด งั้นเรามาตัดสินด้วยเหล็กกัน เสี้ยวที่สี่เป็นของผู้ที่ยืนอยู่" },
    ],
    nudge: () => [{ s: SP.nyx, t: "ชักดาบสิ ผู้กังวาน อย่าให้ข้ารอ" }],
    turnin: () => [
      { s: SP.narr, t: "นิกซ์คุกเข่า กริชหลุดมือ แต่แววตายังไม่ยอมแพ้ เจ้าเก็บเสี้ยวที่ 4 — ครบทั้งสี่แล้ว" },
      { s: SP.nyx, t: "ฆ่าข้าสิ จะได้จบๆ" },
      { s: SP.narr, t: "เจ้าเลือกได้ว่าจะทำอย่างไรต่อไป..." },
    ],
    choice: {
      prompt: "จะทำอย่างไรกับนิกซ์?",
      options: [
        { label: "ยื่นมือช่วยเธอลุกขึ้น", flag: "nyx_ally", after: () => [
          { s: SP.narr, t: "เจ้ายื่นมือไป นิกซ์มองมันนานก่อนคว้าไว้" },
          { s: SP.nyx, t: "...ทำไม ข้าพยายามฆ่าเจ้าตั้งหลายครั้ง" },
          { s: SP.nyx, t: "เจ้าโง่จริง... แต่บางที เจ้าอาจถูก โลกอาจไม่ได้ต้องการมงกุฎองค์ใหม่ — มันอาจต้องการคนที่ยังเชื่อในกันและกัน" },
          { s: SP.narr, t: "นิกซ์ตัดสินใจร่วมทางกับเจ้า (ปลดล็อกตอนจบ 'ภาระที่แบ่งกัน')" },
        ]},
        { label: "บอกเธอว่าพอได้แล้ว แล้วเดินจากไป", flag: "nyx_spared", after: () => [
          { s: SP.narr, t: "เจ้าหันหลังให้เธอ เก็บดาบ" },
          { s: SP.nyx, t: "...เจ้าไม่ฆ่าข้า แม้ข้าจะขวางเจ้ามาตลอด" },
          { s: SP.nyx, t: "ไปเถอะ ผู้กังวาน ทำสิ่งที่เจ้าต้องทำ ข้าจะไม่ตามอีกแล้ว" },
        ]},
      ],
    },
  },

  /* 11 */ {
    id: "s11_gate_to_citadel", chapter: 5, title: "ประตูสู่ป้อมเถ้าธุลี",
    objective: "รวมเสี้ยวครบ 4 — ทางสู่ป้อมเถ้าธุลีเปิดออก",
    giver: "elder", type: "lore", requireLevel: 22,
    reward: { exp: 100, gold: 0 }, setFlags: ["citadel_open"],
    offer: () => [
      { s: SP.rowan, t: "สี่เสี้ยวในมือเจ้าแล้ว มันสั่นสะเทือน... เรียกหาสิ่งที่มันเคยเป็น" },
      { s: SP.rowan, t: "วีรอนอยู่ในป้อมเถ้าธุลี ทางเหนือสุดของแผ่นดิน เขาคือผู้กังวานคนแรก คนที่เราหยุดไม่สำเร็จ" },
      { s: SP.rowan, t: "ระวังตัว เจ้าหนู... และถ้าข้าไม่ได้เจอเจ้าอีก ขอโทษที่ปิดบังเจ้ามานาน" },
    ],
  },

  /* 12 */ {
    id: "s12_ashen_king", chapter: 6, title: "ราชันเถ้าธุลี",
    objective: "บุกป้อมเถ้าธุลี เผชิญหน้าวีรอน",
    giver: "vheron", type: "boss", target: "vheron", need: 1, requireLevel: 25, autoTurnin: true,
    reward: { exp: 1000, gold: 600 },
    offer: () => [
      { s: SP.vheron, t: "ในที่สุด ผู้กังวานอีกคนก็มาถึง เจ้ามองข้าด้วยสายตาแบบนั้น — สายตาของคนที่คิดว่าตัวเองคือฮีโร่" },
      { s: SP.vheron, t: "ข้าเคยเป็นเหมือนเจ้า ข้าพยายามฟื้นมงกุฎเพื่อยุติริ้วมลทิน ด้วยความหวังดีทั้งหมดที่มี" },
      { s: SP.vheron, t: "แล้วมันก็กลืนข้า ทีละนิด จนข้าเข้าใจความจริง — ตราบใดที่ยังมีชีวิต ก็ยังมีความทุกข์ให้ริ้วมลทินหล่อเลี้ยง" },
      { s: SP.vheron, t: "ทางเดียวที่จะจบทุกอย่างคือ 'โลกที่สะอาด' — โลกที่ว่างเปล่า ไร้ลมหายใจให้ปวดร้าว" },
      { s: SP.vheron, t: "เจ้าจะไม่มีวันเข้าใจ จนกว่าจะได้ลิ้มรสมันเอง มาสิ ให้ข้าปลดปล่อยเจ้าจากภาระของการมีชีวิต" },
    ],
    nudge: () => [{ s: SP.vheron, t: "ป้อมนี้จะเป็นสุสานของเจ้า" }],
    turnin: () => [
      { s: SP.narr, t: "วีรอนคุกเข่า เกราะเถ้าธุลีร่วงกระจาย เผยชายผู้เหนื่อยล้าที่แบกภาระมาสามร้อยปี" },
      { s: SP.vheron, t: "อา... เจ้าแข็งแกร่งกว่าที่ข้าเคยเป็น แต่เจ้าเข้าใจผิด... พวกเจ้าทุกคนเข้าใจผิด" },
      { s: SP.vheron, t: "มงกุฎไม่เคยเป็นยารักษา... มันคือ 'กรงขัง' และเสี้ยวในมือเจ้า... เพิ่งไขกรงนั้นออก" },
      { s: SP.narr, t: "แสงในตาวีรอนดับลง เสี้ยวทั้งสี่ในย่ามเจ้าสั่นสะท้าน แล้วความมืดก็เริ่มไหลออกมา..." },
      { s: SP.hollow, t: "ขอบใจนะ... ที่พาเราออกมา……" },
    ],
  },

  /* 13 */ {
    id: "s13_the_hollow", chapter: 6, title: "ความว่างเปล่า",
    objective: "เผชิญหน้าศัตรูที่แท้จริง — ความว่างเปล่า",
    giver: "__auto__", type: "boss", target: "the_hollow", need: 1, requireLevel: 27, autoTurnin: true,
    reward: { exp: 2000, gold: 1000 },
    offer: () => [
      { s: SP.hollow, t: "สามร้อยปีในกรงเหล็ก... เจ้าคือคนที่หมุนกุญแจ ผู้กังวานตัวน้อย" },
      { s: SP.hollow, t: "ทุกคนที่สวมมงกุฎล้วนได้ยินเรา แล้วก็ยอมจำนน วีรอน... ผู้พิทักษ์ทั้งเจ็ด... และเจ้าจะเป็นคนต่อไป" },
      { s: SP.hollow, t: "เราคือความว่างเปล่าที่อยู่ก่อนแสงแรก และจะอยู่หลังแสงสุดท้าย มาเถอะ กลับคืนสู่ความสงบนิรันดร์" },
    ],
    nudge: () => [{ s: SP.hollow, t: "ต้านทานไปก็ไร้ค่า..." }],
    turnin: () => [
      { s: SP.narr, t: "ความว่างเปล่าครวญครางแล้วหดตัวลง เหลือเพียงแกนแสงสั่นไหว — มันอ่อนแรงพอจะถูกจัดการได้แล้ว" },
      { s: SP.narr, t: "เสี้ยวทั้งสี่ลอยขึ้นรอบตัวเจ้า รอการตัดสินใจครั้งสุดท้าย ชะตากรรมของอีเธอเรียอยู่ในมือเจ้า" },
    ],
    ending: true,
  },
];

/* ============================================================
 * ตัวช่วยเข้าถึงสถานะ
 * ========================================================== */
/* ฉากเปิดเกม */
Story.intro = function () {
  return [
    { s: SP.narr, t: "สามร้อยปีก่อน มงกุฎอีเธอร์ที่หล่อเลี้ยงแผ่นดินถูกทุบให้แตกสลาย" },
    { s: SP.narr, t: "นับแต่นั้น 'ริ้วมลทิน' ก็คืบคลานกัดกินทุกสรรพสิ่ง บิดเบือนสัตว์ให้เป็นอสูร กลืนกินความทรงจำของผู้คน" },
    { s: SP.narr, t: `และแล้ว ณ หมู่บ้านเล็กๆ ชื่อเอลดาร์ เด็กคนหนึ่งนามว่า ${hero()} กำลังจะค้นพบว่าตนไม่ใช่คนธรรมดา...` },
    { s: SP.rowan, t: `${hero()}! มานี่สิเจ้าหนู ข้ามีเรื่องด่วนจะขอให้ช่วย — มาคุยกับข้าที่นี่นะ` },
    { s: SP.narr, t: "(กดปุ่ม ✦ หรือเดินไปหาอาจารย์โรวัน 🧙 เพื่อเริ่มการผจญภัย · เปิด 'เนื้อเรื่อง' เพื่อดูภารกิจปัจจุบัน)" },
  ];
};

Story.stage = function (p) {
  return (p.storyStage < Story.STAGES.length) ? Story.STAGES[p.storyStage] : null;
};
Story.flag = function (p, name) { return !!(p.flags && p.flags[name]); };
Story.setFlag = function (p, name) { if (!p.flags) p.flags = {}; p.flags[name] = true; };

/* เควสปัจจุบันสำเร็จหรือยัง */
Story.complete = function (p, st) {
  if (!st) return false;
  switch (st.type) {
    case "hunt": return (p.stageProgress || 0) >= st.need;
    case "boss": return (p.stageProgress || 0) >= 1;
    case "talk": return (p.stageProgress || 0) >= 1;
    case "reach": return (p.stageProgress || 0) >= 1;
    case "collect": return State.countItem(p, st.target) >= st.need;
    case "lore": return true;
    default: return false;
  }
};

/* ความคืบหน้าเป็นข้อความ */
Story.progressText = function (p, st) {
  if (!st) return "";
  if (st.type === "hunt") return `${p.stageProgress || 0}/${st.need}`;
  if (st.type === "collect") return `${State.countItem(p, st.target)}/${st.need}`;
  if (st.type === "boss") return (p.stageProgress >= 1) ? "พร้อมส่ง" : "ยังไม่สำเร็จ";
  return "";
};

/* ============================================================
 * ตรรกะการโต้ตอบ NPC (เรียกจาก world.interact)
 * คืน true ถ้า Story จัดการบทสนทนาแล้ว
 * ========================================================== */
Story.interact = function (npcId) {
  const p = State.player;
  const st = Story.stage(p);

  // พิพ: มินิเกมจับผลึกดาว (สนุกๆ ได้ทอง)
  if (npcId === "pip") { Story.pipGame(p); return true; }

  // NPC เป็นผู้ให้เควสของด่านปัจจุบัน
  if (st && st.giver === npcId) {
    // เควสประเภท lore: เล่าแล้วเดินเรื่องทันที
    if (st.type === "lore") {
      UI.playDialogue(st.offer(), () => Story.advance(p));
      return true;
    }
    if (!p.stageAccepted) {
      UI.playDialogue(st.offer(), () => {
        p.stageAccepted = true; p.stageProgress = 0;
        UI.toast("📜 รับเควส: " + st.title);
        if (typeof SFX !== "undefined") SFX.play("select");
        if (st.visionGame) Story.playVision(p, st);      // นิมิต = มินิเกมความจำ
      });
      return true;
    }
    if (Story.complete(p, st)) {
      Story.doTurnin(p, st);
      return true;
    }
    // ยังไม่เสร็จ — ถ้ามีมินิเกมช่วย ให้เลือกเล่น
    if (st.minigame && typeof Minigames !== "undefined") { Story.offerMinigame(p, st); return true; }
    UI.playDialogue(st.nudge ? st.nudge() : [{ s: SP.narr, t: "ยังทำไม่เสร็จนะ" }]);
    return true;
  }

  // บทพูดเสริม (flavor) ของตัวละครอื่น
  const fl = Story.flavor(npcId, p);
  if (fl) { UI.playDialogue(fl); return true; }
  return false;
};

/* พิพ — มินิเกมจับผลึกดาว */
Story.pipGame = function (p) {
  const fl = Story.flavor("pip", p) || [{ s: SP.pip, t: "พี่ๆ มาเล่นเกมกันไหม!" }];
  UI.playDialogue(fl, () => {
    UI.playChoice("🎮 เล่น 'จับผลึกดาว' ไหม? (ได้ทองถ้าชนะ)", [
      { label: "เล่นเลย!", on: () => Minigames.play("catch", { time: 12, quota: 8 }, (ok, score) => {
          p.gold += score * 4;
          UI.updateHud();
          UI.playDialogue([{ s: SP.pip, t: ok ? `เก่งจัง! ได้ ${score} ผลึก รับทอง ${score*4} ไปเลยพี่!` : `ได้ ${score} ผลึก! รับทอง ${score*4} ลองใหม่ได้นะ!` }]);
        }) },
      { label: "ไว้ก่อน", on: () => {} },
    ]);
  });
};

/* กริมม์ — มินิเกมตีเหล็ก (ช่วยหาผลึกไฟ) */
Story.offerMinigame = function (p, st) {
  const mg = st.minigame;
  UI.playChoice("🔨 ช่วยกริมม์ตีเหล็กไหม? (สำเร็จได้ผลึกไฟ)", [
    { label: "ตีเหล็ก! (มินิเกม)", on: () => Minigames.play(mg.type, mg.opts || {}, (ok) => {
        if (ok) {
          State.addItem(p, mg.give.item, mg.give.qty);
          UI.playDialogue([{ s: SP.grimm, t: `ฝีมือใช้ได้! เอาผลึกไฟไป ${mg.give.qty} ชิ้น` }]);
        } else {
          UI.playDialogue([{ s: SP.grimm, t: "ยังไม่ได้เรื่อง ลองใหม่สิเด็กนอก" }]);
        }
      }) },
    { label: "ไปล่าเอาเอง", on: () => UI.playDialogue(st.nudge ? st.nudge() : []) },
  ]);
};

/* เมฟ — นิมิต = มินิเกมลำดับความจำ */
Story.playVision = function (p, st) {
  Minigames.play("memory", { target: 4 }, (ok) => {
    if (ok) {
      const m = State.gainExp(p, 80); p.gold += 40; UI.updateHud();
      UI.playDialogue([
        { s: SP.maeve, t: "เจ้าตามนิมิตได้ครบถ้วน... จิตของเจ้ามั่นคงดี รับพรจากข้าไป (+80 EXP, +40 ทอง)" },
      ]);
    } else {
      UI.playDialogue([{ s: SP.maeve, t: "นิมิตเลือนหายไป... ไม่เป็นไร ชะตายังคงเดิม ไปจัดการอสูรบึงเถิด" }]);
    }
  });
};

/* เผชิญหน้าบอสบนแผนที่ (NPC ที่มี .boss) */
Story.engageBoss = function (npc) {
  const p = State.player;
  const st = Story.stage(p);
  const bossId = npc.boss;
  if (Story.flag(p, "killed_" + bossId)) { UI.toast("เจ้าปราบมันไปแล้ว"); return; }
  const fight = () => Battle.start(bossId, { bossNpc: npc });

  if (st && st.type === "boss" && st.target === bossId) {
    if (!p.stageAccepted) {
      p.stageAccepted = true; p.stageProgress = 0;
      // บอสที่เป็นผู้ให้เควสด้วย (เช่น วีรอน) — เล่นบทก่อนสู้
      if (st.giver === npc.id && st.offer) { UI.playDialogue(st.offer(), fight); return; }
    }
    fight();
    return;
  }
  // บอสที่ยังไม่ถึงคิวในเนื้อเรื่อง
  UI.playDialogue([{ s: SP.narr, t: "พลังของมันยังหลับใหล... เจ้ายังไม่พร้อมเผชิญหน้ามันตอนนี้" }]);
};

/* ส่งเควส/รับรางวัล + เดินเรื่อง */
Story.doTurnin = function (p, st) {
  UI.playDialogue(st.turnin ? st.turnin() : [{ s: SP.narr, t: "ทำสำเร็จ!" }], () => {
    // ด่านที่มีทางเลือก (เช่น นิกซ์)
    if (st.choice && !p._choiceDone) {
      Story.presentChoice(p, st);
      return;
    }
    if (st.ending) { Story.beginEnding(p); return; }
    Story.advance(p);
  });
};

/* แสดงตัวเลือก (ทางแยกเนื้อเรื่อง) */
Story.presentChoice = function (p, st) {
  const c = st.choice;
  const opts = c.options.map((o) => ({
    label: o.label,
    on: () => {
      if (o.flag) Story.setFlag(p, o.flag);
      p._choiceDone = true;
      UI.playDialogue(o.after ? o.after() : [], () => { p._choiceDone = false; Story.advance(p); });
    },
  }));
  UI.playChoice(c.prompt, opts);
};

/* เดินเรื่องไปด่านถัดไป + ให้รางวัล/ตั้ง flag/ปลดล็อกโซน */
Story.advance = function (p, silent) {
  const st = Story.stage(p);
  if (!st) return;
  const rw = st.reward || {};
  const msgs = State.gainExp(p, rw.exp || 0);
  if (rw.gold) p.gold += rw.gold;
  if (rw.item) State.addItem(p, rw.item, 1);
  if (st.giveItem) State.addItem(p, st.giveItem, 1);
  if (st.setFlags) st.setFlags.forEach((f) => Story.setFlag(p, f));

  if (typeof Auth !== "undefined") Auth.log("story", { stage: st.id, title: st.title });
  p.storyStage++;
  p.stageAccepted = false;
  p.stageProgress = 0;

  UI.updateHud && UI.updateHud();
  const next = Story.stage(p);
  let txt = "✔ " + st.title;
  if (st.setFlags && st.setFlags.some((f) => f.endsWith("_open"))) txt += " — ปลดล็อกโซนใหม่!";
  UI.toast(txt);
  if (typeof SFX !== "undefined") SFX.play("levelup");
  if (msgs.length && typeof SFX !== "undefined") setTimeout(() => SFX.play("levelup"), 500);
  if (typeof Game !== "undefined" && Game.autosave) Game.autosave("story"); else State.save && State.save();

  // ด่านถัดไปแบบ auto (เช่น ความว่างเปล่าโผล่หลังปราบวีรอน)
  if (next && next.giver === "__auto__" && next.type === "boss") {
    setTimeout(() => {
      p.stageAccepted = true; p.stageProgress = 0;
      UI.playDialogue(next.offer(), () => Battle.start(next.target));
    }, 900);
  }
};

/* ============================================================
 * hooks จากระบบอื่น
 * ========================================================== */
Story.onKill = function (p, enemyId) {
  const st = Story.stage(p);
  if (!st || !p.stageAccepted) return;
  if (st.type === "hunt" && st.target === enemyId) {
    p.stageProgress = Math.min((p.stageProgress || 0) + 1, st.need);
  } else if (st.type === "boss" && st.target === enemyId) {
    p.stageProgress = 1;
    if (st.autoTurnin) p._pendingScene = st.id;   // เล่นฉากหลังกลับจากต่อสู้
  }
};

Story.onReach = function (p, mapId) {
  const st = Story.stage(p);
  if (!st || !p.stageAccepted) return;
  if (st.type === "reach" && st.target === mapId) p.stageProgress = 1;
};

/* เรียกหลังกลับจากฉากต่อสู้ (เล่นฉาก cutscene บอส) */
Story.flushScene = function () {
  const p = State.player;
  if (!p || !p._pendingScene) return false;
  const st = Story.stage(p);
  p._pendingScene = null;
  if (st && Story.complete(p, st) && st.giver !== "__auto__") {
    // ด่านที่มี giver ปกติ: ให้ผู้เล่นกลับไปคุยเอง (ยกเว้น autoTurnin)
  }
  if (st && st.autoTurnin && Story.complete(p, st)) {
    Story.doTurnin(p, st);
    return true;
  }
  return false;
};

/* บทพูดเสริมของตัวละคร (เปลี่ยนตามความคืบหน้า) */
Story.flavor = function (npcId, p) {
  const stage = p.storyStage;
  switch (npcId) {
    case "elder":
      if (stage >= 11) return [{ s: SP.rowan, t: "ไปเถอะเจ้าหนู อีเธอเรียทั้งผืนฝากไว้ในมือเจ้าแล้ว" }];
      if (stage >= 4) return [{ s: SP.rowan, t: "เสี้ยวมงกุฎ... ทุกครั้งที่เจ้าเก็บมา ข้าอดหวั่นไม่ได้ ระวังตัวด้วยนะ" }];
      return [{ s: SP.rowan, t: "หมู่บ้านเราเล็ก แต่ก็อบอุ่น ดูแลตัวเองด้วยล่ะ เจ้าหนู" }];
    case "merchant":
      return [{ s: SP.merric, t: "ของดีมีมาเรื่อยๆ นะพ่อหนุ่ม/แม่หนู! ริ้วมลทินน่ะดีต่อการค้า — ยาขายดีเป็นเทน้ำเทท่า ฮ่าๆ" }];
    case "healer":
      if (stage >= 9) return [{ s: SP.anselm, t: "ข้าเริ่มสงสัยแล้วว่าแสงสว่างยังฟังคำอธิษฐานของเราอยู่ไหม... แต่ข้าจะรักษาเจ้าต่อไป นั่นคือสิ่งเดียวที่ข้าทำได้" }];
      return [{ s: SP.anselm, t: "ขอแสงสว่างคุ้มครองเจ้า ผู้เดินทาง หากบาดเจ็บ กลับมาหาข้าได้เสมอ" }];
    case "guard":
      if (stage >= 3) return [{ s: SP.doran, t: "ไปได้ไกลกว่าที่ข้าคิดไว้มากนะเจ้าหนู ทำให้เมืองนี้ภูมิใจด้วยล่ะ" }];
      return [{ s: SP.doran, t: "ข้าเฝ้าประตูเมืองนี้มายี่สิบปี ไม่เคยเห็นริ้วมลทินหนาขนาดนี้มาก่อน" }];
    case "pip":
      if (stage >= 12) return [{ s: SP.pip, t: "พี่จะไปสู้กับราชันเถ้าธุลีจริงๆ เหรอ!? เท่มากเลย! ...พี่ต้องกลับมานะ สัญญาสิ!" }];
      if (stage >= 4) return [{ s: SP.pip, t: "ว้าว! พี่เก็บเสี้ยวมงกุฎได้ด้วย! ขอจับหน่อยได้ไหม— เอ๊ะ ทำไมมันเย็นจัง..." }];
      return [{ s: SP.pip, t: "พี่ๆ! โตขึ้นผมจะเป็นนักผจญภัยเหมือนพี่บ้าง! สอนผมใช้ดาบหน่อยสิ!" }];
    default:
      return null;
  }
};

/* ============================================================
 * ตอนจบ
 * ========================================================== */
Story.beginEnding = function (p) {
  const canShare = Story.flag(p, "nyx_ally");
  const opts = [
    { label: "🔥 ฟื้นมงกุฎ แล้วสวมมันครองอีเธอเรีย", ending: "dark" },
    { label: "💠 ทำลายเสี้ยวทั้งสี่ สละพลังของตน", ending: "sacrifice" },
  ];
  if (canShare) opts.push({ label: "🤝 แบ่งพลังกับนิกซ์ กักขังมันด้วยกัน", ending: "share" });

  UI.playChoice("ชะตากรรมของมงกุฎ — เจ้าจะเลือกทางใด?", opts.map((o) => ({
    label: o.label,
    on: () => Story.showEnding(p, o.ending),
  })), true);
};

Story.ENDINGS = {
  dark: {
    title: "ตอนจบ A — ราชันองค์ใหม่",
    lines: [
      { s: SP.narr, t: "เจ้าหลอมเสี้ยวทั้งสี่เข้าด้วยกัน มงกุฎอีเธอร์เปล่งประกายอีกครั้งหลังสามร้อยปี" },
      { s: SP.narr, t: "เจ้าสวมมันลงบนศีรษะ พลังมหาศาลไหลทะลัก ริ้วมลทินทั่วแผ่นดินสงบลงในพริบตา ผู้คนแซ่ซ้องเจ้าเป็นราชัน" },
      { s: SP.hollow, t: "ดีมาก... ทีนี้ก็แค่เจ้ากับเรา ตลอดไป……" },
      { s: SP.narr, t: "ในความเงียบของราตรี เสียงกระซิบเริ่มดังขึ้นในหัวเจ้า... วัฏจักรของวีรอนกำลังเริ่มต้นใหม่" },
      { s: SP.narr, t: "— อวสาน (ตอนจบมืด) —" },
    ],
  },
  sacrifice: {
    title: "ตอนจบ B — ผู้เสียสละ",
    lines: [
      { s: SP.narr, t: "เจ้าเลือกไม่ฟื้นมงกุฎ แต่ทุบเสี้ยวทั้งสี่จนแหลกด้วยพลังอีเธอร์ทั้งหมดที่มี" },
      { s: SP.hollow, t: "ไม่นะ— เจ้าทำอะไร— เจ้าจะดับไปพร้อมเรา—!" },
      { s: SP.narr, t: "ความว่างเปล่ากรีดร้องก่อนถูกผนึกในเศษแก้วที่สลาย ริ้วมลทินจางหายทั่วอีเธอเรีย แผ่นดินเริ่มเยียวยา" },
      { s: SP.narr, t: "แต่พลังผู้กังวานของเจ้าหมดสิ้น เจ้ากลายเป็นคนธรรมดา ไม่มีใครจดจำว่าใครคือผู้ช่วยโลก" },
      { s: SP.narr, t: "เจ้าเดินกลับบ้านเงียบๆ ใต้ฟ้าที่สดใสเป็นครั้งแรกในรอบร้อยปี — นั่นก็เพียงพอแล้ว" },
      { s: SP.narr, t: "— อวสาน (ตอนจบขมปนหวาน) —" },
    ],
  },
  share: {
    title: "ตอนจบ C — ภาระที่แบ่งกัน",
    lines: [
      { s: SP.narr, t: "นิกซ์ก้าวมายืนเคียงข้างเจ้า ทั้งคู่ประสานมือเหนือเสี้ยวทั้งสี่" },
      { s: SP.nyx, t: "คนเดียวมันหนักเกินไป — เราเคยเห็นแล้วว่ามันจบยังไง งั้นก็แบกมันคนละครึ่งสิ" },
      { s: SP.narr, t: "พลังอีเธอร์ถูกแบ่งเป็นสองสาย ผูกความว่างเปล่าไว้ระหว่างผู้กังวานสองคนที่ไว้ใจกัน — กรงที่ไม่มีวันไขจากข้างใน" },
      { s: SP.rowan, t: "ลูกพ่อ... ขอบใจนะ และ... ขอโทษ สำหรับทุกอย่าง" },
      { s: SP.narr, t: "นิกซ์คืนดีกับบิดา ริ้วมลทินค่อยๆ จางหาย โลกเริ่มต้นใหม่บนความสมดุล — ไม่ใช่ด้วยมงกุฎ แต่ด้วยคนที่ยังเชื่อในกันและกัน" },
      { s: SP.narr, t: "— อวสาน (ตอนจบมีความหวัง) —" },
    ],
  },
};

Story.showEnding = function (p, key) {
  const e = Story.ENDINGS[key];
  p.ending = key;
  p.storyStage = Story.STAGES.length; // จบเนื้อเรื่อง
  if (typeof Auth !== "undefined") Auth.log("ending", { ending: key });
  State.save && State.save();
  if (typeof SFX !== "undefined") SFX.play(key === "dark" ? "defeat" : "victory");
  UI.playDialogue(e.lines, () => {
    UI.openOverlay(`<h2>${e.title}</h2>
      <p class="sub">ขอบคุณที่เล่นจนจบ — เนื้อเรื่อง Aetheria: The Sundered Crown</p>
      <p style="margin:12px 0;color:var(--muted)">เจ้าสามารถเล่นต่อเพื่อสำรวจ หรือเริ่มใหม่เพื่อค้นหาตอนจบอื่น</p>
      <button class="btn btn-primary wide" onclick="UI.closeOverlay()">ปิด</button>`);
  });
};

window.Story = Story;
window.SP = SP;
