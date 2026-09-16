# 0003. Native MongoDB driver + Zod, not an ODM

Status: Accepted

## Context

Given MongoDB (ADR 0002), we need a data-access layer. The ingestion
pipeline already requires a VALIDATE step (source plan section 27) that
checks normalized product data before it's published. Common options are an
ODM (Mongoose) or the official native `mongodb` driver paired with a
schema/validation library.

## Decision

Use the official `mongodb` Node.js driver directly, with **Zod** schemas as
the single source of truth for both runtime validation and TypeScript types
(`z.infer<typeof SaunaSchema>`).

## Alternatives considered

- **Mongoose.** Rejected: would mean maintaining two parallel schema
  systems — Mongoose schemas for persistence and Zod (or similar) for
  ingestion validation — that can drift from each other. Mongoose's
  document/model abstraction (methods, virtuals, middleware) also adds
  behavior this project doesn't need; we want plain documents in, plain
  documents out.
- **Prisma (Mongo connector).** Rejected: heavier runtime, generated-client
  workflow adds friction for a fast-moving/evolving schema in early phases,
  and Prisma's Mongo support has historically lagged its relational
  support.

## Consequences

- One Zod schema per collection (`server/db/models/`, mirrored types in
  `shared/types/`) is both the ingestion validator and the TS type — no
  duplication.
- No automatic schema enforcement at the DB level; Zod parsing at every
  write boundary (ingestion publish step, API route handlers) is what
  keeps bad data out. This must not be skipped anywhere data enters Mongo.
- Slightly more boilerplate per collection (manual `collection<T>()` typed
  accessors in `server/db/`) than an ODM would give for free — acceptable
  tradeoff for avoiding schema duplication.
