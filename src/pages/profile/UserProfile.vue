<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getUserProfileById } from "../../services/user-profiles.js";
import { createInitialUserState, subscribeToAuthStateChanges } from "../../services/auth.js";
import { fetchUserPosts } from "../../services/posts.js";
import { getCommentsCount } from '../../services/comments.js';
import PostCard from '../../components/PostCard.vue';
import PostComments from '../../components/PostComments.vue';

const route = useRoute();
const currentUser = ref(createInitialUserState());
const user = ref(createInitialUserState());
const posts = ref([]);
const loading = ref(true);
const errorMessage = ref('');
const commentsCount = ref({});
const showCommentsModal = ref(false);
const selectedPostId = ref(null);

async function loadUserPosts() {
  const { data, error } = await fetchUserPosts(user.value.id);

  if (error) {
    errorMessage.value = "No se pudieron cargar las publicaciones.";
    return;
  }

  posts.value = data;
  await loadCommentsCount();
}

// Cargar contador de comentarios
async function loadCommentsCount() {
  for (const post of posts.value) {
    try {
      const count = await getCommentsCount(post.id);
      commentsCount.value[post.id] = count;
    } catch (error) {
      console.error('Error al cargar contador de comentarios:', error);
    }
  }
}

// Abrir comentarios
function openComments(post) {
  selectedPostId.value = post.id;
  showCommentsModal.value = true;
}

function closeComments() {
  showCommentsModal.value = false;
  selectedPostId.value = null;
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString() : "No disponible";
}

onMounted(async () => {
  try {
    subscribeToAuthStateChanges(
      (newUserState) => (currentUser.value = newUserState)
    );

    loading.value = true;

    const result = await getUserProfileById(route.params.id);

    if (!result) {
      errorMessage.value = "No se encontró este usuario.";
      loading.value = false;
      return;
    }

    user.value = result;

    await loadUserPosts();

  } catch (error) {
    console.error("Error loading user profile:", error);
    errorMessage.value = "Error cargando el perfil del usuario.";
  }

  loading.value = false;
});
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white px-6 py-12">

    <!--  Loader -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-turquesa border-t-transparent"></div>
    </div>

    <!--  Estado de error -->
    <div v-else-if="errorMessage" class="text-center py-20">
      <h1 class="text-3xl font-bankgothic text-red-500 mb-4">
        Error
      </h1>
      <p class="text-gray-400">{{ errorMessage }}</p>
    </div>

    <!--  Vista principal -->
    <div v-else class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

      <!--  H1 semántico -->
      <h1 class="md:col-span-12 text-4xl font-bankgothic text-turquesa mb-8">
        Perfil de {{ user.display_name || user.username }}
      </h1>

      <!-- Columna de perfil -->
      <div class="space-y-6 md:col-span-6 lg:col-span-4">
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-lg">
          <div class="flex flex-col items-center text-center">

            <img
              v-if="user.avatar_url"
              :src="user.avatar_url"
              alt="Avatar"
              class="w-32 h-32 rounded-full mb-4 border-4 border-turquesa object-cover"
            />

            <div v-else class="w-32 h-32 rounded-full mb-4 bg-gray-700 flex items-center justify-center text-3xl">
              {{ user.display_name?.charAt(0).toUpperCase() }}
            </div>

            <h2 class="text-3xl font-bankgothic text-turquesa mb-2">
              {{ user.display_name }}
            </h2>

            <p class="text-gray-400 text-sm mb-1">Usuario: @{{ user.username }}</p>
            <p class="text-gray-400 text-sm mb-4">Email: {{ user.email }}</p>

            <p class="text-lg text-gray-300 mb-2">{{ user.career || 'Carrera no especificada' }}</p>
            <p class="text-sm text-gray-400 mb-4">{{ user.location || 'Ubicación no especificada' }}</p>

            <span
              v-if="user.available_for_work"
              class="bg-green-700 text-white text-xs px-3 py-1 rounded-full mb-4"
            >
              Disponible para trabajar
            </span>
            <hr class="mb-4">

            <RouterLink
              class="block bg-gray-800 text-turquesa px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              :to="`/usuario/${user.id}/chat`"
            >
              Iniciar conversación privada con {{ user.email }}
            </RouterLink>
          </div>
        </div>

        <!-- Sobre mí, skills, etc. -->
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
              <span
                v-for="skill in user.skills"
                :key="skill"
                class="bg-gray-800 text-turquesa text-sm px-3 py-1 rounded-full"
              >
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
              <label class="block text-gray-400 text-sm">GitHub</label>
              <a
                :href="user.github_url"
                class="block bg-gray-800 text-turquesa px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                target="_blank"
              >
                {{ user.github_url }}
              </a>
            </template>

            <template v-if="user.linkedin_url">
              <label class="block text-gray-400 text-sm">LinkedIn</label>
              <a
                :href="user.linkedin_url"
                class="block bg-gray-800 text-turquesa px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                target="_blank"
              >
                {{ user.linkedin_url }}
              </a>
            </template>

            <template v-if="user.instagram_url">
              <label class="block text-gray-400 text-sm">Instagram</label>
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
          <h2 class="text-3xl font-bankgothic text-turquesa mb-8">Publicaciones</h2>

          <div v-if="posts.length > 0" class="space-y-5">
            <PostCard
              v-for="post in posts"
              :key="post.id"
              :post="post"
              :comments-count="commentsCount[post.id] || 0"
              :current-user-id="currentUser.id"
              :show-user-link="false"
              @comments="openComments"
            />
          </div>

          <div v-else class="text-center text-gray-400 py-8">
            <i class="fa-solid fa-inbox text-4xl mb-3 opacity-50"></i>
            <p>Este usuario aún no ha publicado nada.</p>
          </div>

        </div>
      </div>
    </div>

    <!-- Modal de Comentarios -->
    <PostComments
      v-if="selectedPostId"
      :post-id="selectedPostId"
      :show-comments="showCommentsModal"
      @close="closeComments"
    />
  </div>
</template>