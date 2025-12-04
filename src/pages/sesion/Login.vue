<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { login } from "../../services/auth.js";
import AlertMessage from "../../components/AlertMessage.vue";

const user = ref({
  email: "",
  password: "",
});
const loading = ref(false);
const errorMessage = ref("");
const router = useRouter();

async function handleSubmit() {
  errorMessage.value = "";
  loading.value = true;

  try {
    if (!user.value.email || !user.value.password) {
      errorMessage.value = "Completá todos los campos.";
      loading.value = false;
      return;
    }

    await login(user.value.email, user.value.password);
    await router.push("/mi-perfil");

  } catch (error) {
    errorMessage.value = error.message || "Error al iniciar sesión.";
  }

  loading.value = false;
}

</script>

<template>
  <section class="py-10 flex items-center justify-center">
    <div class="w-full max-w-md  rounded-xl shadow-lg p-8 border border-gray-500 bg-gray-900">
      <h1 class="text-3xl font-bankgothic text-turquesa text-center mb-6">
        Iniciar Sesión
      </h1>
      <!--  Mostrar errores -->
      <AlertMessage
        v-if="errorMessage"
        type="danger"
        :message="errorMessage"
        class="mb-4"
      />

      <form class="space-y-4" @submit.prevent="handleSubmit">

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1" for="email">Email</label>
          <input
            id="email"
            v-model="user.email"
            class="w-full px-4 py-2 rounded-lg  border border-gray-700 focus:border-turquesa focus:ring-2 focus:ring-turquesa text-white placeholder-gray-500"
            placeholder="tu@email.com"
            type="email"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1" for="password">Contraseña</label>
          <input
            id="password"
            v-model="user.password"
            class="w-full px-4 py-2 rounded-lg  border border-gray-700 focus:border-turquesa focus:ring-2 focus:ring-turquesa text-white placeholder-gray-500"
            placeholder="••••••••"
            type="password"
          />
        </div>

        <!--  Botón con loader -->
        <button
          :disabled="loading"
          class="w-full bg-[#0ec49f] hover:bg-[#0db38f] disabled:opacity-50 text-black font-bankgothic tracking-wider uppercase py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          type="submit"
        >
          <span v-if="!loading">Ingresar</span>

          <!-- spinner -->
          <span v-else class="flex items-center gap-2">
            <div class="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
            Cargando...
          </span>
        </button>
      </form>

      <div class="my-6 border-t border-gray-700 relative">
        <span class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-900 px-2 text-gray-400 text-sm">
          o
        </span>
      </div>

      <p class="mt-6 text-center text-gray-400 text-sm">
        ¿No tenés cuenta?
        <router-link class="text-turquesa hover:underline" to="/crear-cuenta">
          Registrate
        </router-link>
      </p>
    </div>
  </section>
</template>
