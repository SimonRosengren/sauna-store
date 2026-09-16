# 0001. Nuxt 4 owns the full stack, no separate backend

Status: Accepted

## Context

The product needs: SSR pages for SEO, a public API for catalog/calculator/
marketplace data, scheduled ingestion jobs, sitemap generation, and an admin
surface. This is a hobby project that must run largely unattended — extra
moving parts (a separate Express/Fastify service, a separate deploy target,
inter-service auth) directly work against that goal.

## Decision

Use Nuxt 4 + TypeScript for everything. Nitro (Nuxt's server engine) provides
API routes (`server/api/`), server-side DB access, and the execution target
for scheduled ingestion logic. There is no separate backend service.

## Alternatives considered

- **Separate API backend (Express/Fastify/NestJS) + Nuxt frontend.** Rejected:
  doubles the deployment surface, requires CORS/auth between services, and
  buys nothing this project needs — Nitro already does SSR + API + server
  logic in one process/deploy.
- **Nuxt for frontend only, Postgres/Mongo accessed via a BaaS (Supabase/
  Firebase).** Rejected: adds a vendor-specific data layer and auth model
  the ingestion pipeline doesn't need; plain server-side DB access from
  Nitro is simpler and keeps all business logic in one place.

## Consequences

- One codebase, one deploy target (Vercel), one set of env vars.
- All ingestion/cron logic must fit Nitro's execution model (see ADR 0004
  for how that interacts with serverless timeouts).
- Admin auth, rate limiting, etc. are implemented as Nitro middleware/routes
  rather than a separate service with its own auth layer.
