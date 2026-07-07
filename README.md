# Aetheria RPG

เกม RPG เล่นบนเบราว์เซอร์ พร้อมระบบสมัคร/เข้าสู่ระบบ, เซฟบนคลาวด์, ประวัติการเล่น
และมัลติเพลเยอร์แบบเรียลไทม์ (WebSocket) — เสิร์ฟทั้งเกมและ API จาก Node.js เซิร์ฟเวอร์เดียว

## รันบนเครื่อง (Local)

```bash
npm install
cp .env.example .env   # แล้วเติมค่าใน .env (อย่างน้อย JWT_SECRET; ใส่ DATABASE_URL ถ้าจะใช้ Postgres)
npm start              # เปิด http://localhost:3000
```

`npm start` จะโหลดไฟล์ `.env` ให้อัตโนมัติ (ผ่าน `dotenv`)
ต้องใช้ **Node.js >= 22.5**

### เลือกฐานข้อมูล
- **PostgreSQL** (แนะนำ) — ตั้ง `DATABASE_URL` ใน `.env` แล้วแอปจะบันทึกข้อมูลบน Postgres
- **SQLite** — ถ้าไม่ตั้ง `DATABASE_URL` จะ fallback เป็นไฟล์ `server/aetheria.db` (สะดวกตอน dev)

## Environment Variables

| ตัวแปร | จำเป็น | คำอธิบาย |
|--------|:------:|----------|
| `DATABASE_URL` | แนะนำ | connection string ของ PostgreSQL — ถ้ามีจะใช้ Postgres, ไม่มีจะ fallback เป็น SQLite |
| `DATABASE_SSL` | ไม่ | ตั้ง `true` เมื่อต่อ Postgres ภายนอกที่บังคับ SSL (public URL ของ Railway/Neon/Supabase) |
| `JWT_SECRET` | ✅ | คีย์ลับสำหรับเซ็น token — ตั้งเป็นสตริงสุ่มยาว ๆ |
| `PORT` | ไม่ | พอร์ตเซิร์ฟเวอร์ (Railway ตั้งให้อัตโนมัติ) |

ดูตัวอย่างครบทุกตัวใน [`.env.example`](.env.example)

## Deploy บน Railway

1. สร้าง project ใหม่ใน Railway แล้วเลือก **Deploy from GitHub repo** ชี้มาที่ repo นี้
2. เพิ่ม **PostgreSQL** ให้ service (Railway จะตั้ง `DATABASE_URL` ให้อัตโนมัติ) —
   เมื่อมี `DATABASE_URL` แอปจะสลับมาใช้ Postgres เอง ถ้าไม่มีจะ fallback เป็น SQLite
   (แต่ SQLite บน Railway เป็น ephemeral ข้อมูลหายเมื่อ redeploy — **แนะนำให้ใช้ Postgres**)
3. ตั้ง Environment Variable **`JWT_SECRET`** (จำเป็น) เป็นสตริงสุ่มยาว ๆ
   ส่วน `DATABASE_URL` และ `PORT` Railway จะตั้งให้อัตโนมัติ
   (ถ้า Postgres เป็นแบบ public/ต้องใช้ SSL ให้เพิ่ม `DATABASE_SSL=true`)

Railway อ่านค่า build/start จาก [`railway.json`](railway.json):
build ด้วย Nixpacks, start ด้วย `npm start`, health check ที่ `/api/health`

## โครงสร้าง

- `index.html`, `src/`, `assets/` — ตัวเกมฝั่ง client (static)
- `server/` — Express + WebSocket, auth, cloud save, ประวัติการเล่น
- `server/db.js` — abstraction เลือก Postgres/SQLite อัตโนมัติ
