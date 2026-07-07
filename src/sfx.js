/* ============================================================
 * Aetheria RPG — Sound FX (WebAudio, สังเคราะห์ล้วน ไม่ใช้ไฟล์เสียง)
 * + Transition effects (fade/flash)
 * ========================================================== */

const SFX = {
  ctx: null,
  enabled: true,
  master: 0.35,
  lastStep: 0,
};

SFX.init = function () {
  if (SFX.ctx) return;
  try {
    SFX.ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) { SFX.enabled = false; }
};

/* ปลดล็อก audio หลัง user gesture แรก */
SFX.unlock = function () {
  SFX.init();
  if (SFX.ctx && SFX.ctx.state === "suspended") SFX.ctx.resume();
};

SFX.toggle = function () {
  SFX.enabled = !SFX.enabled;
  return SFX.enabled;
};

/* โทนพื้นฐาน 1 เสียง */
SFX.tone = function (opt) {
  if (!SFX.enabled) return;
  SFX.init();
  const c = SFX.ctx;
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = opt.type || "square";
  osc.frequency.setValueAtTime(opt.freq, t);
  if (opt.to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opt.to), t + opt.dur);
  const vol = (opt.vol == null ? 0.5 : opt.vol) * SFX.master;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + opt.dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + opt.dur + 0.02);
};

/* เสียง noise สั้นๆ (สำหรับการชน/ระเบิด) */
SFX.noise = function (dur, vol, freq) {
  if (!SFX.enabled) return;
  SFX.init();
  const c = SFX.ctx;
  if (!c) return;
  const t = c.currentTime;
  const n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource(); src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = "bandpass"; filt.frequency.value = freq || 900; filt.Q.value = 0.8;
  const gain = c.createGain();
  gain.gain.setValueAtTime((vol == null ? 0.4 : vol) * SFX.master, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filt).connect(gain).connect(c.destination);
  src.start(t); src.stop(t + dur);
};

SFX.seq = function (notes) {
  // notes: [{freq,dur,type,delay}] เล่นต่อกัน
  let d = 0;
  notes.forEach((nt) => {
    setTimeout(() => SFX.tone(nt), d * 1000);
    d += nt.delay != null ? nt.delay : nt.dur;
  });
};

/* คลังเสียงตามเหตุการณ์ */
SFX.play = function (name) {
  switch (name) {
    case "step": {
      const now = performance.now();
      if (now - SFX.lastStep < 90) return;   // กันถี่เกิน
      SFX.lastStep = now;
      SFX.tone({ type: "triangle", freq: 180, to: 120, dur: 0.06, vol: 0.18 });
      break;
    }
    case "select": SFX.tone({ type: "square", freq: 520, to: 660, dur: 0.07, vol: 0.3 }); break;
    case "menu":   SFX.tone({ type: "square", freq: 380, to: 300, dur: 0.06, vol: 0.25 }); break;
    case "error":  SFX.tone({ type: "sawtooth", freq: 160, to: 90, dur: 0.18, vol: 0.3 }); break;
    case "attack": SFX.tone({ type: "square", freq: 300, to: 120, dur: 0.12, vol: 0.3 });
                   SFX.noise(0.12, 0.25, 700); break;
    // --- เสียงโจมตีแยกตามอาวุธ ---
    case "slash":  SFX.noise(0.09, 0.35, 2600); SFX.tone({ type: "sawtooth", freq: 520, to: 160, dur: 0.1, vol: 0.22 }); break;
    case "bow":    SFX.tone({ type: "triangle", freq: 900, to: 300, dur: 0.13, vol: 0.32 }); SFX.noise(0.06, 0.14, 3200); break;
    case "magic_hit": SFX.tone({ type: "sine", freq: 700, to: 1500, dur: 0.14, vol: 0.3 }); SFX.noise(0.14, 0.12, 1800); break;
    // --- สกิลแยกตามชนิด ---
    case "power_strike": SFX.tone({ type: "square", freq: 200, to: 70, dur: 0.2, vol: 0.34 });
                   SFX.noise(0.22, 0.4, 380); break;   // ฟันหนักหน่วง
    case "fireball": SFX.seq([{ type: "sine", freq: 300, to: 700, dur: 0.12 }, { type: "sine", freq: 500, to: 200, dur: 0.16 }]);
                   setTimeout(() => SFX.noise(0.32, 0.42, 260), 140); break;  // วูบ + ระเบิดไฟ
    case "double_shot": SFX.tone({ type: "triangle", freq: 950, to: 320, dur: 0.1, vol: 0.3 });
                   setTimeout(() => SFX.tone({ type: "triangle", freq: 1050, to: 360, dur: 0.1, vol: 0.3 }), 130); break;
    case "hit":    SFX.noise(0.16, 0.4, 500);
                   SFX.tone({ type: "sawtooth", freq: 160, to: 70, dur: 0.14, vol: 0.28 }); break;
    case "skill":  SFX.seq([
                     { type: "sine", freq: 500, to: 900, dur: 0.09 },
                     { type: "sine", freq: 700, to: 1300, dur: 0.12 },
                   ]); SFX.noise(0.2, 0.15, 1400); break;
    case "heal":   SFX.seq([
                     { type: "sine", freq: 660, dur: 0.1 },
                     { type: "sine", freq: 880, dur: 0.1 },
                     { type: "sine", freq: 1100, dur: 0.16 },
                   ]); break;
    case "buy":    SFX.seq([
                     { type: "square", freq: 700, dur: 0.07 },
                     { type: "square", freq: 1050, dur: 0.1 },
                   ]); break;
    case "levelup": SFX.seq([
                     { type: "square", freq: 523, dur: 0.1 },
                     { type: "square", freq: 659, dur: 0.1 },
                     { type: "square", freq: 784, dur: 0.1 },
                     { type: "square", freq: 1046, dur: 0.22 },
                   ]); break;
    case "victory": SFX.seq([
                     { type: "square", freq: 784, dur: 0.12 },
                     { type: "square", freq: 784, dur: 0.12 },
                     { type: "square", freq: 784, dur: 0.12 },
                     { type: "square", freq: 1046, dur: 0.3 },
                   ]); break;
    case "defeat": SFX.seq([
                     { type: "sawtooth", freq: 400, to: 380, dur: 0.2 },
                     { type: "sawtooth", freq: 330, to: 300, dur: 0.2 },
                     { type: "sawtooth", freq: 260, to: 120, dur: 0.4 },
                   ]); break;
    case "portal": SFX.tone({ type: "sine", freq: 300, to: 800, dur: 0.3, vol: 0.3 });
                   SFX.noise(0.3, 0.12, 1200); break;
    case "encounter": SFX.seq([
                     { type: "sawtooth", freq: 200, to: 600, dur: 0.12 },
                     { type: "sawtooth", freq: 300, to: 800, dur: 0.15 },
                   ]); break;
    case "coin":   SFX.tone({ type: "square", freq: 988, to: 1319, dur: 0.12, vol: 0.28 }); break;
    default: break;
  }
};

window.SFX = SFX;

/* ============================================================
 * FX — Transition effects (fade / flash / shake)
 * ========================================================== */
const FX = {};

/* ทรานสิชันจอ: fade ดำเข้า -> เรียก cb (สลับหน้าจอ) -> fade ออก */
FX.transition = function (cb, color) {
  const el = document.getElementById("transition");
  if (!el) { cb && cb(); return; }
  el.style.background = color || "#0a0916";
  el.classList.add("in");
  setTimeout(() => {
    cb && cb();
    el.classList.remove("in");
    el.classList.add("out");
    setTimeout(() => el.classList.remove("out"), 320);
  }, 230);
};

/* แฟลชสีเต็มจอสั้นๆ (ตอนเข้าต่อสู้/สกิลแรง) */
FX.flash = function (color) {
  const el = document.getElementById("transition");
  if (!el) return;
  el.style.background = color || "#ffffff";
  el.classList.add("flash-fx");
  setTimeout(() => el.classList.remove("flash-fx"), 260);
};

/* สั่นหน้าจอ (ตอนโดนโจมตีแรง) */
FX.shake = function () {
  const g = document.getElementById("game");
  if (!g) return;
  g.classList.remove("shake"); void g.offsetWidth; g.classList.add("shake");
  setTimeout(() => g.classList.remove("shake"), 360);
};

window.FX = FX;
