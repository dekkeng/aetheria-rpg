/* ============================================================
 * Aetheria RPG — Database Abstraction
 * ใช้ PostgreSQL ถ้ามี DATABASE_URL, ไม่งั้น fallback เป็น SQLite (ไฟล์ local)
 * เปิดเผย interface แบบ async เหมือนกันทั้งสองฝั่ง
 * ========================================================== */
const path = require("path");

const USE_PG = !!process.env.DATABASE_URL;
let impl;

/* ---------------- PostgreSQL ---------------- */
function makePg() {
  let Pool;
  try {
    Pool = require("pg").Pool;
  } catch (e) {
    console.error("[db] ตั้ง DATABASE_URL ไว้แต่ยังไม่ได้ติดตั้ง 'pg' — รัน: npm install pg");
    process.exit(1);
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // เปิด SSL เมื่อต่อ Postgres ภายนอก (เช่น public URL ของ Railway/Neon/Supabase)
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  return {
    kind: "postgres",
    async init() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS saves (
          user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS history (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          event TEXT NOT NULL,
          detail JSONB,
          created_at TIMESTAMPTZ DEFAULT now()
        );
      `);
    },
    async createUser(username, hash) {
      const r = await pool.query(
        "INSERT INTO users(username, password_hash) VALUES($1,$2) RETURNING id, username, created_at",
        [username, hash]
      );
      return r.rows[0];
    },
    async getUserByName(username) {
      const r = await pool.query("SELECT * FROM users WHERE username=$1", [username]);
      return r.rows[0] || null;
    },
    async getUserById(id) {
      const r = await pool.query("SELECT id, username, created_at FROM users WHERE id=$1", [id]);
      return r.rows[0] || null;
    },
    async upsertSave(userId, dataObj) {
      await pool.query(
        `INSERT INTO saves(user_id, data, updated_at) VALUES($1,$2,now())
         ON CONFLICT (user_id) DO UPDATE SET data=$2, updated_at=now()`,
        [userId, dataObj]
      );
    },
    async getSave(userId) {
      const r = await pool.query("SELECT data, updated_at FROM saves WHERE user_id=$1", [userId]);
      return r.rows[0] || null;
    },
    async addHistory(userId, event, detailObj) {
      await pool.query(
        "INSERT INTO history(user_id, event, detail) VALUES($1,$2,$3)",
        [userId, event, detailObj]
      );
    },
    async getHistory(userId, limit) {
      const r = await pool.query(
        "SELECT event, detail, created_at FROM history WHERE user_id=$1 ORDER BY id DESC LIMIT $2",
        [userId, limit]
      );
      return r.rows;
    },
  };
}

/* ---------------- SQLite (node:sqlite) ---------------- */
function makeSqlite() {
  const { DatabaseSync } = require("node:sqlite");
  const file = process.env.SQLITE_FILE || path.join(__dirname, "aetheria.db");
  const db = new DatabaseSync(file);

  return {
    kind: "sqlite",
    file,
    async init() {
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS saves (
          user_id INTEGER PRIMARY KEY,
          data TEXT NOT NULL,
          updated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          event TEXT NOT NULL,
          detail TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `);
    },
    async createUser(username, hash) {
      const r = db.prepare("INSERT INTO users(username, password_hash) VALUES(?,?)").run(username, hash);
      return db.prepare("SELECT id, username, created_at FROM users WHERE id=?").get(r.lastInsertRowid);
    },
    async getUserByName(username) {
      return db.prepare("SELECT * FROM users WHERE username=?").get(username) || null;
    },
    async getUserById(id) {
      return db.prepare("SELECT id, username, created_at FROM users WHERE id=?").get(id) || null;
    },
    async upsertSave(userId, dataObj) {
      const str = JSON.stringify(dataObj);
      db.prepare(
        `INSERT INTO saves(user_id, data, updated_at) VALUES(?,?,datetime('now'))
         ON CONFLICT(user_id) DO UPDATE SET data=excluded.data, updated_at=datetime('now')`
      ).run(userId, str);
    },
    async getSave(userId) {
      const row = db.prepare("SELECT data, updated_at FROM saves WHERE user_id=?").get(userId);
      if (!row) return null;
      return { data: JSON.parse(row.data), updated_at: row.updated_at };
    },
    async addHistory(userId, event, detailObj) {
      db.prepare("INSERT INTO history(user_id, event, detail) VALUES(?,?,?)")
        .run(userId, event, detailObj == null ? null : JSON.stringify(detailObj));
    },
    async getHistory(userId, limit) {
      const rows = db.prepare(
        "SELECT event, detail, created_at FROM history WHERE user_id=? ORDER BY id DESC LIMIT ?"
      ).all(userId, limit);
      return rows.map((r) => ({
        event: r.event,
        detail: r.detail ? JSON.parse(r.detail) : null,
        created_at: r.created_at,
      }));
    },
  };
}

impl = USE_PG ? makePg() : makeSqlite();
module.exports = impl;
