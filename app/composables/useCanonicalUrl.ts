/**
 * Sets a canonical <link> tag for the current route, derived from the
 * configured site URL (NUXT_PUBLIC_SITE_URL) + the route's path (query
 * strings stripped, since we don't want e.g. filter/sort params to create
 * duplicate canonical targets — see docs/ai/seo.md).
 *
 * Called once, globally, from app.vue. Individual pages can override by
 * calling `useHead({ link: [{ rel: 'canonical', href: '...' }] })` after
 * this runs, e.g. for paginated views.
 */
export function useCanonicalUrl() {
  const route = useRoute()
  const config = useRuntimeConfig()

  const canonicalUrl = computed(() => {
    const base = config.public.siteUrl.replace(/\/$/, '')
    const path = route.path === '/' ? '' : route.path
    return `${base}${path}`
  })

  useHead({
    link: [
      {
        rel: 'canonical',
        href: canonicalUrl
      }
    ]
  })
}
