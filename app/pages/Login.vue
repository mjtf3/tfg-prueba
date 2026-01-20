<script setup lang="ts">
import SocialSignIn from '~/components/login/SocialSignIn.vue'

const { githubSignIn, googleSignIn } = useAuth()
</script>

<template>
  <div class="flex items-center justify-center">
    <div class="w-full max-w-md bg-gray-200 p-8 rounded-4xl">
      <div class="space-y-6">
        <div class="text-center space-y-2">
          <h1 class="text-3xl font-bold text-gray-900">¡Bienvenido!</h1>
        </div>
        <SocialSignIn nombre="Github" nombre_icono="tabler:brand-github" @inicio_sesion="githubSignIn" />
        <SocialSignIn nombre="Google" nombre_icono="tabler:brand-google" @inicio_sesion="googleSignIn" />
      </div>
    </div>
  </div>
</template>
