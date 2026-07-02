<script setup lang="ts">
definePageMeta({ middleware: 'oficina' })

const route = useRoute()
const { data: lote, error, refresh } = await useFetch(`/api/lotes/${route.params.id}`)

const cajaSeleccion = ref<number[]>([])
const cajaCodigo = ref('')
const cajaError = ref('')
const guardandoCaja = ref(false)

// Tope de 2 recolecciones por caja: se deshabilitan más casillas al llegar a 2.
function casillaBloqueada(recoleccionId: number) {
  return cajaSeleccion.value.length >= 2 && !cajaSeleccion.value.includes(recoleccionId)
}

async function addCaja() {
  cajaError.value = ''
  guardandoCaja.value = true
  try {
    await $fetch('/api/cajas', {
      method: 'POST',
      body: {
        loteId: Number(route.params.id),
        codigo: cajaCodigo.value || undefined,
        recoleccionIds: cajaSeleccion.value,
      },
    })
    cajaSeleccion.value = []
    cajaCodigo.value = ''
    await refresh()
  } catch (e) {
    cajaError.value = mensajeDe(e, 'No se pudo crear la caja')
  } finally {
    guardandoCaja.value = false
  }
}

function fmtFecha(f: string) {
  return new Date(f).toLocaleDateString('es-ES')
}
</script>

<template>
  <div v-if="error" class="alert alert-error">
    <Icon name="tabler:alert-triangle" />
    <span>No se encontró el lote.</span>
  </div>

  <div v-else-if="lote">
    <NuxtLink to="/dashboard/lotes" class="btn btn-ghost btn-sm mb-4">
      <Icon name="tabler:arrow-left" /> Volver
    </NuxtLink>

    <h1 class="text-2xl font-bold font-mono">Lote {{ lote.codigo }}</h1>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 my-4">
      <div><div class="text-xs opacity-60">Producto</div>{{ lote.producto?.nombre }}</div>
      <div><div class="text-xs opacity-60">Categoría</div>{{ lote.categoria?.nombre }}</div>
      <div v-if="lote.numPiezas != null"><div class="text-xs opacity-60">Nº piezas</div>{{ lote.numPiezas }}</div>
      <div v-if="lote.rgseaa"><div class="text-xs opacity-60">RGSEAA</div>{{ lote.rgseaa }}</div>
      <div v-if="lote.ggn"><div class="text-xs opacity-60">GGN</div>{{ lote.ggn }}</div>
      <div v-if="lote.origen"><div class="text-xs opacity-60">Origen</div>{{ lote.origen }}</div>
    </div>

    <!-- Recolecciones agrupadas -->
    <h2 class="text-lg font-semibold mb-2">Recolecciones ({{ lote.recolecciones.length }})</h2>
    <div class="flex flex-wrap gap-2 mb-6">
      <span v-for="lr in lote.recolecciones" :key="lr.recoleccionId" class="badge badge-outline font-mono">
        {{ lr.recoleccion?.codigoTrazabilidad }}
      </span>
    </div>

    <!-- Ventas -->
    <h2 class="text-lg font-semibold mb-2">Ventas ({{ lote.ventas.length }})</h2>
    <div v-if="lote.ventas.length" class="overflow-x-auto mb-6">
      <table class="table table-sm">
        <thead><tr><th>Fecha</th><th class="text-right">Kg</th><th class="text-right">€/kg</th><th class="text-right">Total</th></tr></thead>
        <tbody>
          <tr v-for="v in lote.ventas" :key="v.id">
            <td>{{ fmtFecha(v.fechaVenta) }}</td>
            <td class="text-right">{{ v.kilos }}</td>
            <td class="text-right">{{ v.precioVenta }}</td>
            <td class="text-right font-semibold">{{ v.total }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="text-sm opacity-70 mb-6">Sin ventas registradas.</p>

    <!-- Cajas -->
    <h2 class="text-lg font-semibold mb-2">Cajas de producto terminado ({{ lote.cajas.length }})</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <span v-for="c in lote.cajas" :key="c.id" class="badge badge-neutral">
        {{ c.codigo || `#${c.id}` }} · {{ c.recolecciones.length }} recol.
      </span>
    </div>

    <!-- Alta de caja -->
    <div class="border border-base-300 rounded-box p-4 max-w-lg">
      <span class="font-semibold">Añadir caja</span>
      <label class="form-control my-2">
        <span class="label-text">Código (opcional)</span>
        <input v-model="cajaCodigo" type="text" class="input input-bordered input-sm w-full" />
      </label>
      <p class="text-sm opacity-70">Selecciona hasta 2 recolecciones del lote:</p>
      <div class="flex flex-col gap-1 my-2">
        <label v-for="lr in lote.recolecciones" :key="lr.recoleccionId" class="label cursor-pointer justify-start gap-3">
          <input
            v-model="cajaSeleccion"
            type="checkbox"
            :value="lr.recoleccionId"
            :disabled="casillaBloqueada(lr.recoleccionId)"
            class="checkbox checkbox-sm"
          />
          <span class="font-mono text-sm">{{ lr.recoleccion?.codigoTrazabilidad }}</span>
        </label>
      </div>
      <div v-if="cajaError" class="alert alert-error alert-sm mb-2"><span>{{ cajaError }}</span></div>
      <button class="btn btn-primary btn-sm" :disabled="guardandoCaja || !cajaSeleccion.length" @click="addCaja">
        <span v-if="guardandoCaja" class="loading loading-spinner loading-sm" />
        Añadir caja
      </button>
    </div>
  </div>
</template>
