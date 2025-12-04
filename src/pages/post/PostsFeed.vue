<template>
  <div class="max-w-7xl mx-auto p-8">
    <!-- Layout con grid -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Columna principal de posts -->
      <div class="lg:col-span-3">

        <div class="flex items-center mb-4">
          <h1 class="font-bankgothic text-turquesa text-3xl">Publicaciones</h1>
          <button
            :disabled="loadingPosts || !user.id"
            class="text-turquesa hover:text-white p-1 rounded transition disabled:opacity-50 ml-4"
            title="Actualizar publicaciones"
            @click="loadPosts"
          >
            <i :class="{'animate-spin': loadingPosts, 'fas fa-sync': true}"
               class="w-4 h-4"
            ></i>
          </button>
        </div>



        <!-- ALERT -->
        <AlertMessage
          v-if="errorMessage"
          :message="errorMessage"
          class="mb-4"
          type="danger"
        />

        <!-- Botón flotante -->
        <button
          v-if="user.id"
          class="fixed bottom-6 right-6 bg-turquesa text-black font-bankgothic px-6 py-3 rounded-full shadow-lg hover:bg-[#0db38f] transition-all z-40"
          @click="openModal"
        >
          Nueva publicación
        </button>

        <!-- Modales -->
        <CreatePostModal
          :loading="loadingCreate"
          :show="showModal"
          @close="showModal = false"
          @submit="handleSubmit"
        />

        <EditPostModal
          :loading="loadingUpdate"
          :post="editingPost"
          :show="showEditModal"
          @close="showEditModal = false"
          @submit="handleEditSubmit"
        />

        <!-- Loader de posts -->
        <div v-if="loadingPosts" class="text-center py-10 text-gray-400">
          <div
            class="animate-spin h-10 w-10 mx-auto border-4 border-turquesa border-t-transparent rounded-full mb-3"
          ></div>
          Cargando publicaciones...
        </div>

        <!-- Lista de posts -->
        <div v-else class="space-y-5">
          <PostCard
            v-for="post in posts"
            :key="post.id"
            :comments-count="commentsCount[post.id] || 0"
            :current-user-id="user.id"
            :post="post"
            :show-user-link="true"
            @comments="openComments"
            @delete="handleDelete"
            @edit="openEditModal"
          />

          <!-- Sin publicaciones -->
          <div v-if="posts.length === 0 && !loadingPosts" class="text-center text-gray-500 py-8">
            <i class="fa-solid fa-inbox text-4xl mb-3 opacity-50"></i>
            <p>No hay publicaciones aún.</p>
          </div>
        </div>
      </div>

      <!-- Listado de usuarios con los que chateo -->
      <div class="hidden lg:block lg:col-span-1">
        <ChatList/>
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

<script setup>
import {nextTick, onMounted, onUnmounted, ref} from 'vue';
import {createInitialUserState, subscribeToAuthStateChanges} from "../../services/auth.js";
import {createPost, deletePost, fetchPosts, subscribeToPosts, updatePost} from "../../services/posts.js";
import {getCommentsCount} from '../../services/comments.js';
import PostCard from '../../components/PostCard.vue';
import PostComments from '../../components/PostComments.vue';
import AlertMessage from '../../components/AlertMessage.vue';
import ChatList from '../../components/ChatList.vue';
import CreatePostModal from '../../components/CreatePostModal.vue';
import EditPostModal from '../../components/EditPostModal.vue';

// Estado
const user = ref(createInitialUserState());
const posts = ref([]);
const showModal = ref(false);
const showEditModal = ref(false);
const loadingPosts = ref(false);
const loadingCreate = ref(false);
const loadingUpdate = ref(false);
const errorMessage = ref("");
const showCommentsModal = ref(false);
const selectedPostId = ref(null);
const commentsCount = ref({});
const editingPost = ref(null);

let unsubscribeFromAuth = () => {
};
let unsubscribeFromPost = () => {
};

// Abrir comentarios
function openComments(post) {
  selectedPostId.value = post.id;
  showCommentsModal.value = true;
}

function closeComments() {
  showCommentsModal.value = false;
  selectedPostId.value = null;
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

// Crear post
async function handleSubmit(formData) {
  errorMessage.value = "";

  if (!user.value.id) {
    errorMessage.value = "Tenés que iniciar sesión para publicar.";
    return;
  }

  if (!formData.content.trim()) {
    errorMessage.value = "El contenido no puede estar vacío.";
    return;
  }

  try {
    loadingCreate.value = true;
    await createPost(formData);
    showModal.value = false;
  } catch (error) {
    console.error("[PostsFeed.vue] Error al crear el post:", error);
    errorMessage.value = "No se pudo crear la publicación.";
  } finally {
    loadingCreate.value = false;
  }
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
    console.error("[PostsFeed.vue] Error al actualizar el post:", error);
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
    console.error("[PostsFeed.vue] Error al eliminar el post:", error);
    errorMessage.value = "No se pudo eliminar la publicación.";
  }
}

// Cargar posts
async function loadPosts() {
  try {
    loadingPosts.value = true;
    posts.value = await fetchPosts();
    await loadCommentsCount();
  } catch (error) {
    console.error("[PostsFeed.vue] Error al cargar posts:", error);
    errorMessage.value = "No se pudieron cargar las publicaciones.";
  } finally {
    loadingPosts.value = false;
  }
}

function openModal() {
  errorMessage.value = "";
  showModal.value = true;
}

onMounted(async () => {
  unsubscribeFromAuth = subscribeToAuthStateChanges(
    (newUserState) => (user.value = newUserState)
  );

  await loadPosts();

  unsubscribeFromPost = subscribeToPosts(async (newPost) => {
    posts.value.unshift(newPost);
    await nextTick();
  });
});

onUnmounted(() => {
  unsubscribeFromAuth();
  unsubscribeFromPost();
});
</script>