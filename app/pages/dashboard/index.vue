<script setup lang="ts">
const { user } = useAuth()
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold">Dashboard</h1>
    <p>Bienvenido/a, {{ user?.name }}</p>
    <p>Esta es la página pricipal del dashboard</p>
  </div>
</template>
