<script setup lang="ts">
const { searchTerm, paletteKey, groups, resetPalette, resultLimit } = useCommand()
</script>

<template>
  <UCommandPalette
    :key="paletteKey"
    v-model:search-term="searchTerm"
    :groups="groups"
    preserve-group-order
    :fuse="{
      resultLimit,
      matchAllWhenSearchEmpty: false,
      fuseOptions: {
        keys: ['label', 'suffix', 'keywords'],
      },
    }"
    @keydown.space.prevent
    @update:model-value="resetPalette"
  />
</template>
