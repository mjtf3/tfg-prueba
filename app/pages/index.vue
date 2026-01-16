<script setup lang="ts">
const { signOut, session, loggedIn, user } = useAuth()
</script>

<template>
  <div class="container mx-auto">
    <div class="w-full flex items-center justify-center p-4">
      <h1 class="text-4xl font-bold text-gray-900">Bienvenidos</h1>
    </div>
    <div v-if="loggedIn" class="w-full flex flex-col items-center justify-center p-4">
      <div class="bg-green-100 text-green-800 p-4 rounded-lg mb-4 border border-green-200">
        Has iniciado sesión correctamente.
      </div>
      <h2 class="text-2xl">Hola {{ user?.name }}</h2>
      <button @click="signOut()" class="btn btn-primary mt-4">Cerrar sesión</button>
    </div>
    <div v-else class="w-full flex flex-col items-center justify-center p-4">
      <div class="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-4 border border-yellow-200">
        No has iniciado sesión. Por favor, inicia sesión para continuar.
      </div>
      <NuxtLink to="/login" class="btn btn-primary mt-4">Iniciar sesión</NuxtLink>
    </div>
  </div>
</template>
