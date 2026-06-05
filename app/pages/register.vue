<script setup lang="ts">
definePageMeta({
  auth: { only: 'guest' },
})

const { signUp, options } = useAuth()
const deshabilitado = ref(false)
const cargandoRegistro = ref(false)
const nombre = ref('')
const email = ref('')
const contrasena = ref('')
const errorRegistro = ref('')

async function handleRegistroEmail() {
  errorRegistro.value = ''
  deshabilitado.value = true
  cargandoRegistro.value = true

  const { error } = await signUp.email({
    name: nombre.value,
    email: email.value,
    password: contrasena.value,
    callbackURL: options.redirectUserTo,
  })

  if (error) {
    errorRegistro.value = error.message || 'No se pudo completar el registro'
    deshabilitado.value = false
    cargandoRegistro.value = false
    return
  }

  await navigateTo(options.redirectUserTo)
}
</script>

<template>
  <div class="flex items-center justify-center">
    <div class="w-full max-w-md bg-gray-200 p-8 m-4 rounded-4xl">
      <div class="space-y-12">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900">Crear cuenta</h1>
        </div>
        <form class="space-y-4" @submit.prevent="handleRegistroEmail">
          <input
            v-model="nombre"
            class="input input-bordered w-full"
            type="text"
            autocomplete="name"
            placeholder="Nombre"
            :disabled="deshabilitado"
            required
          />
          <input
            v-model="email"
            class="input input-bordered w-full"
            type="email"
            autocomplete="email"
            placeholder="Email"
            :disabled="deshabilitado"
            required
          />
          <input
            v-model="contrasena"
            class="input input-bordered w-full"
            type="password"
            autocomplete="new-password"
            placeholder="Contraseña"
            minlength="8"
            :disabled="deshabilitado"
            required
          />
          <p v-if="errorRegistro" class="text-error text-sm">{{ errorRegistro }}</p>
          <button class="btn btn-primary w-full" type="submit" :disabled="deshabilitado">
            <span v-if="cargandoRegistro" class="loading loading-bars"></span>
            <span>Registrarse</span>
          </button>
          <p class="text-center text-sm text-gray-700">
            ¿Ya tienes cuenta?
            <NuxtLink class="link link-primary" to="/login">Inicia sesión</NuxtLink>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
