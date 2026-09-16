# SEO conventions

SEO is a first-class product requirement (source brief sections 13–19, 31),
not an afterthought bolted onto pages. Read this before adding/changing any
indexable route.

## Route structure

```
/                                   Homepage
/bastur                             Full catalog / search
/bastur/[slug]                      Product page (canonical Sauna)
/bastutunnor                        Category page
/vedeldade-bastur                   Category page
/el-bastur                          Category page
/bastustugor                        Category page
/guider                             Guide index
/guider/[...slug]                   Guide (Nuxt Content)
/verktyg                            Tools index
/verktyg/bastukalkylator            Cost calculator
/jobb                               Marketplace listing (noindex)
/jobb/ny                            Create project (noindex)
/jobb/[id]                          Project detail (noindex)
/go/[offerId]                       Outbound redirect + click tracking (noindex, nofollow)
```

Combination pages (e.g. `/bastur-for-4-personer`) are only made indexable
when there's a real, distinct set of matching products and genuinely useful
content — never generate a page just because a URL pattern is possible.
**Do not build thin combination pages that differ from each other only by a
number or city name** (source brief section 34's explicit bad example:
`/bastutunnor/bastutunna-for-4-personer-under-34750-malmo`).

## What's data-driven vs. hand-written

- Category pages, filters, price ranges, "N återförsäljare" counts: always
  computed from `saunas`/`offers` via Mongo queries/aggregations at request
  time (or cached with ISR) — never hardcoded lists. Adding a sauna via
  ingestion should make it appear in every relevant category/filter
  automatically.
- Guides: hand-written Markdown in `content/guider/` (ADR 0007) — these are
  the one place manual content work is expected and fine.
- Sitemap (`@nuxtjs/sitemap`) and `robots.txt` (`@nuxtjs/robots`): generated
  from actual database content, never manually maintained lists of URLs.

## Metadata & structured data

- Use `useSeoMeta`/`useHead` per page; title/description templates should
  be generated from product/category data (name, category, price range),
  not copy-pasted per page.
- Canonical URLs on every indexable page.
- Structured data via `nuxt-schema-org`: `Product`+`Offer` on product pages,
  `BreadcrumbList` everywhere there's a breadcrumb, `Article` on guides,
  `FAQPage` only where the page genuinely has visible FAQ content. **Only
  emit structured data that matches what's actually visible on the page**
  (source brief section 18) — don't emit an `Offer` price that isn't shown,
  don't emit `AggregateRating` we don't have real data for.
- `/jobb/*` pages: `noindex` (source brief section 22) — the marketplace is
  a product feature, not an SEO page generator. `/go/*` redirects:
  `noindex, nofollow`.

## Internal linking

Every page should connect to at least one of: a related guide, a related
product/category, or a tool (calculator). Avoid isolated/orphan pages —
guides link to relevant products and the calculator; products link to
relevant guides; the calculator links to relevant products and to
`/jobb/ny`. Build shared components for this (`RelatedGuides`,
`RelatedProducts`, `CalculatorCta`) rather than one-off links per page, so
the graph stays consistent as content grows.

## Search Console feedback loop (section 16)

After launch, this is the actual product-development driver for
Phase 4/ongoing: check Search Console for queries with impressions but low
CTR or ranking, and for new unexpected search terms, and build/improve
content for those — don't try to predict every keyword pre-launch. This is
an ongoing process, not a one-time Phase 4 task; note new content
opportunities discovered this way in `docs/ai/roadmap.md` or as GitHub
issues, whichever the operator prefers once that habit starts.
