<script setup lang="ts">
const { signOut, session, loggedIn } = useAuth()
</script>

<template>
  <div class="container mx-auto">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
      <p class="text-gray-600">You are signed in</p>
    </div>
    <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <pre class="text-xs text-gray-700 overflow-auto font-mono"> {{ JSON.stringify(session, null, 2) }}</pre>
    </div>
    <button
      v-if="loggedIn"
      @click="signOut()"
      class="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
    >
      Sign out
    </button>
  </div>
</template>
