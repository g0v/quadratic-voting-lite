// https://nuxt.com/docs/api/configuration/nuxt-config
import dotenv from 'dotenv'
dotenv.config()

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ["@prisma/nuxt"],
  experimental: {
    componentIslands: true,
  },
  css: ['~/assets/css/main.css', '~/assets/css/font.css'],
  postcss: {
    plugins: {
      "@tailwindcss/postcss": {},
      'postcss-nested': {},
    }
  },
   alias: {
    '.prisma/client/index-browser': '@prisma/client',
    '.prisma/client/default': '@prisma/client',
  }
})
