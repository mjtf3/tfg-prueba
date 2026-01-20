<script setup lang="ts">
const { user } = useAuth()
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
        <NuxtLink to="/login" class="btn btn-primary">Inicia sesión</NuxtLink>
      </div>
    </div>
  </div>
</template>
