/* ============================================================
 * Aetheria RPG — Minigames
 * มินิเกมสลับอารมณ์: ตีเหล็ก (จังหวะ) / จับผลึกดาว (รีแอคชัน) / ลำดับนิมิต (ความจำ)
 * Minigames.play(type, opts, done(success, score))
 * ========================================================== */

const Minigames = {};

Minigames.layer = function () { return document.getElementById("minigame"); };

Minigames.close = function () {
  const l = Minigames.layer();
  l.classList.remove("open");
  l.innerHTML = "";
  if (Minigames._raf) cancelAnimationFrame(Minigames._raf);
  if (Minigames._timer) clearInterval(Minigames._timer);
  Minigames._raf = null; Minigames._timer = null;
};

Minigames.play = function (type, opts, done) {
  opts = opts || {};
  const fn = Minigames["_" + type];
  if (!fn) { done && done(false, 0); return; }
  Minigames.layer().classList.add("open");
  fn(opts, (success, score) => {
    Minigames.close();
    if (typeof SFX !== "undefined") SFX.play(success ? "victory" : "error");
    done && done(success, score);
  });
};

Minigames.frame = function (title, hint, bodyHtml) {
  return `<div class="mg-box">
    <div class="mg-title">${title}</div>
    <div class="mg-hint">${hint}</div>
    ${bodyHtml}
  </div>`;
};

/* ---------------- 1) ตีเหล็ก (จังหวะ) ---------------- */
Minigames._smith = function (opts, done) {
  const need = opts.need || 5, maxMiss = opts.maxMiss || 3;
  const l = Minigames.layer();
  l.innerHTML = Minigames.frame("🔨 ตีเหล็ก", "แตะเมื่อค้อนอยู่ในช่องทอง!", `
    <div class="mg-smith">
      <div class="mg-bar"><div class="mg-zone" id="mg-zone"></div><div class="mg-marker" id="mg-marker"></div></div>
      <div class="mg-stat">ตี <b id="mg-hits">0</b>/${need} · พลาด <b id="mg-miss">0</b>/${maxMiss}</div>
      <button class="btn btn-primary wide" id="mg-hit">ตี! 🔨</button>
    </div>`);
  let pos = 0, dir = 1, speed = 1.1 + (opts.speed || 0);
  let hits = 0, miss = 0;
  let zoneStart = 35, zoneW = 30;
  const marker = document.getElementById("mg-marker");
  const zone = document.getElementById("mg-zone");
  const setZone = () => {
    zoneW = Math.max(14, 30 - hits * 2);
    zoneStart = 10 + Math.random() * (80 - zoneW);
    zone.style.left = zoneStart + "%"; zone.style.width = zoneW + "%";
  };
  setZone();
  const step = () => {
    pos += dir * speed;
    if (pos >= 100) { pos = 100; dir = -1; } else if (pos <= 0) { pos = 0; dir = 1; }
    marker.style.left = pos + "%";
    Minigames._raf = requestAnimationFrame(step);
  };
  step();
  const hit = () => {
    if (pos >= zoneStart && pos <= zoneStart + zoneW) {
      hits++; if (typeof SFX !== "undefined") SFX.play("power_strike");
      document.getElementById("mg-hits").textContent = hits;
      speed += 0.25; setZone();
      if (hits >= need) { done(true, hits); return; }
    } else {
      miss++; if (typeof SFX !== "undefined") SFX.play("error");
      document.getElementById("mg-miss").textContent = miss;
      if (miss >= maxMiss) { done(false, hits); return; }
    }
  };
  document.getElementById("mg-hit").addEventListener("click", hit);
};

/* ---------------- 2) จับผลึกดาว (รีแอคชัน) ---------------- */
Minigames._catch = function (opts, done) {
  const time = opts.time || 12, quota = opts.quota || 8;
  const l = Minigames.layer();
  l.innerHTML = Minigames.frame("✦ จับผลึกดาว", "แตะผลึกที่ร่วงลงมาให้ได้มากที่สุด!", `
    <div class="mg-stat">คะแนน <b id="mg-score">0</b>/${quota} · เวลา <b id="mg-time">${time}</b> วิ</div>
    <div class="mg-field" id="mg-field"></div>`);
  const field = document.getElementById("mg-field");
  let score = 0, left = time;
  const glyphs = ["✦", "💎", "🔷", "⭐", "🔶"];
  const timer = setInterval(() => {
    left--; document.getElementById("mg-time").textContent = left;
    if (left <= 0) { clearInterval(timer); done(score >= quota, score); }
  }, 1000);
  Minigames._timer = timer;
  const spawn = () => {
    if (!l.classList.contains("open")) return;
    const el = document.createElement("div");
    el.className = "mg-crystal";
    el.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    el.style.left = (5 + Math.random() * 85) + "%";
    const dur = 1.6 + Math.random() * 1.4;
    el.style.animationDuration = dur + "s";
    el.addEventListener("click", () => {
      score++; document.getElementById("mg-score").textContent = score;
      if (typeof SFX !== "undefined") SFX.play("coin");
      el.remove();
    });
    field.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 50);
  };
  Minigames._spawn = setInterval(spawn, 480);
  const origClose = Minigames.close;
  // เคลียร์ spawn ตอนปิด
  const guard = setInterval(() => {
    if (!l.classList.contains("open")) { clearInterval(Minigames._spawn); clearInterval(guard); }
  }, 200);
};

/* ---------------- 3) ลำดับนิมิต (ความจำ) ---------------- */
Minigames._memory = function (opts, done) {
  const target = opts.target || 5;
  const l = Minigames.layer();
  const runes = [
    { g: "🜂", c: "#ff6b5c" }, { g: "🜄", c: "#5ca8ff" },
    { g: "🜁", c: "#7ee787" }, { g: "🜃", c: "#c98bff" },
  ];
  l.innerHTML = Minigames.frame("🔮 ลำดับนิมิต", "จำลำดับที่เรืองแสง แล้วแตะซ้ำตามนั้น", `
    <div class="mg-stat">ระดับ <b id="mg-lv">0</b>/${target}</div>
    <div class="mg-runes">${runes.map((r, i) =>
      `<button class="mg-rune" data-r="${i}" style="--rc:${r.c}">${r.g}</button>`).join("")}</div>
    <div class="mg-msg" id="mg-msg">ดูให้ดี...</div>`);
  let seq = [], input = [], playerTurn = false;
  const btns = Array.from(l.querySelectorAll(".mg-rune"));
  const flash = (i, ms) => new Promise((res) => {
    btns[i].classList.add("lit");
    if (typeof SFX !== "undefined") SFX.tone({ type: "sine", freq: 400 + i * 140, dur: 0.25, vol: 0.35 });
    setTimeout(() => { btns[i].classList.remove("lit"); setTimeout(res, 140); }, ms);
  });
  const showSeq = async () => {
    playerTurn = false; document.getElementById("mg-msg").textContent = "ดูให้ดี...";
    for (const i of seq) await flash(i, 460);
    playerTurn = true; input = [];
    document.getElementById("mg-msg").textContent = "ถึงตาเจ้าแล้ว!";
  };
  const next = () => {
    seq.push(Math.floor(Math.random() * 4));
    document.getElementById("mg-lv").textContent = seq.length - 1;
    setTimeout(showSeq, 500);
  };
  btns.forEach((b) => b.addEventListener("click", async () => {
    if (!playerTurn) return;
    const i = +b.dataset.r;
    b.classList.add("lit"); setTimeout(() => b.classList.remove("lit"), 160);
    if (typeof SFX !== "undefined") SFX.tone({ type: "sine", freq: 400 + i * 140, dur: 0.18, vol: 0.35 });
    input.push(i);
    const idx = input.length - 1;
    if (input[idx] !== seq[idx]) { document.getElementById("mg-msg").textContent = "ผิด!"; setTimeout(() => done(false, seq.length - 1), 700); return; }
    if (input.length === seq.length) {
      document.getElementById("mg-lv").textContent = seq.length;
      if (seq.length >= target) { document.getElementById("mg-msg").textContent = "สำเร็จ!"; setTimeout(() => done(true, seq.length), 700); return; }
      playerTurn = false; document.getElementById("mg-msg").textContent = "เยี่ยม! ต่อไป..."; next();
    }
  }));
  next();
};

window.Minigames = Minigames;
