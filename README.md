# Nghĩa Phái Art & Design (Miniecom Platform)

A bespoke Gallery, Blog, and E-commerce platform built for a Bát Tràng ceramic artist. Designed with a high-end "Dark Museum" aesthetic to showcase fine-art ceramics, and engineered with a robust modern tech stack for seamless content management and future e-commerce capabilities.

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | Node.js, Express 5, JavaScript |
| **Database** | PostgreSQL 15 |
| **ORM** | Prisma 7 (`@prisma/adapter-pg`) |
| **Auth** | JWT (Dual-Token Access/Refresh Strategy), bcrypt |
| **Frontend & Admin** | Next.js 16 (App Router), React 19 |
| **Styling** | Tailwind CSS v4 |
| **Infrastructure** | Docker Compose (Postgres) |

## Project Structure

```text
├── backend/                  # Express REST API
│   ├── prisma/               # Database schema & migrations
│   ├── routes/, controllers/ # HTTP Layer
│   ├── services/             # Business logic (JWT, Token Rotation, Prisma)
│   └── middlewares/          # Auth, Error handling, Validation
├── frontend-gomsu/           # Next.js Public Site & Admin Dashboard
│   ├── app/                  # Next.js App Router (Public + Admin routes)
│   ├── components/           # Reusable UI (Hero, Gallery, Quote, Navbar)
│   └── lib/                  # API Client, Markdown Parser, Admin Auth
└── project-docs/             # Technical specifications & learning paths
```

## Status & Roadmap

- ✅ **Phase 1: Brand Foundation (COMPLETED)**
  - Dark Museum UI (Hero, Artist Intro, Gallery Grid, Editorial Quotes).
  - Custom CMS for Admin (Dual-Token Auth, Image Uploads).
  - Blog & Gallery infrastructure with Markdown support and SEO optimization.
- 🚧 **Phase 2: E-commerce Core (UP NEXT)**
  - Product Catalog (Ceramics & Artworks).
  - Shopping Cart state management.
  - Checkout flow and order management.

## Getting Started

### 1. Database & Backend
```bash
cd backend
npm install

# Start Postgres database container
docker-compose up -d

# Apply database schema
npx prisma migrate dev

# Start Express server (runs on http://localhost:4000)
npm run dev
```
*(Remember to copy `.env.example` to `.env` if needed).*

### 2. Frontend
```bash
cd frontend-gomsu
npm install

# Start Next.js development server
npm run dev
```
- **Public Site:** `http://localhost:3001`
- **Admin Dashboard:** `http://localhost:3001/admin/login` (Uses JWT Auth)

## API Design Pattern

Every REST endpoint strictly returns a standardized payload to ensure robust frontend parsing:

```json
// Success
{ 
  "data": { ... }, 
  "meta": null, 
  "error": null 
}

// Error
{ 
  "data": null, 
  "meta": null, 
  "error": { 
    "code": "UNAUTHORIZED", 
    "message": "Token expired", 
    "details": null 
  } 
}
```
