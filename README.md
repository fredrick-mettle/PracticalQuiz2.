# RentGH — Ghana Rental & Property Finder

A web app for finding houses, apartments, rooms, hostels, land and commercial
property **for rent or sale across all 16 regions of Ghana** — with agent
dashboards, admin moderation, image uploads, maps, inquiries and favorites.
Built phase by phase (12 phases total).

## Tech stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **PostgreSQL** + **Prisma 7** ORM (Rust-free WASM query engine + `pg` driver adapter)
- **NextAuth v4** (credentials provider, JWT sessions, bcrypt-hashed passwords)
- **Cloudinary** signed uploads — Phase 4
- **Leaflet + OpenStreetMap** — Phase 7
- **Zod** validation + **React Hook Form** (auth forms; everywhere from Phase 3)
- **Server Actions** are the standard mutation mechanism (route handlers only
  where the framework requires them, e.g. NextAuth's endpoint)
- Currency: **GHS** (whole cedis). Locations: Ghana regions → city/town → area.

## Quick start

### 1. Install dependencies

```bash
npm install
```

This also generates the Prisma client (`postinstall`).

### 2. Environment variables

```bash
cp .env.example .env
```

Set `DATABASE_URL` (below) and a `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32   # paste the output into .env as NEXTAUTH_SECRET
```

### 3. Start a database (pick ONE)

**Option A — zero install (recommended for local dev):** a real PostgreSQL
server that runs straight from `node_modules` (data in `.local-postgres/`):

```bash
npm run db:local      # keep this running in its own terminal
```

The default `.env.example` `DATABASE_URL` already points at it
(`postgresql://postgres:postgres@localhost:54329/rentgh`).

**Option B — your own PostgreSQL / Neon / Supabase:** set `DATABASE_URL` in
`.env` to your connection string instead.

### 4. Create the schema and seed sample data

```bash
npm run db:migrate    # applies prisma/migrations/*
npm run db:seed       # 1 admin, 2 agents, 1 tenant, 15 properties
```

### 5. Run the app

```bash
npm run dev           # http://localhost:3000
```

### Seed accounts (development only)

| Role   | Email                    | Password      |
| ------ | ------------------------ | ------------- |
| Admin  | admin@rentgh.com         | Password123!  |
| Agent  | kwame.mensah@rentgh.com  | Password123!  |
| Agent  | ama.serwaa@rentgh.com    | Password123!  |
| Tenant | yaw.danso@gmail.com      | Password123!  |

## Authentication & roles

- `TENANT` — browse, save favorites (Phase 9), send inquiries (Phase 8)
- `AGENT` — agent/landlord: manage own listings (Phase 3) and inquiries
- `ADMIN` — moderation and user management (Phase 10)

| Route        | Access            | Notes                                   |
| ------------ | ----------------- | --------------------------------------- |
| `/register`  | Public            | TENANT or AGENT self-registration       |
| `/login`     | Public            | Redirects signed-in users to their home |
| `/profile`   | Any signed-in user|                                         |
| `/dashboard` | AGENT only        | Agent home (listing CRUD in Phase 3)    |
| `/admin`     | ADMIN only        | Admin home (full panel in Phase 10)     |

Protection is layered: `middleware.ts` checks the role embedded in the JWT
(Edge-safe, no DB access), and pages/server actions re-check on the server
via `requireRole()` in `lib/auth-helpers.ts`. After login, admins land on
`/admin`, agents on `/dashboard`, tenants on `/` (or the page they were
trying to visit). Suspended/banned accounts cannot sign in.

## Useful scripts

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Start the Next.js dev server                        |
| `npm run build`     | Production build (type-check + compile)             |
| `npm run start`     | Run the production build                            |
| `npm run lint`      | ESLint                                              |
| `npm run db:local`  | Start the zero-install local PostgreSQL (Option A)  |
| `npm run db:migrate`| Create/apply migrations in development              |
| `npm run db:deploy` | Apply migrations in production                      |
| `npm run db:seed`   | Seed (or re-seed) the development data              |
| `npm run db:generate` | Regenerate the Prisma client                      |
| `npm run db:studio` | Open Prisma Studio (database browser)               |

## project structure

```
app/            Next.js App Router pages/layouts (+ api/auth route)
components/     Shared React components (layout/, auth/)
lib/            prisma.ts (DB client), auth.ts (NextAuth), auth-helpers.ts,
                constants.ts (regions/amenities), utils.ts,
                validations/ (Zod schemas), services/ + actions/ (mutations)
middleware.ts   Role-based route protection
prisma/         schema.prisma, migrations/, seed.ts
prisma.config.ts  Prisma CLI config (datasource URL, seed command)
scripts/        local-db.mjs (embedded Postgres), schema-engine-shim.mjs (see below)
types/          Shared TypeScript types (incl. NextAuth augmentation)
```

## A note on Prisma engines & offline environments

Prisma 7's CLI runs migrations with a native `schema-engine` binary it
downloads from `binaries.prisma.sh`. On machines with normal internet access
everything just works. In **offline / network-restricted environments**
(where that host is unreachable), run migrations through the bundled
WASM-based drop-in replacement instead:

```bash
PRISMA_SCHEMA_ENGINE_BINARY="$(pwd)/scripts/schema-engine-shim.mjs" \
  npx prisma migrate dev
```

`scripts/schema-engine-shim.mjs` speaks the same protocol to the CLI but
executes with Prisma's official `@prisma/schema-engine-wasm` + the Postgres
driver adapter — identical migrations, no binary download. (Client
generation gets the same fallback automatically via
`scripts/prisma-generate.mjs`.)

## Progress

- [x] **Phase 1 — Setup:** scaffold, Tailwind, Prisma schema, first migration, seed
- [x] **Phase 2 — Authentication & roles:** NextAuth credentials, register/login/logout, role-based middleware + navbar
- [ ] Phase 3 — Listing CRUD (agent dashboard)
- [ ] Phase 4 — Image uploads (Cloudinary)
- [ ] Phase 5 — Public browsing & search filters
- [ ] Phase 6 — Property detail page
- [ ] Phase 7 — Maps (Leaflet)
- [ ] Phase 8 — In-app inquiries
- [ ] Phase 9 — Favorites
- [ ] Phase 10 — Admin panel
- [ ] Phase 11 — Security & quality
- [ ] Phase 12 — Deployment

<!-- Screenshots will be added as features land. -->
