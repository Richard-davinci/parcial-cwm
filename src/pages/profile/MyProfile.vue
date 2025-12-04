<script setup>
import {ref, onMounted, onUnmounted} from 'vue'
import {
  createInitialUserState,
  subscribeToAuthStateChanges
} from "../../services/auth.js";
import {fetchUserPosts} from "../../services/posts.js";

const user = ref(createInitialUserState())
const posts = ref([])
const loading = ref(true)
const errorMessage = ref('')

let unsubscribeFromAuth = () => {
};

async function loadUserPosts() {
  try {
    const {data, error} = await fetchUserPosts(user.value.id);

    if (error) {
      errorMessage.value = "No se pudieron cargar tus publicaciones.";
      posts.value = [];
      return;
    }

    posts.value = data;
  } catch (error) {
    console.error("Error al cargar los posts:", error);
    errorMessage.value = "Error al cargar tus publicaciones.";
    posts.value = [];
  }
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString() : "No disponible";
}

onMounted(() => {
  unsubscribeFromAuth = subscribeToAuthStateChanges(async newUserState => {
    user.value = newUserState;

    if (!user.value || !user.value.id) {
      errorMessage.value = "No se pudo cargar tu perfil.";
      loading.value = false;
      return;
    }

    await loadUserPosts();
    loading.value = false;
  });
})

onUnmounted(() => {
  unsubscribeFromAuth();
})
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white px-6 py-12">

    <!-- Loader -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-turquesa border-t-transparent"></div>
    </div>

    <!-- Error de carga -->
    <div v-else-if="errorMessage" class="text-center py-20">
      <h1 class="text-3xl font-bankgothic text-red-500 mb-4">Error</h1>
      <p class="text-gray-400">{{ errorMessage }}</p>
    </div>

    <!-- Contenido principal -->
    <div v-else class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

      <!-- H1 principal que el profe exige -->
      <h1 class="md:col-span-12 text-4xl font-bankgothic text-turquesa mb-8">
        Mi Perfil
      </h1>

      <!-- Columna del perfil -->
      <div class="space-y-6 md:col-span-6 lg:col-span-4">
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-lg">
          <div class="flex flex-col items-center text-center">

            <img
              v-if="user.avatar_url"
              :src="`/img/${user.avatar_url || 'avatar.webp'}`"
              alt="Avatar"
              class="w-32 h-32 rounded-full mb-4 border-4 border-turquesa object-cover"
            />

            <div v-else class="w-32 h-32 rounded-full mb-4 bg-gray-700 flex items-center justify-center text-3xl">
              {{ user.display_name?.charAt(0).toUpperCase() }}
            </div>

            <h2 class="text-3xl font-bankgothic text-turquesa mb-2">
              {{ user.display_name }}
            </h2>

            <p class="text-gray-400 text-sm mb-1">@{{ user.username  }}</p>
            <p class="text-gray-400 text-sm mb-4">{{ user.email }}</p>

            <p class="text-lg text-gray-300 mb-2">{{ user.career || 'Carrera no especificada' }}</p>
            <p class="text-sm text-gray-400 mb-4">{{ user.location || 'Ubicación no especificada' }}</p>

            <span
              v-if="user.available_for_work"
              class="bg-green-700 text-white text-xs px-3 py-1 rounded-full mb-4"
            >
              Disponible para trabajar
            </span>

            <RouterLink
              class="bg-turquesa text-black font-bankgothic px-6 py-2 rounded-lg hover:bg-[#0db38f] transition-colors"
              to="/mi-perfil/editar"
            >
              Editar perfil
            </RouterLink>
          </div>
        </div>

        <!-- Información secundaria -->
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-lg space-y-6">
          <div>
            <h2 class="text-2xl font-bankgothic text-turquesa mb-2">Sobre mí</h2>
            <p class="text-gray-300">{{ user.bio || 'Aún no completado.' }}</p>
          </div>

          <div>
            <h2 class="text-2xl font-bankgothic text-turquesa mb-2">Proyecto actual</h2>
            <p class="text-gray-300">{{ user.current_project || 'No especificado' }}</p>
          </div>

          <div>
            <h2 class="text-2xl font-bankgothic text-turquesa mb-2">
              Años de experiencia:
              <span class="text-white">{{ user.experience_years || 'No especificado' }}</span>
            </h2>
          </div>

          <div v-if="user.website_url">
            <h2 class="text-2xl font-bankgothic text-turquesa mb-2">Sitio web</h2>
            <a :href="user.website_url" class="text-turquesa hover:underline break-all" target="_blank">
              {{ user.website_url }}
            </a>
          </div>

          <div v-if="user.skills?.length">
            <h2 class="text-2xl font-bankgothic text-turquesa mb-2">Skills</h2>
            <div class="flex flex-wrap gap-2">
              <span v-for="skill in user.skills" :key="skill" class="bg-gray-800 text-turquesa text-sm px-3 py-1 rounded-full">
                {{ skill }}
              </span>
            </div>
          </div>

          <div class="text-sm text-gray-500 pt-4 border-t border-gray-800">
            <p>Perfil creado: {{ formatDate(user.created_at) }}</p>
            <p>Última actualización: {{ formatDate(user.updated_at) }}</p>
          </div>
        </div>

        <!-- Redes -->
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-lg">
          <h3 class="text-xl font-bankgothic text-turquesa mb-4">Redes y enlaces</h3>

          <div class="space-y-4">

            <template v-if="user.github_url">
              <label class="block text-gray-400 text-sm mb-2">GitHub</label>
              <a
                :href="user.github_url"
                class="block bg-gray-800 text-turquesa px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                target="_blank"
              >
                {{ user.github_url }}
              </a>
            </template>

            <template v-if="user.linkedin_url">
              <label class="block text-gray-400 text-sm mb-2">LinkedIn</label>
              <a
                :href="user.linkedin_url"
                class="block bg-gray-800 text-turquesa px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                target="_blank"
              >
                {{ user.linkedin_url }}
              </a>
            </template>

            <template v-if="user.instagram_url">
              <label class="block text-gray-400 text-sm mb-2">Instagram</label>
              <a
                :href="user.instagram_url"
                class="block bg-gray-800 text-turquesa px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                target="_blank"
              >
                {{ user.instagram_url }}
              </a>

            </template>

          </div>

        </div>
      </div>

      <!-- Publicaciones -->
      <div class="space-y-6 md:col-span-6 lg:col-span-8">
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-lg">
          <h2 class="text-3xl font-bankgothic text-turquesa mb-8">Mis publicaciones</h2>

          <div v-if="posts.length > 0" class="space-y-6">
            <div
              v-for="post in posts"
              :key="post.id"
              class="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow hover:border-gray-600 transition"
            >
              <p class="text-sm text-gray-400 mb-2">
                Publicado el {{ new Date(post.created_at).toLocaleString() }}
              </p>

              <p class="text-lg text-gray-200 mb-4">{{ post.content }}</p>

              <img
                v-if="post.image_url"
                :src="post.image_url"
                alt="Imagen del post"
                class="w-full rounded-lg mb-4 object-cover"
              />

              <div v-if="post.tags?.length" class="flex flex-wrap gap-2">
                <span
                  v-for="tag in post.tags"
                  :key="tag"
                  class="bg-gray-700 text-turquesa text-xs px-3 py-1 rounded-full"
                >
                  {{ tag }}
                </span>
              </div>

            </div>
          </div>

          <div v-else class="text-center text-gray-400 py-8">
            Aún no publicaste nada.
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
