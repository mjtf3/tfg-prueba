<script setup lang="ts">
definePageMeta({ middleware: 'oficina' })

const route = useRoute()
const { data: rec, error } = await useFetch(`/api/recolecciones/${route.params.id}`)

function fmtFecha(f: string) {
  return new Date(f).toLocaleDateString('es-ES')
}
function imprimir() {
  window.print()
}
</script>

<template>
  <div v-if="error" class="alert alert-error">
    <Icon name="tabler:alert-triangle" />
    <span>No se encontró la recolección.</span>
  </div>

  <div v-else-if="rec">
    <div class="flex items-center justify-between mb-4 print:hidden">
      <NuxtLink to="/dashboard/recolecciones" class="btn btn-ghost btn-sm">
        <Icon name="tabler:arrow-left" /> Volver
      </NuxtLink>
      <button class="btn btn-primary btn-sm" @click="imprimir">
        <Icon name="tabler:printer" /> Imprimir etiquetas
      </button>
    </div>

    <h1 class="text-2xl font-bold font-mono">{{ rec.codigoTrazabilidad }}</h1>
    <span class="badge my-2" :class="rec.tipo === 'propio' ? 'badge-success' : 'badge-warning'">
      {{ rec.tipo }}
    </span>

    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 my-4">
      <div><div class="text-xs opacity-60">Fecha</div>{{ fmtFecha(rec.fechaRecoleccion) }}</div>
      <div><div class="text-xs opacity-60">Producto</div>{{ rec.producto?.nombre }}</div>
      <div><div class="text-xs opacity-60">Categoría</div>{{ rec.categoria?.nombre }}</div>
      <div v-if="rec.albaran"><div class="text-xs opacity-60">Albarán</div>{{ rec.albaran }}</div>
      <div v-if="rec.precioCoste"><div class="text-xs opacity-60">Coste (€/kg)</div>{{ rec.precioCoste }}</div>
      <div><div class="text-xs opacity-60">Total</div>{{ rec.totalKilos }} kg</div>
      <template v-if="rec.tipo === 'propio'">
        <div v-if="rec.parcela">
          <div class="text-xs opacity-60">Origen</div>
          {{ rec.parcela.pueblo?.nombre }} / {{ rec.parcela.nombre || rec.parcela.codigo }}
          <span v-if="rec.recinto"> / {{ rec.recinto.codigo }}</span>
        </div>
        <div v-if="rec.finca"><div class="text-xs opacity-60">Finca</div>{{ rec.finca.nombre }}</div>
      </template>
      <div v-else-if="rec.proveedor"><div class="text-xs opacity-60">Proveedor</div>{{ rec.proveedor.nombre }}</div>
    </div>

    <h2 class="text-lg font-semibold mb-2">Palés ({{ rec.pales.length }})</h2>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <div v-for="p in rec.pales" :key="p.id" class="card card-compact bg-base-100 border border-base-300">
        <figure class="pt-4"><img :src="p.qrDataUrl" :alt="p.qr" class="w-32 h-32" /></figure>
        <div class="card-body items-center text-center">
          <span class="font-mono text-xs">{{ p.qr }}</span>
          <span class="text-sm opacity-70">{{ p.numCajas }} cajas · {{ p.kilos }} kg</span>
        </div>
      </div>
    </div>
  </div>
</template>
