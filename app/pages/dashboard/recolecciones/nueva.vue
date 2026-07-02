<script setup lang="ts">
definePageMeta({ middleware: 'oficina' })

interface Catalogo {
  id: number
  nombre: string | null
  codigo?: string
}

const router = useRouter()

const { data: pueblos } = await useFetch<Catalogo[]>('/api/catalogos/pueblos')
const { data: fincas } = await useFetch<Catalogo[]>('/api/catalogos/fincas')
const { data: productos } = await useFetch<Catalogo[]>('/api/catalogos/productos')
const { data: categorias } = await useFetch<Catalogo[]>('/api/catalogos/categorias')
const { data: proveedores } = await useFetch<Catalogo[]>('/api/catalogos/proveedores')

const parcelas = ref<Catalogo[]>([])
const recintos = ref<Catalogo[]>([])

const form = reactive({
  tipo: 'propio' as 'propio' | 'comprado',
  fechaRecoleccion: '',
  albaran: '',
  precioCoste: null as number | null,
  productoId: null as number | null,
  categoriaId: null as number | null,
  puebloId: null as number | null,
  parcelaId: null as number | null,
  recintoId: null as number | null,
  fincaId: null as number | null,
  proveedorId: null as number | null,
})

const pales = ref([{ numCajas: 0, kilos: 0 }])
const totalKilos = computed(() => pales.value.reduce((s, p) => s + Number(p.kilos || 0), 0))

watch(
  () => form.puebloId,
  async (id) => {
    form.parcelaId = null
    form.recintoId = null
    recintos.value = []
    parcelas.value = id ? await $fetch('/api/catalogos/parcelas', { query: { puebloId: id } }) : []
  }
)

watch(
  () => form.parcelaId,
  async (id) => {
    form.recintoId = null
    recintos.value = id ? await $fetch('/api/catalogos/recintos', { query: { parcelaId: id } }) : []
  }
)

function addPale() {
  pales.value.push({ numCajas: 0, kilos: 0 })
}
function removePale(i: number) {
  if (pales.value.length > 1) pales.value.splice(i, 1)
}

const saving = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  saving.value = true
  try {
    const payload: Record<string, unknown> = {
      tipo: form.tipo,
      fechaRecoleccion: form.fechaRecoleccion,
      albaran: form.albaran || undefined,
      precioCoste: form.precioCoste ?? undefined,
      productoId: form.productoId,
      categoriaId: form.categoriaId,
      pales: pales.value.map((p) => ({ numCajas: Number(p.numCajas), kilos: Number(p.kilos) })),
    }
    if (form.tipo === 'propio') {
      payload.parcelaId = form.parcelaId
      payload.recintoId = form.recintoId ?? undefined
      payload.fincaId = form.fincaId ?? undefined
    } else {
      payload.proveedorId = form.proveedorId
    }
    const rec = await $fetch<{ id: number }>('/api/recolecciones', { method: 'POST', body: payload })
    await router.push(`/dashboard/recolecciones/${rec.id}`)
  } catch (e) {
    const err = e as { data?: { statusMessage?: string }; statusMessage?: string }
    error.value = err?.data?.statusMessage || err?.statusMessage || 'No se pudo crear la recolección'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-bold mb-4">Nueva recolección</h1>

    <form class="flex flex-col gap-4" @submit.prevent="submit">
      <!-- Tipo de origen -->
      <div class="join">
        <input
          v-model="form.tipo"
          class="join-item btn"
          type="radio"
          name="tipo"
          value="propio"
          aria-label="Cosecha propia"
        />
        <input
          v-model="form.tipo"
          class="join-item btn"
          type="radio"
          name="tipo"
          value="comprado"
          aria-label="Compra foránea"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label class="form-control">
          <span class="label-text">Fecha de recolección</span>
          <input v-model="form.fechaRecoleccion" type="date" required class="input input-bordered w-full" />
        </label>
        <label class="form-control">
          <span class="label-text">Albarán</span>
          <input v-model="form.albaran" type="text" class="input input-bordered w-full" />
        </label>
        <label class="form-control">
          <span class="label-text">Producto</span>
          <select v-model.number="form.productoId" required class="select select-bordered w-full">
            <option :value="null" disabled>Selecciona…</option>
            <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
          </select>
        </label>
        <label class="form-control">
          <span class="label-text">Categoría</span>
          <select v-model.number="form.categoriaId" required class="select select-bordered w-full">
            <option :value="null" disabled>Selecciona…</option>
            <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
        </label>
        <label class="form-control">
          <span class="label-text">{{ form.tipo === 'propio' ? 'Coste (€/kg)' : 'Precio de compra (€/kg)' }}</span>
          <input v-model.number="form.precioCoste" type="number" step="0.01" min="0" class="input input-bordered w-full" />
        </label>
      </div>

      <!-- Origen propio: ubicación -->
      <fieldset v-if="form.tipo === 'propio'" class="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-base-300 rounded-box p-4">
        <legend class="px-2 text-sm font-semibold">Origen (parcela)</legend>
        <label class="form-control">
          <span class="label-text">Pueblo</span>
          <select v-model.number="form.puebloId" class="select select-bordered w-full">
            <option :value="null" disabled>Selecciona…</option>
            <option v-for="p in pueblos" :key="p.id" :value="p.id">{{ p.codigo }} · {{ p.nombre }}</option>
          </select>
        </label>
        <label class="form-control">
          <span class="label-text">Parcela</span>
          <select v-model.number="form.parcelaId" :disabled="!parcelas.length" class="select select-bordered w-full">
            <option :value="null" disabled>Selecciona…</option>
            <option v-for="p in parcelas" :key="p.id" :value="p.id">{{ p.codigo }} · {{ p.nombre }}</option>
          </select>
        </label>
        <label class="form-control">
          <span class="label-text">Recinto</span>
          <select v-model.number="form.recintoId" :disabled="!recintos.length" class="select select-bordered w-full">
            <option :value="null">—</option>
            <option v-for="r in recintos" :key="r.id" :value="r.id">{{ r.codigo }}</option>
          </select>
        </label>
        <label class="form-control">
          <span class="label-text">Finca</span>
          <select v-model.number="form.fincaId" class="select select-bordered w-full">
            <option :value="null">—</option>
            <option v-for="f in fincas" :key="f.id" :value="f.id">{{ f.nombre }}</option>
          </select>
        </label>
      </fieldset>

      <!-- Origen comprado: proveedor -->
      <label v-else class="form-control">
        <span class="label-text">Proveedor</span>
        <select v-model.number="form.proveedorId" required class="select select-bordered w-full">
          <option :value="null" disabled>Selecciona…</option>
          <option v-for="p in proveedores" :key="p.id" :value="p.id">{{ p.nombre }}</option>
        </select>
      </label>

      <!-- Palés -->
      <div class="border border-base-300 rounded-box p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="font-semibold">Palés</span>
          <button type="button" class="btn btn-sm" @click="addPale">
            <Icon name="tabler:plus" /> Añadir palé
          </button>
        </div>
        <div v-for="(p, i) in pales" :key="i" class="flex items-end gap-2 mb-2">
          <label class="form-control flex-1">
            <span class="label-text">Palé {{ i + 1 }} · nº cajas</span>
            <input v-model.number="p.numCajas" type="number" min="0" class="input input-bordered w-full" />
          </label>
          <label class="form-control flex-1">
            <span class="label-text">Kilos</span>
            <input v-model.number="p.kilos" type="number" step="0.01" min="0" class="input input-bordered w-full" />
          </label>
          <button
            type="button"
            class="btn btn-ghost btn-square"
            :disabled="pales.length === 1"
            @click="removePale(i)"
          >
            <Icon name="tabler:trash" />
          </button>
        </div>
        <p class="text-sm opacity-70">Total: {{ totalKilos }} kg en {{ pales.length }} palé(s)</p>
      </div>

      <div v-if="error" class="alert alert-error">
        <Icon name="tabler:alert-triangle" />
        <span>{{ error }}</span>
      </div>

      <div class="flex gap-2">
        <button type="submit" class="btn btn-primary" :disabled="saving">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          Crear recolección
        </button>
        <NuxtLink to="/dashboard/recolecciones" class="btn btn-ghost">Cancelar</NuxtLink>
      </div>
    </form>
  </div>
</template>
