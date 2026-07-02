<script setup lang="ts">
definePageMeta({ middleware: 'oficina' })

interface LoteItem {
  id: number
  codigo: string
  producto?: { nombre: string | null }
}

const { data: ventas, refresh } = await useFetch('/api/ventas')
const { data: lotes } = await useFetch<LoteItem[]>('/api/lotes')

const form = reactive({
  loteId: null as number | null,
  fechaVenta: '',
  kilos: null as number | null,
  precioVenta: null as number | null,
})

const total = computed(() => (Number(form.kilos) || 0) * (Number(form.precioVenta) || 0))

const saving = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  saving.value = true
  try {
    await $fetch('/api/ventas', {
      method: 'POST',
      body: {
        loteId: form.loteId,
        fechaVenta: form.fechaVenta,
        kilos: Number(form.kilos),
        precioVenta: Number(form.precioVenta),
      },
    })
    form.loteId = null
    form.fechaVenta = ''
    form.kilos = null
    form.precioVenta = null
    await refresh()
  } catch (e) {
    const err = e as { data?: { statusMessage?: string }; statusMessage?: string }
    error.value = err?.data?.statusMessage || err?.statusMessage || 'No se pudo registrar la venta'
  } finally {
    saving.value = false
  }
}

function fmtFecha(f: string) {
  return new Date(f).toLocaleDateString('es-ES')
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Alta de venta -->
    <div class="lg:col-span-1">
      <h1 class="text-2xl font-bold mb-4">Nueva venta</h1>
      <form class="flex flex-col gap-3" @submit.prevent="submit">
        <label class="form-control">
          <span class="label-text">Lote</span>
          <select v-model.number="form.loteId" required class="select select-bordered w-full">
            <option :value="null" disabled>Selecciona…</option>
            <option v-for="l in lotes" :key="l.id" :value="l.id">{{ l.codigo }} · {{ l.producto?.nombre }}</option>
          </select>
        </label>
        <label class="form-control">
          <span class="label-text">Fecha</span>
          <input v-model="form.fechaVenta" type="date" required class="input input-bordered w-full" />
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="form-control">
            <span class="label-text">Kilos</span>
            <input v-model.number="form.kilos" type="number" step="0.01" min="0" required class="input input-bordered w-full" />
          </label>
          <label class="form-control">
            <span class="label-text">Precio (€/kg)</span>
            <input v-model.number="form.precioVenta" type="number" step="0.01" min="0" required class="input input-bordered w-full" />
          </label>
        </div>
        <div class="text-right text-sm">Total: <span class="font-bold text-lg">{{ total.toFixed(2) }} €</span></div>

        <div v-if="error" class="alert alert-error"><Icon name="tabler:alert-triangle" /><span>{{ error }}</span></div>

        <button type="submit" class="btn btn-primary" :disabled="saving || !form.loteId">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          Registrar venta
        </button>
      </form>
    </div>

    <!-- Listado -->
    <div class="lg:col-span-2">
      <h2 class="text-lg font-semibold mb-2">Ventas registradas</h2>
      <div v-if="!ventas?.length" class="alert">
        <Icon name="tabler:info-circle" /><span>Aún no hay ventas.</span>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr><th>Fecha</th><th>Lote</th><th>Producto</th><th class="text-right">Kg</th><th class="text-right">€/kg</th><th class="text-right">Total</th></tr>
          </thead>
          <tbody>
            <tr v-for="v in ventas" :key="v.id" class="hover">
              <td>{{ fmtFecha(v.fechaVenta) }}</td>
              <td class="font-mono">{{ v.lote?.codigo }}</td>
              <td>{{ v.lote?.producto?.nombre }}</td>
              <td class="text-right">{{ v.kilos }}</td>
              <td class="text-right">{{ v.precioVenta }}</td>
              <td class="text-right font-semibold">{{ v.total }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
