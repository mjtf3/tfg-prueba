<script setup lang="ts">
definePageMeta({ middleware: 'oficina' })

const { data: recolecciones, pending, error, refresh } = await useFetch('/api/recolecciones')

const eliminandoId = ref<number | null>(null)
const errorEliminar = ref('')

function fmtFecha(f: string) {
  return new Date(f).toLocaleDateString('es-ES')
}

async function eliminar(r: { id: number; codigoTrazabilidad: string }) {
  if (eliminandoId.value !== null) return
  if (!confirm(`¿Eliminar la recolección ${r.codigoTrazabilidad}?`)) return
  errorEliminar.value = ''
  eliminandoId.value = r.id
  try {
    await $fetch(`/api/recolecciones/${r.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e) {
    errorEliminar.value = mensajeDe(e, 'No se pudo eliminar la recolección')
  } finally {
    eliminandoId.value = null
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold">Recolecciones</h1>
      <NuxtLink to="/dashboard/recolecciones/nueva" class="btn btn-primary btn-sm">
        <Icon name="tabler:plus" /> Nueva
      </NuxtLink>
    </div>

    <div v-if="pending" class="flex justify-center p-8"><span class="loading loading-spinner" /></div>

    <div v-else-if="error" class="alert alert-error">
      <Icon name="tabler:alert-triangle" />
      <span>No se pudieron cargar las recolecciones. Inténtalo de nuevo.</span>
    </div>

    <div v-else-if="!recolecciones?.length" class="alert">
      <Icon name="tabler:info-circle" />
      <span>Aún no hay recolecciones registradas.</span>
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
              <th>Trazabilidad</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th class="text-right">Palés</th>
              <th class="text-right">Kg totales</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in recolecciones" :key="r.id" class="hover">
              <td>
                <NuxtLink :to="`/dashboard/recolecciones/${r.id}`" class="link link-primary font-mono">
                  {{ r.codigoTrazabilidad }}
                </NuxtLink>
              </td>
              <td>{{ fmtFecha(r.fechaRecoleccion) }}</td>
              <td>
                <span class="badge" :class="r.tipo === 'propio' ? 'badge-success' : 'badge-warning'">
                  {{ r.tipo }}
                </span>
              </td>
              <td>{{ r.producto?.nombre }}</td>
              <td>{{ r.categoria?.nombre }}</td>
              <td class="text-right">{{ r.numPales }}</td>
              <td class="text-right">{{ r.totalKilos }}</td>
              <td class="text-right">
                <button class="btn btn-ghost btn-xs text-error" :disabled="eliminandoId === r.id" @click="eliminar(r)">
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
