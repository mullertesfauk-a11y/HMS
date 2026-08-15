# Hotel Reservation System

A production-ready MVP hotel reservation platform: a public booking website for
guests plus an internal, table-oriented admin system for hotel staff.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS + Prisma +
PostgreSQL (Neon) + Better Auth**. Architecturally prepared for a future
food-ordering / restaurant module without a rewrite.

> **Status:** All phases complete (1–8). Foundation, availability engine,
> reservation domain + public API, protected admin API, admin UI (core +
> modules), the public booking website, and security hardening + docs are all
> done. Remaining work is operational: production rate-limit storage,
> monitoring, and ongoing maintenance.

---

## 1. Tech stack

| Concern        | Choice                                                        |
| -------------- | ------------------------------------------------------------- |
| Framework      | Next.js (App Router), React, TypeScript (strict)              |
| Styling        | Tailwind CSS v4, custom UI system (no shadcn/ui)              |
| Database       | PostgreSQL — **Neon** (hosted)                                |
| ORM            | Prisma 7 (migrations + generated client, Neon driver adapter) |
| Auth           | Better Auth (email/password, Prisma adapter)                  |
| Validation     | Zod 4 (all server input validation)                           |
| Icons          | lucide-react                                                  |
| Dates          | date-fns + custom timezone-safe date helpers                  |
| Tables         | TanStack Table (admin data tables)                            |
| Forms          | React Hook Form + Zod resolver (complex forms)                |
| Utilities      | clsx, tailwind-merge, class-variance-authority                |

## 2. Prerequisites

- Node.js 20+
- A [Neon](https://neon.com) project (or any PostgreSQL). Grab two connection
  strings from Neon's dashboard:
  - **Pooled** connection → `DATABASE_URL` (app runtime)
  - **Direct** connection → `DIRECT_URL` (Prisma CLI migrations)

## 3. Install

```bash
npm install
```

## 4. Configure environment

```bash
cp .env.example .env
```

Fill in `DATABASE_URL`, `DIRECT_URL`, and generate an auth secret:

```bash
openssl rand -base64 32
```

| Variable               | Purpose                                        |
| ---------------------- | ---------------------------------------------- |
| `DATABASE_URL`         | Pooled Neon connection (app runtime)           |
| `DIRECT_URL`           | Direct Neon connection (Prisma migrations)     |
| `BETTER_AUTH_SECRET`   | Better Auth signing secret (≥32 chars)         |
| `BETTER_AUTH_URL`      | Public app URL (defaults to `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL`  | Public app URL for client code                 |

Environment variables are validated centrally in `src/lib/env.ts` — the app
fails fast at startup if anything is missing or malformed.

## 5. Database

Generate the client and validate the schema:

```bash
npx prisma generate
npx prisma validate
```

Run migrations (creates all tables):

```bash
npx prisma migrate dev --name init
```

Seed demo data (idempotent):

```bash
npx prisma db seed
```

Seed data includes one hotel, 6 amenities, 3 room types (8 physical rooms),
and two staff accounts:

```
admin@example.com / Admin123!   (ADMIN — full access)
staff@example.com  / Staff123!  (STAFF — operational access)
```

> ⚠️ These credentials are **development-only**. Change them immediately in any
> shared/staging environment. Passwords are never stored in plaintext — Better
> Auth hashes them with scrypt.

## 6. Development

```bash
npm run dev
```

Open http://localhost:3000 — the public booking website (Phase 7). The admin
portal lives under `/admin` (sign in with the seeded credentials).

## 7. Quality checks

```bash
npm run lint       # ESLint
npx tsc --noEmit   # strict typecheck
npm run build      # production build
```

## 8. Tests

```bash
npm test                    # unit + DB integration (integration needs a live DB)
```

Coverage:

- **Admin services** (`src/server/services/admin.service.integration.test.ts`) —
  staff CRUD via the admin plugin (create/list/update/disable, non-admin
  denied), room + room-type CRUD (uniqueness, amenity replacement, deletion
  safety), dashboard metrics with real in-house revenue, settings update.
- **Website actions** (`src/server/services/website-actions.integration.test.ts`) —
  the public booking server actions: create with server pricing, lookup with
  the number + last-name privacy gate (wrong last name denied), cancellation,
  invalid slug, and invalid-date validation.
- **Security hardening** (`src/server/services/security-hardening.integration.test.ts`)
  — public self-registration rejected, staff creation via the admin plugin
  still works, and role/status cannot be self-assigned.
- **Permissions** (`src/lib/permissions.test.ts`) — full ADMIN matrix, STAFF
  operational access, and denial of staff/settings/destructive permissions.
- **Reservation domain** (`src/server/services/reservation.service.integration.test.ts`)
  — creation happy path (pricing, number format, payment, audit), sold-out
  rollback (concurrent-booking protection), capacity rejection, guest
  dedupe, lookup privacy, cancel frees availability, state-machine
  transitions, room assignment rules.
- **Availability** (`src/server/services/availability.service.integration.test.ts`)
  — runs against the live database: baseline, overlapping reservations,
  exact checkout/check-in boundary, assigned vs unassigned bookings,
  cancelled/checked-out releases, MAINTENANCE exclusion, capacity rules,
  and the in-transaction validation path.
- **Dates** (`src/lib/dates.test.ts`) — timezone-safe parsing/formatting,
  nights, and the overlap rule.
- **Pricing** (`src/lib/domain/pricing.test.ts`) — single/multi-night, tax,
  discount, float safety.
- **State machine** (`src/lib/domain/reservation-status.test.ts`) — valid and
  invalid transitions, cancellable/active status sets.

Integration tests skip automatically when `DATABASE_URL` is not set.

## 9. Project structure

```
src/
├── app/                  # App Router: (website), (admin), api/v1, api/auth
├── components/           # ui/, website/, admin/ (custom design system)
├── lib/
│   ├── auth/             # Better Auth (auth.ts, auth-client.ts)
│   ├── db/               # Prisma client singleton (Neon adapter)
│   ├── api/              # response + pagination helpers
│   ├── permissions/      # roles/permissions + require* helpers
│   ├── validation/       # Zod schemas
│   ├── dates/            # timezone-safe hotel date helpers
│   ├── domain/           # reservation state machine, pricing, numbers
│   └── utils/            # cn, logger, errors, rate-limit, env
├── server/
│   ├── services/         # availability, reservation, room, guest, payment, dashboard
│   └── repositories/     # thin Prisma wrappers
└── generated/prisma/     # generated Prisma client (gitignored)
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

## 10. Architecture

```
UI → API / server action → Auth → Authorization → Validation
   → Service layer → Repository layer → Prisma → PostgreSQL
```

- Route handlers stay thin; business logic lives in services.
- Reservation creation is a single transactional domain operation
  (`reservationService.createReservation`) shared by every client
  (website, admin, future mobile app).
- Availability overlap uses `existingCheckIn < requestedCheckOut AND
  existingCheckOut > requestedCheckIn`; a checkout day is bookable by the
  next guest.
- All prices are computed server-side — the browser never sends totals.
- Permissions are centralized in `src/lib/permissions.ts`; two roles
  (ADMIN, STAFF) map to fine-grained permissions so new roles can be added
  without touching route handlers.

## 11. API

Public API (versioned, live):

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET    | `/api/v1/hotel` | Hotel info |
| GET    | `/api/v1/room-types` | Active room types |
| GET    | `/api/v1/room-types/:slug` | Room type detail |
| GET    | `/api/v1/availability?checkIn&checkOut&adults&children` | Bookable room types + server pricing |
| POST   | `/api/v1/reservations` | Create reservation (transactional) |
| POST   | `/api/v1/reservations/lookup` | Lookup by number + last name |
| POST   | `/api/v1/reservations/:reservationNumber/cancel` | Cancel (cancellable states only) |

Reservation creation is a single transaction: availability re-check, guest
find-or-create, server-side pricing, reservation number, room-type line,
PENDING payment, and audit entry. Totals from clients are never trusted.
Rate limiting applies to `POST /reservations`, `/lookup`, and `/cancel`.

### Admin API

All `/api/v1/admin/*` endpoints require a session and enforce permissions
(`requirePermission`); see `src/lib/permissions.ts`. STAFF has operational
access (reservations, guests, rooms, room-type reads) but is denied staff
management, settings, and destructive room/room-type operations (403).

| Area | Endpoints |
| ---- | --------- |
| Dashboard | `GET /api/v1/admin/dashboard` (arrivals, departures, occupancy, revenue) |
| Reservations | `GET/POST /api/v1/admin/reservations`, `GET/PATCH /api/v1/admin/reservations/:id`, `POST …/confirm`, `…/cancel`, `…/check-in`, `…/check-out`, `…/assign-room` |
| Rooms | `GET/POST /api/v1/admin/rooms`, `GET/PATCH/DELETE /api/v1/admin/rooms/:id` |
| Room types | `GET/POST /api/v1/admin/room-types`, `GET/PATCH/DELETE /api/v1/admin/room-types/:id` |
| Guests | `GET /api/v1/admin/guests`, `GET/PATCH /api/v1/admin/guests/:id` (with reservation history) |
| Staff | `GET/POST /api/v1/admin/staff`, `GET/PATCH /api/v1/admin/staff/:id`, `POST …/disable` (via Better Auth admin plugin) |
| Settings | `GET/PATCH /api/v1/admin/settings` (hotel info, times, tax rate) |

Reservation edits (`PATCH`) re-check availability excluding the reservation
itself and reprice server-side; pending payment amounts stay in sync.
`PATCH /admin/settings` can change the tax rate, which the public booking API
applies to all new reservations.

Responses are standardized:

```json
{ "success": true, "data": {}, "meta": {} }
{ "success": false, "error": { "code": "ROOM_NOT_AVAILABLE", "message": "…" } }
```

## 12. Security

Hardening (Phase 8) covers the auth surface, transport, and headers:

- **No public self-registration.** `emailAndPassword.disableSignUp` is set, so
  the `/sign-up/email` endpoint refuses requests. Staff accounts are created
  exclusively through the admin portal (`staffService.create` via the Better
  Auth admin plugin) — there is no way to mint an account with the default
  STAFF role from the public internet.
- **No self-escalation.** `role` and `status` are `input: false` on the User
  model: clients can never set them; only server-side admin staff management
  assigns roles.
- **Password policy.** Server-enforced minimum 8 characters (max 128).
- **Auth rate limiting.** Better Auth's built-in per-IP limiter is enabled in
  production with a tightened rule for `/sign-in/email` (10/min). Like the
  app-level limiter it defaults to in-memory storage — for multi-instance
  deployments configure `secondaryStorage` or a distributed store.
- **Origin/CSRF protection.** `trustedOrigins` restricts callback and origin
  URLs to the configured app URL, blocking cross-origin abuse.
- **Cookies.** `hms.*` cookie prefix, `HttpOnly`, `SameSite=Lax`, and
  `Secure` (via `useSecureCookies`) in production. `BETTER_AUTH_URL` must be
  an `https://` URL in production (enforced by `src/lib/env.ts`; localhost is
  exempt so local builds work).
- **Security headers** (`next.config.ts`): CSP (frame-ancestors, no
  object-src, tight sources), `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and
  `X-Powered-By` is disabled.
- **Audit trail.** Every reservation and staff action is recorded in
  `audit_log` inside the same transaction.

### Rate limiting

Public booking/lookup endpoints are rate-limited via the abstraction in
`src/lib/rate-limit.ts`. The current default is an in-memory limiter (fine for
local dev). **For production**, swap the `rateLimiter` export for a distributed
store (e.g. Upstash Redis) — the interface is intentionally small so route
handlers don't change. The same guidance applies to Better Auth's built-in
limiter: on multi-instance deployments point it at a shared store.

## 13. Deployment

1. `npm run build`
2. Deploy the Next.js app to your host of choice.
3. Run migrations against the production database with
   `npx prisma migrate deploy`.
4. Set all env vars from `.env.example` in the production environment.
5. Do **not** run `prisma db seed` in production.

## 14. Roadmap (phases)

- **Phase 1 ✅:** foundation — schema, auth, permissions, validation, errors,
  service/repository architecture, seed.
- **Phase 2 ✅:** availability engine — `availabilityService.searchAvailability`,
  `findAvailableRooms`, `getRoomTypeAvailability`, `validateRoomAvailability`
  (in-transaction safe), with unit + DB integration tests.
- **Phase 3 ✅:** reservation domain — transactional `createReservation`,
  lookup, public + admin cancel, confirm/check-in/check-out/no-show via the
  state machine, room assignment; public API under `/api/v1` with rate
  limiting and sanitized views.
- **Phase 4 ✅:** admin API — 18 protected endpoints across dashboard,
  reservations (incl. edit + assign-room), rooms, room-types, guests, staff,
  and settings, all permission-gated and powered by the Better Auth admin
  plugin; hotel tax rate setting drives booking pricing.
- **Phase 5 ✅:** admin UI core — custom design system, admin shell with auth
  gate + sidebar + sign-in/out, TanStack v9 `DataTable` with server-driven
  sorting/pagination/filters, operational dashboard with click-through
  metrics, reservations list (search/status/payment/room-type/date filters),
  and reservation detail with state-based actions (confirm/cancel/check-in/
  check-out/assign room via server actions) + audit timeline.
- **Phase 6 ✅:** admin UI modules — rooms (list with search/filters/sort,
  create/edit/delete), room types (create/edit with amenity picker, delete
  safety), guests (list + detail with upcoming/previous stay history),
  staff (create, inline role + enable/disable), settings (hotel info, times,
  tax rate). All modules permission-gated per role.
- **Phase 7 ✅:** public booking website — branded home page with hero + live
  availability search, room listing (browse per-night rates or search real
  availability with server-computed pricing incl. tax), room detail with
  sticky booking panel (guest details, inline confirmation with reservation
  number), and "find my booking" lookup + cancel using the number + last-name
  privacy gate. Mutations go through rate-limited server actions that reuse
  the same transactional services as the API.
- **Phase 8 ✅:** security hardening + docs — public self-registration
  disabled (staff accounts only via the admin plugin), Better Auth rate
  limiting + trusted origins + `Secure` namespaced cookies, CSP + hardening
  headers via `next.config.ts`, production env validation (https app URL),
  integration tests guarding the hardened invariants, and this security
  section in the README.
