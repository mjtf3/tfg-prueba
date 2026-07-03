<script setup lang="ts">
// El menú lateral se colapsa en móvil (drawer) y queda fijo en escritorio
// (lg:drawer-open). Al navegar se cierra automáticamente en móvil.
const menuAbierto = ref(false)
const route = useRoute()
watch(
  () => route.fullPath,
  () => {
    menuAbierto.value = false
  }
)
</script>

<template>
  <NuxtLayout name="default">
    <div class="drawer lg:drawer-open h-full">
      <input id="dash-drawer" v-model="menuAbierto" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content overflow-y-auto">
        <NuxtPage class="p-4" />
      </div>
      <div class="drawer-side z-20 print:hidden">
        <label for="dash-drawer" aria-label="Cerrar menú" class="drawer-overlay"></label>
        <dashboard-sidebar />
      </div>
    </div>
  </NuxtLayout>
</template>
