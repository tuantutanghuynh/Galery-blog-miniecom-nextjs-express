# Miniecom — White-Label Gallery, Blog & Ecommerce Platform

A single Express/Prisma backend powering multiple independent storefronts through a **white-label clone architecture**: one shared data model and API serve completely different businesses, while each frontend is its own Next.js app, free to diverge in branding, theme, and page structure.

Currently:
- **`frontend-gomsu`** — "Nghĩa Phái", a Bát Tràng ceramic art brand. Dark Museum aesthetic, actively developed (Blog & Gallery phase, real content live).
- **`frontend-petshop`** — a pet shop storefront. Scaffolded from the same base, paused while the ceramics vertical ships first.

## Why one backend, many frontends

Rather than a multi-tenant SaaS (one shared UI, configured per tenant), this project clones the frontend per business and keeps the backend generic. The `Category` model supports a parent/child tree plus `CategoryAttribute`/`CategoryAttributeValue` (an EAV pattern), so unrelated product types — ceramic vases, pet food — can be modeled without schema changes. Each frontend scopes every query to its own `BRAND_CATEGORY_SLUG` constant (`lib/brand.js`), so both storefronts safely share one Postgres database without leaking each other's content, even through the shared admin endpoints.

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | Node.js, Express 5, JavaScript |
| **Database** | PostgreSQL 15 |
| **ORM** | Prisma 7 (`@prisma/adapter-pg`) |
| **Auth** | JWT (access + refresh, rotation + reuse detection), bcrypt |
| **Frontend** | Next.js 16 (App Router), React 19 |
| **Styling** | Tailwind CSS v4 (design tokens defined per frontend) |
| **Infrastructure** | Docker Compose (Postgres) |

## Project Structure

```text
├── backend/                  # Shared Express REST API — used by every frontend
│   ├── prisma/                # Database schema & migrations
│   ├── routes/, controllers/  # HTTP layer
│   ├── services/               # Business logic (JWT, token rotation, Prisma client)
│   └── middlewares/            # Auth, error handling, validation
├── frontend-gomsu/            # "Nghĩa Phái" ceramic art storefront + admin (active)
│   ├── app/                    # Next.js App Router (public routes + /admin)
│   ├── components/             # Dark Museum UI (Hero, Gallery, Navbar...)
│   └── lib/                    # API client, brand.js (category scope), admin auth
├── frontend-petshop/          # Pet shop storefront (scaffolded, not yet themed)
└── project-docs/              # Specs, architecture notes, learning index
```

## Status & Roadmap

- ✅ **Phase 1 — Blog & Gallery per business**
  - Shared backend: auth, categories with dynamic attributes, blog, gallery, image upload.
  - `frontend-gomsu` themed ("Dark Museum"), Blog + Gallery live with real content, admin CMS (create/edit/delete for posts and gallery items).
  - `frontend-petshop` cloned from the same base, not yet themed or populated.
- 🚧 **Phase 2 — Ecommerce core (shared, up next)**
  - Product catalog, cart, checkout — built once on the shared backend, then enabled per frontend.
- ⏳ **Later** — theme `frontend-petshop`, deploy both storefronts to their own domains.

## Getting Started

### 1. Backend (shared — start this once, no matter which frontend you run)

```bash
cd backend
npm install

# Start Postgres
docker compose up -d

# Apply the database schema
npx prisma migrate dev

# Start the API (http://localhost:4000, mounted under /api/v1)
npm run dev
```

Copy `.env.example` to `.env` first and fill in real secrets.

### 2. A frontend — pick one

```bash
cd frontend-gomsu   # or frontend-petshop
npm install
npm run dev
```

- `frontend-gomsu` → `http://localhost:3001` (admin: `/admin/login`)
- `frontend-petshop` → `http://localhost:3000`

Both can run at the same time against the same backend — CORS allows multiple origins via `FRONTEND_URLS` in `backend/.env`.

## API Response Format

Every endpoint returns the same envelope, regardless of which frontend calls it:

```json
// Success
{ "data": { ... }, "meta": null, "error": null }

// Error
{ "data": null, "meta": null, "error": { "code": "UNAUTHORIZED", "message": "Token expired", "details": null } }
```
