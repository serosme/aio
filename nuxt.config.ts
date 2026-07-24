export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  ui: {
    fonts: false,
  },
  devServer: {
    port: 2999,
  },
  vite: {
    optimizeDeps: {
      include: ['@audio/decode', '@audio/encode', '@vueuse/core', 'pinyin-pro'],
    },
  },
})
