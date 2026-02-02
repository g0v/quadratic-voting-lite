// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@prisma/nuxt'],
  experimental: {
    componentIslands: true,
  },
  css: ['~/assets/css/main.css', '~/assets/css/font.css'],
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
      'postcss-nested': {},
    },
  },
  alias: {
    '.prisma/client': '~/node_modules/.prisma/client',
  },
})
