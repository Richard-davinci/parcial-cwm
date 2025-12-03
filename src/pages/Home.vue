<script setup>
import {onMounted, ref} from "vue";
import {subscribeToAuthStateChanges} from "../services/auth.js";
import {fetchPosts} from "../services/posts.js";
import {fetchFeaturedUsers, fetchTotalUsers} from "../services/user-profiles.js";

const user = ref({
  id: null,
  display_name: null,
  avatar_url: null,
});

// Últimos posts
const lastPosts = ref([]);
const loadingPosts = ref(false);

// Usuarios recomendados
const featuredUsers = ref([]);
const totalUsers = ref(0);
const loadingUsers = ref(false);

let unsubscribeFromAuth = () => {
};


async function loadLastPosts() {
  try {
    loadingPosts.value = true;

    const posts = await fetchPosts();
    lastPosts.value = posts.slice(0, 3);

  } catch (e) {
    console.error("[Home.vue] Error cargando posts:", e);
  } finally {
    loadingPosts.value = false;
  }
}

async function loadFeatured() {
  try {
    loadingUsers.value = true;

    featuredUsers.value = await fetchFeaturedUsers(4);
    totalUsers.value = await fetchTotalUsers();

  } catch (e) {
    console.error("[Home.vue] Error cargando usuarios:", e);
  } finally {
    loadingUsers.value = false;
  }
}

onMounted(async () => {
  unsubscribeFromAuth = subscribeToAuthStateChanges(
    (newUserState) => (user.value = newUserState)
  );

  await loadLastPosts();
  await loadFeatured();
});
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white">

    <section class="max-w-6xl mx-auto px-6 py-16 text-center">
      <h1 class="text-4xl md:text-5xl font-bankgothic text-turquesa mb-4">
        Bienvenido a Lili-Studio Comunidad
      </h1>

      <p class="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
        Unite a una comunidad donde compartimos ideas, proyectos y aprendizaje real.
      </p>

      <div
        v-if="user.id"
        class="flex items-center justify-center gap-4 mb-8"
      >
        <img
          :src="user.avatar_url || '/img/default-avatar.png'"
          alt="avatar"
          class="w-14 h-14 rounded-full border border-gray-700"
        />
        <p class="text-xl text-turquesa font-bankgothic">
          Hola {{ user.display_name }}
        </p>
      </div>

      <RouterLink
        class="inline-block bg-turquesa text-black font-bankgothic px-10 py-4 rounded-lg text-xl hover:bg-[#0db38f] transition"
        to="/feed"
      >
        Ir a la comunidad
      </RouterLink>
    </section>

    <!-- CONTADOR -->
    <section class="max-w-4xl mx-auto px-6 mt-10 text-center">
      <p class="text-xl text-gray-400">
        Ya somos
        <span class="text-turquesa font-bankgothic">{{ totalUsers }}</span>
        miembros
      </p>
    </section>

    <!-- ÚLTIMOS POSTS -->
    <section class="max-w-6xl mx-auto px-6 mt-16">
      <h2 class="text-3xl font-bankgothic text-turquesa mb-6">
        Últimas publicaciones
      </h2>

      <div v-if="loadingPosts" class="text-gray-500">
        Cargando publicaciones...
      </div>

      <div v-else class="grid md:grid-cols-3 gap-6">
        <article
          v-for="post in lastPosts"
          :key="post.id"
          class="bg-gray-900 border border-gray-700 p-6 rounded-xl hover:shadow-lg transition"
        >
          <div class="flex items-center gap-3 mb-3">
            <img
              :src="post.user_profiles?.avatar_url || '/img/default-avatar.png'"
              class="w-10 h-10 rounded-full border border-gray-700"
            />

            <p class="font-bankgothic text-white">
              {{
                post.user_profiles?.display_name ||
                post.user_profiles?.username ||
                "Usuario"
              }}
            </p>
          </div>

          <p class="text-gray-300 text-sm mb-4 line-clamp-3">
            {{ post.content }}
          </p>

          <RouterLink
            :to="`/usuario/${post.user_id}`"
            class="text-turquesa font-semibold hover:underline"
          >
            Ver perfil →
          </RouterLink>
        </article>
      </div>
    </section>

    <!-- usuarios recomendados -->
    <section class="max-w-6xl mx-auto px-6 mt-20">
      <h2 class="text-3xl font-bankgothic text-turquesa mb-6">
        Usuarios recomendados
      </h2>

      <div v-if="loadingUsers" class="text-gray-500">Cargando...</div>

      <div v-else class="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div
          v-for="u in featuredUsers"
          :key="u.id"
          class="bg-gray-900 border border-gray-700 p-6 rounded-xl text-center hover:shadow-lg transition"
        >
          <img
            :src="u.avatar_url || '/img/default-avatar.png'"
            class="w-16 h-16 mx-auto rounded-full border border-gray-700 mb-4"
          />

          <p class="font-bankgothic text-white">
            {{ u.display_name || u.username }}
          </p>

          <RouterLink
            :to="`/usuario/${u.id}`"
            class="text-turquesa text-sm mt-2 inline-block hover:underline"
          >
            Ver perfil
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- QUE PODÉS HACER -->
    <section class="max-w-6xl mx-auto px-6 mt-20 pb-20">
      <h2 class="text-3xl font-bankgothic text-turquesa mb-6">
        ¿Qué podés hacer acá?
      </h2>

      <ul class="grid md:grid-cols-2 gap-6 text-gray-300 text-lg">
        <li>✔ Crear publicaciones y compartir tu trabajo</li>
        <li>✔ Ver perfiles de otros desarrolladores</li>
        <li>✔ Chatear de forma privada</li>
        <li>✔ Conectar con personas con tus mismas skills</li>
        <li>✔ Mostrar tu experiencia y tu portfolio</li>
        <li>✔ Seguir el crecimiento de la comunidad</li>
      </ul>
    </section>

  </div>
</template>
