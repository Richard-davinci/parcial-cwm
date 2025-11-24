<script>
/**
 * ===========================================================
 * Login.vue — Componente de inicio de sesión
 * ===========================================================
 * Descripción:
 *   Este componente gestiona el proceso de autenticación de usuarios
 *   mediante email y contraseña. Valida los campos, llama al servicio
 *   `auth.js` para autenticar, y redirige al perfil si el login es exitoso.
 *
 * Relación con otros servicios:
 *   - services/auth.js → usa la función `login(email, password)` para autenticar.
 *   - router.js        → redirige a `/mi-perfil` tras el inicio de sesión.
 *
 * Índice de funciones:
 *   1) data()                  → Estado local del formulario
 *   2) handleSubmit()         → Maneja el envío del formulario y la autenticación
 *
 * Errores comunes:
 *   - Credenciales incorrectas: Supabase lanza error si el email/contraseña no coinciden.
 *   - Campos vacíos: deben validarse antes de llamar a `login()`.
 *   - Sesión activa previa: si ya hay sesión, podría redirigir directamente sin pasar por login.
 * ===========================================================
 */

import {login} from '../services/auth.js';
import AlertMessage from "../components/AlertMessage.vue";


export default {
  name: 'Login',
  components: { AlertMessage },
  data() {
    return {
      user: {
        email: '',
        password: '',
        errorMessage: "",
      },
      // loading: false,  // controla estado del botón de envío
    };
  },

  methods: {
    /**
     * -----------------------------------------------------------
     * handleSubmit()
     * -----------------------------------------------------------
     * Objetivo:
     *   - Validar y enviar las credenciales al servicio `auth.js`.
     *   - Manejar errores de autenticación.
     *   - Redirigir al perfil del usuario al iniciar sesión con éxito.
     *
     * Flujo:
     *   a) Cambia `loading` a true para indicar que se está procesando.
     *   b) Llama a `login(email, password)` desde `auth.js`.
     *   c) Si el login es exitoso, redirige al perfil (`/mi-perfil`).
     *   d) Captura y muestra errores si la autenticación falla.
     *   e) Restaura `loading` a false al finalizar.
     *
     * Validaciones recomendadas (a implementar en UI):
     *   - Verificar que email y password no estén vacíos antes del submit.
     *   - Manejar mensajes de error personalizados según el código devuelto por Supabase.
     */
    async handleSubmit() {
      try {
        // this.loading = true; // activa el estado de carga
        await login(this.user.email, this.user.password);
        this.$router.push('/mi-perfil');
      } catch (error) {
        // !!!!!!!!!!!!Maneja y registra errores (ej. credenciales incorrectas)!!!!!!!!!!!
        this.errorMessage = error.message || "Error al iniciar sesión.";      }
      //this.loading = false; // finaliza el estado de carga, incluso si hubo error
    },
  },
};
</script>


<template>
  <div class="py-10 flex items-center justify-center text-white">
    <div class="w-full max-w-md bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-700">
      <h1 class="text-3xl font-bankgothic text-turquesa text-center mb-6">
        Iniciar Sesión
      </h1>

      <form action="#" class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <AlertMessage
            v-if="errorMessage"
            type="danger"
            :message="errorMessage"
          />

          <label class="block text-sm font-medium text-gray-300 mb-1" for="email">Email</label>
          <input
            id="email"
            v-model="user.email"
            class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-turquesa focus:ring-2 focus:ring-turquesa text-white placeholder-gray-500"
            placeholder="tu@email.com"
            type="email"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1" for="password">Contraseña</label>
          <input
            id="password"
            v-model="user.password"
            class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-turquesa focus:ring-2 focus:ring-turquesa text-white placeholder-gray-500"
            placeholder="••••••••"
            type="password"
          />
        </div>

        <button
          class="w-full bg-[#0ec49f] hover:bg-[#0db38f] text-black font-bankgothic tracking-wider uppercase py-2 px-4 rounded-lg transition-colors"
          type="submit"
        >
          Ingresar
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
  </div>
</template>