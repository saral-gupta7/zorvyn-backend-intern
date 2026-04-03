# Zorvyn Finance API

A role-based finance dashboard backend built with Bun, Elysia, PostgreSQL (Neon), and Drizzle ORM. Built as part of a backend internship assignment.

Live API: https://finapi.srlgpta.xyz
API Docs: https://finapi.srlgpta.xyz/swagger

---

## Stack & Why

| Tool            | Reason                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bun**         | Faster runtime than Node.js, native password hashing via `Bun.password`, no extra bcrypt dependency                                         |
| **Elysia**      | Built for Bun, first-class TypeScript support, built-in TypeBox validation, clean plugin/middleware system                                  |
| **PostgreSQL**  | Financial data is relational by nature — transactions belong to users, aggregations are SQL's strength. Mongo would be the wrong tool here. |
| **Drizzle ORM** | Lightweight, schema-first, keeps SQL close to the surface. Chosen over Prisma because it doesn't abstract away what's happening underneath. |
| **Neon**        | Serverless Postgres — no infra to manage, free tier sufficient for this project                                                             |
| **Docker**      | Single command local setup and consistent deployment environment                                                                            |
| **Caddy**       | Automatic HTTPS, minimal config, already running on the VPS                                                                                 |

---

## Architecture

```
src/
  db/
    schema/         ← Drizzle table definitions (users, transactions, refresh_tokens)
    index.ts        ← DB client singleton
    seed.ts         ← Seed script with sample data
    migrations/     ← Auto-generated migration files
  modules/
    auth/           ← JWT login/register, password hashing
    users/          ← User management (admin only)
    transactions/   ← Financial records CRUD + filtering
    dashboard/      ← Analytics and summary endpoints
  middlewares/
    auth.middleware.ts   ← JWT verification, attaches user to context
    rbac.middleware.ts   ← Role guard factory
  utils/
    responses.ts    ← Shared error handler
  app.ts            ← App assembly (plugins, middleware, routes)
  index.ts          ← Server entry point
```

Separation of concerns is strict — routes handle HTTP, services handle business logic, middlewares handle cross-cutting concerns. No business logic lives in route handlers.

---

## Role & Permission Model

| Action                   | Viewer | Analyst | Admin |
| ------------------------ | ------ | ------- | ----- |
| Login / Register         | ✅     | ✅      | ✅    |
| GET /users/me            | ✅     | ✅      | ✅    |
| GET /users               | ❌     | ❌      | ✅    |
| GET /users/:id           | ❌     | ❌      | ✅    |
| PATCH /users/:id         | ❌     | ❌      | ✅    |
| DELETE /users/:id        | ❌     | ❌      | ✅    |
| GET /transactions        | ❌     | ✅      | ✅    |
| GET /transactions/:id    | ❌     | ✅      | ✅    |
| POST /transactions       | ❌     | ❌      | ✅    |
| PATCH /transactions/:id  | ❌     | ❌      | ✅    |
| DELETE /transactions/:id | ❌     | ❌      | ✅    |
| GET /dashboard/\*        | ❌     | ✅      | ✅    |

RBAC is enforced at the middleware level via `requireRole(...roles)` — a plugin factory that verifies the JWT and checks the user's role before the route handler runs.

---

## Security Measures

| Measure                       | Implementation                                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Password hashing**          | `Bun.password.hash()` — Argon2id algorithm, built into Bun runtime                                              |
| **JWT authentication**        | Short-lived access tokens (1h) signed with HS256 via `@elysiajs/jwt`                                            |
| **Role-based access control** | `requireRole()` middleware applied per route group                                                              |
| **Rate limiting**             | 100 requests/min globally via `elysia-rate-limit`, returns 429                                                  |
| **Security headers**          | `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy` on all responses             |
| **CORS**                      | Restricted to deployment domain in production, open in development                                              |
| **Input validation**          | TypeBox schemas on all request bodies and query params, returns 422 on invalid input                            |
| **Generic auth errors**       | Login returns `"Invalid email or password"` for both wrong email and wrong password — prevents user enumeration |

---

## Quick Start

**Requirements:** Bun, Docker, a Neon database URL

```bash
# 1. Clone
git clone https://github.com/srlgpta/zorvyn-backend-intern.git
cd zorvyn-backend-intern

# 2. Set up environment
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, PORT, NODE_ENV

# 3. Run migrations and seed
bun install
bun db:generate
bun db:migrate
bun db:seed

# 4. Start the server
bun run dev

# Or with Docker
docker compose up -d --build
```

**Seed credentials:**

| Role    | Email               | Password  |
| ------- | ------------------- | --------- |
| Admin   | something@gmail.com | 123423525 |
| Analyst | someone@gmail.com   | 123423525 |
| Viewer  | somebody@gmail.com  | 123423525 |

---

## API Reference

Full interactive docs available at `/swagger`.

### Auth

```
POST /auth/register   Create a new user
POST /auth/login      Login and receive JWT
```

### Users

```
GET    /users         Paginated user list (admin)
GET    /users/me      Own profile (any authenticated user)
GET    /users/:id     Single user (admin)
PATCH  /users/:id     Update role/status/username (admin)
DELETE /users/:id     Delete user (admin)
```

### Transactions

```
GET    /transactions         Paginated + filtered list (analyst, admin)
POST   /transactions         Create transaction (admin)
GET    /transactions/:id     Single transaction (analyst, admin)
PATCH  /transactions/:id     Update transaction (admin)
DELETE /transactions/:id     Delete transaction (admin)
```

**Filter params:** `?type=income|expense`, `?category=food`, `?from=2024-01-01`, `?to=2024-12-31`, `?sortBy=date|amount|created_at`, `?order=asc|desc`, `?page=1`, `?limit=10`

### Dashboard

```
GET /dashboard/summary       Total income, expenses, net balance, count
GET /dashboard/by-category   Per-category income and expense breakdown
GET /dashboard/trends        Monthly trends for last N months (?months=6)
GET /dashboard/recent        Last N transactions (?limit=5)
```

---

## Assumptions & Decisions

- **No soft delete on transactions** — financial records are a source of truth. Deleting them, even softly, undermines auditability. Hard delete is intentional.
- **`user_id` from JWT, not request body** — when creating a transaction, the user is identified from the verified JWT payload, not from a client-supplied field. This prevents users from creating records on behalf of others.
- **Role is assigned at registration** — in a real system this would be admin-only. For this assignment, role can be passed during registration for easier testing.
- **Refresh tokens stored in DB** — allows revocation. Not fully wired into the auth flow for this submission but the table and structure are in place.
- **Single access token approach** — returning JWT in response body rather than cookies for simplicity and easier API testing.

---

## Tradeoffs & What I'd Add With More Time

- **Refresh token rotation** — the `refresh_tokens` table exists but the full refresh flow isn't wired up yet
- **Viewer transaction access** — viewers currently can't see any transactions. A natural next step would be scoping their access to only their own records
- **Audit log** — a separate table tracking who changed what and when, important for a real finance system
- **Integration tests** — at minimum, happy path + auth failure tests for each module
- **Tighter rate limits on auth routes** — currently global rate limit applies everywhere equally

