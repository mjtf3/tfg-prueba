<script setup lang="ts">
const { session, githubSignIn, signOut } = useAuth()
</script>

<template>
  <div
    class="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-100"
  >
    <div class="w-full max-w-md">
      <div v-if="!session?.data" class="space-y-6">
        <div class="text-center space-y-2">
          <h1 class="text-3xl font-bold text-gray-900">Welcome</h1>
          <p class="text-gray-600">Sign in to continue</p>
        </div>
        <button
          class="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-900 font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          @click="githubSignIn()"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.545 2.914 1.209.092-.937.349-1.546.636-1.9-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.817c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.194 20 14.44 20 10.017 20 4.484 15.522 0 10 0z"
              clip-rule="evenodd"
            />
          </svg>
          Continue with GitHub
        </button>
      </div>
      <div v-else class="bg-white rounded-lg shadow-xl p-8 space-y-6">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
          <p class="text-gray-600">You are signed in</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <pre class="text-xs text-gray-700 overflow-auto max-h-64 font-mono">{{
            JSON.stringify(session.data, null, 2)
          }}</pre>
        </div>
        <button
          @click="signOut()"
          class="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </div>
  </div>
</template>
