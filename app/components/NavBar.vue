<script setup>
// Función para quitar el foco del elemento activo (cierra el dropdown)
const closeDropdown = () => {
  const elem = document.activeElement
  if (elem) {
    elem.blur()
  }
}
</script>

<template>
  <div>
    <div class="navbar container mx-auto">
      <div class="flex-1">
        <NuxtLink to="/" class="btn btn-ghost text-xl">TFG</NuxtLink>
      </div>
      <div class="flex gap-2">
        <div class="dropdown dropdown-end">
          <div
            tabindex="0"
            role="button"
            class="btn btn-ghost btn-circle avatar"
          >
            <div class="w-10 rounded-full">
              <img
                alt="Tailwind CSS Navbar component"
                src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
              />
            </div>
          </div>
          <ul
            tabindex="-1"
            class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
            @click="closeDropdown"
          >
            <li>
              <a class="justify-between">
                Perfil
                <span class="badge">New</span>
              </a>
            </li>
            <li><a>Configuración</a></li>
            <li><a href="/">Cerrar sesión</a></li>
            <li><NuxtLink to="/login">Iniciar sesión</NuxtLink></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
