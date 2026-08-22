<script setup lang="ts">
const { recording, result } = useVoiceInput()
</script>

<template>
  <div class="p-8">
    <p v-if="recording">
      正在录音
    </p>
    <p v-else-if="result">
      {{ result }}
    </p>
    <p v-else>
      等待录音
    </p>
  </div>
</template>
