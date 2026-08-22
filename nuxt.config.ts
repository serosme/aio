import process from 'node:process'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: false },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  ui: {
    fonts: false,
  },
  icon: {
    provider: 'none',
    clientBundle: {
      scan: {
        globInclude: ['**/*.{vue,jsx,tsx,ts,md,mdc,mdx,yml,yaml}'],
      },
    },
  },
  devServer: {
    port: Number(process.env.DEV_PORT ?? 2999),
  },
  nitro: {
    experimental: {
      websocket: true,
    },
  },
  vite: {
    optimizeDeps: {
      include: ['pinyin-pro'],
    },
  },
})
