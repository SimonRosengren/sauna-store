<script setup lang="ts">
const navLinks = [
  { label: 'Bastur', to: '/bastur' },
  { label: 'Guider', to: '/guider' },
  { label: 'Kalkylator', to: '/verktyg/bastukalkylator' },
  { label: 'Jobb', to: '/jobb' }
]

const mobileMenuOpen = ref(false)
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-default bg-default/90 backdrop-blur">
    <UContainer class="flex h-16 items-center justify-between">
      <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg text-highlighted">
        <UIcon name="i-lucide-flame" class="size-5 text-primary" />
        Bastuguiden
      </NuxtLink>

      <nav class="hidden md:flex items-center gap-6">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="text-sm font-medium text-muted hover:text-highlighted transition-colors"
          active-class="text-highlighted"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="hidden md:block">
        <UButton to="/jobb/ny" color="primary" size="sm">
          Lägg upp projekt
        </UButton>
      </div>

      <UButton
        class="md:hidden"
        color="neutral"
        variant="ghost"
        :icon="mobileMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'"
        aria-label="Meny"
        @click="mobileMenuOpen = !mobileMenuOpen"
      />
    </UContainer>

    <div v-if="mobileMenuOpen" class="md:hidden border-t border-default">
      <UContainer class="flex flex-col gap-4 py-4">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="text-sm font-medium text-muted hover:text-highlighted"
          @click="mobileMenuOpen = false"
        >
          {{ link.label }}
        </NuxtLink>
        <UButton to="/jobb/ny" color="primary" size="sm" block @click="mobileMenuOpen = false">
          Lägg upp projekt
        </UButton>
      </UContainer>
    </div>
  </header>
</template>
