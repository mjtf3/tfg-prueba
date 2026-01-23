<script setup lang="ts">
import SocialSignIn from '~/components/login/SocialSignIn.vue'

const { githubSignIn, googleSignIn } = useAuth()
const deshabilitado = ref(false)

function handleInicioSesion(iniciador: () => void) {
  deshabilitado.value = true
  iniciador()
}
</script>

<template>
  <div class="flex items-center justify-center">
    <div class="w-full max-w-md bg-gray-200 p-8 m-4 rounded-4xl">
      <div class="space-y-12">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900">¡Bienvenido!</h1>
        </div>
        <div class="space-y-6">
          <SocialSignIn
            nombre="Google"
            nombre_icono="tabler:brand-google"
            :deshabilitado="deshabilitado"
            @inicio_sesion="handleInicioSesion(googleSignIn)"
          />
          <SocialSignIn
            nombre="Github"
            nombre_icono="tabler:brand-github"
            :deshabilitado="deshabilitado"
            @inicio_sesion="handleInicioSesion(githubSignIn)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
