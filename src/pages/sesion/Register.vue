<script setup>
import {ref} from 'vue';
import {useRouter} from 'vue-router';
import {register} from "../../services/auth.js";
import AlertMessage from "../../components/AlertMessage.vue";

const router = useRouter();

const user = ref({
  email: "",
  password: "",
  username: "",
  display_name: "",
});

const loading = ref(false);
const errorMessage = ref("");

const handleSubmit = async () => {
  errorMessage.value = "";

  if (
    !user.value.email ||
    !user.value.password ||
    !user.value.username ||
    !user.value.display_name
  ) {
    errorMessage.value = "Completá todos los campos.";
    return;
  }

  loading.value = true;

  try {
    await register({
      email: user.value.email,
      password: user.value.password,
      username: user.value.username,
      display_name: user.value.display_name,
    });

    await router.push("/mi-perfil");

  } catch (error) {
    errorMessage.value = error.message || "No se pudo crear tu cuenta.";
  }

  loading.value = false;
};
</script>
<template>

  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-md bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-500">

      <h1 class="text-3xl font-bankgothic text-turquesa text-center mb-6">
        Crear cuenta
      </h1>

      <AlertMessage
        v-if="errorMessage"
        type="danger"
        :message="errorMessage"
        class="mb-4"
      />

      <form class="space-y-4" @submit.prevent="handleSubmit">

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1" for="username">
            Usuario
          </label>
          <input
            id="username"
            v-model="user.username"
            class="w-full px-4 py-2 rounded-lg  border border-gray-700
                   focus:border-turquesa focus:ring-2 focus:ring-turquesa text-white"
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
            class="w-full px-4 py-2 rounded-lg  border border-gray-700
                   focus:border-turquesa focus:ring-2 focus:ring-turquesa text-white"
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
            class="w-full px-4 py-2 rounded-lg white border border-gray-700
                   focus:border-turquesa focus:ring-2 focus:ring-turquesa text-white"
            placeholder="lili-studio@email.com"
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
            class="w-full px-4 py-2 rounded-lg  border border-gray-700
                   focus:border-turquesa focus:ring-2 focus:ring-turquesa text-white"
            placeholder="••••••••"
            type="password"
          />
        </div>

        <!-- BOTÓN CON LOADER -->
        <button
          :disabled="loading"
          class="w-full bg-turquesa hover:bg-[#0db38f] disabled:opacity-50
                 text-black font-bankgothic tracking-wider uppercase py-2 px-4 rounded-lg
                 transition-colors flex items-center justify-center gap-2"
          type="submit"
        >
          <span v-if="!loading">Crear cuenta</span>

          <span v-else class="flex items-center gap-2">
            <div class="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
            Registrando...
          </span>
        </button>
      </form>

      <div class="my-6 border-t border-gray-700 relative">
        <span class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-900 px-2 text-gray-400 text-sm">
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
