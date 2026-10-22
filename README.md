<p align="center">
  <img src="frontend/public/og-image.jpg" alt="RentFlow" width="720" />
</p>

<h1 align="center">RentFlow</h1>

<p align="center">
  <strong>Dormitory discovery and end-to-end rental management platform.</strong><br/>
  Find a dorm, publish listings, bill tenants, verify payments and handle maintenance — all in one place.
</p>

<p align="center">
  <strong>English</strong> &nbsp;|&nbsp; <a href="README.th.md"><strong>🇹🇭 อ่านภาษาไทย →</strong></a>
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

## What is RentFlow?

RentFlow is a **full-stack web application for the Thai dormitory (หอพัก) rental market**. It connects
three groups in one system:

- **Tenants** search for a dorm near their university or workplace, then manage their own room: view bills,
  pay by PromptPay QR, upload a payment slip, and file maintenance requests.
- **Dorm owners** publish and manage listings, rooms and tenants, issue monthly bills with meter readings,
  and track payments and maintenance — without spreadsheets or chat groups.
- **Admins** moderate the marketplace: approve owners and listings, manage subscription plans and coupons,
  and monitor platform revenue.

The project covers the entire rental lifecycle, from public SEO-friendly listing pages to a paid SaaS
subscription model (free tier, trials, PromptPay checkout, coupons and slip quotas).

> **Live demo:** <https://rentflow.duckdns.org> — the production deployment referenced in the project's metadata.

### Project at a glance

| | |
|---|---|
| **Type** | Full-stack SaaS web application (multi-role portal + public marketplace) |
| **Domain** | Real estate / rental property management (Thai dormitories) |
| **Users** | Public visitors, tenants, dorm owners, platform admins |
| **Frontend** | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4 |
| **Backend** | Fastify 5 REST API, Prisma ORM, PostgreSQL, Redis + BullMQ |
| **Infrastructure** | Docker Compose, Caddy (automatic HTTPS), Cloudflare R2 storage, self-hosted OCR microservice |
| **Language** | Thai-first UI (IBM Plex Sans Thai), with English metadata |

---

## Highlights

- **Four separate role experiences** (public, tenant, owner, admin) with route-level authorization on both
  the Next.js and the Fastify side.
- **Real billing engine** — metered or flat-rate water, electricity, common fees, late fees, due-day rules,
  and immutable snapshots of rates and meter readings on every bill.
- **PromptPay QR payment flow** — bills render a QR from the owner's PromptPay ID; tenants upload a slip and
  the system verifies it automatically.
- **Automated verification on two fronts** — the hosted **SlipOK** API checks payment slips, while a
  **self-hosted PaddleOCR service** (FastAPI) reads water/electricity meter photos, with confidence
  thresholds and manual-review flags.
- **Subscription SaaS layer** — plans with room/dorm quotas, OCR gating, free trial, coupons, PromptPay
  checkout, billing orders, and admin revenue reports.
- **QR-code tenant onboarding** — owners print per-room QR codes (single or bulk PDF); tenants scan to log in
  and bind to their room instead of remembering credentials.
- **Production-oriented operations** — Docker images, Caddy reverse proxy with TLS, Redis-backed email queue
  with a separate worker, database backup/restore scripts, and a deploy script with health checks.
- **Security basics done right** — Argon2 password hashing, short-lived access tokens with refresh tokens,
  login-attempt lockout, rate limiting, Helmet headers, encrypted PDPA consent tracking, and OTP-based
  password reset.

---

## Features

### Public visitors
- Landing page with search by **landmark / university / area**
- Dorm listing and detail pages with photo gallery, room types and prices, map location, contact channels
  and promotions
- SEO support: dynamic `sitemap.ts`, `robots.ts`, per-page metadata, and a generated Open Graph image route
- Public pricing page and privacy policy (PDPA)

### Tenants
- Account registration with privacy consent, or **login by scanning the room QR code**
- Dashboard with current room, contract details and bill summary
- Bill list and bill detail with PromptPay QR, slip upload, payment status and a downloadable PDF copy of each bill
- Maintenance requests with a message thread
- Dorm announcements and personal profile management

### Dorm owners
- Registration and admin approval flow with a configurable **free trial**
- Dormitory management: listing content, images, map coordinates, contacts, promotions, publishing state
- Room management: room type (fan / air), base price, status (available, occupied, maintenance, disabled)
- Tenant management and room assignment
- Monthly billing: meter readings (or flat rate), common fee, late fee, due-day offset, bill drafts, and
  multi-item bills
- **OCR meter scanning** from a photo, with page-by-page review before the bill is saved
- Payment tracking with automatic slip verification and usage quotas per plan
- Announcements, maintenance queue, QR-code generation for rooms (single or bulk PDF)
- Subscription management: plan selection, duration discounts, trial confirmation, PromptPay checkout,
  billing history

### Platform admins
- Owner and dormitory approval queue
- User management, including locked accounts from repeated failed logins
- Featured listing curation and landmark management
- Feature flags (for example enabling/disabling OCR billing)
- Subscription plans, coupons, billing orders, revenue reports and platform payment settings
- Role-protected Swagger API documentation at `/docs`

---

## Tech stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, TanStack Query, react-hook-form, Framer Motion, Chart.js, Lucide icons, `next-themes` |
| **Backend** | Node.js 20, Fastify 5, TypeScript, Prisma 6, Zod, Pino, JWT (access + refresh), Argon2, Nodemailer, BullMQ, Puppeteer (PDF), `promptpay-qr`, QR generation |
| **Database** | PostgreSQL 16 |
| **Cache / queue** | Redis 7 with a BullMQ email worker |
| **Storage** | Cloudflare R2 (S3-compatible) with presigned URLs and `sharp` image processing |
| **OCR service** | Python, FastAPI, PaddleOCR (Thai + English), OpenCV, with a pooled-model design |
| **Payment verification** | SlipOK API (hosted) and a self-hosted OCR fallback |
| **Infrastructure** | Docker Compose (dev + prod), Caddy 2 reverse proxy with automatic HTTPS |

---

## Architecture

```
                          ┌───────────────────────────────┐
   Browser  ────────────▶ │  Caddy  (TLS termination)     │
                          └───────────────┬───────────────┘
                                ┌─────────┴──────────┐
                                ▼                    ▼
                     Next.js frontend         Fastify REST API
                         (:3000)                   (:3001)
                                │                    │
                                │        ┌───────────┼──────────────┬──────────────┐
                                │        ▼           ▼              ▼              ▼
                                │   PostgreSQL     Redis        OCR service    Cloudflare R2
                                │    (Prisma)    (+ BullMQ)   FastAPI/Paddle   (images, slips)
                                │                    │            (:8899)
                                │                    ▼
                                │              Email worker
                                └── server-side rendering & proxying
```

- The Next.js app renders server components and proxies API calls through `/api/*` using a refresh-token
  aware axios client.
- Authenticated API responses are role-checked (`TENANT`, `OWNER`, `ADMIN`) by middleware on the backend.
- Long-running work (email delivery) is pushed to Redis and consumed by a dedicated worker container.
- Images and payment slips live in object storage; the API issues presigned URLs for upload and display.

---

## Repository structure

```
RentFlow/
├── frontend/                 # Next.js 16 application
│   ├── app/                  # Route groups: (public), (auth), (tenant), (owner), (admin), api
│   ├── features/             # Domain modules (dormitory, room, tenant, bill, billing, maintenance, ...)
│   ├── lib/                  # API client, auth helpers, shared UI
│   └── certificates/         # Local HTTPS certificates for `next dev --experimental-https`
├── backend/                  # Fastify REST API
│   ├── src/modules/          # admin, auth, bill, billing, dormitory, room, tenant, maintenance, ...
│   ├── src/services/         # storage, mail, slip verification, QR
│   ├── src/workers/          # BullMQ email worker
│   ├── prisma/schema.prisma  # Data model
│   └── docker-entrypoint.sh  # prisma generate + db push + seed on start
├── ocr-service/              # Python FastAPI + PaddleOCR microservice
├── scripts/                  # Backup / restore helpers for the VPS
├── docker-compose.yml        # Development stack
├── docker-compose.prod.yml   # Production stack (Caddy, health checks, resource limits)
├── deploy.sh                 # Pull, back up, rebuild, health-check
└── Caddyfile                 # Reverse proxy / TLS configuration
```

---

## Getting started

### Prerequisites

- Docker Engine / Docker Desktop with **Compose v2**
- Git
- For running a single service outside Docker: Node.js 20+ (backend and frontend) or Python 3.10+ (OCR)

### 1. Clone the project

```bash
git clone https://github.com/sharkvortex/RentFlow.git
cd RentFlow
```

### 2. Configure environment variables

Create a `.env` in the **repository root**:

```dotenv
APP_URL=http://localhost:3000
```

Create `backend/.env` (see `backend/.env.example` for the full list):

```dotenv
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://rentflow:rentflow@localhost:5432/rentflow

# JWT / encryption secrets — use long random strings
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
RESET_SECRET=
ENCRYPTION_KEY=
QR_PEPPER_SECRET=
OTP_PEPPER_SECRET=

# Object storage (Cloudflare R2 / any S3-compatible endpoint)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
S3_BUCKET=

# Seeded on first start
ADMIN_EMAIL=
ADMIN_PASSWORD=

# Optional integrations
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

> Optional and integration-only variables (`SMTP_*`, `MAIL_*`, `SLIPOK_*`, `OCR_SERVICE_URL`, and the
> `PLATFORM_*` payment account used by the admin settings page) can be left empty; the related features
> simply stay disabled. Never commit real secrets.

### 3. Start the stack

```bash
npm run dev          # docker compose up -d --build
npm run dev:logs     # follow logs
npm run dev:down     # stop
```

Docker Compose starts six services:

| Service | Container | URL / port |
|---|---|---|
| Frontend (Next.js) | `rentflow-frontend` | <http://localhost:3000> |
| Backend API (Fastify) | `rentflow-backend` | <http://localhost:3001>, health at `/health` |
| OCR service | `ocr-server` | <http://localhost:8899> |
| PostgreSQL | `rentflow-postgres` | `localhost:5432` |
| Redis | `rentflow-redis` | `localhost:6379` |
| Email worker | `rentflow-worker` | background process |

On startup the backend entrypoint runs `prisma generate`, `prisma db push`, and the seed script, which
creates the admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, the OCR feature flag, and the default
subscription plans. Log in as that admin at <http://localhost:3000/auth/login>.

### 4. Running services without Docker (optional)

```bash
# Backend (needs PostgreSQL + Redis running)
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev            # seed + API server + email worker

# Frontend
cd frontend
npm install
npm run dev            # https://localhost:3000 (self-signed certificate)
```

---

## How to use RentFlow

### As a dorm owner

1. **Register** at `/auth/register` and accept the privacy notice. The account waits for admin approval.
2. **Create a dormitory** under *Owner → Dorms*: name, description, address, map location, contacts,
   photos and optional promotions.
3. **Add rooms** with type (fan / air), base price and status.
4. **Add tenants** and assign them to rooms.
5. **Set billing rates** in the dorm settings: water (metered or flat), electricity, common fee, late fee,
   and the due day.
6. **Create a monthly bill** — type in meter readings, or upload a meter photo to let OCR read it, then
   review the calculated amounts before saving.
7. **Share the PromptPay QR**; when a tenant uploads a slip, RentFlow verifies it automatically and updates
   the payment status. Slip checks are limited by the subscription plan.
8. **Handle maintenance requests** and post announcements to all tenants.
9. **Manage the subscription** under *Owner → Billing*: choose a plan, apply a duration discount, confirm
   the trial, and pay the platform by PromptPay QR.

### As a tenant

1. **Log in** with an email and password, or scan the QR code posted in your room.
2. Open **Bills** to see the current amount, the itemized breakdown and the PromptPay QR.
3. **Pay and upload the slip**; the owner sees the verification result immediately.
4. **Report a problem** from *Maintenance* and follow the conversation in the thread.
5. Read **announcements** and check your **contract** and profile details.

### As an admin

1. Sign in with the seeded admin account.
2. Approve pending **owners** and **dormitories** from the approval queue.
3. Curate **featured** listings and **landmarks** used by public search.
4. Configure **plans, coupons, trial settings, payment account and feature flags**.
5. Review **billing orders** and **revenue reports**, and manage users or locked accounts.
6. Open `/docs` for the Swagger API reference (admin-only).

### Subscription plans (seeded defaults)

| Plan | Price / month | Dorms | Rooms | Slip verification | OCR metering |
|---|---|---|---|---|---|
| FREE | ฿0 | 1 | — | — | — |
| START | ฿199 | 1 | 20 | 30 / month | — |
| STANDARD | ฿399 | 1 | 40 | Unlimited | ✓ |
| PRO | ฿699 | 3 | 80 | Unlimited | ✓ |
| BUSINESS | ฿999 | 6 | 150 | Unlimited | ✓ |

Multi-month discounts are seeded at **5% (3 months)**, **10% (6 months)** and **17% (12 months)**.
Plans, quotas, prices, coupons and trial length are all editable by admins at runtime.

### Available scripts

| Command | Description |
|---|---|
| `npm run dev` / `npm run dev:down` / `npm run dev:logs` | Development stack (Docker) |
| `npm run prod` / `npm run prod:down` / `npm run prod:logs` | Production stack |
| `npm run prod:test` | Production stack with local overrides |
| `npm run db:backup` / `npm run db:restore` | PostgreSQL dump and restore (Windows helper scripts) |
| `npm run vps:deploy` / `npm run vps:backup` / `npm run vps:restore` | VPS deploy and backup scripts |
| `npm run clean:comments` / `npm run clean:all` | Strip comments and format the codebase |

---

## Deployment

Production uses `docker-compose.prod.yml`:

- **Caddy** terminates TLS (automatic certificates), proxies to the frontend and API, and enforces security
  headers.
- Every service has health checks, `no-new-privileges`, dropped capabilities, log rotation and memory/CPU
  limits.
- The backend image is a multi-stage build compiled with esbuild; the frontend uses Next.js standalone output.

```bash
cp .env.example .env        # if present, then set APP_URL=https://your-domain
./deploy.sh                 # pull, back up, rebuild, wait for healthy
./deploy.sh --skip-backup   # skip the pre-deploy database backup
```

`scripts/backup.sh` and `scripts/restore.sh` handle PostgreSQL dumps for the VPS.

---

## Security & data protection

- Passwords hashed with **Argon2**; access tokens are short-lived and paired with refresh tokens.
- Account lockout after repeated failed logins, plus per-route rate limiting.
- Route-level role guards (`TENANT`, `OWNER`, `ADMIN`) on the API and middleware checks in Next.js.
- Privacy consent is recorded with a timestamp and policy version (PDPA-friendly).
- Payment slips and dorm photos are served via signed object-storage URLs, not public buckets.
- Secrets are supplied through environment files and are excluded from version control.

---

## Notes

- The UI and domain logic are Thai-first; the codebase and this documentation are in English.
- There is no automated test suite in the repository yet — verification is done through the running app and
  API. Adding unit/integration tests is the main next step.
- Some features need external credentials to work fully: email (SMTP), slip verification (SlipOK),
  object storage (R2), and the OCR service.

---

<p align="center">
  <a href="README.th.md"><strong>🇹🇭 อ่าน README ภาษาไทย →</strong></a>
</p>
