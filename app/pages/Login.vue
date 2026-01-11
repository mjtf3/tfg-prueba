<script setup lang="ts">
import SocialSignIn from '~/components/login/SocialSignIn.vue'

const { session, githubSignIn, signOut } = useAuth()
</script>

<template>
  <div
    class="flex items-center justify-center min-h-screen bg-linear-to-br from-amber-50 to-orange-100"
  >
    <div class="w-full max-w-md">
      <div v-if="!session?.data" class="space-y-6">
        <div class="text-center space-y-2">
          <h1 class="text-3xl font-bold text-gray-900">Hola</h1>
        </div>
        <SocialSignIn
          nombre="Github"
          nombre_icono="tabler:brand-github"
          @inicio_sesion="githubSignIn"
        />
      </div>
      <div v-else class="bg-white rounded-lg shadow-xl p-8 space-y-6">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
          <p class="text-gray-600">You are signed in</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <pre class="text-xs text-gray-700 overflow-auto max-h-64 font-mono">{{
            JSON.stringify(session.data, null, 2)
          }}</pre>
        </div>
        <button
          @click="signOut()"
          class="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </div>
  </div>
</template>
