<script setup lang="ts">
definePageMeta({ middleware: 'oficina' })

const { data, pending } = await useFetch('/api/informes')
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">Informes</h1>

    <div v-if="pending" class="flex justify-center p-8"><span class="loading loading-spinner" /></div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h2 class="text-lg font-semibold mb-2">Ventas por producto</h2>
        <div v-if="!data?.ventasPorProducto.length" class="alert"><span>Sin ventas registradas.</span></div>
        <div v-else class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr><th>Producto</th><th class="text-right">Ventas</th><th class="text-right">Kg</th><th class="text-right">Importe (€)</th></tr>
            </thead>
            <tbody>
              <tr v-for="v in data.ventasPorProducto" :key="v.producto ?? ''">
                <td>{{ v.producto }}</td>
                <td class="text-right">{{ v.numVentas }}</td>
                <td class="text-right">{{ v.totalKilos }}</td>
                <td class="text-right font-semibold">{{ v.totalImporte }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-semibold mb-2">Recolecciones por origen</h2>
        <div v-if="!data?.recoleccionesPorTipo.length" class="alert"><span>Sin recolecciones registradas.</span></div>
        <div v-else class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr><th>Tipo</th><th class="text-right">Recolecciones</th></tr>
            </thead>
            <tbody>
              <tr v-for="r in data.recoleccionesPorTipo" :key="r.tipo">
                <td><span class="badge" :class="r.tipo === 'propio' ? 'badge-success' : 'badge-warning'">{{ r.tipo }}</span></td>
                <td class="text-right">{{ r.numRecolecciones }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
