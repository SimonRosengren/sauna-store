# 0007. Nuxt Content (file-based) for editorial guides

Status: Accepted

## Context

The source brief's SEO knowledge base (`/guider`) is hand-written editorial
content about the sauna buying journey (prices, installation, regulations,
etc. — section 15). Unlike the product catalog, this content is *not*
ingested from external sources and does not need to grow automatically. The
brief's admin section (26) does list "Edit SEO/editorial content" as an
admin function, which would normally suggest a DB-backed CMS.

## Decision

Store guides as Markdown files in `content/guider/` using the **Nuxt
Content** module, edited directly in the repo (and reviewable via normal git
PRs) rather than through a database-backed admin CMS.

## Alternatives considered

- **DB-backed CMS (guides collection in Mongo + admin editor UI).** Matches
  the brief's admin section literally, but means building and maintaining a
  rich-text/markdown editor UI for content that changes rarely and is
  written by the operator themselves. Disproportionate effort for a hobby
  project meant to be low-maintenance.
- **Third-party headless CMS (Sanity, Contentful, etc.).** Rejected: extra
  vendor, extra auth/API surface, for content volume that doesn't need it.

## Consequences

- Editing a guide means editing a Markdown file and deploying (Vercel
  preview deploys make this low-friction) — no separate CMS login/UI.
- Guides get free git history/versioning and review via PRs.
- The "admin edits editorial content" function from the source brief is
  satisfied by "edit the Markdown file," which should be documented as such
  rather than silently dropped — see `docs/ai/marketplace.md` /
  `docs/ai/seo.md` for how guides plug into internal linking.
- If editorial workflows ever need to be handed to a non-technical
  collaborator, this decision should be revisited (add an ADR superseding
  this one rather than bolting on a CMS ad hoc).
