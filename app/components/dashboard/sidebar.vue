<script setup lang="ts">
const { user } = useAuth()
const role = computed(() => user.value?.role)
</script>

<template>
  <ul class="menu bg-base-200 w-60 p-4 h-full shadow-md">
    <li class="menu-title">{{ role === 'oficina' ? 'Oficina / gerencia' : 'Operario de almacén' }}</li>
    <li><NuxtLink to="/dashboard">Dashboard</NuxtLink></li>
    <li v-if="role === 'oficina'"><NuxtLink to="/dashboard/recolecciones">Recolecciones</NuxtLink></li>
    <!--
      Enlaces por rol pendientes de sprints siguientes:
        oficina  -> Lotes y Ventas (S6), Informes (S7)
        operario -> Escaneo (S5)
        ambos    -> Trazabilidad (S7)
    -->
  </ul>
</template>
