<script setup lang="ts">
// Minimal read-only ingestion inspection view (Phase 2 scope — see
// docs/ai/roadmap.md; the full admin system is Phase 7). Gated by a single
// shared password (ADMIN_PASSWORD), stored only in this page's memory, not
// persisted — re-entering it is expected on every visit until Phase 7's
// real session auth exists.
useSeoMeta({ title: 'Ingestion — Admin' })

interface IngestionRun {
  _id: string
  sourceId: string
  startedAt: string
  finishedAt: string | null
  status: string
  counts: Record<string, number>
  errors: Array<{ url?: string, stage: string, message: string }>
}

interface SourceDoc {
  _id: string
  name: string
  enabled: boolean
  stats: {
    lastRunAt: string | null
    lastSuccessAt: string | null
    productsFoundLastRun: number
    productsFoundAvgTrailing: number
    consecutiveFailures: number
  }
}

const password = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const runs = ref<IngestionRun[]>([])
const sources = ref<SourceDoc[]>([])
const loaded = ref(false)

async function load() {
  loading.value = true
  errorMessage.value = null
  try {
    const data = await $fetch<{ runs: IngestionRun[], sources: SourceDoc[] }>('/api/admin/ingestion-runs', {
      headers: { 'x-admin-password': password.value }
    })
    runs.value = data.runs
    sources.value = data.sources
    loaded.value = true
  } catch {
    errorMessage.value = 'Fel lösenord eller kunde inte hämta data.'
  } finally {
    loading.value = false
  }
}

const statusColor: Record<string, 'success' | 'error' | 'warning' | 'neutral'> = {
  succeeded: 'success',
  failed: 'error',
  flagged_suspicious: 'warning',
  running: 'neutral'
}
</script>

<template>
  <UContainer class="py-12">
    <h1 class="text-2xl font-bold text-highlighted mb-6">
      Ingestion — admin
    </h1>

    <form v-if="!loaded" class="flex gap-2 max-w-sm" @submit.prevent="load">
      <UInput
        v-model="password"
        type="password"
        placeholder="Admin-lösenord"
        class="flex-1"
      />
      <UButton type="submit" :loading="loading">
        Logga in
      </UButton>
    </form>
    <p v-if="errorMessage" class="text-error mt-2">
      {{ errorMessage }}
    </p>

    <template v-if="loaded">
      <h2 class="text-lg font-semibold mt-8 mb-3">
        Källor
      </h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="text-left border-b border-default">
              <th class="py-2 pr-4">Källa</th>
              <th class="py-2 pr-4">Aktiverad</th>
              <th class="py-2 pr-4">Senaste körning</th>
              <th class="py-2 pr-4">Senast lyckad</th>
              <th class="py-2 pr-4">Produkter (senast / snitt)</th>
              <th class="py-2 pr-4">Ihållande fel</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="source in sources" :key="source._id" class="border-b border-default">
              <td class="py-2 pr-4">{{ source.name }}</td>
              <td class="py-2 pr-4">{{ source.enabled ? 'Ja' : 'Nej' }}</td>
              <td class="py-2 pr-4">{{ source.stats.lastRunAt ?? '—' }}</td>
              <td class="py-2 pr-4">{{ source.stats.lastSuccessAt ?? '—' }}</td>
              <td class="py-2 pr-4">{{ source.stats.productsFoundLastRun }} / {{ source.stats.productsFoundAvgTrailing }}</td>
              <td class="py-2 pr-4">{{ source.stats.consecutiveFailures }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 class="text-lg font-semibold mt-8 mb-3">
        Senaste körningar
      </h2>
      <div v-for="run in runs" :key="run._id" class="border border-default rounded-lg p-4 mb-3">
        <div class="flex items-center gap-2 mb-2">
          <UBadge :color="statusColor[run.status] ?? 'neutral'" variant="subtle">
            {{ run.status }}
          </UBadge>
          <span class="font-medium">{{ run.sourceId }}</span>
          <span class="text-muted text-sm">{{ run.startedAt }} → {{ run.finishedAt ?? '…' }}</span>
        </div>
        <p class="text-sm text-muted">
          Hittade: {{ run.counts.discovered }} · Hämtade: {{ run.counts.fetched }} ·
          Validerade: {{ run.counts.validated }} · Publicerade: {{ run.counts.published }} ·
          Misslyckade: {{ run.counts.failed }}
        </p>
        <details v-if="run.errors.length" class="mt-2 text-sm">
          <summary class="cursor-pointer text-muted">{{ run.errors.length }} fel</summary>
          <ul class="mt-1 list-disc pl-5">
            <li v-for="(error, i) in run.errors" :key="i">
              <span class="font-mono text-xs">[{{ error.stage }}]</span> {{ error.message }}
              <span v-if="error.url" class="text-muted"> — {{ error.url }}</span>
            </li>
          </ul>
        </details>
      </div>
      <p v-if="runs.length === 0" class="text-muted">
        Inga körningar än.
      </p>
    </template>
  </UContainer>
</template>
