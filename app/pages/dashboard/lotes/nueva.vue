<script setup lang="ts">
definePageMeta({ middleware: 'oficina' })

interface Catalogo {
  id: number
  nombre: string | null
}
interface RecolItem {
  id: number
  codigoTrazabilidad: string
  productoId: number
  categoriaId: number
  fechaRecoleccion: string
}

const router = useRouter()

const { data: productos } = await useFetch<Catalogo[]>('/api/catalogos/productos')
const { data: categorias } = await useFetch<Catalogo[]>('/api/catalogos/categorias')
const { data: recolecciones } = await useFetch<RecolItem[]>('/api/recolecciones')

const form = reactive({
  codigo: '',
  productoId: null as number | null,
  categoriaId: null as number | null,
  numPiezas: null as number | null,
  rgseaa: '',
  ggn: '',
  origen: '',
})

const seleccion = ref<number[]>([])

// Recolecciones que se pueden agrupar: mismo producto y categoría que el lote (RF-06).
const compatibles = computed(() => {
  if (!form.productoId || !form.categoriaId) return []
  return (recolecciones.value ?? []).filter(
    (r) => r.productoId === form.productoId && r.categoriaId === form.categoriaId
  )
})

// Si cambian producto/categoría, la selección anterior deja de ser válida.
watch([() => form.productoId, () => form.categoriaId], () => {
  seleccion.value = []
})

const saving = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  saving.value = true
  try {
    const l = await $fetch<{ id: number }>('/api/lotes', {
      method: 'POST',
      body: {
        codigo: form.codigo,
        productoId: form.productoId,
        categoriaId: form.categoriaId,
        numPiezas: form.numPiezas ?? undefined,
        rgseaa: form.rgseaa || undefined,
        ggn: form.ggn || undefined,
        origen: form.origen || undefined,
        recoleccionIds: seleccion.value,
      },
    })
    await router.push(`/dashboard/lotes/${l.id}`)
  } catch (e) {
    error.value = mensajeDe(e, 'No se pudo crear el lote')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-bold mb-4">Nuevo lote</h1>

    <form class="flex flex-col gap-4" @submit.prevent="submit">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label class="form-control">
          <span class="label-text">Nº de lote</span>
          <input v-model="form.codigo" type="text" required class="input input-bordered w-full" placeholder="p. ej. 0700018" />
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
      </div>

      <fieldset class="grid grid-cols-2 sm:grid-cols-4 gap-4 border border-base-300 rounded-box p-4">
        <legend class="px-2 text-sm font-semibold">Etiqueta externa (opcional)</legend>
        <label class="form-control">
          <span class="label-text">Nº piezas</span>
          <input v-model.number="form.numPiezas" type="number" min="0" class="input input-bordered w-full" />
        </label>
        <label class="form-control">
          <span class="label-text">RGSEAA</span>
          <input v-model="form.rgseaa" type="text" class="input input-bordered w-full" />
        </label>
        <label class="form-control">
          <span class="label-text">GGN</span>
          <input v-model="form.ggn" type="text" class="input input-bordered w-full" />
        </label>
        <label class="form-control">
          <span class="label-text">Origen</span>
          <input v-model="form.origen" type="text" class="input input-bordered w-full" />
        </label>
      </fieldset>

      <div class="border border-base-300 rounded-box p-4">
        <span class="font-semibold">Recolecciones a agrupar</span>
        <p v-if="!form.productoId || !form.categoriaId" class="text-sm opacity-70 mt-1">
          Elige primero producto y categoría.
        </p>
        <p v-else-if="!compatibles.length" class="text-sm opacity-70 mt-1">
          No hay recolecciones de ese producto y categoría.
        </p>
        <div v-else class="mt-2 flex flex-col gap-1">
          <label v-for="r in compatibles" :key="r.id" class="label cursor-pointer justify-start gap-3">
            <input v-model="seleccion" type="checkbox" :value="r.id" class="checkbox checkbox-sm" />
            <span class="font-mono text-sm">{{ r.codigoTrazabilidad }}</span>
            <span class="text-xs opacity-60">{{ new Date(r.fechaRecoleccion).toLocaleDateString('es-ES') }}</span>
          </label>
        </div>
      </div>

      <div v-if="error" class="alert alert-error">
        <Icon name="tabler:alert-triangle" />
        <span>{{ error }}</span>
      </div>

      <div class="flex gap-2">
        <button type="submit" class="btn btn-primary" :disabled="saving || !seleccion.length">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          Crear lote
        </button>
        <NuxtLink to="/dashboard/lotes" class="btn btn-ghost">Cancelar</NuxtLink>
      </div>
    </form>
  </div>
</template>
