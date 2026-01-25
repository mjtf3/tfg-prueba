<script setup lang="ts">
const { user } = useAuth()
definePageMeta({
  auth: false
})
</script>

<template>
  <div class="hero relative">
    <NuxtImg
      src="/hero-image.jpg"
      class="absolute inset-0 w-full h-full object-cover -z-10"
      alt="Fondo de bienvenida"
      format="webp"
      quality="80"
      sizes="100vw sm:100vw md:100vw lg:100vw"
    />
    <div class="hero-content text-center bg-gray-50 rounded-3xl">
      <div class="max-w-lg">
        <h1 class="text-5xl font-bold p-2 m-2">¡Bienvenidos a mi app para el TFG!</h1>
        <p class="py-6 text-2xl">
          {{ user ? `Hola ${user.name}` : 'Por favor, inicia sesión para continuar.' }}
        </p>
        <NuxtLink v-if="!user" to="/login" class="btn btn-primary">Inicia sesión</NuxtLink>
        <NuxtLink v-else to="/dashboard" class="btn btn-primary">Ir a la dashboard</NuxtLink>
      </div>
    </div>
  </div>
</template>
