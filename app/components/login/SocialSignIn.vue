<script setup lang="ts">
const props = defineProps(['nombre', 'nombre_icono'])
const emits = defineEmits(['inicio_sesion'])
</script>

<template>
  <div class="space-y-6">
    <button
      class="w-full bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-900 font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
      @click="() => emits('inicio_sesion')"
    >
      <Icon :name="nombre_icono" size="32" />
      Iniciar sesion con {{ nombre }}
    </button>
  </div>
</template>
