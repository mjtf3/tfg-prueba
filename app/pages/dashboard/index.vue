<script setup lang="ts">
const { user } = useAuth()
</script>

<template>
  <div>
    <h1>Dashboard</h1>
    <p>Welcome, {{ user?.name }}</p>
    <NuxtLink to="/dashboard/pagina1">Pagina 1</NuxtLink>
  </div>
</template>