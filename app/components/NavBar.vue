<script setup>
const { loggedIn, signOut, user } = useAuth()
// Función para quitar el foco del elemento activo (cierra el dropdown)
const closeDropdown = () => {
  const elem = document.activeElement
  if (elem) {
    elem.blur()
  }
}
</script>

<template>
  <!-- Esto de fondo se colorea y se pone la sombra -->
  <div class="bg-base-100 shadow-md border-b border-gray-400">
    <!-- Luego lo que es la navbar solo ocupa lo que ocupe container -->
    <div class="navbar container mx-auto">
      <div class="flex-1">
        <NuxtLink to="/" class="btn btn-ghost text-xl">TFG</NuxtLink>
      </div>
      <NuxtLink v-if="!loggedIn" to="/login" class="btn text-lg">Iniciar sesión</NuxtLink>
      <div v-else class="flex gap-2">
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
            <div class="w-10 rounded-full">
              <img
                alt="Tailwind CSS Navbar component"
                :src="user.image || 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp'"
              />
            </div>
          </div>
          <ul
            tabindex="-1"
            class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
            @click="closeDropdown"
          >
            <li>
              <a class="justify-between">Perfil</a>
            </li>
            <li><span @click="signOut">Cerrar sesión</span></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
