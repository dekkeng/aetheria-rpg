/* ============================================================
 * Aetheria RPG — Background Music (WebAudio, สังเคราะห์ล้วน)
 * ดนตรีบรรเลงเบาๆ แยกอารมณ์ตามแมพ + ระทึกตอนสู้บอส
 * เพลงทั้งหมดเป็นการประพันธ์ต้นฉบับด้วยโค้ด (ไม่มีไฟล์เพลง)
 * ========================================================== */

const Music = {
  ctx: null,
  master: null,
  timer: null,
  mood: null,
  step: 0,
  nextTime: 0,
  playing: false,
};

/* สเกล (semitone offsets) */
const SCALES = {
  major:    [0, 2, 4, 5, 7, 9, 11],
  minor:    [0, 2, 3, 5, 7, 8, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
};

/* นิยามอารมณ์เพลง — ประพันธ์ต้นฉบับ */
Music.MOODS = {
  // เมือง: สบายๆ อบอุ่น
  calm:    { root: 60, scale: "major",    bpm: 82,  prog: [0, 3, 4, 0], drums: false, arpWave: "triangle", leadWave: "sine",     vol: 0.11 },
  // ทุ่ง: ผจญภัยเบาๆ สดใส
  explore: { root: 62, scale: "major",    bpm: 104, prog: [0, 4, 5, 3], drums: "hat", arpWave: "square",   leadWave: "triangle", vol: 0.11 },
  // โซนมอนสเตอร์: ตื่นเต้น เร่งเร้า (คีย์ไมเนอร์ + กลอง)
  tense:   { root: 57, scale: "minor",    bpm: 122, prog: [0, 5, 3, 4], drums: true,  arpWave: "square",   leadWave: "square",   vol: 0.10 },
  // ต่อสู้ปกติ
  battle:  { root: 55, scale: "minor",    bpm: 134, prog: [0, 3, 4, 0], drums: true,  arpWave: "square",   leadWave: "square",   vol: 0.11 },
  // บอส: ระทึก ดาร์ก (ฟรีเจียน + กลองหนัก)
  boss:    { root: 53, scale: "phrygian", bpm: 144, prog: [0, 5, 6, 1], drums: "heavy", arpWave: "sawtooth", leadWave: "square", vol: 0.12 },
};

/* แมพ -> อารมณ์เพลง */
Music.MAP_MOOD = {
  town: "calm", field: "explore", forest: "tense",
  emberpeak: "tense", mistfen: "tense", frostspire: "tense", citadel: "tense",
};

Music.freq = function (midi) { return 440 * Math.pow(2, (midi - 69) / 12); };

Music.init = function () {
  if (Music.ctx) return true;
  if (typeof SFX !== "undefined") { SFX.init(); Music.ctx = SFX.ctx; }
  if (!Music.ctx) {
    try { Music.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return false; }
  }
  Music.master = Music.ctx.createGain();
  Music.master.gain.value = 0.0;
  Music.master.connect(Music.ctx.destination);
  return true;
};

/* triad semitones ของคอร์ดตาม degree ในสเกล */
Music.triad = function (scale, deg) {
  const s = SCALES[scale];
  const tone = (i) => s[i % 7] + 12 * Math.floor(i / 7);
  return [tone(deg), tone(deg + 2), tone(deg + 4)];
};

Music.note = function (time, midi, dur, type, vol) {
  const c = Music.ctx;
  const osc = c.createOscillator(), g = c.createGain();
  osc.type = type; osc.frequency.value = Music.freq(midi);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.linearRampToValueAtTime(vol, time + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(g).connect(Music.master);
  osc.start(time); osc.stop(time + dur + 0.03);
};

Music.kick = function (time, hard) {
  const c = Music.ctx;
  const osc = c.createOscillator(), g = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(hard ? 150 : 120, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);
  g.gain.setValueAtTime(hard ? 0.5 : 0.35, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
  osc.connect(g).connect(Music.master);
  osc.start(time); osc.stop(time + 0.18);
};

Music.hat = function (time, vol) {
  const c = Music.ctx;
  const n = Math.floor(c.sampleRate * 0.03);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 7000;
  const g = c.createGain(); g.gain.value = vol || 0.06;
  src.connect(f).connect(g).connect(Music.master);
  src.start(time); src.stop(time + 0.03);
};

/* จัดคิวโน้ต 1 สเต็ป (8 สเต็ป/บาร์) */
Music.scheduleStep = function (globalStep, time) {
  const m = Music.MOODS[Music.mood]; if (!m) return;
  const bar = Math.floor(globalStep / 8), sib = globalStep % 8;
  const deg = m.prog[bar % m.prog.length];
  const tri = Music.triad(m.scale, deg);
  const rootMidi = m.root + tri[0];

  // เบส (root ต่ำ) ที่สเต็ป 0 และ 4
  if (sib === 0 || sib === 4) Music.note(time, rootMidi - 12, 0.5, "triangle", m.vol * 0.85);

  // อาร์เพจจิโอ (โน้ตในคอร์ด) เบาๆ
  const arpTone = tri[sib % 3] + 12;
  if (sib % 2 === 0 || m.drums === "heavy") Music.note(time, m.root + arpTone, 0.16, m.arpWave, m.vol * 0.42);

  // เมโลดี้ (ประพันธ์เป็นจังหวะ syncopated)
  if (sib === 0 || sib === 3 || sib === 6) {
    const pick = tri[(bar + sib) % 3] + 24;
    Music.note(time + 0.005, m.root + pick, sib === 6 ? 0.4 : 0.24, m.leadWave, m.vol * 0.5);
  }

  // กลอง
  if (m.drums) {
    if (sib === 0 || sib === 4) Music.kick(time, m.drums === "heavy");
    if (m.drums !== "hat") { if (sib % 2 === 1) Music.hat(time, m.drums === "heavy" ? 0.09 : 0.05); }
    else if (sib % 2 === 1) Music.hat(time, 0.04);
    if (m.drums === "heavy" && sib === 6) Music.kick(time, false);
  }
};

Music.scheduler = function () {
  const c = Music.ctx; if (!c) return;
  const m = Music.MOODS[Music.mood]; if (!m) return;
  const stepDur = 60 / m.bpm / 2;   // สเต็ป = โน้ตเขบ็ต 1 ชั้น
  while (Music.nextTime < c.currentTime + 0.14) {
    Music.scheduleStep(Music.step, Music.nextTime);
    Music.step++;
    Music.nextTime += stepDur;
  }
};

/* เริ่มเล่นอารมณ์หนึ่ง (crossfade สั้นๆ) */
Music.play = function (mood) {
  if (!mood || !Music.MOODS[mood]) return;
  if (typeof SFX !== "undefined" && !SFX.enabled) { Music.mood = mood; return; }
  if (!Music.init()) return;
  if (Music.ctx.state === "suspended") Music.ctx.resume();
  const changing = (Music.mood !== mood);
  Music.mood = mood;
  const g = Music.master.gain, now = Music.ctx.currentTime;
  const target = Music.MOODS[mood].vol * 1.0;
  if (!Music.playing) {
    Music.step = 0; Music.nextTime = now + 0.06;
    Music.playing = true;
    Music.timer = setInterval(Music.scheduler, 25);
    g.cancelScheduledValues(now); g.setValueAtTime(0.0001, now);
    g.linearRampToValueAtTime(target, now + 0.8);
  } else if (changing) {
    // ดิปเสียงสั้นๆ แล้วขึ้นใหม่ (เปลี่ยนอารมณ์)
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0.0001, now + 0.18);
    g.linearRampToValueAtTime(target, now + 0.7);
  } else {
    g.cancelScheduledValues(now); g.linearRampToValueAtTime(target, now + 0.4);
  }
};

Music.stop = function (fade) {
  if (Music.timer) { clearInterval(Music.timer); Music.timer = null; }
  Music.playing = false;
  if (Music.master && Music.ctx) {
    const g = Music.master.gain, now = Music.ctx.currentTime;
    g.cancelScheduledValues(now); g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0.0001, now + (fade || 0.3));
  }
};

/* เล่นเพลงตามแมพ */
Music.playForMap = function (mapId) {
  Music.play(Music.MAP_MOOD[mapId] || "calm");
};
/* เล่นเพลงต่อสู้ (บอส = ระทึก) */
Music.playBattle = function (isBoss) {
  Music.play(isBoss ? "boss" : "battle");
};
/* เลือกอารมณ์อัตโนมัติจากบริบทปัจจุบัน */
Music.autostart = function () {
  if (typeof SFX !== "undefined" && !SFX.enabled) return;
  if (typeof State === "undefined") { Music.play("calm"); return; }
  if (State.screen === "battle" && State.battle) Music.playBattle(!!(State.battle.def && State.battle.def.boss));
  else if (State.screen === "world" && State.player) Music.playForMap(State.player.map);
  else Music.play("calm");
};

window.Music = Music;
