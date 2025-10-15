<template>
  <nav
    class="w-full flex items-center justify-between px-6 py-4 bg-gray-800 text-white shadow-lg border-b border-gray-700 fixed">
    <RouterLink class="font-quantum text-3xl pb-3" to="/">
      Lili-Studio Comunidad
    </RouterLink>
    <ul class="flex items-center space-x-2">
      <li>
        <RouterLink
          :class="{ 'text-turquesa': $route.path === '/' }"
          class="px-3 rounded-md hover:bg-gray-700 hover:text-turquesa transition-colors duration-200 font-bankgothic"
          to="/">Inicio
        </RouterLink>
      </li>
      <template v-if="user.id === null">
        <li>
          <RouterLink :class="{ 'opacity-75': $route.path === '/ingresar' }"
                      class="bg-turquesa text-black font-bankgothic py-2 px-6 rounded-lg"
                      to="/ingresar">Ingresar
          </RouterLink>
        </li>
        <li>
          <RouterLink :class="{ 'opacity-75': $route.path === '/crear-cuenta' }"
                      class="bg-turquesa text-black font-bankgothic py-2 px-6 rounded-lg"
                      to="/crear-cuenta">Crear cuenta
          </RouterLink>
        </li>
      </template>
      <template v-else>
        <li>
          <RouterLink
            :class="{ 'text-turquesa': $route.path === '/feed' }"
            class="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-turquesa transition-colors duration-200 font-bankgothic"
            to="/feed">Comunidad
          </RouterLink>
        </li>
        <li class="relative group">
          <button
            class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 hover:text-turquesa transition-colors duration-200">
            <img alt="Avatar" class="w-8 h-8 rounded-full" src="/img/ricardo.webp">
            <span class="font-bankgothic">Mi cuenta</span>
          </button>
          <div
            class="dropdown-menu hidden group-hover:block shadow border border-gray-700 bg-gray-800  hover:text-turquesa transition-colors duration-200 absolute right-0 py-1 w-48 rounded-md">
            <RouterLink class="block px-4 py-2 text-sm hover:bg-gray-700 font-bankgothic" to="/mi-perfil">
              <i class="bi bi-person-circle mr-2 "></i> Ver perfil
            </RouterLink>
            <div class="border-t border-gray-700 my-1"></div>
            <form action="#" @submit.prevent="handleLogout">
              <button class="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 font-bankgothic"
                      type="submit">
                <i class="bi bi-box-arrow-right mr-2 "></i>Cerrar sesión
              </button>
            </form>
          </div>
        </li>
      </template>
    </ul>
  </nav>
</template>

<script>
import {logout, subscribeToAuthStateChanges} from "../services/auth.js";

export default {
  name: 'AppNavbar',
  data() {
    return {
      user: {
        id: null,
        email: null,
      },
    }
  },
  methods: {
    handleLogout() {
      logout()
      this.$router.push('/ingresar')
    }
  },
  mounted() {
    subscribeToAuthStateChanges(newUserState => this.user = newUserState);
  }
}
</script>