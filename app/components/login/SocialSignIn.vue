<script setup lang="ts">
const props = defineProps<{
  nombre: string
  nombre_icono: string
  cargando: boolean
}>()
const emits = defineEmits(['inicio_sesion'])
</script>

<template>
  <div>
    <button
      class="btn btn-primary w-full hover:scale-103 transition-transform duration-250 h-auto py-2"
      @click="() => emits('inicio_sesion')"
      :disabled="cargando"
    >
      <span class="loading loading-bars loading-xl" v-if="cargando"></span>
      <Icon :name="nombre_icono" class="min-h-8 min-w-8 mx-2" />
      <span class="text-xl text-center text-balance">Iniciar sesión con {{ nombre }}</span>
    </button>
  </div>
</template>
