# 0004. Vercel hosting + cron-driven, chunked ingestion

Status: Accepted

## Context

This is a hobby project meant to be launched and largely left alone (source
brief, "Product goal"). Hosting choice directly determines how scheduled
ingestion jobs (discovery, fetch, price refresh, project expiration) can be
implemented, since Nuxt/Nitro's own cron scheduling assumes a long-running
process, which a serverless platform doesn't provide.

## Decision

- Host on **Vercel**.
- Scheduled work is driven by **Vercel Cron** (defined in `vercel.json`)
  hitting secret-protected Nitro API routes under `server/api/cron/*`,
  which invoke Nitro tasks (`server/tasks/`) that do the actual work.
- Because serverless functions have execution time limits, every
  cron-triggered job processes a **bounded batch** and tracks a cursor
  (e.g. "next N stalest products," "next N pending discovered URLs") so a
  single invocation never needs to finish an entire source's catalog. The
  next scheduled invocation picks up where the previous one left off.
- Daily cron cadence is enough for this product (price/availability drift on
  sauna retailers is not time-sensitive), which keeps this working even on
  Vercel's Hobby (free) tier, which only allows daily-or-slower cron
  schedules.

## Alternatives considered

- **VPS with a real crontab / PM2 + long-running Node process.** Would
  remove the execution-time-limit problem entirely and allow a classic
  Nitro `scheduledTasks` setup. Rejected for now: more operational surface
  (patching, monitoring, restarts) than a hobby project run "largely left
  alone" should need. Revisit if ingestion volume ever outgrows the
  chunked-batch model.
- **External queue (Redis/BullMQ, Upstash QStash).** Would help with more
  complex job orchestration/retries. Rejected for the initial build to keep
  infrastructure minimal — the cursor-based batching approach is a "poor
  man's queue" implemented as plain Mongo documents, no extra service. If
  ingestion complexity grows, revisit this rather than reflexively adding
  Redis.

## Consequences

- Every ingestion/refresh task must be written as an idempotent, resumable
  batch operation from day one — not "process the whole source in one go."
- `sources` collection (see `docs/ai/data-model.md`) needs to persist a
  cursor/pointer, not just last-run metadata.
- A run that times out mid-batch must leave the database in a consistent
  state (partial progress is fine; corrupted/partial documents are not).
- If/when ingestion needs more-than-daily freshness or heavier per-run
  compute, the first lever to pull is Vercel Pro's longer function
  duration and more frequent cron, not immediately migrating off Vercel.
