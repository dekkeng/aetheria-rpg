/* ============================================================
 * Aetheria RPG — Frontend Auth + Cloud Save Client
 * เชื่อมกับ backend: สมัคร/เข้าสู่ระบบ, เซฟบนคลาวด์, ประวัติการเล่น
 * ถ้าต่อ backend ไม่ได้ -> ทำงานแบบออฟไลน์ (localStorage) ต่อได้
 * ========================================================== */

const Auth = {
  token: null,
  user: null,
  online: false,        // backend ใช้งานได้ไหม
  base: "",             // API base (same-origin)
};

const TOKEN_KEY = "aetheria_token";

Auth.headers = function (json) {
  const h = {};
  if (json) h["Content-Type"] = "application/json";
  if (Auth.token) h["Authorization"] = "Bearer " + Auth.token;
  return h;
};

Auth.api = async function (path, opts) {
  opts = opts || {};
  const res = await fetch(Auth.base + "/api" + path, {
    method: opts.method || "GET",
    headers: Auth.headers(!!opts.body),
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) throw new Error((data && data.error) || "เกิดข้อผิดพลาด");
  return data;
};

/* ตรวจว่ามี backend ไหม + กู้เซสชันจาก token ที่เก็บไว้ */
Auth.init = async function () {
  try {
    const h = await fetch(Auth.base + "/api/health");
    Auth.online = h.ok;
  } catch (e) { Auth.online = false; }
  if (!Auth.online) return;

  const saved = localStorage.getItem(TOKEN_KEY);
  if (saved) {
    Auth.token = saved;
    try {
      const me = await Auth.api("/me");
      Auth.user = me.user;
    } catch (e) {
      Auth.token = null;
      localStorage.removeItem(TOKEN_KEY);
    }
  }
};

Auth.register = async function (username, password) {
  const d = await Auth.api("/register", { method: "POST", body: { username, password } });
  Auth.token = d.token; Auth.user = d.user;
  localStorage.setItem(TOKEN_KEY, d.token);
  return d.user;
};

Auth.login = async function (username, password) {
  const d = await Auth.api("/login", { method: "POST", body: { username, password } });
  Auth.token = d.token; Auth.user = d.user;
  localStorage.setItem(TOKEN_KEY, d.token);
  return d.user;
};

Auth.logout = function () {
  Auth.token = null; Auth.user = null;
  localStorage.removeItem(TOKEN_KEY);
};

Auth.isLoggedIn = function () { return !!Auth.user; };

/* ---------- cloud save ---------- */
Auth.cloudSave = async function (data) {
  if (!Auth.isLoggedIn()) return false;
  await Auth.api("/save", { method: "PUT", body: { data } });
  return true;
};
Auth.cloudLoad = async function () {
  if (!Auth.isLoggedIn()) return null;
  try {
    const d = await Auth.api("/save");
    return d.data;
  } catch (e) { return null; }
};

/* ---------- play history ---------- */
Auth.log = async function (event, detail) {
  if (!Auth.isLoggedIn()) return;
  try { await Auth.api("/history", { method: "POST", body: { event, detail: detail || null } }); }
  catch (e) {}
};
Auth.history = async function (limit) {
  if (!Auth.isLoggedIn()) return [];
  try {
    const d = await Auth.api("/history?limit=" + (limit || 30));
    return d.events || [];
  } catch (e) { return []; }
};

window.Auth = Auth;
