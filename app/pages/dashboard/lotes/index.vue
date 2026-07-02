<script setup lang="ts">
definePageMeta({ middleware: 'oficina' })

const { data: lotes, pending } = await useFetch('/api/lotes')
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

    <div v-else-if="!lotes?.length" class="alert">
      <Icon name="tabler:info-circle" />
      <span>Aún no hay lotes registrados.</span>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Lote</th>
            <th>Producto</th>
            <th>Categoría</th>
            <th class="text-right">Recolecciones</th>
            <th class="text-right">Ventas</th>
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
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
