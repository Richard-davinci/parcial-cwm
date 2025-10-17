<script>
import {register} from "../services/auth.js";

export default {
  name: "Register",
  data() {
    return {
      user: {
        email: "",
        password: "",
        username: "",
        display_name: "",
      },
      loading: false,
    };
  },
  methods: {
    async handleSubmit() {
      this.loading = true;
      try {
        await register({
          email: this.user.email,
          password: this.user.password,
          username: this.user.username,
          display_name: this.user.display_name,
        });
        this.$router.push("/mi-perfil");
      } catch (error) {
        console.error("[Register.vue] Error al registrar:", error.message);
      }
      this.loading = false;
    },
  },
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-950 text-white px-4">
    <div class="w-full max-w-md bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-700">
      <h1 class="text-3xl font-bankgothic text-turquesa text-center mb-6">
        Crear cuenta
      </h1>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1" for="username">
            Nombre de usuario
          </label>
          <input
            id="username"
            v-model="user.username"
            class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-turquesa focus:ring-2 focus:ring-turquesa text-white placeholder-gray-500"
            required
            type="text"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1" for="display_name">
            Nombre y Apellido
          </label>
          <input
            id="display_name"
            v-model="user.display_name"
            class="w-full px-4 py-2 roundd-lg bg-gray-800 border border-gray-700 focus:border-turquesa focus:ring-2 focus:ring-turquesa text-white placeholder-gray-500"
            required
            type="text"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1" for="email">
            Email
          </label>
          <input
            id="email"
            v-model="user.email"
            class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-turquesa focus:ring-2 focus:ring-turquesa text-white placeholder-gray-500"
            placeholder="lili-studio@email.com"
            required
            type="email"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1" for="password">
            Contraseña
          </label>
          <input
            id="password"
            v-model="user.password"
            class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-turquesa focus:ring-2 focus:ring-turquesa text-white placeholder-gray-500"
            placeholder="••••••••"
            required
            type="password"
          />
        </div>

        <button
          class="w-full bg-turquesa hover:bg-[#0db38f] text-black font-bankgothic tracking-wider uppercase py-2 px-4 rounded-lg transition-colors"
          type="submit"
        >
          Crear cuenta
        </button>
      </form>

      <div class="my-6 border-t border-gray-700 relative">
        <span
          class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-900 px-2 text-gray-400 text-sm"
        >
          o
        </span>
      </div>

      <p class="mt-6 text-center text-gray-400 text-sm">
        ¿Ya tenés cuenta?
        <router-link class="text-turquesa hover:underline" to="/ingresar">
          Iniciá sesión
        </router-link>
      </p>
    </div>
  </div>
</template>

