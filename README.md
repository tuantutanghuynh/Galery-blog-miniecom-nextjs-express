# Miniecom — Blog & Gallery + Ecommerce Platform

A multi-vertical ecommerce platform (pet food, cosmetics, household, FMCG) built with a
Node.js/Express REST API and a Next.js storefront. Current focus: Blog & Gallery with
SEO-optimized, mobile-friendly pages, deployed early to start accumulating traffic before
the full storefront (cart, checkout, payments) ships.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Node.js, Express 5, JavaScript |
| Database | PostgreSQL 15 |
| ORM | Prisma 7 (driver adapter `@prisma/adapter-pg`) |
| Auth | JWT (access + refresh), bcrypt |
| Validation | express-validator |
| File upload | multer |
| Frontend | Next.js (App Router) |
| Dev environment | Docker Compose (Postgres) |

## Project Structure

```
backend/          Express REST API
  app.js, bin/www          Express app bootstrap
  config/                  Environment config
  prisma/                  Database schema & migrations
  services/                Business logic (Prisma client, JWT, tokens...)
  controllers/, routes/    HTTP layer
  middlewares/             Auth, error handling, validation
storefront/        Next.js public site + admin (in progress)
project-docs/       Implementation plan / progress notes
```

## Getting Started (backend)

```bash
cd backend
npm install

# Start Postgres locally
docker compose up -d

# Apply database migrations
npx prisma migrate dev

# Run the dev server
npm run dev
```

The API runs at `http://localhost:4000`, mounted under `/api/v1`. Copy `.env.example` to
`.env` and fill in real secrets before running.

## API Response Format

Every endpoint returns a consistent shape:

```json
// Success
{ "data": {}, "meta": null, "error": null }

// Error
{ "data": null, "meta": null, "error": { "code": "SOME_CODE", "message": "...", "details": null } }
```

## Status

- ✅ Project setup, Docker Postgres, Prisma
- ✅ Core catalog schema (users, categories, products)
- ✅ Standard middleware (error handling, response format, validation)
- 🚧 Auth (JWT), Blog & Gallery, Next.js storefront, deploy

See `project-docs/` for the detailed implementation plan.

## License

Educational project.
