<script setup lang="ts">
definePageMeta({ middleware: 'oficina' })

const { data: usuarios, refresh } = await useFetch('/api/usuarios')

const form = reactive({
  name: '',
  email: '',
  password: '',
  role: 'operario' as 'oficina' | 'operario',
})
const saving = ref(false)
const error = ref('')
const ok = ref('')

async function submit() {
  error.value = ''
  ok.value = ''
  saving.value = true
  try {
    await $fetch('/api/usuarios', { method: 'POST', body: { ...form } })
    ok.value = `Usuario ${form.email} creado.`
    form.name = ''
    form.email = ''
    form.password = ''
    form.role = 'operario'
    await refresh()
  } catch (e) {
    error.value = mensajeDe(e, 'No se pudo crear el usuario')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Alta de usuario -->
    <div class="lg:col-span-1">
      <h1 class="text-2xl font-bold mb-4">Nuevo usuario</h1>
      <form class="flex flex-col gap-3" @submit.prevent="submit">
        <label class="form-control">
          <span class="label-text">Nombre</span>
          <input v-model="form.name" type="text" required class="input input-bordered w-full" />
        </label>
        <label class="form-control">
          <span class="label-text">Correo</span>
          <input v-model="form.email" type="email" required class="input input-bordered w-full" />
        </label>
        <label class="form-control">
          <span class="label-text">Contraseña</span>
          <input v-model="form.password" type="password" minlength="8" required class="input input-bordered w-full" />
        </label>
        <label class="form-control">
          <span class="label-text">Rol</span>
          <select v-model="form.role" class="select select-bordered w-full">
            <option value="operario">Operario de almacén</option>
            <option value="oficina">Oficina / gerencia</option>
          </select>
        </label>

        <div v-if="error" class="alert alert-error"><Icon name="tabler:alert-triangle" /><span>{{ error }}</span></div>
        <div v-if="ok" class="alert alert-success"><Icon name="tabler:check" /><span>{{ ok }}</span></div>

        <button type="submit" class="btn btn-primary" :disabled="saving">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          Crear usuario
        </button>
      </form>
    </div>

    <!-- Listado -->
    <div class="lg:col-span-2">
      <h2 class="text-lg font-semibold mb-2">Usuarios</h2>
      <div v-if="!usuarios?.length" class="alert"><Icon name="tabler:info-circle" /><span>No hay usuarios.</span></div>
      <div v-else class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr><th>Nombre</th><th>Correo</th><th>Rol</th></tr>
          </thead>
          <tbody>
            <tr v-for="u in usuarios" :key="u.id" class="hover">
              <td>{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td>
                <span class="badge" :class="u.role === 'oficina' ? 'badge-primary' : 'badge-ghost'">{{ u.role }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
