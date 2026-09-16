<script setup lang="ts">
const categoryLinks = [
  { label: 'Bastutunnor', to: '/bastutunnor' },
  { label: 'Vedeldade bastur', to: '/vedeldade-bastur' },
  { label: 'El-bastur', to: '/el-bastur' },
  { label: 'Bastustugor', to: '/bastustugor' }
]

const resourceLinks = [
  { label: 'Guider', to: '/guider' },
  { label: 'Bastukalkylator', to: '/verktyg/bastukalkylator' },
  { label: 'Lägg upp projekt', to: '/jobb/ny' },
  { label: 'Bläddra i projekt', to: '/jobb' }
]

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-default mt-24">
    <UContainer class="py-12 grid gap-8 sm:grid-cols-3">
      <div>
        <p class="font-bold text-highlighted mb-2">Bastuguiden</p>
        <p class="text-sm text-muted">
          Jämför bastur, räkna på totalkostnaden och hitta hjälp med
          installationen — allt på ett ställe.
        </p>
      </div>

      <div>
        <p class="font-semibold text-highlighted mb-2 text-sm">Kategorier</p>
        <ul class="space-y-1">
          <li v-for="link in categoryLinks" :key="link.to">
            <NuxtLink :to="link.to" class="text-sm text-muted hover:text-highlighted">
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div>
        <p class="font-semibold text-highlighted mb-2 text-sm">Resurser</p>
        <ul class="space-y-1">
          <li v-for="link in resourceLinks" :key="link.to">
            <NuxtLink :to="link.to" class="text-sm text-muted hover:text-highlighted">
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </UContainer>

    <div class="border-t border-default">
      <UContainer class="py-4 text-xs text-muted">
        &copy; {{ currentYear }} Bastuguiden. Priser och produktinformation
        hämtas automatiskt från respektive återförsäljare och kan ändras.
      </UContainer>
    </div>
  </footer>
</template>
