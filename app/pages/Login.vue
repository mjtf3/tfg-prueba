<script setup lang="ts">
import SocialSignIn from '~/components/login/SocialSignIn.vue'

const { githubSignIn } = useAuth()
</script>

<template>
  <div
    class="flex items-center justify-center min-h-screen bg-linear-to-br from-amber-50 to-orange-100"
  >
    <div class="w-full max-w-md">
      <div class="space-y-6">
        <div class="text-center space-y-2">
          <h1 class="text-3xl font-bold text-gray-900">Hola</h1>
        </div>
        <SocialSignIn
          nombre="Github"
          nombre_icono="tabler:brand-github"
          @inicio_sesion="githubSignIn"
        />
      </div>
    </div>
  </div>
</template>
