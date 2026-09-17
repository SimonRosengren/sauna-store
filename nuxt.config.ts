// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
    'nuxt-schema-org'
  ],
  css: ['~/assets/css/main.css'],
  nitro: {
    // Nitro tasks (server/tasks/*.ts) power the cron-triggered ingestion
    // batches (docs/adr/0004-vercel-hosting-and-cron-strategy.md).
    experimental: { tasks: true }
  },
  typescript: {
    strict: true,
    typeCheck: false
  },
  // Shared by @nuxtjs/sitemap, @nuxtjs/robots and nuxt-schema-org (all built
  // on nuxt-site-config). `url` is auto-detected from NUXT_PUBLIC_SITE_URL
  // in production (see .env.example); the value below is only the local
  // dev fallback.
  site: {
    url: 'http://localhost:3000',
    name: 'Bastuguiden'
  },
  robots: {
    // Route rules below are the single source of truth for what's
    // indexable — this just makes sure the resulting robots.txt/meta tags
    // stay consistent with each other, per docs/ai/seo.md.
    disallowNonIndexableRoutes: true
  },
  schemaOrg: {
    // No logo yet (no branding assets exist) — add one once designed
    // rather than pointing Schema.org at a placeholder.
    identity: {
      type: 'Organization',
      name: 'Bastuguiden'
    }
  },
  // Every route not listed here defaults to indexable. Stub pages built
  // ahead of their real phase (see docs/ai/roadmap.md) are explicitly
  // marked noindex here rather than per-page, so sitemap/robots.txt/meta
  // tags all agree automatically (see docs/ai/seo.md).
  routeRules: {
    '/admin/**': { robots: false },
    '/bastur/**': { robots: false },
    '/bastutunnor': { robots: false },
    '/vedeldade-bastur': { robots: false },
    '/el-bastur': { robots: false },
    '/bastustugor': { robots: false },
    '/guider/**': { robots: false },
    '/verktyg/**': { robots: false },
    '/jobb/**': { robots: false }
  },
  runtimeConfig: {
    // Server-only. These env var names intentionally don't use Nuxt's
    // `NUXT_`-prefixed auto-mapping convention (see .env.example) — they're
    // read explicitly here so the plain, provider-conventional names
    // (MONGODB_URI, RESEND_API_KEY, ...) can be set as-is in Vercel/CI.
    mongodbUri: process.env.MONGODB_URI || '',
    mongodbDbName: process.env.MONGODB_DB_NAME || 'sauna_store',
    resendApiKey: process.env.RESEND_API_KEY || '',
    resendFromEmail: process.env.RESEND_FROM_EMAIL || '',
    cronSecret: process.env.CRON_SECRET || '',
    adminPassword: process.env.ADMIN_PASSWORD || '',
    blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN || '',
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || '',
    // Public keys use the NUXT_PUBLIC_* convention, so Nuxt maps them
    // automatically — defaults below are dev fallbacks only.
    public: {
      siteUrl: 'http://localhost:3000',
      umamiWebsiteId: '',
      umamiScriptUrl: '',
      turnstileSiteKey: ''
    }
  },
  app: {
    head: {
      // Google Search Console verification (docs/ai/seo.md). Only emitted
      // once a verification code exists — set up as part of Phase 4, left
      // empty until then rather than shipping a placeholder meta tag.
      meta: process.env.NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION
        ? [
            {
              name: 'google-site-verification',
              content: process.env.NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION
            }
          ]
        : []
    }
  }
})
