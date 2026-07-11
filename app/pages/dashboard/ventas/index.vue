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
  cliente: string
  anuladaAt: string | null
  motivoAnulacion: string | null
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
        cliente: form.cliente.trim(),
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

// Id de la venta que se está anulando, o null si no hay ninguna en curso: evita
// disparar dos anulaciones a la vez si el usuario pulsa varias veces.
const anulando = ref<number | null>(null)
const errorAnulacion = ref('')

async function anular(id: number) {
  if (anulando.value !== null) return
  // El prompt hace también de confirmación: cancelarlo aborta la anulación.
  const motivo = prompt('Anular venta: la venta se conservará en el histórico como anulada.\nMotivo (opcional):')
  if (motivo === null) return
  errorAnulacion.value = ''
  anulando.value = id
  try {
    await $fetch(`/api/ventas/${id}`, { method: 'DELETE', body: { motivo: motivo.trim() || undefined } })
    await refresh()
  } catch (e) {
    errorAnulacion.value = mensajeDe(e, 'No se pudo anular la venta')
  } finally {
    anulando.value = null
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
          <input v-model="form.cliente" type="text" required class="input input-bordered w-full" />
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

      <div v-if="errorAnulacion" class="alert alert-error mb-3">
        <Icon name="tabler:alert-triangle" />
        <span>{{ errorAnulacion }}</span>
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
            <tr v-for="v in ventas" :key="v.id" class="hover" :class="{ 'opacity-50': v.anuladaAt }">
              <td>{{ fmtFecha(v.fechaVenta) }}</td>
              <td class="font-mono">{{ v.lote?.codigo }}</td>
              <td>{{ v.lote?.producto?.nombre }}</td>
              <td>{{ v.cliente || '—' }}</td>
              <td class="text-right">{{ v.kilos }}</td>
              <td class="text-right">{{ v.precioVenta }}</td>
              <td class="text-right font-semibold">{{ v.total }}</td>
              <td class="text-right">
                <span v-if="v.anuladaAt" class="badge badge-ghost" :title="v.motivoAnulacion || undefined">
                  Anulada
                </span>
                <button
                  v-else
                  type="button"
                  class="btn btn-ghost btn-xs text-error"
                  :disabled="anulando === v.id"
                  title="Anular venta"
                  @click="anular(v.id)"
                >
                  <Icon name="tabler:ban" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
