# 0006. Resend for transactional email

Status: Accepted

## Context

The marketplace needs transactional email: project-owner email verification
(source brief section 23) and contractor-interest notifications to customers
(section 21). Volume is low (hobby-project scale) but deliverability and
developer experience both matter since there's no dedicated ops time to
babysit email infrastructure.

## Decision

Use **Resend** for all transactional email, called from Nitro server routes
(`server/email/`).

## Alternatives considered

- **Postmark.** Excellent deliverability reputation, but no perpetual free
  tier — direct cost from day one for a hobby project with unproven
  traffic. Resend's free tier is generous enough for expected marketplace
  volume at launch.
- **Rolling your own SMTP (e.g. via a generic provider).** Rejected: more
  configuration (DKIM/SPF/DMARC setup is still needed either way, but
  Resend's dashboard and API make this and template management simpler)
  and worse DX than a purpose-built transactional API.

## Consequences

- Domain DKIM/SPF/DMARC records must still be configured for the sending
  domain regardless of provider — this is a one-time setup task in Phase 6,
  not something the code handles.
- Revisit only if volume outgrows the free tier or deliverability issues
  appear — not a hard dependency baked deep into the domain model (email
  sending is isolated behind `server/email/`, so swapping providers later
  is a contained change).
