# Architecture Decision Records

ADRs capture *why* a significant technical decision was made, not just what
was decided. Code and `docs/ai/*` describe the current state of the system;
ADRs explain the reasoning trail that got us here — read them when you're
wondering "why is it built this way?" or before proposing to change something
that was already deliberated.

## When to write one

Write a new ADR when a decision is:

- Hard/costly to reverse (data store, hosting platform, core domain model)
- Non-obvious (someone could reasonably ask "why not X instead?")
- Cross-cutting (affects more than one feature area)

Small, easily-reversible implementation choices don't need one — use good
commit messages and code comments for those.

## Format

Each ADR is a numbered markdown file: `NNNN-short-title.md`. Use the next
sequential number. Structure:

```markdown
# NNNN. Title

Status: Accepted | Superseded by NNNN | Deprecated

## Context
What problem/question forced this decision? What constraints applied?

## Decision
What we're doing, stated plainly.

## Alternatives considered
What else we looked at and why it lost.

## Consequences
What this makes easier, what it makes harder, what to watch out for.
```

If a later decision reverses an earlier one, don't delete the old ADR — mark
its status as "Superseded by NNNN" and add a new one explaining the change.

## Index

| # | Title | Status |
|---|---|---|
| [0001](./0001-nuxt-owns-the-stack.md) | Nuxt 4 owns the full stack, no separate backend | Accepted |
| [0002](./0002-mongodb-over-postgres.md) | MongoDB over PostgreSQL | Accepted |
| [0003](./0003-native-driver-plus-zod-over-odm.md) | Native MongoDB driver + Zod, not an ODM | Accepted |
| [0004](./0004-vercel-hosting-and-cron-strategy.md) | Vercel hosting + cron-driven, chunked ingestion | Accepted |
| [0005](./0005-tailwind-nuxt-ui.md) | Tailwind CSS + Nuxt UI for styling | Accepted |
| [0006](./0006-resend-for-email.md) | Resend for transactional email | Accepted |
| [0007](./0007-nuxt-content-for-guides.md) | Nuxt Content (file-based) for editorial guides | Accepted |
| [0008](./0008-source-adapter-architecture.md) | Source adapter architecture for ingestion | Accepted |
| [0009](./0009-dedup-and-provenance-model.md) | Canonical product / offer dedup + field-level provenance | Accepted |
| [0010](./0010-initial-ingestion-sources.md) | Initial ingestion sources: Polhus, Bauhaus | Accepted |
