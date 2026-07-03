<script setup lang="ts">
definePageMeta({
  auth: { only: 'guest' },
})

const { signIn, options } = useAuth()
const deshabilitado = ref(false)
const email = ref('')
const contrasena = ref('')
const errorLogin = ref('')

async function handleLoginEmail() {
  errorLogin.value = ''
  deshabilitado.value = true

  const { error } = await signIn.email({
    email: email.value,
    password: contrasena.value,
    callbackURL: options.redirectUserTo,
  })

  if (error) {
    errorLogin.value = error.message || 'No se pudo iniciar sesión'
    deshabilitado.value = false
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
          <h1 class="text-3xl font-bold text-gray-900">Iniciar sesión</h1>
        </div>
        <form class="space-y-4" @submit.prevent="handleLoginEmail">
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
            autocomplete="current-password"
            placeholder="Contraseña"
            minlength="8"
            :disabled="deshabilitado"
            required
          />
          <p v-if="errorLogin" class="text-error text-sm">{{ errorLogin }}</p>
          <button class="btn btn-primary w-full" type="submit" :disabled="deshabilitado">
            <span>Iniciar sesión</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
