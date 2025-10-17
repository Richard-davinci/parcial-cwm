<template>
  <nav
    class="w-full flex items-center justify-between px-6 py-4 bg-gray-800 text-white shadow-lg border-b border-gray-700 fixed">
    <RouterLink class="text-2xl font-quantum" to="/">
      Lili-Studio Comunidad
    </RouterLink>
    <ul class="hidden md:flex items-center gap-6 font-bankgothic">
      <li>
        <RouterLink
          :class="{ 'text-turquesa': $route.path === '/' }"
          class="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-turquesa transition-colors duration-200 font-bankgothic"
          to="/">Inicio
        </RouterLink>
      </li>
      <template v-if="user.id === null">
        <li>
          <RouterLink
            :class="['font-bankgothic py-2 px-6 rounded-lg transition-all duration-200',
            $route.path === '/ingresar'
            ? 'border-2 border-turquesa text-turquesa bg-transparent'
            : 'bg-turquesa text-black hover:opacity-90']"
            to="/ingresar"
          >
            Iniciar sesión
          </RouterLink>
        </li>
        <li>
          <RouterLink
            :class="['font-bankgothic py-2 px-6 rounded-lg transition-all duration-200',
            $route.path === '/crear-cuenta'
            ? 'border-2 border-turquesa text-turquesa bg-transparent'
            : 'bg-turquesa text-black hover:opacity-90']"
            to="/crear-cuenta"
          >
            Crear cuenta
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
              <i class="bi bi-person-circle mr-2 "></i> Perfil
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
    <button
      :aria-expanded="menuOpen ? 'true' : 'false'"
      aria-label="Abrir menú"
      class="md:hidden text-3xl leading-none"
      @click="toggleMenu"
    >
      ☰
    </button>
  </nav>
  <transition appear name="overlay">
    <div
      v-if="menuOpen"
      aria-modal="true"
      class="fixed inset-0 z-[60] md:hidden bg-gray-900 text-white"
      role="dialog"
    >
      <div class="h-full w-full flex flex-col">
        <!-- invertimos el orden con flex-row-reverse -->
        <div class="h-16 px-6 flex flex-row-reverse items-center justify-between">
          <!-- botón ✕ ahora a la derecha -->
          <button
            aria-label="Cerrar menú"
            class="text-2xl leading-none text-turquesa"
            @click="closeMenu"
          >
            ✕
          </button>
          <!-- título ahora a la izquierda -->
          <div class="text-2xl font-quantum">
            Lili-Studio Comunidad
          </div>
          <div class="w-8"></div>
        </div>

        <transition appear name="slide-left">
          <ul
            key="mobile-menu"
            class="mt-6 px-6 flex flex-col gap-4 text-lg font-bankgothic items-end text-right"
          >
            <li>
              <RouterLink
                :class="{ 'text-turquesa': $route.path === '/' }"
                class="block py-2"
                to="/"
                @click="closeMenu"
              >
                Inicio
              </RouterLink>
            </li>

            <template v-if="user.id != null">
              <li>
                <RouterLink
                  :class="{ 'text-turquesa': $route.path === '/feed' }"
                  class="block py-2"
                  to="/feed"
                  @click="closeMenu"
                >
                  Comunidad
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  :class="{ 'text-turquesa': $route.path === '/mi-perfil' }"
                  class="block py-2"
                  to="/mi-perfil"
                  @click="closeMenu"
                >
                  Mi Perfil
                </RouterLink>
              </li>
              <li>
                <button
                  class="block py-2 text-right text-red-800"
                  @click="onLogoutFromOverlay"
                >
                  Cerrar sesión
                </button>
              </li>
            </template>

            <template v-else>
              <li>
                <RouterLink
                  :class="{ 'text-turquesa': $route.path === '/ingresar' }"
                  class="block py-2"
                  to="/ingresar"
                  @click="closeMenu"
                >
                  Ingresar
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  :class="{ 'text-turquesa': $route.path === '/crear-cuenta' }"
                  class="block py-2"
                  to="/crear-cuenta"
                  @click="closeMenu"
                >
                  Crear cuenta
                </RouterLink>
              </li>
            </template>
          </ul>
        </transition>
      </div>
    </div>
  </transition>

</template>

<script>
import {watch} from "vue";
import {useRouter} from "vue-router";
import {logout, subscribeToAuthStateChanges} from "../services/auth";

export default {
  name: "AppNavbar",

  data() {
    return {
      menuOpen: false,
      user: {id: null, email: null},
    };
  },

  created() {
    // Suscripción al estado de autenticación
    this.unsubscribe = subscribeToAuthStateChanges((newUser) => {
      this.user = newUser;
    });
  },

  mounted() {
    // Bloqueo de scroll cuando el menú se abre
    this.stopWatch = watch(
      () => this.menuOpen,
      (isOpen) => {
        const root = document.documentElement;
        if (isOpen) {
          root.classList.add("overflow-hidden");
        } else {
          root.classList.remove("overflow-hidden");
        }
      }
    );
  },

  beforeUnmount() {
    // Cancelar suscripción al auth si existe
    if (typeof this.unsubscribe === "function") this.unsubscribe();
    if (this.stopWatch) this.stopWatch();
  },

  methods: {
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
    },

    closeMenu() {
      this.menuOpen = false;
    },

    async onLogoutFromOverlay() {
      this.closeMenu();
      await this.handleLogout();
    },

    async handleLogout() {
      await logout();
      this.$router.push("/ingresar");
    },
  },

  setup() {
    const router = useRouter();
    return {router};
  },
};
</script>