<div align="center">

<img src="frontend-gomsu/public/images/logo-nghia-phai-gom-su-bat-trang-v2.png" alt="Nghĩa Phái logo" width="96" />

# Nghĩa Phái — Bát Tràng Ceramic Art Platform

**A production storefront, CMS and lead-to-sale system for a Vietnamese ceramic artist,<br/>built on a white-label Express + Next.js architecture.**

[![Live site](https://img.shields.io/badge/live-www.nghiaphai.com-c8a97e?style=for-the-badge)](https://www.nghiaphai.com)

![Next.js](https://img.shields.io/badge/Next.js_16-000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232a?logo=react&logoColor=61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_7-2d3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169e1?logo=postgresql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_v4-06b6d4?logo=tailwindcss&logoColor=white)
![Vitest](https://img.shields.io/badge/tests-123_passing-6e9f18?logo=vitest&logoColor=white)
![Sentry](https://img.shields.io/badge/Sentry-monitored-362d59?logo=sentry&logoColor=white)

<br/>

<img src="assets/screenshots/home-hero.jpg" alt="Nghĩa Phái homepage" width="100%" />

</div>

---

## Overview

**Nghĩa Phái** is the online home of sculptor and ceramic artist Nguyễn Đức Nghĩa from Bát Tràng, Vietnam's
historic pottery village. It is a real business site, running in production on its own domain:

- a **"Dark Museum" storefront** that presents each piece like an exhibit, not a catalogue row;
- a **content engine** (blog + gallery) built for Google and AI search from the first commit;
- a **lead-to-sale workflow**: visitors request a consultation, staff call back, and the admin records the
  real negotiated price so revenue and conversion stats stay honest;
- an **admin workspace** with inline visual editing, so the artist updates the site without touching code.

Underneath sits a **white-label backend**: one Express API and one PostgreSQL schema that can serve several
independent brands, each with its own Next.js frontend.

> [!NOTE]
> Online checkout exists in the codebase but is deliberately **switched off**. Hand-made art is usually
> negotiated, shipped carefully and paid on trust, so the production flow is *consultation first*. The cart,
> stock reservation and VNPay code is parked on its own branch until the money logic has been fully audited.

---

## ✨ Highlights

<table>
<tr>
<td width="50%" valign="top">

### 🏺 Lead-to-sale instead of checkout
- Prices are **always re-read from the database**. A client that posts `price: 1` gets the real price.
- Every request stores a **snapshot** of name, variant, image and price, so later catalogue edits never
  rewrite history.
- Staff record the **real closing amount** (after bargaining and shipping), which feeds revenue, average
  order value and conversion rate.
- Only **active products of the current brand** can be requested, and Vietnamese phone numbers are validated.
- Honeypot field plus a per-IP rate limit keep bots out of the call list.

</td>
<td width="50%" valign="top">

### 🔐 Auth that survives real attacks
- Short-lived JWT access tokens plus **rotating refresh tokens with reuse detection**: replaying a stolen
  token revokes every session of that user.
- Rotation is **atomic**, so five parallel refreshes with one token yield exactly one new session.
- Password reset tokens are **hashed, single-use and expire after one hour**; a reset **signs out every old
  session**.
- **No account enumeration**: login, "forgot password" and reset all answer the same way for known and
  unknown emails.
- Brute-force protection counts **only failed logins**, so real users are never locked out.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🔎 Built for Google *and* AI search
- Server-rendered pages with per-page titles, descriptions and **canonical URLs** from one source of truth.
- **JSON-LD** for `LocalBusiness`, `Product` / `AggregateOffer`, `BlogPosting` and `BreadcrumbList`,
  escaped against script injection.
- **Dynamic sitemap** fed by the API (real `lastModified`, active products only), `robots.txt`, and an
  `llms.txt` route for AI crawlers.
- Unfinished pages are `noindex`; the old `.vercel.app` address **308-redirects** to the real domain.

</td>
<td width="50%" valign="top">

### 🎨 Edit the site where you see it
- Logged-in admins hover any key image on the **public** site and get a **"Đổi ảnh"** (change image)
  button. Upload goes to Cloudinary and the page refreshes in place.
- Rich-text blog editor (Quill) with server-side **HTML sanitising** on save.
- Category-driven **dynamic product specs** (height, weight, firing temperature…) defined per category,
  no schema change needed.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🧪 Tests that found real bugs
- **123 API tests** (Vitest + Supertest) against a disposable local Postgres.
- A **safety gate** refuses to run unless the database is local *and* named `*test*`, and blanks every
  outbound credential (SMTP, Resend, Sentry), so a test can never touch production.
- The suite walks each endpoint from the happy path to the worst case: boundaries, wrong types, IDOR,
  mass assignment, races, rate limits, Vietnamese text and emoji.
- It surfaced **11 real defects** (signup and token races, enumeration, missing brute-force limit,
  500s on bad input…), all fixed with the tests kept as regression guards.

</td>
<td width="50%" valign="top">

### 🏗️ Production-grade plumbing
- **Sentry** error reporting with cookies, headers, bodies and user data scrubbed before sending.
- Transactional email through **Resend's HTTPS API**, because the host blocks outbound SMTP; sending is
  fire-and-forget so response time never reveals whether an account exists.
- Every list endpoint shares one **pagination parser** (clamps bad input, caps page size) and a stable
  `id` tie-breaker.
- A background worker **prunes expired refresh tokens** every six hours.
- `helmet`, CORS allow-list, body-size limits, `trust proxy` for correct per-IP limits behind the load balancer.

</td>
</tr>
</table>

---

## 📸 Tour

### The storefront

<table>
<tr>
<td width="50%"><img src="assets/screenshots/gallery.jpg" alt="Gallery" /><p align="center"><b>Gallery</b> — works filtered by category</p></td>
<td width="50%"><img src="assets/screenshots/products.jpg" alt="Products" /><p align="center"><b>Products</b> — category tabs, server-rendered</p></td>
</tr>
</table>

<details open>
<summary><b>Product page</b> — gallery, variants, trust badges, specs and the story behind the piece</summary>
<br/>
<img src="assets/screenshots/product-detail.jpg" alt="Product detail page" />
</details>

<table>
<tr>
<td width="50%"><img src="assets/screenshots/blog-post.jpg" alt="Blog post" /><p align="center"><b>Blog post</b> — long-form, with author box and structured data</p></td>
<td width="50%"><img src="assets/screenshots/about.jpg" alt="About the artist" /><p align="center"><b>About</b> — the artist's exhibitions and awards</p></td>
</tr>
</table>

<details>
<summary><b>Full homepage</b></summary>
<br/>
<img src="assets/screenshots/home-full.jpg" alt="Full homepage" />
</details>

<details>
<summary><b>Blog index, contact and sign-in</b></summary>
<br/>
<img src="assets/screenshots/blog.jpg" alt="Blog index" />
<img src="assets/screenshots/contact.jpg" alt="Contact page" />
<img src="assets/screenshots/login.jpg" alt="Sign-in page" />
</details>

### From interest to a phone call

<table>
<tr>
<td width="50%"><img src="assets/screenshots/quote-request.jpg" alt="Consultation request" /><p align="center"><b>1. Customer</b> — picks pieces and leaves a phone number, no account needed</p></td>
<td width="50%"><img src="assets/screenshots/admin-quotes.jpg" alt="Admin quote list" /><p align="center"><b>2. Staff</b> — call list with live revenue and conversion stats</p></td>
</tr>
<tr>
<td colspan="2"><img src="assets/screenshots/admin-quote-detail.jpg" alt="Closing a deal" /><p align="center"><b>3. Close the deal</b> — record the real negotiated amount; it feeds the stats</p></td>
</tr>
</table>

### On every screen size

<table>
<tr>
<td width="33%"><img src="assets/screenshots/mobile-home.jpg" alt="Mobile homepage" /></td>
<td width="33%"><img src="assets/screenshots/mobile-product.jpg" alt="Mobile product page" /></td>
<td width="33%"><img src="assets/screenshots/mobile-blog-post.jpg" alt="Mobile blog post" /></td>
</tr>
</table>

### The admin workspace

<p align="center"><img src="assets/screenshots/inline-edit.jpg" alt="Inline image editing" /><br/><b>Inline visual editing</b> — the admin sees a "Đổi ảnh" button right on the public page</p>

<table>
<tr>
<td width="50%"><img src="assets/screenshots/admin-post-edit.jpg" alt="Blog editor" /><p align="center"><b>Blog editor</b> — rich text, scheduling, thumbnail</p></td>
<td width="50%"><img src="assets/screenshots/admin-product-edit.jpg" alt="Product editor" /><p align="center"><b>Product editor</b> — dynamic specs, variants, stock, images</p></td>
</tr>
<tr>
<td width="50%"><img src="assets/screenshots/admin-gallery.jpg" alt="Gallery manager" /><p align="center"><b>Gallery manager</b></p></td>
<td width="50%"><img src="assets/screenshots/admin-categories.jpg" alt="Categories" /><p align="center"><b>Categories</b> — each defines its own product specs</p></td>
</tr>
<tr>
<td width="50%"><img src="assets/screenshots/admin-contacts.jpg" alt="Contact inbox" /><p align="center"><b>Contact inbox</b></p></td>
<td width="50%"><img src="assets/screenshots/admin-settings.jpg" alt="Settings" /><p align="center"><b>Settings</b> — shared product specs, password change</p></td>
</tr>
</table>

<sub>Public pages are captured from the live site. Admin screens are captured from a local copy of the same
public content, with **fictional customers** so that no real personal data appears here.</sub>

---

## 🧭 Architecture

```mermaid
flowchart LR
    subgraph Vercel
        FE["frontend-gomsu<br/>Next.js 16 · App Router<br/>SSR pages + admin SPA"]
    end
    subgraph Render
        API["backend<br/>Express 5 · TypeScript<br/>REST /api/v1"]
        W["pruneRefreshTokens<br/>worker (6h)"]
    end
    DB[("PostgreSQL<br/>Supabase<br/>Prisma 7")]
    CDN["Cloudinary<br/>images"]
    MAIL["Resend<br/>email"]
    SEN["Sentry<br/>errors"]

    U((Visitor)) --> FE
    A((Admin)) --> FE
    FE -- "fetch + X-Brand-Slug" --> API
    API --> DB
    W --> DB
    API --> CDN
    API --> MAIL
    API --> SEN
```

**One backend, many brands.** Every request carries an `X-Brand-Slug` header. The `resolveBrand` middleware
turns it into the brand's root category plus its sub-categories, and every query is scoped to that set, so
two storefronts can share one database without ever seeing each other's products, posts or leads. Brands are
categories, and product specs are defined per category (an EAV pattern), so a ceramics shop and a pet shop fit
the same schema without migrations.

### How a consultation request flows

```mermaid
sequenceDiagram
    participant C as Customer
    participant FE as Next.js
    participant API as Express
    participant DB as PostgreSQL
    participant M as Resend

    C->>FE: Add pieces (stored in localStorage only)
    C->>FE: Name, phone, address
    FE->>API: POST /quote-requests (variant ids + quantities)
    API->>API: Rate limit · honeypot · type & phone checks
    API->>DB: Load active variants of THIS brand, real prices
    API->>DB: Save request with an item snapshot
    API-->>FE: 201 { id, createdAt }
    API--)M: Notify shop + confirm to customer (fire-and-forget)
    Note over API,DB: Later: staff mark CONTACTED → CLOSED with the real amount
```

---

## 🛠️ Tech stack

| Layer | Choices |
|---|---|
| **Frontend** | Next.js 16 (App Router, Server Components), React 19, TypeScript strict, Tailwind CSS v4, Quill 2 |
| **Backend** | Node.js, Express 5, TypeScript strict, express-validator, express-rate-limit, helmet, sanitize-html |
| **Data** | PostgreSQL (Supabase in production), Prisma 7 with the `pg` driver adapter |
| **Auth** | JWT access tokens + hashed, rotating refresh tokens, bcrypt |
| **Media & mail** | Cloudinary (uploads), Resend HTTPS API (with SMTP fallback for local use) |
| **Quality** | Vitest, Supertest, `tsc --noEmit` in both apps, Sentry |
| **Hosting** | Vercel (frontend), Render (API), Mắt Bão DNS for `nghiaphai.com` |

---

## 📁 Project structure

```text
.
├── backend/                     Express REST API shared by every brand
│   ├── bin/www.ts               Entry point: Sentry, HTTP server, background worker
│   ├── app.ts                   Middleware chain: helmet, CORS, rate limit, routes, error handler
│   ├── routes/                  auth, products, blog, gallery, categories, quote-requests, contact, settings, upload…
│   ├── controllers/             Request handlers
│   ├── services/                Prisma client, JWT, refresh-token rotation, mail + templates
│   ├── middlewares/             authenticate, requireRole, resolveBrand, validate, errorHandler
│   ├── utils/                   Pagination parser, HTML sanitiser, rate-limit factory, ApiError
│   ├── workers/                 Refresh-token pruning
│   ├── prisma/schema.prisma     Data model
│   └── test/                    API test suite, safety gate, helpers
├── frontend-gomsu/              "Nghĩa Phái" storefront + admin (Next.js)
│   ├── app/                     Public routes, /admin, /auth, sitemap, robots, llms.txt
│   ├── components/              home, product, contact, layout, admin, ui (incl. inline image editing)
│   └── lib/                     API client, auth, quote list, JSON-LD, site URL, contact info
├── assets/screenshots/          Images used in this README
└── project-docs/                Architecture notes and design write-ups
```

---

## 🚀 Getting started

**Requirements:** Node.js 22+, PostgreSQL 15+ (or Docker).

### 1. Backend

```bash
cd backend
npm install
docker compose up -d            # optional: Postgres on localhost:5434
cp .env.example .env            # then fill in the values below
npx prisma generate
npm run db:push                 # create the tables
npx tsx scripts/seedAdmin.ts you@example.com 'YourStrong#Pass1'   # first admin
npm run dev                     # http://localhost:4000
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | PostgreSQL connection (pooled and direct) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SALT` | Token signing secrets |
| `FRONTEND_URLS` | Comma-separated CORS allow-list |
| `FRONTEND_URL` | Base URL used in password-reset links |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image uploads |
| `RESEND_API_KEY`, `MAIL_FROM` | Email in production (optional locally: links are printed to the log) |
| `SHOP_NOTIFY_EMAIL`, `SHOP_PHONE` | Where new leads are sent, and the phone shown to customers |
| `SENTRY_DSN` | Error reporting (optional) |

### 2. Frontend

```bash
cd frontend-gomsu
npm install
```

Create `frontend-gomsu/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_BACKEND_ORIGIN=http://localhost:4000
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

```bash
npm run dev                     # http://localhost:3001
```

> [!IMPORTANT]
> Build with `npm run build` (it passes `--webpack`). A bare `next build` uses Turbopack, which currently
> crashes on this project's `globals.css`.

### 3. Tests

The suite needs its own local database. The safety gate in `backend/test/setup.ts` refuses anything that is
not on `localhost` with `test` in its name.

```bash
createdb miniecom_test
# backend/.env.test
# DATABASE_URL="postgresql://<user>@localhost:5432/miniecom_test"
# DIRECT_URL="postgresql://<user>@localhost:5432/miniecom_test"
cd backend
set -a; . ./.env.test; set +a; npx prisma db push
npm test                        # 123 tests
```

---

## 🗺️ Status & roadmap

- ✅ Storefront, blog, gallery and artist pages live at [www.nghiaphai.com](https://www.nghiaphai.com)
- ✅ Consultation-request sales flow with revenue and conversion stats
- ✅ Admin CMS with inline visual editing
- ✅ Email, error monitoring, SEO / structured data, custom domain
- ✅ API test suite for auth and consultation requests
- 🔜 Pagination UI on blog and gallery as content grows
- 🔜 Real content for the Workshop, Art and Projects sections
- 🧊 Online checkout (cart, stock reservation, VNPay), parked until the payment logic is fully audited
- 🧊 A second brand on the same backend, each brand in its own repository and database

---

<div align="center">
<sub>Nghĩa Phái · Hơi thở đất — Dáng hình thời gian · Bát Tràng, Gia Lâm, Hà Nội</sub>
</div>
