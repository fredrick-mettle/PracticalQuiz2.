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
| `/dashboard` | AGENT only        | Agent home: own listings, status tabs   |
| `/dashboard/properties/new` | AGENT only | Create listing (→ PENDING review)       |
| `/dashboard/properties/[id]/edit` | AGENT (owner) only | Edit own listing + photos; 404 if not yours |
| `/admin`     | ADMIN only        | Admin home (full panel in Phase 10)     |

Protection is layered: `middleware.ts` checks the role embedded in the JWT
(Edge-safe, no DB access), and pages/server actions re-check on the server
via `requireRole()` in `lib/auth-helpers.ts`. After login, admins land on
`/admin`, agents on `/dashboard`, tenants on `/` (or the page they were
trying to visit). Suspended/banned accounts cannot sign in.

## Agent listing management (Phase 3)

Agents manage their properties from `/dashboard`: a paginated list of their
own listings with status filter tabs (All / Approved / Pending review /
Rejected / Rented or Sold) and title search. Create/edit use a shared form
(`components/properties/property-form.tsx`) validated by one Zod schema
(`lib/validations/property.ts`) on both client and server; mutations are
Server Actions over `lib/services/properties.ts`.

**Ownership is enforced on the server for every operation** — all queries are
scoped by `ownerId`, there is no code path that updates or deletes by
property id alone, and opening another agent's edit page returns **404**
(not 403) so listing existence isn't leaked.

**Status policy** — agents never set their own status:

| Action | Result |
| ------ | ------ |
| Create listing | Always `PENDING` (status isn't in the form schema; forced server-side) |
| Edit a PENDING listing | Status unchanged |
| Edit an APPROVED listing | Back to `PENDING` for re-moderation (since Phase 10 — photo changes don't trigger this) |
| Edit a REJECTED listing | Resubmitted: back to `PENDING`, rejection reason cleared |
| "Mark as rented/sold" | Only from `APPROVED` → `RENTED_OR_SOLD` |
| "Relist" | `RENTED_OR_SOLD` → `PENDING` (must pass moderation again) |
| Delete | Removes the property; images/favorites/inquiries cascade in the DB |

Notable validation rules: price in whole GHS (₵1–₵100,000,000); SALE
listings must use the one-off price period and RENT listings per month/year;
coordinates, when given, must come as a pair inside Ghana's bounding box
(map pin picker arrives in Phase 7); LAND can't have bedrooms/bathrooms;
amenities are limited to the canonical list in `lib/constants.ts`.

## Image uploads (Phase 4)

Listings can have up to **10 photos** (JPG/PNG/WebP, max 5MB each), managed
from the Photos section of the edit page — the first photo is the cover.
Uploads are **signed and direct**: the server issues a short-lived
Cloudinary signature (`lib/cloudinary.ts`), the browser uploads straight to
Cloudinary (nothing passes through our server), and the result is only
saved after the server verifies Cloudinary's own response signature, cloud
name and folder (`rentgh/properties`). Deleting a photo or listing also
deletes the file from Cloudinary (best-effort — the database stays the
source of truth).

**Enable uploads** (takes ~2 minutes, free tier is plenty):

1. Create an account at [cloudinary.com](https://cloudinary.com) and open
   **Console → Settings → API Keys**.
2. Put the three values in `.env` (they stay server-side — never commit them):

   ```bash
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="123456789012345"
   CLOUDINARY_API_SECRET="your-secret"
   ```

3. Restart the dev server. Without these keys the app still runs — the
   Photos section shows a "not configured" notice and existing photos can
   still be reordered or removed.

## Public browsing & search (Phase 5)

The home page (`/`) is the real storefront now: hero with the search bar,
featured listings (most photos, then newest), browse-by-region cards and
live counts. `/properties` is the results page — keyword (title/city/area),
region, city, type, rent/sale, price range and minimum-bedrooms filters,
three sort orders, removable filter chips, and pagination (12 per page).
The same search bar component is reused on both pages and navigates with
shareable URL parameters.

**Only APPROVED listings are ever public** — every query in
`lib/services/public-properties.ts` hard-codes `status: "APPROVED"`, so
pending, rejected and rented/sold properties can't leak. URL parameters
are treated as untrusted: `lib/validations/search.ts` validates and
coerces them, silently dropping anything invalid (unknown regions,
non-numeric prices; out-of-range pages redirect to the last page) instead
of erroring the page.

Cards link to `/properties/[id]` — the detail page arrives in Phase 6.

## Property detail page (Phase 6)

`/properties/[id]` shows one listing: photo gallery (arrows, counter,
thumbnails), key-details grid, description, amenities, a location box
(Google Maps link when coordinates exist; the Leaflet map arrives in
Phase 7), and a sticky sidebar with the price and the agent's contact
card — the phone number stays masked until "Show phone number" is
clicked, then Call/WhatsApp actions appear, next to anti-scam safety
tips. Similar properties (same city + rent/sale, then region, then
type) close the page, and title/OpenGraph metadata is generated per
property. Only APPROVED listings resolve; pending/rejected/rented ids
404 exactly like nonexistent ones.

**Sandbox note:** if your dev environment has no outbound internet, the
Next.js image optimizer can't fetch remote photos server-side and
images appear broken. Set `NEXT_IMAGE_UNOPTIMIZED=1` in `.env` so
browsers load them directly — never set it in production.

## Maps (Phase 7)

Leaflet + OpenStreetMap (no API key needed), loaded lazily in the browser:

- **Detail page** — a pin at the property's coordinates (scroll-zoom
  unlocks on click so the map never traps page scrolling) with an
  "Open in Google Maps" link alongside.
- **Search** — Grid ⇄ Map toggle on `/properties` (`?view=map`): every
  matching APPROVED listing that has coordinates becomes a price-pill
  pin (capped at 100); click one for a mini card linking to the detail
  page. The header notes how many matches have no pin yet.
- **Listing form** — a click/drag pin picker with "Use my current
  location", synced both ways with the numeric latitude/longitude
  fields, which stay validated to Ghana's bounding box.

Markers are pure-CSS pins (`divIcon`s) to dodge Leaflet's fragile
default marker images, and all popup text is HTML-escaped. Map tiles
load browser-side, so maps work even in offline dev sandboxes.

## Inquiries & email (Phase 8)

Signed-in users send inquiries from the property page (guests are asked
to log in; the owner sees a link to their inbox instead). Both sides
get threaded inboxes: tenants at `/inquiries`, agents at
`/dashboard/inquiries` with New/Read/Replied/Closed tabs, an unread
badge on the dashboard, and close/reopen. There is one open thread per
tenant+property — sending again continues the conversation rather than
spamming new ones. Status tracks the agent's attention (a tenant reply
flips it back to New), and only the two participants can ever see a
thread — everyone else gets a 404.

Email notifications (new inquiry + every reply) go through
[Resend](https://resend.com). Add both keys to `.env` and restart to
enable — without them, sends are logged no-ops and everything else
works:

```bash
RESEND_API_KEY="re_..."
EMAIL_FROM="RentGH <noreply@yourdomain.com>"
```

Resend's free tier only delivers to your own account email until you
verify a domain — fine for development.

**Migration note:** `CLOSED` was added to `InquiryStatus` in
`20261025230000_add_closed_inquiry_status`. In this offline sandbox the
migration file was authored by hand and applied with `migrate deploy`
(the WASM shim can't run shadow-database diagnostics); on a normal
machine `npm run db:migrate` generates the identical SQL.

## Favorites (Phase 9)

Signed-in users save properties with the heart on every card (home,
search, similar) or the "Save this property" button on the detail
page; everything lives at `/favorites`, newest saves first. Toggling
is optimistic, guests are bounced through login and back, and you
can't save your own listings. If a saved property is later rented,
sold or unpublished it moves to a "No longer available" section
instead of vanishing — unsaving always works, even then; deleted
properties cascade their saves away.

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

## Admin panel (Phase 10)

`/admin` is ADMIN-only (middleware + server-side `requireRole` in the admin
layout). Everything runs through Server Actions over `lib/services/admin.ts`.

- **Overview** — live stats: listings by status, users by role, total
  inquiries, plus the oldest listings still awaiting review.
- **Moderation queue** — PENDING listings oldest-first (FIFO), with
  waiting-time labels and a flag for listings with no photos. Approve or
  reject inline; rejecting requires a written reason (5–500 chars) that the
  agent sees on their edit page.
- **Listings** — every property regardless of status, with status tabs and
  search by title/city/owner. Inspect opens the full record (gallery,
  address, coordinates, owner). From there an admin can take down a live
  listing, reinstate a rejected one, or **delete** it outright (Cloudinary
  files are cleaned up; favorites/inquiries cascade in the DB).
- **Users** — searchable list with role/status filters. Suspend or ban
  blocks the account's next sign-in (enforced in `lib/auth.ts`); reinstate
  restores it. An admin can't change their own status or another admin's.

**Moderation transitions** go through one guarded service: approve from
PENDING/REJECTED, reject from PENDING/APPROVED; `RENTED_OR_SOLD` listings
can't be moderated. The owner is emailed on approval (with the live link)
and on rejection (with the reason and a link to fix it).

**Policy completed from Phase 3:** editing a live (APPROVED) listing now
sends it back to `PENDING` for re-moderation, so agents can't swap content
after approval. The edit page warns about this. Photo-only changes don't
trigger re-review.

Known limitation (session revocation was added in Phase 11 — see below):
suspending an agent doesn't unpublish their listings (moderate or delete
them separately).

## Security & quality (Phase 11)

- **Security headers + CSP** on every response (`next.config.mjs`):
  a Content-Security-Policy whitelisting only our origin, Unsplash,
  Cloudinary and OpenStreetMap tiles, plus `nosniff`, strict
  Referrer-Policy and a locked-down Permissions-Policy. Production adds
  HSTS and clickjacking protection (`frame-ancestors 'none'` +
  `X-Frame-Options: DENY`); those two are omitted in dev so the
  iframe-embedded cloud preview keeps working. Dev CSP additionally
  allows `unsafe-eval`/websockets for HMR. (`script-src 'unsafe-inline'`
  remains for Next.js's inline flight scripts — nonce-based CSP is the
  documented next step.)
- **Rate limiting** (`lib/rate-limit.ts`, in-memory sliding window):
  login 10 attempts / 15 min per IP+email and 30 / 15 min per IP;
  registration 5/hour per IP; inquiries 20/hour per user; Cloudinary
  upload signatures 100/hour per agent. Blocked attempts don't extend
  the lockout. Swap the Map for Redis if the app ever runs on multiple
  instances.
- **Session hardening:** the JWT re-validates account status/role
  against the database every 5 minutes, so suspending/banning (or
  deleting) a user now ends their live session — not just their next
  sign-in — and role changes propagate without a fresh login. Sessions
  expire after 7 days (was the 30-day default). Unknown-email logins
  run a dummy bcrypt comparison so timing doesn't reveal whether an
  account exists. Middleware and `getCurrentUser` treat a claimless
  token as signed out.
- **Audit:** no `dangerouslySetInnerHTML` anywhere; Leaflet popup HTML
  escapes every dynamic value; `passwordHash` is only touched inside
  the auth service; login `callbackUrl` only accepts same-origin paths
  (now also rejecting the `/\` protocol-relative trick); registration
  reveals duplicate emails (UX choice — blunted by the rate limit).
- **Tests:** Vitest unit suite in `tests/` (`npm test`) — 42 tests over
  the Zod schemas (cross-field property rules, no-ADMIN self-registration,
  moderation reasons, Cloudinary URL pinning), search-param parsing,
  constants/labels, formatting helpers and the rate limiter. `npm run
  lint` and `tsc --noEmit` are clean.

## Deployment (Phase 12)

RentGH runs on **Vercel** (app, London `lhr1` — close to Ghana and to the
database) + **Supabase Postgres** (database, `eu-west-1`), both on free tiers.

**Environment variables** (Vercel → Project → Settings → Environment
Variables; never commit real values):

| Variable | Required | Notes |
| -------- | -------- | ----- |
| `DATABASE_URL` | ✅ | Supabase → Connect → **Session pooler** connection string |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` — unique per environment |
| `NEXTAUTH_URL` | ✅ | Public site URL, e.g. `https://rentgh-….vercel.app` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | – | Without these, photo uploads are disabled (agents see a notice) |
| `RESEND_API_KEY` / `EMAIL_FROM` | – | Without these, notification emails are skipped (logged server-side) |
| `NEXT_IMAGE_UNOPTIMIZED` | 🚫 | Sandbox-dev workaround only — must be unset in production |

**How the database was provisioned:** the two Prisma migrations in
`prisma/migrations/` were applied to Supabase and recorded in
`_prisma_migrations` (so `prisma migrate deploy` stays consistent), then the
database was seeded with the demo data. To reproduce on a normal machine
with the Supabase `DATABASE_URL` in `.env`, it's simply:

```bash
npm run db:deploy   # apply migrations
npm run db:seed     # optional demo data (see warning)
```

⚠️ **Demo accounts warning:** the seeded users (including
`admin@rentgh.com`) share the publicly-known password `Password123!` and are
convenient for demos/marking only. For real use, delete them and create a
proper admin (register normally, then promote via SQL:
`UPDATE "User" SET role='ADMIN' WHERE email='you@example.com';`).

**Ongoing deploys:** pushing to `main` triggers a Vercel production deploy;
other branches get preview URLs. Prisma client generation runs automatically
via `postinstall`.

## Progress

- [x] **Phase 1 — Setup:** scaffold, Tailwind, Prisma schema, first migration, seed
- [x] **Phase 2 — Authentication & roles:** NextAuth credentials, register/login/logout, role-based middleware + navbar
- [x] **Phase 3 — Listing CRUD:** agent dashboard with own-listing CRUD, server-side ownership enforcement, PENDING default + status policy
- [x] **Phase 4 — Image uploads (Cloudinary):** signed direct uploads with server-verified results, cover/reorder/delete, deletion sync, graceful unconfigured mode
- [x] **Phase 5 — Public browsing & search:** home storefront + `/properties` with validated filters/sort/pagination, APPROVED-only visibility
- [x] **Phase 6 — Property detail page:** gallery, key details, agent contact reveal + WhatsApp, similar properties, APPROVED-only 404s
- [x] **Phase 7 — Maps (Leaflet/OpenStreetMap):** detail-page pin, search map view with price-pill pins + popups, form pin-picker synced with lat/lng fields
- [x] **Phase 8 — Inquiries & email:** threaded tenant/agent inboxes, NEW→READ→REPLIED→CLOSED flow, Resend notifications (graceful unconfigured mode)
- [x] **Phase 9 — Favorites:** optimistic heart toggles everywhere, saved-properties page with no-longer-available handling
- [x] **Phase 10 — Admin panel:** stats overview, FIFO moderation queue with rejection reasons + owner emails, full listing oversight & delete, user suspend/ban, re-moderation when a live listing is edited
- [x] **Phase 11 — Security & quality:** CSP + security headers, rate limiting on auth/inquiries/uploads, live-session revocation for suspended users, timing-safe login, 42-test Vitest suite, clean lint/types
- [ ] Phase 12 — Deployment

<!-- Screenshots will be added as features land. -->
