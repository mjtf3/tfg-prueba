import tailwindcss from '@tailwindcss/vite'
// https://nuxt.com/docs/api/configuration/nuxt-config

import env from './server/utils/env'
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  nitro: {
    preset: 'bun',
  },

  runtimeConfig: {
    // Variables públicas (accesibles en cliente y servidor)
    public: {
      authBaseUrl: env.BETTER_AUTH_URL,
    },
  },

  modules: ['@nuxt/icon', '@nuxt/image'],
})