/* ============================================================
 * Aetheria RPG — Art / Ambiance
 * โลโก้เกม (SVG), ฉากหลังไตเติล, บรรยากาศต่อโซน — คุมโทนทั้งเกม
 * เวกเตอร์ต้นฉบับทั้งหมด สเกลคมทุกจอ
 * ========================================================== */

const Art = {};

/* โทนสีต่อโซน (ปรับบรรยากาศฉากหลังเวที) */
Art.zoneMood = {
  town:       { a: "#241f45", b: "#0e0c1c", glow: "#6b5cff" },
  field:      { a: "#1f3320", b: "#0a1410", glow: "#5fbf6b" },
  forest:     { a: "#16281c", b: "#070f0a", glow: "#3f8f57" },
  emberpeak:  { a: "#3a1712", b: "#160806", glow: "#ff6a3c" },
  mistfen:    { a: "#182a26", b: "#0a1512", glow: "#57c9a0" },
  frostspire: { a: "#20304a", b: "#0b1220", glow: "#8fc4ff" },
  citadel:    { a: "#241830", b: "#0c0714", glow: "#b061ff" },
  bamboo:     { a: "#1f331f", b: "#0a140a", glow: "#7fd06b" },
  shrine:     { a: "#33261f", b: "#160f0a", glow: "#ff9a5c" },
  cave:       { a: "#241f2e", b: "#0c0a14", glow: "#8f7cc4" },
  coast:      { a: "#1a2c3a", b: "#0a1420", glow: "#5cc4e0" },
};

Art.applyZoneMood = function (mapId) {
  const m = Art.zoneMood[mapId] || Art.zoneMood.town;
  const stage = document.getElementById("world-stage");
  if (stage) {
    stage.style.background =
      `radial-gradient(120% 85% at 50% 28%, ${m.a} 0%, ${m.b} 68%, #050409 100%)`;
    stage.style.setProperty("--zone-glow", m.glow);
  }
};

/* ---------- โลโก้เกม ---------- */
Art.logoSVG = function () {
  return `
<svg viewBox="0 0 340 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="AETHERIA">
  <defs>
    <linearGradient id="lg-gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe6a0"/><stop offset=".5" stop-color="#ffcc55"/><stop offset="1" stop-color="#e0952f"/>
    </linearGradient>
    <linearGradient id="lg-txt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f4ecff"/><stop offset=".55" stop-color="#c9b6ff"/><stop offset="1" stop-color="#8f6dff"/>
    </linearGradient>
    <radialGradient id="lg-glow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#8f6dff" stop-opacity=".55"/><stop offset="1" stop-color="#8f6dff" stop-opacity="0"/>
    </radialGradient>
    <filter id="lg-soft"><feGaussianBlur stdDeviation="1.1"/></filter>
  </defs>
  <ellipse cx="170" cy="52" rx="120" ry="46" fill="url(#lg-glow)"/>
  <!-- มงกุฎ -->
  <g filter="url(#lg-soft)">
    <path d="M132 62 L140 30 L154 50 L170 22 L186 50 L200 30 L208 62 Z" fill="url(#lg-gold)" stroke="#7a5c14" stroke-width="2" stroke-linejoin="round"/>
    <rect x="132" y="60" width="76" height="12" rx="3" fill="url(#lg-gold)" stroke="#7a5c14" stroke-width="2"/>
    <circle cx="140" cy="30" r="4" fill="#c98bff"/><circle cx="170" cy="22" r="5" fill="#8fd4ff"/><circle cx="200" cy="30" r="4" fill="#c98bff"/>
    <circle cx="150" cy="66" r="2.4" fill="#fff8e0"/><circle cx="170" cy="66" r="2.4" fill="#fff8e0"/><circle cx="190" cy="66" r="2.4" fill="#fff8e0"/>
    <!-- รอยร้าว (มงกุฎที่แตกสลาย) -->
    <path d="M170 22 L168 40 L173 52 L169 72" fill="none" stroke="#3a2a08" stroke-width="1.3" opacity=".6"/>
  </g>
  <text x="170" y="112" text-anchor="middle" font-family="'Chakra Petch','Kanit',sans-serif"
        font-size="40" font-weight="700" letter-spacing="7" fill="url(#lg-txt)"
        stroke="#5a3fd6" stroke-width="1">AETHERIA</text>
  <text x="170" y="134" text-anchor="middle" font-family="'Kanit',sans-serif"
        font-size="12" letter-spacing="6" fill="#8f83c4">THE SUNDERED CROWN</text>
</svg>`;
};

/* ---------- ฉากหลังไตเติล ---------- */
Art.titleBgSVG = function () {
  // ดาวสุ่ม
  let stars = "";
  for (let i = 0; i < 60; i++) {
    const x = (Math.random() * 100).toFixed(1), y = (Math.random() * 55).toFixed(1);
    const r = (Math.random() * 1.1 + 0.3).toFixed(2), o = (Math.random() * 0.6 + 0.2).toFixed(2);
    stars += `<circle cx="${x}%" cy="${y}%" r="${r}" fill="#cbd3ff" opacity="${o}"/>`;
  }
  // เสี้ยวมงกุฎลอย
  let shards = "";
  const sc = [["18%", "62%", "#8fd4ff"], ["82%", "40%", "#c98bff"], ["70%", "72%", "#ffcc55"], ["30%", "35%", "#7ee7b0"]];
  sc.forEach(([x, y, c], i) => {
    shards += `<g transform="translate(0,0)" opacity=".9">
      <polygon points="0,-9 6,0 0,9 -6,0" fill="${c}" opacity=".85">
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 -8; 0 0" dur="${4 + i}s" repeatCount="indefinite"/>
      </polygon></g>`.replace('translate(0,0)', `translate(${x.replace('%','')} ${y.replace('%','')})`);
  });
  return `
<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#191338"/><stop offset=".5" stop-color="#241a44"/><stop offset="1" stop-color="#0a0816"/>
    </linearGradient>
    <radialGradient id="moon" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#fdf6e3"/><stop offset=".7" stop-color="#e9d9b8"/><stop offset="1" stop-color="#e9d9b8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="moonglow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#b9a6ff" stop-opacity=".4"/><stop offset="1" stop-color="#b9a6ff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" fill="url(#sky)"/>
  ${stars}
  <circle cx="72" cy="26" r="20" fill="url(#moonglow)"/>
  <circle cx="72" cy="26" r="10" fill="url(#moon)"/>
  <!-- ภูเขาไกล -->
  <polygon points="0,72 14,52 26,66 40,46 55,68 70,50 84,66 100,54 100,100 0,100" fill="#1a1636" opacity=".85"/>
  <polygon points="0,82 18,64 34,78 50,60 66,80 82,64 100,78 100,100 0,100" fill="#120f28"/>
  <polygon points="0,92 22,78 44,90 64,76 84,90 100,82 100,100 0,100" fill="#0b0918"/>
  <!-- หมอก -->
  <rect x="0" y="70" width="100" height="30" fill="#6b5cff" opacity=".05"/>
  ${shards}
</svg>`;
};

Art.mount = function () {
  const lw = document.getElementById("logo-wrap");
  if (lw) lw.innerHTML = Art.logoSVG();
  const tb = document.getElementById("title-bg");
  if (tb) tb.innerHTML = Art.titleBgSVG();
};

window.Art = Art;
