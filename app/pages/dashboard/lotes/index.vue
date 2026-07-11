<script setup lang="ts">
definePageMeta({ middleware: 'oficina' })

const { data: lotes, pending, error, refresh } = await useFetch('/api/lotes')

const eliminandoId = ref<number | null>(null)
const errorEliminar = ref('')

async function eliminar(l: { id: number; codigo: string }) {
  if (eliminandoId.value !== null) return
  if (!confirm(`¿Eliminar el lote ${l.codigo}?`)) return
  errorEliminar.value = ''
  eliminandoId.value = l.id
  try {
    await $fetch(`/api/lotes/${l.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e) {
    errorEliminar.value = mensajeDe(e, 'No se pudo eliminar el lote')
  } finally {
    eliminandoId.value = null
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold">Lotes</h1>
      <NuxtLink to="/dashboard/lotes/nueva" class="btn btn-primary btn-sm">
        <Icon name="tabler:plus" /> Nuevo
      </NuxtLink>
    </div>

    <div v-if="pending" class="flex justify-center p-8"><span class="loading loading-spinner" /></div>

    <div v-else-if="error" class="alert alert-error">
      <Icon name="tabler:alert-triangle" />
      <span>No se pudieron cargar los lotes. Inténtalo de nuevo.</span>
    </div>

    <div v-else-if="!lotes?.length" class="alert">
      <Icon name="tabler:info-circle" />
      <span>Aún no hay lotes registrados.</span>
    </div>

    <div v-else>
      <div v-if="errorEliminar" class="alert alert-error mb-4">
        <Icon name="tabler:alert-triangle" />
        <span>{{ errorEliminar }}</span>
      </div>

      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Lote</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th class="text-right">Recolecciones</th>
              <th class="text-right">Ventas</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in lotes" :key="l.id" class="hover">
              <td>
                <NuxtLink :to="`/dashboard/lotes/${l.id}`" class="link link-primary font-mono">{{ l.codigo }}</NuxtLink>
              </td>
              <td>{{ l.producto?.nombre }}</td>
              <td>{{ l.categoria?.nombre }}</td>
              <td class="text-right">{{ l.numRecolecciones }}</td>
              <td class="text-right">{{ l.numVentas }}</td>
              <td class="text-right">
                <button class="btn btn-ghost btn-xs text-error" :disabled="eliminandoId === l.id" @click="eliminar(l)">
                  <Icon name="tabler:trash" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
