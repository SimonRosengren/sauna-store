<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
  }>(),
  {
    description: 'Den här sidan byggs just nu och är inte klar än.'
  }
)
</script>

<template>
  <UContainer class="py-24 text-center">
    <UIcon name="i-lucide-hammer" class="mx-auto mb-4 size-10 text-muted" />
    <h1 class="text-2xl font-bold text-highlighted mb-2">
      {{ title }}
    </h1>
    <p class="text-muted max-w-md mx-auto">
      {{ description }}
    </p>
    <UButton to="/" variant="soft" class="mt-6">
      Tillbaka till startsidan
    </UButton>
  </UContainer>
</template>
