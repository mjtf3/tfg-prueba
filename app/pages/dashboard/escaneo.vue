<script setup lang="ts">
interface Vista {
  qr: string
  numCajas: number
  kilos: string
  recoleccion: {
    id: number
    codigoTrazabilidad: string
    producto?: string
    categoria?: string
    numPales: number
    totalCajas: number
    totalKilos: number
  }
}

const consecutivo = ref(false)
const vista = ref<Vista | null>(null)
const mensaje = ref('')
const mensajeTipo = ref<'ok' | 'error'>('ok')
const kilosManual = ref(0)

// Evita recuentos repetidos del mismo palé mientras sigue dentro del cuadro.
let ultimoQr = ''

async function onDecode(data: string) {
  if (data === ultimoQr) return
  ultimoQr = data
  setTimeout(() => {
    if (ultimoQr === data) ultimoQr = ''
  }, 1500)

  try {
    if (consecutivo.value) {
      vista.value = await $fetch(`/api/pales/${encodeURIComponent(data)}/cajas`, {
        method: 'PATCH',
        body: { cajas: 1 },
      })
      mensaje.value = `+1 caja · ${data}`
    } else {
      vista.value = await $fetch(`/api/pales/${encodeURIComponent(data)}`)
      mensaje.value = `Palé ${data}`
    }
    mensajeTipo.value = 'ok'
  } catch (e) {
    mensaje.value =
      estadoDe(e) === 404 ? `Palé no reconocido: ${data}` : 'Error al consultar el palé. Inténtalo de nuevo.'
    mensajeTipo.value = 'error'
  }
}

async function incrementar(cajas: number, kilos: number) {
  if (!vista.value) return
  try {
    vista.value = await $fetch(`/api/pales/${encodeURIComponent(vista.value.qr)}/cajas`, {
      method: 'PATCH',
      body: { cajas, kilos },
    })
    kilosManual.value = 0
    mensaje.value = 'Palé actualizado'
    mensajeTipo.value = 'ok'
  } catch {
    mensaje.value = 'No se pudo actualizar el palé'
    mensajeTipo.value = 'error'
  }
}

const { videoRef, scanning, error, start, stop } = useQrScanner(onDecode)
</script>

<template>
  <div class="max-w-md mx-auto">
    <h1 class="text-2xl font-bold mb-4">Escaneo de palés</h1>

    <label class="label cursor-pointer justify-start gap-3 mb-3">
      <input v-model="consecutivo" type="checkbox" class="toggle toggle-primary" />
      <span class="label-text">Modo consecutivo (suma +1 caja por lectura)</span>
    </label>

    <!-- Vídeo de la cámara -->
    <div class="relative bg-base-300 rounded-box overflow-hidden aspect-square mb-3">
      <video ref="videoRef" class="w-full h-full object-cover"></video>
      <div v-if="!scanning" class="absolute inset-0 flex items-center justify-center text-base-content/50">
        <Icon name="tabler:camera-off" size="48" />
      </div>
    </div>

    <div class="flex gap-2 mb-3">
      <button v-if="!scanning" class="btn btn-primary flex-1" @click="start">
        <Icon name="tabler:camera" /> Iniciar cámara
      </button>
      <button v-else class="btn btn-outline flex-1" @click="stop"><Icon name="tabler:player-stop" /> Detener</button>
    </div>

    <div v-if="error" class="alert alert-error mb-3">
      <Icon name="tabler:alert-triangle" />
      <span>{{ error }}</span>
    </div>

    <div v-if="mensaje" class="alert mb-3" :class="mensajeTipo === 'ok' ? 'alert-success' : 'alert-error'">
      <span>{{ mensaje }}</span>
    </div>

    <!-- Resultado del escaneo -->
    <div v-if="vista" class="card bg-base-100 border border-base-300">
      <div class="card-body">
        <h2 class="card-title font-mono">{{ vista.recoleccion.codigoTrazabilidad }}</h2>
        <p class="text-sm opacity-70">{{ vista.recoleccion.producto }} · {{ vista.recoleccion.categoria }}</p>

        <div class="divider my-1">Palé {{ vista.qr }}</div>
        <div class="flex justify-around text-center">
          <div>
            <div class="text-2xl font-bold">{{ vista.numCajas }}</div>
            <div class="text-xs opacity-60">cajas (palé)</div>
          </div>
          <div>
            <div class="text-2xl font-bold">{{ vista.kilos }}</div>
            <div class="text-xs opacity-60">kg (palé)</div>
          </div>
        </div>

        <div class="flex gap-2 mt-2">
          <button class="btn btn-sm btn-primary" @click="incrementar(1, 0)"><Icon name="tabler:plus" /> 1 caja</button>
          <button class="btn btn-sm btn-outline" :disabled="vista.numCajas === 0" @click="incrementar(-1, 0)">
            <Icon name="tabler:minus" /> 1 caja
          </button>
          <div class="join">
            <input
              v-model.number="kilosManual"
              type="number"
              step="0.01"
              class="input input-bordered input-sm join-item w-24"
              placeholder="kg"
            />
            <button class="btn btn-sm join-item" :disabled="!kilosManual" @click="incrementar(0, kilosManual)">
              Añadir kg
            </button>
          </div>
        </div>

        <div class="divider my-1">Totales de la recolección</div>
        <div class="flex justify-around text-center">
          <div>
            <div class="text-xl font-bold">{{ vista.recoleccion.numPales }}</div>
            <div class="text-xs opacity-60">palés</div>
          </div>
          <div>
            <div class="text-xl font-bold">{{ vista.recoleccion.totalCajas }}</div>
            <div class="text-xs opacity-60">cajas</div>
          </div>
          <div>
            <div class="text-xl font-bold">{{ vista.recoleccion.totalKilos }}</div>
            <div class="text-xs opacity-60">kg</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
