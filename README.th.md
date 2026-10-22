<p align="center">
  <img src="frontend/public/og-image.jpg" alt="RentFlow" width="720" />
</p>

<h1 align="center">RentFlow</h1>

<p align="center">
  <strong>แพลตฟอร์มค้นหาหอพักและระบบจัดการหอพักให้เช่าครบวงจร</strong><br/>
  ค้นหาหอพัก ลงประกาศ ออกบิล ตรวจสอบการชำระเงิน และรับแจ้งซ่อม — จบในที่เดียว
</p>

<p align="center">
  <a href="README.md"><strong>🇬🇧 Read in English →</strong></a> &nbsp;|&nbsp; <strong>ภาษาไทย</strong>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img alt="Fastify" src="https://img.shields.io/badge/Fastify-5-000000?logo=fastify&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" />
  <img alt="Redis" src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" />
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" />
</p>

---

## RentFlow คืออะไร?

RentFlow คือ **เว็บแอปพลิเคชันแบบ full-stack สำหรับตลาดหอพักในประเทศไทย** ที่เชื่อมคนสามกลุ่มไว้ในระบบเดียว

- **ผู้เช่า** ค้นหาหอพักใกล้มหาวิทยาลัยหรือที่ทำงาน แล้วจัดการห้องของตัวเองได้: ดูบิล ชำระเงินผ่าน
  PromptPay QR อัปโหลดสลิป และแจ้งซ่อม
- **เจ้าของหอพัก** ลงประกาศและจัดการหอ ห้อง และผู้เช่า ออกบิลรายเดือนพร้อมเลขมิเตอร์ และติดตามการชำระเงิน
  กับงานซ่อมได้ โดยไม่ต้องใช้ Excel หรือกลุ่มแชท
- **แอดมิน** ดูแลตลาดทั้งระบบ: อนุมัติเจ้าของหอและประกาศ จัดการแพ็คเกจและคูปอง และดูรายได้ของแพลตฟอร์ม

โปรเจกต์ครอบคลุมวงจรการเช่าตั้งแต่ต้นจนจบ ตั้งแต่หน้าค้นหาหอพักที่ทำ SEO ไปจนถึงระบบสมาชิกแบบ SaaS
ที่มีแพ็คเกจฟรี ทดลองใช้ ชำระเงินผ่าน PromptPay คูปอง และโควตาการตรวจสลิป

> **เว็บตัวอย่างจริง:** <https://rentflow.duckdns.org> — deployment บน production ที่อ้างอิงใน metadata ของโปรเจกต์

### ภาพรวมโปรเจกต์

| | |
|---|---|
| **ประเภท** | เว็บแอปพลิเคชัน SaaS แบบ full-stack (พอร์ทัลหลายบทบาท + ตลาดสาธารณะ) |
| **อุตสาหกรรม** | อสังหาริมทรัพย์ / ระบบจัดการหอพักให้เช่า |
| **ผู้ใช้งาน** | ผู้เยี่ยมชมทั่วไป, ผู้เช่า, เจ้าของหอพัก, แอดมินแพลตฟอร์ม |
| **Frontend** | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4 |
| **Backend** | Fastify 5 REST API, Prisma ORM, PostgreSQL, Redis + BullMQ |
| **โครงสร้างพื้นฐาน** | Docker Compose, Caddy (HTTPS อัตโนมัติ), Cloudflare R2, OCR microservice ที่โฮสต์เอง |
| **ภาษา** | หน้าจอภาษาไทยเป็นหลัก (IBM Plex Sans Thai) พร้อม metadata ภาษาอังกฤษ |

---

## จุดเด่นของโปรเจกต์

- **แยกประสบการณ์ 4 บทบาท** (สาธารณะ, ผู้เช่า, เจ้าของหอ, แอดมิน) พร้อมการตรวจสิทธิ์ระดับ route
  ทั้งฝั่ง Next.js และ Fastify
- **ระบบคำนวณบิลจริง** — ค่าน้ำแบบมิเตอร์หรือเหมาจ่าย ค่าไฟ ค่าส่วนกลาง ค่าปรับล่าช้า กติกาวันครบกำหนด
  และการเก็บ snapshot ของอัตราค่าใช้จ่ายกับเลขมิเตอร์ไว้ในบิลทุกใบ
- **ขั้นตอนชำระเงินด้วย PromptPay QR** — บิลสร้าง QR จาก PromptPay ID ของเจ้าของหอ ผู้เช่าอัปโหลดสลิป
  แล้วระบบตรวจสอบให้อัตโนมัติ
- **ตรวจสอบอัตโนมัติสองทาง** — ตรวจสลิปด้วย **SlipOK** API และอ่านภาพมิเตอร์น้ำ-ไฟด้วย
  **OCR service ที่โฮสต์เอง** (FastAPI/PaddleOCR) พร้อมค่า confidence และการ flag ให้ตรวจซ้ำ
- **ระบบสมาชิกแบบ SaaS** — แพ็คเกจพร้อมโควตาหอ/ห้อง, การจำกัดฟีเจอร์ OCR, ทดลองใช้ฟรี, คูปอง,
  ชำระเงินผ่าน PromptPay, ใบสั่งซื้อ และรายงานรายได้สำหรับแอดมิน
- **ผู้เช่าเข้าสู่ระบบด้วย QR Code** — เจ้าของหอพิมพ์ QR ประจำห้องได้ (ทีละห้องหรือทั้งชุดเป็น PDF)
  ผู้เช่าสแกนเพื่อเข้าสู่ระบบและผูกกับห้องของตัวเอง
- **พร้อมใช้งานจริงบน production** — Docker image, Caddy reverse proxy พร้อม TLS, คิวอีเมลบน Redis
  แยก worker, สคริปต์ backup/restore ฐานข้อมูล และสคริปต์ deploy ที่ตรวจ health check
- **ความปลอดภัยพื้นฐานครบถ้วน** — แฮชรหัสผ่านด้วย Argon2, access token อายุสั้นพร้อม refresh token,
  ล็อกบัญชีเมื่อล็อกอินผิดหลายครั้ง, rate limiting, Helmet, เก็บ consent ตาม PDPA และรีเซ็ตรหัสผ่านด้วย OTP

---

## ฟีเจอร์

### ผู้เยี่ยมชมทั่วไป
- หน้าแรกพร้อมค้นหาหอพักตาม **สถานที่สำคัญ / มหาวิทยาลัย / ย่าน**
- หน้ารวมและหน้ารายละเอียดหอพัก พร้อมแกลเลอรีรูป ประเภทห้องและราคา แผนที่ ช่องทางติดต่อ และโปรโมชั่น
- รองรับ SEO: `sitemap.ts`, `robots.ts` แบบไดนามิก, metadata รายหน้า และ route สร้าง Open Graph image
- หน้าราคาแพ็คเกจและนโยบายความเป็นส่วนตัว (PDPA)

### ผู้เช่า
- สมัครสมาชิกพร้อมยินยอมนโยบายความเป็นส่วนตัว หรือ **เข้าสู่ระบบด้วยการสแกน QR Code ของห้อง**
- Dashboard แสดงห้องปัจจุบัน ข้อมูลสัญญา และสรุปบิล
- หน้ารวมบิลและรายละเอียดบิล พร้อม PromptPay QR การอัปโหลดสลิป สถานะการชำระเงิน และดาวน์โหลดบิลเป็น PDF
- แจ้งซ่อมพร้อม thread การสนทนา
- ประกาศจากหอพัก และจัดการโปรไฟล์ส่วนตัว

### เจ้าของหอพัก
- สมัครสมาชิกและรอแอดมินอนุมัติ พร้อม **ทดลองใช้ฟรี** ที่ตั้งค่าได้
- จัดการหอพัก: เนื้อหาประกาศ รูปภาพ พิกัดแผนที่ ช่องทางติดต่อ โปรโมชั่น และสถานะการเผยแพร่
- จัดการห้องพัก: ประเภทห้อง (พัดลม / แอร์) ราคาตั้งต้น สถานะ (ว่าง, มีผู้เช่า, ซ่อมบำรุง, ปิดใช้งาน)
- จัดการผู้เช่าและกำหนดห้องพัก
- ออกบิลรายเดือน: เลขมิเตอร์ (หรือเหมาจ่าย) ค่าส่วนกลาง ค่าปรับล่าช้า การเลื่อนวันครบกำหนด bill draft
  และบิลแบบหลายรายการ
- **สแกนมิเตอร์ด้วย OCR** จากรูปภาพ พร้อมตรวจทานทีละหน้าก่อนบันทึกบิล
- ติดตามการชำระเงินด้วยการตรวจสลิปอัตโนมัติ และโควตาตามแพ็คเกจ
- ประกาศ แจ้งซ่อม สร้าง QR Code ประจำห้อง (ทีละห้องหรือทั้งชุดเป็น PDF)
- จัดการแพ็คเกจ: เลือกแพ็คเกจ ส่วนลดตามระยะเวลา ยืนยันทดลองใช้ ชำระเงินผ่าน PromptPay และดูประวัติการเรียกเก็บ

### แอดมินแพลตฟอร์ม
- คิวอนุมัติเจ้าของหอและหอพัก
- จัดการผู้ใช้ รวมถึงบัญชีที่ถูกล็อกจากการล็อกอินผิดซ้ำ
- คัดเลือกหอพักแนะนำ (featured) และจัดการสถานที่สำคัญ (landmark)
- เปิด/ปิดฟีเจอร์ (feature flag) เช่น OCR สำหรับออกบิล
- จัดการแพ็คเกจ คูปอง ใบสั่งซื้อ รายงานรายได้ และบัญชีรับเงินของแพลตฟอร์ม
- เอกสาร API ด้วย Swagger ที่ `/docs` (เฉพาะแอดมิน)

---

## เทคโนโลยีที่ใช้

| ชั้น | เทคโนโลยี |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, TanStack Query, react-hook-form, Framer Motion, Chart.js, Lucide, `next-themes` |
| **Backend** | Node.js 20, Fastify 5, TypeScript, Prisma 6, Zod, Pino, JWT (access + refresh), Argon2, Nodemailer, BullMQ, Puppeteer (PDF), `promptpay-qr`, สร้าง QR Code |
| **ฐานข้อมูล** | PostgreSQL 16 |
| **Cache / คิวงาน** | Redis 7 พร้อม email worker (BullMQ) |
| **ที่เก็บไฟล์** | Cloudflare R2 (รองรับ S3) ด้วย presigned URL และประมวลผลรูปด้วย `sharp` |
| **OCR service** | Python, FastAPI, PaddleOCR (ไทย + อังกฤษ), OpenCV แบบ pool model |
| **ตรวจสอบการชำระเงิน** | SlipOK API และ OCR ที่โฮสต์เองเป็นทางเลือกสำรอง |
| **โครงสร้างพื้นฐาน** | Docker Compose (dev + prod), Caddy 2 reverse proxy พร้อม HTTPS อัตโนมัติ |

---

## สถาปัตยกรรม

```
                          ┌───────────────────────────────┐
   เบราว์เซอร์  ────────▶ │  Caddy  (จัดการ TLS)          │
                          └───────────────┬───────────────┘
                                ┌─────────┴──────────┐
                                ▼                    ▼
                     Next.js frontend         Fastify REST API
                         (:3000)                   (:3001)
                                │                    │
                                │        ┌───────────┼──────────────┬──────────────┐
                                │        ▼           ▼              ▼              ▼
                                │   PostgreSQL     Redis        OCR service    Cloudflare R2
                                │    (Prisma)    (+ BullMQ)   FastAPI/Paddle   (รูปภาพ, สลิป)
                                │                    │            (:8899)
                                │                    ▼
                                │              Email worker
                                └── server-side rendering และ proxy
```

- ฝั่ง Next.js เรนเดอร์ server component และ proxy การเรียก API ผ่าน `/api/*` ด้วย axios client ที่ต่ออายุ token เอง
- API ที่ต้องเข้าสู่ระบบจะตรวจสิทธิ์ (`TENANT`, `OWNER`, `ADMIN`) ด้วย middleware ฝั่ง backend
- งานที่ใช้เวลานาน (ส่งอีเมล) จะถูกส่งเข้า Redis และประมวลผลโดย worker container แยก
- รูปภาพและสลิปเก็บใน object storage โดย API ออก presigned URL สำหรับอัปโหลดและแสดงผล

---

## โครงสร้างโปรเจกต์

```
RentFlow/
├── frontend/                 # แอป Next.js 16
│   ├── app/                  # Route groups: (public), (auth), (tenant), (owner), (admin), api
│   ├── features/             # โมดูลตามโดเมน (dormitory, room, tenant, bill, billing, maintenance, ...)
│   ├── lib/                  # API client, auth helper, UI ที่ใช้ร่วมกัน
│   └── certificates/         # ใบรับรอง HTTPS สำหรับ `next dev --experimental-https`
├── backend/                  # Fastify REST API
│   ├── src/modules/          # admin, auth, bill, billing, dormitory, room, tenant, maintenance, ...
│   ├── src/services/         # storage, mail, ตรวจสลิป, QR
│   ├── src/workers/          # BullMQ email worker
│   ├── prisma/schema.prisma  # โครงสร้างข้อมูล
│   └── docker-entrypoint.sh  # prisma generate + db push + seed ตอนเริ่มระบบ
├── ocr-service/              # Python FastAPI + PaddleOCR microservice
├── scripts/                   # สคริปต์ backup / restore สำหรับ VPS
├── docker-compose.yml        # ชุด development
├── docker-compose.prod.yml   # ชุด production (Caddy, health check, จำกัด resource)
├── deploy.sh                 # pull, backup, rebuild, health check
└── Caddyfile                 # ตั้งค่า reverse proxy / TLS
```

---

## เริ่มต้นใช้งาน (สำหรับนักพัฒนา)

### สิ่งที่ต้องมี

- Docker Engine / Docker Desktop ที่มี **Compose v2**
- Git
- หากจะรัน service เดี่ยวโดยไม่ใช้ Docker: Node.js 20+ (backend และ frontend) หรือ Python 3.10+ (OCR)

### 1. Clone โปรเจกต์

```bash
git clone https://github.com/sharkvortex/RentFlow.git
cd RentFlow
```

### 2. ตั้งค่า environment variables

สร้างไฟล์ `.env` ที่ **root ของโปรเจกต์**

```dotenv
APP_URL=http://localhost:3000
```

สร้าง `backend/.env` (ดูรายการทั้งหมดได้ที่ `backend/.env.example`)

```dotenv
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://rentflow:rentflow@localhost:5432/rentflow

# secrets สำหรับ JWT / encryption — ใช้สตริงสุ่มที่ยาวและคาดเดายาก
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
RESET_SECRET=
ENCRYPTION_KEY=
QR_PEPPER_SECRET=
OTP_PEPPER_SECRET=

# object storage (Cloudflare R2 หรือ S3-compatible)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
S3_BUCKET=

# สร้างตอนเริ่มระบบครั้งแรก
ADMIN_EMAIL=
ADMIN_PASSWORD=

# integration เสริม (ไม่บังคับ)
REDIS_HOST=localhost
REDIS_PORT=6379
SMTP_HOST=
SMTP_PORT=
MAIL_USER=
MAIL_PASS=
SLIPOK_BRANCH_ID=
SLIPOK_API_KEY=
OCR_SERVICE_URL=http://localhost:8899/scan
```

> ตัวแปรที่เป็น integration เสริม (`SMTP_*`, `MAIL_*`, `SLIPOK_*`, `OCR_SERVICE_URL` และ `PLATFORM_*`
> ที่ใช้ในหน้าตั้งค่าของแอดมิน) ปล่อยว่างได้ ฟีเจอร์ที่เกี่ยวข้องจะถูกปิดไว้เท่านั้น ห้าม commit ค่าจริงลง repo

### 3. เริ่มระบบ

```bash
npm run dev          # docker compose up -d --build
npm run dev:logs     # ดู log
npm run dev:down     # หยุดระบบ
```

Docker Compose จะเปิด 6 service:

| Service | Container | URL / port |
|---|---|---|
| Frontend (Next.js) | `rentflow-frontend` | <http://localhost:3000> |
| Backend API (Fastify) | `rentflow-backend` | <http://localhost:3001> ตรวจสถานะที่ `/health` |
| OCR service | `ocr-server` | <http://localhost:8899> |
| PostgreSQL | `rentflow-postgres` | `localhost:5432` |
| Redis | `rentflow-redis` | `localhost:6379` |
| Email worker | `rentflow-worker` | ทำงานเบื้องหลัง |

ตอนเริ่มระบบ entrypoint ของ backend จะรัน `prisma generate`, `prisma db push` และ seed script ซึ่งสร้างบัญชี
แอดมินจาก `ADMIN_EMAIL` / `ADMIN_PASSWORD` สร้าง feature flag ของ OCR และสร้างแพ็คเกจเริ่มต้น จากนั้นเข้า
<http://localhost:3000/auth/login> เพื่อล็อกอินด้วยบัญชีแอดมินนั้น

### 4. รัน service เดี่ยวโดยไม่ใช้ Docker (ไม่บังคับ)

```bash
# Backend (ต้องมี PostgreSQL + Redis รันอยู่)
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev            # seed + API server + email worker

# Frontend
cd frontend
npm install
npm run dev            # https://localhost:3000 (ใช้ self-signed certificate)
```

---

## วิธีใช้งาน RentFlow

### ในฐานะเจ้าของหอพัก

1. **สมัครสมาชิก** ที่ `/auth/register` และยอมรับนโยบายความเป็นส่วนตัว บัญชีจะรอแอดมินอนุมัติ
2. **สร้างหอพัก** ที่เมนู *Owner → Dorms*: ชื่อ รายละเอียด ที่อยู่ พิกัดแผนที่ ช่องทางติดต่อ รูปภาพ
   และโปรโมชั่น (ถ้ามี)
3. **เพิ่มห้องพัก** ระบุประเภท (พัดลม / แอร์) ราคาตั้งต้น และสถานะ
4. **เพิ่มผู้เช่า** และกำหนดให้เข้าพักในห้อง
5. **ตั้งค่าอัตราค่าใช้จ่าย** ในหน้าตั้งค่าหอ: ค่าน้ำ (มิเตอร์หรือเหมาจ่าย) ค่าไฟ ค่าส่วนกลาง ค่าปรับล่าช้า
   และวันครบกำหนดชำระ
6. **สร้างบิลรายเดือน** — กรอกเลขมิเตอร์เอง หรืออัปโหลดรูปมิเตอร์ให้ OCR อ่าน แล้วตรวจทานยอดก่อนบันทึก
7. **แชร์ PromptPay QR** เมื่อผู้เช่าอัปโหลดสลิป ระบบจะตรวจสอบอัตโนมัติและอัปเดตสถานะการชำระเงิน
   (จำนวนการตรวจสลิปขึ้นอยู่กับแพ็คเกจ)
8. **ดูแลงานซ่อม** และประกาศข่าวสารให้ผู้เช่าทุกคน
9. **จัดการแพ็คเกจ** ที่ *Owner → Billing*: เลือกแพ็คเกจ ใช้ส่วนลดตามระยะเวลา ยืนยันทดลองใช้
   และชำระเงินให้แพลตฟอร์มผ่าน PromptPay QR

### ในฐานะผู้เช่า

1. **เข้าสู่ระบบ** ด้วยอีเมลและรหัสผ่าน หรือสแกน QR Code ที่ติดไว้ในห้องพัก
2. เปิด **บิล** เพื่อดูยอดที่ต้องชำระ รายละเอียดค่าใช้จ่าย และ PromptPay QR
3. **ชำระเงินและอัปโหลดสลิป** เจ้าของหอจะเห็นผลการตรวจสอบทันที
4. **แจ้งปัญหา** ที่เมนู *Maintenance* และติดตามการสนทนาใน thread
5. อ่าน **ประกาศ** และตรวจสอบ **สัญญา** กับข้อมูลโปรไฟล์ของตัวเอง

### ในฐานะแอดมิน

1. เข้าสู่ระบบด้วยบัญชีแอดมินที่ seed ไว้
2. อนุมัติ **เจ้าของหอ** และ **หอพัก** ที่รออยู่ในคิวอนุมัติ
3. คัดเลือก **หอพักแนะนำ** และจัดการ **สถานที่สำคัญ (landmark)** ที่ใช้ค้นหาในหน้าสาธารณะ
4. ตั้งค่า **แพ็คเกจ คูปอง การทดลองใช้ บัญชีรับเงิน และ feature flag**
5. ดู **ใบสั่งซื้อ** และ **รายงานรายได้** พร้อมจัดการผู้ใช้หรือบัญชีที่ถูกล็อก
6. เปิด `/docs` เพื่อดู API reference (Swagger) เฉพาะแอดมิน

### แพ็คเกจเริ่มต้น (ค่า default ที่ seed ไว้)

| แพ็คเกจ | ราคา / เดือน | จำนวนหอ | จำนวนห้อง | ตรวจสลิป | OCR มิเตอร์ |
|---|---|---|---|---|---|
| FREE | ฿0 | 1 | — | — | — |
| START | ฿199 | 1 | 20 | 30 ครั้ง / เดือน | — |
| STANDARD | ฿399 | 1 | 40 | ไม่จำกัด | ✓ |
| PRO | ฿699 | 3 | 80 | ไม่จำกัด | ✓ |
| BUSINESS | ฿999 | 6 | 150 | ไม่จำกัด | ✓ |

ส่วนลดตามระยะเวลาที่ seed ไว้คือ **5% (3 เดือน)**, **10% (6 เดือน)** และ **17% (12 เดือน)**
แพ็คเกจ โควตา ราคา คูปอง และระยะเวลาทดลองใช้ แอดมินแก้ไขได้ตลอดเวลาผ่านหน้าแอดมิน

### สคริปต์ที่ใช้บ่อย

| คำสั่ง | รายละเอียด |
|---|---|
| `npm run dev` / `npm run dev:down` / `npm run dev:logs` | ชุด development (Docker) |
| `npm run prod` / `npm run prod:down` / `npm run prod:logs` | ชุด production |
| `npm run prod:test` | ชุด production พร้อม override สำหรับทดสอบในเครื่อง |
| `npm run db:backup` / `npm run db:restore` | dump และ restore PostgreSQL (สคริปต์สำหรับ Windows) |
| `npm run vps:deploy` / `npm run vps:backup` / `npm run vps:restore` | deploy และ backup บน VPS |
| `npm run clean:comments` / `npm run clean:all` | ลบ comment และ format โค้ดทั้งโปรเจกต์ |

---

## การ deploy

Production ใช้ `docker-compose.prod.yml`:

- **Caddy** จัดการ TLS (ออก certificate อัตโนมัติ) proxy ไปยัง frontend และ API พร้อมใส่ security header
- ทุก service มี health check, `no-new-privileges`, ตัด capability, หมุน log และจำกัด memory/CPU
- backend image เป็น multi-stage build ที่ compile ด้วย esbuild ส่วน frontend ใช้ standalone output ของ Next.js

```bash
cp .env.example .env        # ถ้ามีไฟล์นี้ แล้วตั้ง APP_URL=https://your-domain
./deploy.sh                 # pull, backup, rebuild, รอจน healthy
./deploy.sh --skip-backup   # ข้ามการ backup ฐานข้อมูลก่อน deploy
```

`scripts/backup.sh` และ `scripts/restore.sh` ใช้จัดการ dump ฐานข้อมูล PostgreSQL บน VPS

---

## ความปลอดภัยและการคุ้มครองข้อมูล

- รหัสผ่านแฮชด้วย **Argon2** access token อายุสั้นและมี refresh token คู่กัน
- ล็อกบัญชีเมื่อล็อกอินผิดซ้ำ ๆ และมี rate limiting ในแต่ละ route
- ตรวจสิทธิ์ตามบทบาท (`TENANT`, `OWNER`, `ADMIN`) ทั้งที่ API และ middleware ของ Next.js
- เก็บ consent ของนโยบายความเป็นส่วนตัวพร้อมเวลาและเวอร์ชันนโยบาย (รองรับ PDPA)
- สลิปการชำระเงินและรูปหอพักเสิร์ฟผ่าน signed URL ของ object storage ไม่ได้เปิด bucket สาธารณะ
- secrets ทั้งหมดส่งผ่าน environment file และไม่ถูก commit ลง version control

---

## หมายเหตุ

- หน้าจอและ logic หลักเป็นภาษาไทย ส่วนโค้ดและเอกสารนี้เป็นภาษาอังกฤษ
- โปรเจกต์ยังไม่มีชุดทดสอบอัตโนมัติ (automated test suite) — การตรวจสอบทำผ่านการใช้งานจริงและ API
  การเพิ่ม unit/integration test คือก้าวต่อไปที่สำคัญ
- บางฟีเจอร์ต้องใช้ credential ภายนอกจึงจะทำงานเต็มรูปแบบ: อีเมล (SMTP), ตรวจสลิป (SlipOK),
  object storage (R2) และ OCR service

---

<p align="center">
  <a href="README.md"><strong>🇬🇧 Read in English →</strong></a>
</p>
