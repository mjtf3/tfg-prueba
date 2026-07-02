<script setup lang="ts">
const { user } = useAuth()
const role = computed(() => user.value?.role)
</script>

<template>
  <ul class="menu bg-base-200 w-60 p-4 h-full shadow-md">
    <li class="menu-title">{{ role === 'oficina' ? 'Oficina / gerencia' : 'Operario de almacén' }}</li>
    <li><NuxtLink to="/dashboard">Dashboard</NuxtLink></li>
    <li v-if="role === 'oficina'"><NuxtLink to="/dashboard/recolecciones">Recolecciones</NuxtLink></li>
    <li v-if="role === 'oficina'"><NuxtLink to="/dashboard/lotes">Lotes</NuxtLink></li>
    <li v-if="role === 'oficina'"><NuxtLink to="/dashboard/ventas">Ventas</NuxtLink></li>
    <li><NuxtLink to="/dashboard/escaneo">Escaneo</NuxtLink></li>
    <!--
      Enlaces por rol pendientes de sprints siguientes:
        ambos    -> Trazabilidad (S7)
    -->
  </ul>
</template>
