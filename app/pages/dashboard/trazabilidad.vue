<script setup lang="ts">
interface Traza {
  pale: { qr: string; numCajas: number; kilos: string }
  recoleccion: {
    codigoTrazabilidad: string
    tipo: 'propio' | 'comprado'
    fechaRecoleccion: string
    producto?: string
    categoria?: string
    origen: {
      pueblo?: string
      parcela?: string | null
      recinto?: string
      finca?: string
      proveedor?: string
    }
  }
  lotes: { codigo: string; ventas: { fechaVenta: string; kilos: string }[] }[]
}

const qr = ref('')
const resultado = ref<Traza | null>(null)
const error = ref('')
const cargando = ref(false)

async function consultar(code?: string) {
  const q = (code ?? qr.value).trim()
  if (!q) return
  qr.value = q
  error.value = ''
  resultado.value = null
  cargando.value = true
  try {
    resultado.value = await $fetch(`/api/trazabilidad/${encodeURIComponent(q)}`)
  } catch (e) {
    error.value =
      estadoDe(e) === 404
        ? 'No se encontró ningún palé con ese código.'
        : 'Error al consultar la trazabilidad. Inténtalo de nuevo.'
  } finally {
    cargando.value = false
  }
}

const { videoRef, scanning, error: camError, start, stop } = useQrScanner((data) => {
  stop()
  consultar(data)
})

function fmtFecha(f: string) {
  return new Date(f).toLocaleDateString('es-ES')
}
</script>

<template>
  <div class="max-w-xl">
    <h1 class="text-2xl font-bold mb-4">Trazabilidad</h1>

    <form class="join w-full mb-3" @submit.prevent="consultar()">
      <input v-model="qr" type="text" placeholder="Código QR del palé (p. ej. TRZ-…-P01)" class="input input-bordered join-item flex-1" />
      <button type="submit" class="btn btn-primary join-item" :disabled="cargando">Consultar</button>
    </form>

    <div class="mb-3">
      <button v-if="!scanning" class="btn btn-outline btn-sm" @click="start"><Icon name="tabler:camera" /> Escanear</button>
      <button v-else class="btn btn-outline btn-sm" @click="stop"><Icon name="tabler:player-stop" /> Detener</button>
    </div>
    <div v-if="scanning" class="relative bg-base-300 rounded-box overflow-hidden aspect-square mb-3">
      <video ref="videoRef" class="w-full h-full object-cover"></video>
    </div>
    <div v-if="camError" class="alert alert-error mb-3"><span>{{ camError }}</span></div>

    <div v-if="cargando" class="flex justify-center p-8"><span class="loading loading-spinner" /></div>
    <div v-else-if="error" class="alert alert-warning"><Icon name="tabler:alert-triangle" /><span>{{ error }}</span></div>

    <!-- Cadena de trazabilidad -->
    <div v-else-if="resultado" class="flex flex-col gap-4">
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h2 class="card-title font-mono text-base">{{ resultado.pale.qr }}</h2>
          <p class="text-sm opacity-70">{{ resultado.pale.numCajas }} cajas · {{ resultado.pale.kilos }} kg</p>
        </div>
      </div>

      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <span class="text-xs opacity-60">Recolección</span>
          <h3 class="font-mono">{{ resultado.recoleccion.codigoTrazabilidad }}</h3>
          <p class="text-sm">
            {{ resultado.recoleccion.producto }} · {{ resultado.recoleccion.categoria }} ·
            {{ fmtFecha(resultado.recoleccion.fechaRecoleccion) }}
          </p>
          <p class="text-sm opacity-80">
            <span class="badge badge-sm" :class="resultado.recoleccion.tipo === 'propio' ? 'badge-success' : 'badge-warning'">
              {{ resultado.recoleccion.tipo }}
            </span>
            <template v-if="resultado.recoleccion.tipo === 'propio'">
              {{ resultado.recoleccion.origen.pueblo }} / {{ resultado.recoleccion.origen.parcela }}
              <span v-if="resultado.recoleccion.origen.recinto"> / {{ resultado.recoleccion.origen.recinto }}</span>
              <span v-if="resultado.recoleccion.origen.finca"> · {{ resultado.recoleccion.origen.finca }}</span>
            </template>
            <template v-else>{{ resultado.recoleccion.origen.proveedor }}</template>
          </p>
        </div>
      </div>

      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <span class="text-xs opacity-60">Lotes y ventas</span>
          <div v-if="!resultado.lotes.length" class="text-sm opacity-70">Este palé aún no está en ningún lote.</div>
          <div v-for="l in resultado.lotes" :key="l.codigo" class="mt-1">
            <span class="font-mono font-semibold">Lote {{ l.codigo }}</span>
            <ul v-if="l.ventas.length" class="text-sm opacity-80 ml-4 list-disc">
              <li v-for="(v, i) in l.ventas" :key="i">Vendido el {{ fmtFecha(v.fechaVenta) }} · {{ v.kilos }} kg</li>
            </ul>
            <span v-else class="text-sm opacity-60"> · sin ventas</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
