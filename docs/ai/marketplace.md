# Marketplace (`/jobb`)

Source brief sections 20–23. Read this before touching anything under
`server/api/projects/`, `server/api/contractors/`, or `app/pages/jobb/`.

## Design constraint: keep it simple

No accounts, chat, dashboards, reviews, or payments for contractors or
customers unless real usage proves they're needed. The entire loop is:
customer posts a project → contractors browse `/jobb` → an interested
contractor submits contact details → customer gets an email → project
expires automatically. Don't build past this without a concrete reason.

## Project lifecycle

```
new → active → contacted → closed
              ↘ expired (automatic, if untouched)
```

- **new**: just created, email not yet verified. Not shown on `/jobb`.
- **active**: email verified, visible on `/jobb`.
- **contacted**: at least one contractor has expressed interest. Still
  visible (multiple contractors may be relevant) unless the customer closes
  it.
- **closed**: customer-initiated (future: a "mark as filled" action) or
  admin-removed (spam).
- **expired**: automatic, via the Phase 6 scheduled task, once
  `expiresAt` (createdAt + 30–60 days, see `docs/ai/data-model.md`) passes.
  Expired projects are not deleted — they're just hidden from `/jobb` and
  excluded from new contractor interest.

Status transitions happen server-side only (`server/api/projects/`); there
is no client-side status field editing.

## Submission flow

1. Customer fills `/jobb/ny` (location, sauna type, budget, foundation/
   installation needs, timeframe, description, contact email/phone).
2. Server validates input (Zod), runs it through the spam/profanity filter,
   applies rate limiting (per-IP, Mongo-backed counter — see ADR-worthy
   detail: no Redis, just a `rate_limits` collection with a fixed window),
   and creates a `projects` doc with `status: 'new'`.
3. Resend sends a verification email with a single-use token
   (`email_verifications`).
4. Clicking the link flips `emailVerified: true` and `status: 'active'` —
   only now does it appear on `/jobb`.

## Contractor interest flow

1. Contractor browses `/jobb` (no login).
2. Clicks "Jag är intresserad" on a project → fills name, company, email,
   phone, optional message (also rate-limited + spam-filtered).
3. Server creates a `contractor_interests` doc, sets project `status:
   'contacted'` if it wasn't already, and emails the customer's verified
   address with the contractor's details.

## Spam/moderation (section 23)

Deterministic and cheap by default — no per-submission AI calls:

- Rate limiting per IP per route.
- Basic input validation (required fields, sane lengths, valid email/phone
  formats).
- Word-list/heuristic spam filter (excessive links, all-caps, known spam
  phrases) applied to free-text fields (`description`, `message`).
- Email verification as the main anti-spam gate for project creation.
- Admin can hard-remove a project/interest (Phase 7 admin).
- Optional: Cloudflare Turnstile on both forms — not yet decided, flag for
  confirmation before implementing (see `docs/ai/roadmap.md` Phase 6 notes).

## SEO note

Individual project pages (`/jobb/[id]`) and the creation form are `noindex`
— see `docs/ai/seo.md`. The marketplace is not meant to generate indexable
pages; don't add sitemap entries for it.
