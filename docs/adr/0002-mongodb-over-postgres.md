# 0002. MongoDB over PostgreSQL

Status: Accepted

## Context

The original product brief suggested PostgreSQL as the default "boring"
choice for relational data (Sauna ↔ Offer ↔ Retailer relationships, project
↔ contractor-interest relationships). The project owner has hands-on
preference and experience with MongoDB and wants to run it instead.

Separately, the domain itself has some genuinely document-shaped needs:

- Field-level provenance (`{ value, source, sourceUrl, fetchedAt }` per
  field) is naturally a nested/variable-shape object per Sauna document.
- Different source adapters produce different raw shapes before
  normalization; a flexible schema absorbs that better during early
  iteration than a rigid relational schema with frequent migrations.

## Decision

Use MongoDB (hosted on Atlas) as the only datastore.

## Alternatives considered

- **PostgreSQL** (the source brief's suggestion). Rejected in favor of
  operator preference. Tradeoff acknowledged: Postgres would give stronger
  relational integrity for Sauna↔Offer↔Retailer and simpler aggregate
  queries (JOINs vs `$lookup`), and is arguably a better fit for the
  "boring and maintainable" principle from the source brief. We're
  consciously trading a bit of that away for developer familiarity/velocity.
- **Postgres + JSONB for provenance fields (hybrid).** Would have addressed
  the document-shaped provenance need without leaving Postgres. Not chosen,
  since going full Mongo avoids running two paradigms at once.

## Consequences

- Canonical Sauna ↔ Offer relationship is modeled as separate collections
  linked by `saunaId` (see `docs/ai/data-model.md`), with application-level
  joins via `$lookup` or multiple queries — there's no foreign-key
  enforcement, so referential integrity is the application's job
  (ingestion pipeline must not create an Offer pointing at a deleted Sauna).
- Schema evolves via Zod schemas (ADR 0003) rather than SQL migrations —
  faster iteration, but "migrating" existing documents when a schema
  changes needs an explicit backfill script; there's no automatic column
  default the way Postgres gives you.
- MongoDB Atlas free tier (M0) is sufficient for a hobby-scale catalog and
  is reachable from Vercel serverless functions, which ruled out
  self-hosting Mongo (see ADR 0004).
