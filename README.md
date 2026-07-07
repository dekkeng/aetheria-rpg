# Aetheria RPG

เกม RPG เล่นบนเบราว์เซอร์ พร้อมระบบสมัคร/เข้าสู่ระบบ, เซฟบนคลาวด์, ประวัติการเล่น
และมัลติเพลเยอร์แบบเรียลไทม์ (WebSocket) — เสิร์ฟทั้งเกมและ API จาก Node.js เซิร์ฟเวอร์เดียว

## รันบนเครื่อง (Local)

```bash
npm install
npm start          # เปิด http://localhost:3000
```

ค่าเริ่มต้นใช้ **SQLite** (ไฟล์ `server/aetheria.db`) ไม่ต้องตั้งอะไรเพิ่ม
ต้องใช้ **Node.js >= 22.5** (ใช้ `node:sqlite`)

## Deploy บน Railway

1. สร้าง project ใหม่ใน Railway แล้วเลือก **Deploy from GitHub repo** ชี้มาที่ repo นี้
2. เพิ่ม **PostgreSQL** ให้ service (Railway จะตั้ง `DATABASE_URL` ให้อัตโนมัติ) —
   เมื่อมี `DATABASE_URL` แอปจะสลับมาใช้ Postgres เอง ถ้าไม่มีจะ fallback เป็น SQLite
   (แต่ SQLite บน Railway เป็น ephemeral ข้อมูลหายเมื่อ redeploy — **แนะนำให้ใช้ Postgres**)
3. ตั้ง Environment Variables:

   | ตัวแปร | จำเป็น | คำอธิบาย |
   |--------|:------:|----------|
   | `JWT_SECRET` | ✅ | คีย์ลับสำหรับเซ็น token — ตั้งเป็นสตริงสุ่มยาวๆ |
   | `DATABASE_URL` | อัตโนมัติ | Railway ตั้งให้เมื่อ add Postgres |
   | `PORT` | อัตโนมัติ | Railway ตั้งให้เอง |

Railway อ่านค่า build/start จาก [`railway.json`](railway.json):
build ด้วย Nixpacks, start ด้วย `npm start`, health check ที่ `/api/health`

## โครงสร้าง

- `index.html`, `src/`, `assets/` — ตัวเกมฝั่ง client (static)
- `server/` — Express + WebSocket, auth, cloud save, ประวัติการเล่น
- `server/db.js` — abstraction เลือก Postgres/SQLite อัตโนมัติ
