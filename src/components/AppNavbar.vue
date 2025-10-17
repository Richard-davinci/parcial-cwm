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
        <div class="h-16 px-6 flex items-center justify-between">
          <button
            aria-label="Cerrar menú"
            class="text-2xl leading-none text-turquesa"
            @click="closeMenu"
          >
            ✕
          </button>
          <div class="text-2xl font-bankgothic">
            Lili-Studio Comunidad
          </div>
          <div class="w-8"></div>
        </div>
        <transition appear name="slide-left">
          <ul
            key="mobile-menu"
            class="mt-6 px-6 flex flex-col gap-4 text-lg font-bankgothic"
          >
            <li>
              <RouterLink
                :class="{ 'text-turquesa': $route.path === '/' }"
                class="block py-2" to="/" @click="closeMenu">
                Inicio
              </RouterLink>
            </li>

            <template v-if="user.id != null">
              <li>
                <RouterLink
                  :class="{ 'text-turquesa': $route.path === '/feed' }"
                  class="block py-2" to="/feed" @click="closeMenu">
                  Comunidad
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  :class="{ 'text-turquesa': $route.path === '/mi-perfil' }"
                  class="block py-2" to="/mi-perfil" @click="closeMenu">
                  Mi Perfil
                </RouterLink>
              </li>
              <li>
                <button class="block py-2 text-left text-red-800" @click="onLogoutFromOverlay">
                  Cerrar sesión
                </button>
              </li>
            </template>

            <template v-else>
              <li>
                <RouterLink
                  :class="{ 'text-turquesa': $route.path === '/ingresar' }"
                  class="block py-2" to="/ingresar" @click="closeMenu">
                  Ingresar
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  :class="{ 'text-turquesa': $route.path === '/crear-cuenta' }"
                  class="block py-2" to="/crear-cuenta" @click="closeMenu">
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

<script setup>
import {onMounted, onUnmounted, ref, watch} from "vue";
import {RouterLink, useRouter} from "vue-router";
import {logout, subscribeToAuthStateChanges} from "../services/auth";

const router = useRouter();
const menuOpen = ref(false);
const user = ref({id: null, email: null});

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

const closeMenu = () => {
  menuOpen.value = false;
};

const onLogoutFromOverlay = async () => {
  closeMenu();
  await handleLogout();
};

const handleLogout = async () => {
  await logout();
  router.push("/ingresar");
};

onMounted(() => {
  const unsubscribe = subscribeToAuthStateChanges((newUser) => {
    user.value = newUser;
  });

  onUnmounted(() => {
    if (typeof unsubscribe === "function") unsubscribe();
  });
});


watch(
  () => menuOpen.value,
  (isOpen) => {
    const root = document.documentElement; // <html>
    if (isOpen) {
      root.classList.add("overflow-hidden");
    } else {
      root.classList.remove("overflow-hidden");
    }
  },
  {immediate: false}
);
</script>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-10%);
  opacity: 0;
}
</style>
