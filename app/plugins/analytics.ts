// Umami analytics (docs/adr/... analytics decision, docs/ai/roadmap.md).
// Privacy-friendly, cookie-free — no consent banner needed. Only injected
// when both env vars are configured, so local/dev/preview environments
// without an Umami website ID don't send any events.
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const { umamiWebsiteId, umamiScriptUrl } = config.public

  if (!umamiWebsiteId || !umamiScriptUrl) {
    return
  }

  useHead({
    script: [
      {
        src: umamiScriptUrl,
        defer: true,
        'data-website-id': umamiWebsiteId
      }
    ]
  })
})
