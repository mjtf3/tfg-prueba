<script setup lang="ts">
definePageMeta({ middleware: 'oficina' })

interface LoteItem {
  id: number
  codigo: string
  producto?: { nombre: string | null }
}
interface VentaItem {
  id: number
  fechaVenta: string
  kilos: number
  precioVenta: number
  total: number
  cliente?: string | null
  lote?: { codigo: string; producto?: { nombre: string | null } }
}

const { data: ventas, refresh, error: errorVentas, pending: pendingVentas } = await useFetch<VentaItem[]>('/api/ventas')
const { data: lotes, error: errorLotes, pending: pendingLotes } = await useFetch<LoteItem[]>('/api/lotes')

const form = reactive({
  loteId: null as number | null,
  fechaVenta: '',
  kilos: null as number | null,
  precioVenta: null as number | null,
  cliente: '',
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
        cliente: form.cliente.trim() || undefined,
      },
    })
    form.loteId = null
    form.fechaVenta = ''
    form.kilos = null
    form.precioVenta = null
    form.cliente = ''
    await refresh()
  } catch (e) {
    error.value = mensajeDe(e, 'No se pudo registrar la venta')
  } finally {
    saving.value = false
  }
}

function fmtFecha(f: string) {
  return new Date(f).toLocaleDateString('es-ES')
}

// Id de la venta que se está borrando, o null si no hay ninguna en curso: evita
// disparar dos borrados a la vez si el usuario pulsa varias veces.
const borrando = ref<number | null>(null)
const errorBorrado = ref('')

async function eliminar(id: number) {
  if (borrando.value !== null) return
  if (!confirm('¿Seguro que quieres eliminar esta venta?')) return
  errorBorrado.value = ''
  borrando.value = id
  try {
    await $fetch(`/api/ventas/${id}`, { method: 'DELETE' })
    await refresh()
  } catch (e) {
    errorBorrado.value = mensajeDe(e, 'No se pudo eliminar la venta')
  } finally {
    borrando.value = null
  }
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Alta de venta -->
    <div class="lg:col-span-1">
      <h1 class="text-2xl font-bold mb-4">Nueva venta</h1>

      <div v-if="errorLotes" class="alert alert-error mb-3">
        <Icon name="tabler:alert-triangle" />
        <span>No se pudieron cargar los lotes. Inténtalo de nuevo.</span>
      </div>

      <form class="flex flex-col gap-3" @submit.prevent="submit">
        <label class="form-control">
          <span class="label-text">Lote</span>
          <select v-model.number="form.loteId" required :disabled="pendingLotes" class="select select-bordered w-full">
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
            <input
              v-model.number="form.kilos"
              type="number"
              step="0.01"
              min="0.01"
              required
              class="input input-bordered w-full"
            />
          </label>
          <label class="form-control">
            <span class="label-text">Precio (€/kg)</span>
            <input
              v-model.number="form.precioVenta"
              type="number"
              step="0.01"
              min="0"
              required
              class="input input-bordered w-full"
            />
          </label>
        </div>
        <label class="form-control">
          <span class="label-text">Cliente / destino</span>
          <input v-model="form.cliente" type="text" placeholder="Opcional" class="input input-bordered w-full" />
        </label>
        <div class="text-right text-sm">
          Total: <span class="font-bold text-lg">{{ total.toFixed(2) }} €</span>
        </div>

        <div v-if="error" class="alert alert-error">
          <Icon name="tabler:alert-triangle" /><span>{{ error }}</span>
        </div>

        <button type="submit" class="btn btn-primary" :disabled="saving || !form.loteId">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          Registrar venta
        </button>
      </form>
    </div>

    <!-- Listado -->
    <div class="lg:col-span-2">
      <h2 class="text-lg font-semibold mb-2">Ventas registradas</h2>

      <div v-if="errorBorrado" class="alert alert-error mb-3">
        <Icon name="tabler:alert-triangle" />
        <span>{{ errorBorrado }}</span>
      </div>

      <div v-if="pendingVentas" class="flex justify-center p-8"><span class="loading loading-spinner" /></div>

      <div v-else-if="errorVentas" class="alert alert-error">
        <Icon name="tabler:alert-triangle" />
        <span>No se pudieron cargar las ventas. Inténtalo de nuevo.</span>
      </div>

      <div v-else-if="!ventas?.length" class="alert">
        <Icon name="tabler:info-circle" /><span>Aún no hay ventas.</span>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Lote</th>
              <th>Producto</th>
              <th>Cliente</th>
              <th class="text-right">Kg</th>
              <th class="text-right">€/kg</th>
              <th class="text-right">Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in ventas" :key="v.id" class="hover">
              <td>{{ fmtFecha(v.fechaVenta) }}</td>
              <td class="font-mono">{{ v.lote?.codigo }}</td>
              <td>{{ v.lote?.producto?.nombre }}</td>
              <td>{{ v.cliente || '—' }}</td>
              <td class="text-right">{{ v.kilos }}</td>
              <td class="text-right">{{ v.precioVenta }}</td>
              <td class="text-right font-semibold">{{ v.total }}</td>
              <td class="text-right">
                <button
                  type="button"
                  class="btn btn-ghost btn-xs text-error"
                  :disabled="borrando === v.id"
                  @click="eliminar(v.id)"
                >
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
