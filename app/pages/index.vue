<script setup lang="ts">
useSeoMeta({
  title: 'Bastuguiden — Jämför bastur, räkna kostnad, hitta hjälp',
  description:
    'Jämför bastur från flera återförsäljare, räkna på totalkostnaden för ditt bastuprojekt och hitta hjälp med installationen.',
  ogTitle: 'Bastuguiden',
  ogDescription:
    'Jämför bastur, räkna på totalkostnaden och hitta hjälp med installationen.'
})

const primaryPaths = [
  {
    title: 'Hitta en bastu',
    description: 'Jämför bastur från flera återförsäljare på ett ställe.',
    icon: 'i-lucide-search',
    to: '/bastur'
  },
  {
    title: 'Räkna på kostnaden',
    description: 'Få en realistisk uppskattning av totalkostnaden.',
    icon: 'i-lucide-calculator',
    to: '/verktyg/bastukalkylator'
  },
  {
    title: 'Lägg upp ditt bastuprojekt',
    description: 'Beskriv ditt projekt och låt intresserade hantverkare höra av sig.',
    icon: 'i-lucide-hammer',
    to: '/jobb/ny'
  }
]

const categories = [
  { label: 'Bastutunnor', to: '/bastutunnor' },
  { label: 'Vedeldade bastur', to: '/vedeldade-bastur' },
  { label: 'El-bastur', to: '/el-bastur' },
  { label: 'Bastustugor', to: '/bastustugor' }
]
</script>

<template>
  <div>
    <section class="border-b border-default bg-elevated/30">
      <UContainer class="py-20 text-center">
        <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-highlighted">
          Funderar du på bastu?
        </h1>
        <p class="mt-4 text-lg text-muted max-w-2xl mx-auto">
          Jämför bastur, räkna på totalkostnaden och hitta hjälp med
          installationen.
        </p>
      </UContainer>
    </section>

    <UContainer class="py-16">
      <div class="grid gap-6 sm:grid-cols-3">
        <UCard
          v-for="path in primaryPaths"
          :key="path.to"
          class="text-center hover:ring-primary transition-shadow"
        >
          <NuxtLink :to="path.to" class="flex flex-col items-center gap-3 py-2">
            <UIcon :name="path.icon" class="size-8 text-primary" />
            <h2 class="font-semibold text-highlighted">{{ path.title }}</h2>
            <p class="text-sm text-muted">{{ path.description }}</p>
          </NuxtLink>
        </UCard>
      </div>
    </UContainer>

    <UContainer class="py-16 border-t border-default">
      <h2 class="text-xl font-bold text-highlighted mb-6">
        Populära kategorier
      </h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UButton
          v-for="category in categories"
          :key="category.to"
          :to="category.to"
          variant="soft"
          color="neutral"
          block
          size="lg"
        >
          {{ category.label }}
        </UButton>
      </div>
    </UContainer>
  </div>
</template>
