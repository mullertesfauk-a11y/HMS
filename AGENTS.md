<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# HMS — Hotel Reservation System

Single-package Next.js 16 (App Router) + React 19 + Tailwind v4 + Prisma 7 + Neon Postgres + Better Auth app. Public booking site (`(website)`) plus an internal `/admin` portal. Import alias `@/*` → `src/*`. See `README.md` for the full architecture.

## Commands

- `npm run dev` — dev server on :3000 (also regenerates this AGENTS.md block).
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`).
- `npx tsc --noEmit` — strict typecheck.
- `npm run build` — `prisma generate && next build`. Don't skip the generate step; `src/generated/` is gitignored and must be regenerated after schema changes.
- `npm test` — vitest over `src/**/*.test.ts`. Focused run: `npx vitest run src/lib/dates.test.ts`.
- Prisma CLI needs a direct connection: `npx prisma migrate dev` / `npx prisma migrate deploy` use `DIRECT_URL` (via `prisma.config.ts`, which loads dotenv itself — the Prisma 7 CLI does not auto-load `.env`). Runtime uses pooled `DATABASE_URL` via the Neon driver adapter.
- Seed (idempotent): `npx prisma db seed` → runs `tsx prisma/seed.ts`. Creates the `gurja-hotel` hotel, room types/rooms/amenities, and dev staff accounts.

## Environment

- `cp .env.example .env`; required vars: `DATABASE_URL` (pooled), `DIRECT_URL` (direct), `BETTER_AUTH_SECRET` (≥32 chars). Production additionally requires `BETTER_AUTH_URL` (or `NEXT_PUBLIC_APP_URL` as fallback) served over `https://` — loopback hosts are exempt. Uploadthing vars (`UPLOADTHING_TOKEN`/`UPLOADTHING_APP_ID`) are optional in dev, required at runtime for image uploads.
- Env is validated centrally in `src/lib/env.ts` and **throws at import time** if anything is missing/malformed. Never read `process.env` ad hoc — import `env` from `@/lib/env` (server only). `NEXT_PUBLIC_*` vars are inlined by Next at build time for client code.
- `.env` is gitignored; `.env.example` is the contract. `.npmrc` sets `legacy-peer-deps=true` — keep it.

## Prisma 7 quirks

- The `datasource` block in `prisma/schema.prisma` has **no `url`**. CLI connection lives in `prisma.config.ts`; runtime connection in `src/lib/db/prisma.ts` (memoized singleton on `globalThis`).
- Import the generated client from `@/generated/prisma/client`, never `@prisma/client`.
- Client output is `src/generated/prisma` (gitignored).

## Testing

- `npm test` collects unit **and** integration suites. Files run sequentially (`fileParallelism: false`) because the `*.integration.test.ts` suites share one database; per-test timeouts are raised to 30s for slow Neon round trips.
- Integration suites import `@/lib/db/prisma` → `@/lib/env`, so a valid `.env` is required even for "unit" runs. They execute only when `DATABASE_URL` is set (else `describe.skip`).
- `server-only` resolves to `test/server-only-stub.ts` under vitest (`vitest.config.mts`); the real package throws outside a React Server Component context.
- ⚠️ **Hotel slug mismatch:** the seed creates `gurja-hotel`, but all four integration suites hardcode `grand-meridian` (pre-rebrand slug) and abort with "Seed data missing — run `npx prisma db seed` first" when it's absent. They currently pass only because the old hotel persists in the dev DB; on a fresh DB they fail. If you touch the seed hotel slug, update `admin.service`, `availability.service`, `reservation.service`, and `website-actions` integration tests.

## Architecture rules (server-side)

- Route handlers and server actions stay thin; business logic lives in `src/server/services/*` on top of thin `src/server/repositories/*` Prisma wrappers. Public mutations are server actions in `src/app/(website)/actions.ts`; admin modules each have their own `actions.ts` under `src/app/(admin)/admin/(protected)/*`.
- Orders (`orderService.createOrder`) are a parallel transactional domain to reservations, sharing the same service/repository layering. Domain logic (state machines, pricing, numbers) lives in `src/lib/domain/*` — e.g. `order-status.ts` for order transitions, `reservation-status.ts` for reservation transitions.
- Reservation creation is one transaction: `reservationService.createReservation` (availability re-check, guest find-or-create, server pricing, reservation number, room-type line, PENDING payment, audit log). Client-supplied totals are never trusted.
- Authorization is centralized in `src/lib/permissions.ts`. API routes use `requirePermission`/`requireRole` (throw 401/403); pages use `requirePermissionPage` (redirects). Add new permissions to the `PERMISSIONS` map — never spread role checks.
- Public self-registration is disabled and `role`/`status` are `input: false` (no self-escalation). Staff accounts are created ADMIN-only via the Better Auth admin plugin.
- Server modules start with `import "server-only"`; client components must not import them.
- Hotel dates are date-only handled as UTC-midnight Dates. Use `hotelDateToUtc`/`utcToHotelDate`/`calculateNights` from `src/lib/dates.ts`; never do browser-local timezone math on stored dates.
- `src/lib/rate-limit.ts` is an in-memory limiter (dev-grade). The production path still needs a distributed store swapped in — don't treat it as production-ready.

## Dev credentials (seed only, never production)

- `admin@example.com` / `Admin123!` (ADMIN)
- `staff@example.com` / `Staff123!` (STAFF)