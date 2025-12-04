<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { createInitialUserState, subscribeToAuthStateChanges } from "../../services/auth.js";
import { fetchUserPosts } from "../../services/posts.js";
import { getCommentsCount } from '../../services/comments.js';
import { deletePost, updatePost } from "../../services/posts.js";
import PostCard from '../../components/PostCard.vue';
import PostComments from '../../components/PostComments.vue';
import EditPostModal from '../../components/EditPostModal.vue';
import AlertMessage from '../../components/AlertMessage.vue';

const user = ref(createInitialUserState());
const posts = ref([]);
const loading = ref(true);
const errorMessage = ref('');
const commentsCount = ref({});
const showCommentsModal = ref(false);
const selectedPostId = ref(null);
const showEditModal = ref(false);
const editingPost = ref(null);
const loadingUpdate = ref(false);

let unsubscribeFromAuth = () => {};

// Formatear fecha
function formatDate(date) {
  return date ? new Date(date).toLocaleDateString('es-AR') : "No disponible";
}

// Cargar posts del usuario
async function loadUserPosts() {
  try {
    loading.value = true;
    const { data, error } = await fetchUserPosts(user.value.id);

    if (error) {
      errorMessage.value = "No se pudieron cargar las publicaciones.";
      return;
    }

    posts.value = data;
    await loadCommentsCount();
  } catch (error) {
    console.error('Error al cargar posts:', error);
    errorMessage.value = "Error cargando las publicaciones.";
  } finally {
    loading.value = false;
  }
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

// Editar post
function openEditModal(post) {
  if (!post.id) {
    errorMessage.value = "Error: No se puede editar este post (ID faltante)";
    return;
  }

  editingPost.value = {
    id: post.id,
    user_id: post.user_id,
    content: post.content,
    image_url: post.image_url,
    tags: post.tags
  };

  errorMessage.value = "";
  showEditModal.value = true;
}

async function handleEditSubmit(formData) {
  errorMessage.value = "";

  if (!formData.content.trim()) {
    errorMessage.value = "El contenido no puede estar vacío.";
    return;
  }

  try {
    loadingUpdate.value = true;
    await updatePost(editingPost.value.id, formData);

    const postIndex = posts.value.findIndex(p => p.id === editingPost.value.id);
    if (postIndex !== -1) {
      posts.value[postIndex] = {
        ...posts.value[postIndex],
        ...formData
      };
    }

    showEditModal.value = false;
    editingPost.value = null;
  } catch (error) {
    console.error("[MyProfile.vue] Error al actualizar el post:", error);
    errorMessage.value = "No se pudo actualizar la publicación.";
  } finally {
    loadingUpdate.value = false;
  }
}

// Eliminar post
async function handleDelete(post) {
  if (!confirm("¿Estás seguro de que querés eliminar esta publicación?")) {
    return;
  }

  try {
    await deletePost(post.id);
    posts.value = posts.value.filter(p => p.id !== post.id);
  } catch (error) {
    console.error("[MyProfile.vue] Error al eliminar el post:", error);
    errorMessage.value = "No se pudo eliminar la publicación.";
  }
}

onMounted(async () => {
  unsubscribeFromAuth = subscribeToAuthStateChanges(async (newUserState) => {
    user.value = newUserState;
    if (newUserState.id) {
      await loadUserPosts();
    }
  });
});

onUnmounted(() => {
  unsubscribeFromAuth();
});
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white px-6 py-12">
    <!-- Loader -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-turquesa border-t-transparent"></div>
    </div>

    <!-- Vista principal -->
    <div v-else class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      <!-- H1 semántico -->
      <h1 class="md:col-span-12 text-4xl font-bankgothic text-turquesa mb-8">
        Mi Perfil
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

            <hr class="w-full mb-4" />

            <RouterLink
              class="w-full bg-gray-800 text-turquesa px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              to="/mi-perfil/editar"
            >
              Editar perfil
            </RouterLink>
          </div>
        </div>

        <!-- Sobre mí-->
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
                class="block bg-gray-800 text-turquesa px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors truncate"
                target="_blank"
              >
                {{ user.github_url }}
              </a>
            </template>

            <template v-if="user.linkedin_url">
              <label class="block text-gray-400 text-sm">LinkedIn</label>
              <a
                :href="user.linkedin_url"
                class="block bg-gray-800 text-turquesa px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors truncate"
                target="_blank"
              >
                {{ user.linkedin_url }}
              </a>
            </template>

            <template v-if="user.instagram_url">
              <label class="block text-gray-400 text-sm">Instagram</label>
              <a
                :href="user.instagram_url"
                class="block bg-gray-800 text-turquesa px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors truncate"
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
        <!-- ALERT -->
        <AlertMessage
          v-if="errorMessage"
          :message="errorMessage"
          class="mb-4"
          type="danger"
        />

        <!-- Modal de edición -->
        <EditPostModal
          :show="showEditModal"
          :post="editingPost"
          :loading="loadingUpdate"
          @close="showEditModal = false"
          @submit="handleEditSubmit"
        />

        <div class="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-lg">
          <h2 class="text-3xl font-bankgothic text-turquesa mb-8">Publicaciones</h2>

          <!-- Sin posts -->
          <div v-if="posts.length === 0" class="text-center text-gray-400 py-8">
            <i class="fa-solid fa-inbox text-4xl mb-3 opacity-50"></i>
            <p>Aún no has publicado nada.</p>
          </div>

          <!-- Lista de posts usando el componente -->
          <div v-else class="space-y-5">
            <PostCard
              v-for="post in posts"
              :key="post.id"
              :post="post"
              :comments-count="commentsCount[post.id] || 0"
              :current-user-id="user.id"
              :show-user-link="false"
              @edit="openEditModal"
              @delete="handleDelete"
              @comments="openComments"
            />
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