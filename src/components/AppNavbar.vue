<script setup>
import {ref, onMounted} from 'vue';
import {useRouter} from 'vue-router';
import {logout, subscribeToAuthStateChanges} from "../services/auth";

const router = useRouter();
const menuOpen = ref(false);
const user = ref({
  id: null,
  email: null,
});

// Logout states
const logoutLoading = ref(false);
const showLogoutConfirm = ref(false);
const logoutError = ref("");

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

const closeMenu = () => {
  menuOpen.value = false;
};

const confirmLogout = () => {
  showLogoutConfirm.value = true;
  logoutError.value = "";
};

const handleLogout = async () => {
  logoutLoading.value = true;
  logoutError.value = "";

  try {
    await logout();
    showLogoutConfirm.value = false;
    router.push("/ingresar");
  } catch (error) {
    console.error("[Navbar] Error al cerrar sesión:", error.message);
    logoutError.value = "No se pudo cerrar la sesión. Intentá nuevamente.";
  }

  logoutLoading.value = false;
};

const onLogoutFromOverlay = async () => {
  closeMenu();
  confirmLogout();
};

onMounted(() => {
  subscribeToAuthStateChanges((newUserState) => user.value = newUserState);
});
</script>

<template>
  <nav
    class="w-full flex items-center justify-between px-6 py-4 bg-gray-800 text-white shadow-lg border-b border-gray-700 fixed"
  >
    <RouterLink class="text-2xl font-quantum" to="/">
      Lili-Studio Comunidad
    </RouterLink>

    <!-- Desktop Menu -->
    <ul class="hidden md:flex items-center gap-6 font-bankgothic">
      <li>
        <RouterLink
          :class="{ 'text-turquesa': $route.path === '/' }"
          class="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-turquesa transition-colors duration-200"
          to="/"
        >
          Inicio
        </RouterLink>
      </li>

      <!-- SI NO ESTÁ LOGUEADO -->
      <template v-if="user.id === null">
        <li>
          <RouterLink
            :class="['py-2 px-6 rounded-lg transition-all duration-200',
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
            :class="['py-2 px-6 rounded-lg transition-all duration-200',
            $route.path === '/crear-cuenta'
              ? 'border-2 border-turquesa text-turquesa bg-transparent'
              : 'bg-turquesa text-black hover:opacity-90']"
            to="/crear-cuenta"
          >
            Crear cuenta
          </RouterLink>
        </li>
      </template>

      <!-- SI ESTÁ LOGUEADO -->
      <template v-else>
        <li>
          <RouterLink
            :class="{ 'text-turquesa': $route.path === '/feed' }"
            class="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-turquesa transition-colors duration-200"
            to="/feed"
          >
            Comunidad
          </RouterLink>
        </li>

        <!-- DROPDOWN -->
        <li class="relative group">
          <button
            class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 hover:text-turquesa transition-colors duration-200"
          >
            <img alt="Avatar" class="w-8 h-8 rounded-full" src="/img/ricardo.webp" />
            <span class="font-bankgothic">Mi cuenta</span>
          </button>

          <!-- Menú -->
          <div
            class="dropdown-menu hidden group-hover:block shadow border border-gray-700 bg-gray-800 transition-colors duration-200 absolute right-0 py-1 w-48 rounded-md"
          >
            <RouterLink class="block px-4 py-2 text-sm hover:bg-gray-700 font-bankgothic" to="/mi-perfil">
              <i class="bi bi-person-circle mr-2"></i> Perfil
            </RouterLink>

            <div class="border-t border-gray-700 my-1"></div>

            <!-- Cerrar sesión -->
            <form action="#" @submit.prevent="confirmLogout">
              <button
                class="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 font-bankgothic"
                type="submit"
              >
                <i class="bi bi-box-arrow-right mr-2"></i> Cerrar sesión
              </button>
            </form>
          </div>
        </li>
      </template>
    </ul>

    <!-- Hamburger Menu -->
    <button
      :aria-expanded="menuOpen ? 'true' : 'false'"
      aria-label="Abrir menú"
      class="md:hidden text-3xl leading-none"
      @click="toggleMenu"
    >
      ☰
    </button>
  </nav>

  <!-- MOBILE OVERLAY -->
  <transition appear name="overlay">
    <div
      v-if="menuOpen"
      aria-modal="true"
      class="fixed inset-0 z-[60] md:hidden bg-gray-900 text-white"
      role="dialog"
    >
      <div class="h-full w-full flex flex-col">
        <div class="h-16 px-6 flex flex-row-reverse items-center justify-between">
          <button aria-label="Cerrar menú" class="text-2xl leading-none text-turquesa" @click="closeMenu">
            ✕
          </button>

          <div class="text-2xl font-quantum">
            Lili-Studio Comunidad
          </div>

          <div class="w-8"></div>
        </div>

        <transition appear name="slide-left">
          <ul key="mobile-menu" class="mt-6 px-6 flex flex-col gap-4 text-lg font-bankgothic items-end text-right">
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
                <button class="block py-2 text-right text-red-800" @click="onLogoutFromOverlay">
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

  <!-- ===================================== -->
  <!-- MODAL DE CONFIRMACIÓN DE LOGOUT -->
  <!-- ===================================== -->
  <transition name="fade">
    <div
      v-if="showLogoutConfirm"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-[80]"
    >
      <div class="bg-gray-900 border border-gray-700 rounded-xl p-8 w-full max-w-sm shadow-xl">
        <h3 class="text-xl font-bankgothic text-turquesa mb-4 text-center">
          ¿Cerrar sesión?
        </h3>

        <p class="text-gray-300 text-center mb-6">
          Vas a salir de tu cuenta. ¿Querés continuar?
        </p>

        <div v-if="logoutError" class="text-red-400 text-sm mb-4 text-center">
          {{ logoutError }}
        </div>

        <div class="flex gap-4">
          <button
            class="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
            @click="showLogoutConfirm = false"
            :disabled="logoutLoading"
          >
            Cancelar
          </button>

          <button
            class="flex-1 py-2 bg-turquesa text-black rounded-lg hover:bg-[#0db38f] transition flex items-center justify-center gap-2"
            @click="handleLogout"
            :disabled="logoutLoading"
          >
            <span v-if="!logoutLoading">Cerrar sesión</span>

            <span v-else class="flex items-center gap-2">
              <div class="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></div>
              Saliendo...
            </span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>
