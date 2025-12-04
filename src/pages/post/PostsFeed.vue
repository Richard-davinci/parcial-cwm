<script setup>
import {nextTick, onMounted, onUnmounted, ref} from 'vue';
import {createInitialUserState, subscribeToAuthStateChanges} from "../../services/auth.js";
import {createPost, deletePost, fetchPosts, subscribeToPosts, updatePost} from "../../services/posts.js";
import {getCommentsCount} from '../../services/comments.js';
import PostComments from '../../components/PostComments.vue';
import AlertMessage from '../../components/AlertMessage.vue';
import ChatList from '../../components/ChatList.vue';


const user = ref(createInitialUserState());
const posts = ref([]);
const newPost = ref({
  content: "",
  image_url: "",
  tags: "",
});
const editingPost = ref(null);
const editPostData = ref({
  content: "",
  image_url: "",
  tags: "",
});
const showModal = ref(false);
const showEditModal = ref(false);
const loadingPosts = ref(false);
const loadingCreate = ref(false);
const loadingUpdate = ref(false);
const errorMessage = ref("");
const showCommentsModal = ref(false);
const selectedPostId = ref(null);
const commentsCount = ref({});

let unsubscribeFromAuth = () => {
};
let unsubscribeFromPost = () => {
};

// Función para mostrar comentarios
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

// ========================
// CREAR PUBLICACION
// ========================
async function handleSubmit() {
  errorMessage.value = "";

  if (!user.value.id) {
    errorMessage.value = "Tenés que iniciar sesión para publicar.";
    return;
  }

  if (!newPost.value.content.trim()) {
    errorMessage.value = "El contenido no puede estar vacío.";
    return;
  }

  try {
    loadingCreate.value = true;

    await createPost({
      content: newPost.value.content,
      image_url: newPost.value.image_url || null,
      tags: newPost.value.tags
        ? newPost.value.tags.split(",").map(t => t.trim())
        : [],
    });

    newPost.value.content = "";
    newPost.value.image_url = "";
    newPost.value.tags = "";
    showModal.value = false;

  } catch (error) {
    console.error("[PostsFeed.vue] Error al crear el post:", error);
    errorMessage.value = "No se pudo crear la publicación.";
  }

  loadingCreate.value = false;
}

// ========================
// EDITAR PUBLICACION
// ========================
function openEditModal(post) {
  // Validar que el post tenga id
  if (!post.id) {
    errorMessage.value = "Error: No se puede editar este post (ID faltante)";
    return;
  }

  console.log('Editando post:', post); // Para debug

  editingPost.value = {
    id: post.id,
    user_id: post.user_id,
    content: post.content,
    image_url: post.image_url,
    tags: post.tags
  };

  editPostData.value = {
    content: post.content || "",
    image_url: post.image_url || "",
    tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
  };

  errorMessage.value = "";
  showEditModal.value = true;
}

async function handleEditSubmit() {
  errorMessage.value = "";

  if (!editPostData.value.content.trim()) {
    errorMessage.value = "El contenido no puede estar vacío.";
    return;
  }

  try {
    loadingUpdate.value = true;

    await updatePost(editingPost.value.id, {
      content: editPostData.value.content,
      image_url: editPostData.value.image_url,
      tags: editPostData.value.tags.split(',').map(t => t.trim())
    });


    // Actualizar el post en la lista local
    const postIndex = posts.value.findIndex(p => p.id === editingPost.value.id);
    if (postIndex !== -1) {
      posts.value[postIndex] = {
        ...posts.value[postIndex],
        content: editPostData.value.content,
        image_url: editPostData.value.image_url || null,
        tags: editPostData.value.tags
          ? editPostData.value.tags.split(",").map(t => t.trim())
          : [],
      };
    }

    showEditModal.value = false;
    editingPost.value = null;

  } catch (error) {
    console.error("[PostsFeed.vue] Error al actualizar el post:", error);
    errorMessage.value = "No se pudo actualizar la publicación.";
  }

  loadingUpdate.value = false;
}

// ========================
// ELIMINAR PUBLICACION
// ========================
async function handleDelete(post) {
  if (!confirm("¿Estás seguro de que querés eliminar esta publicación?")) {
    return;
  }

  try {
    await deletePost(post.id);

    // Remover de la lista local
    posts.value = posts.value.filter(p => p.id !== post.id);

  } catch (error) {
    console.error("[PostsFeed.vue] Error al eliminar el post:", error);
    errorMessage.value = "No se pudo eliminar la publicación.";
  }
}

// ========================
// CARGAR POSTS
// ========================
async function loadPosts() {
  try {
    loadingPosts.value = true;
    posts.value = await fetchPosts();
    await loadCommentsCount();
  } catch (error) {
    console.error("[PostsFeed.vue] Error al cargar posts:", error);
    errorMessage.value = "No se pudieron cargar las publicaciones.";
  }
  loadingPosts.value = false;
}

// Función para verificar si el usuario es dueño del post
function isOwner(post) {
  return user.value.id && post.user_id === user.value.id;
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

<template>
  <div class="max-w-7xl mx-auto p-8">
    <!-- Layout con grid -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Columna principal de posts -->
      <div class="lg:col-span-3">
        <h1 class="font-bankgothic text-turquesa text-3xl mb-6">Publicaciones</h1>

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
          class="fixed bottom-6 right-6 bg-turquesa font-bankgothic px-6 py-3 rounded-full shadow-lg hover:bg-[#0db38f] transition-all"
          @click="openModal"
        >
          Nueva publicación
        </button>

        <!-- Modal Crear -->
        <transition name="fade-scale">
          <div
            v-if="showModal"
            class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div class="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-lg w-full shadow-xl">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bankgothic text-turquesa">
                  Crear nueva publicación
                </h2>
                <button
                  class="text-2xl text-turquesa hover:text-white transition"
                  @click="showModal = false"
                >
                  ✕
                </button>
              </div>

              <form class="space-y-5" @submit.prevent="handleSubmit">
                <div>
                  <label class="block text-gray-300 mb-2 font-medium" for="content">
                    ¿Qué querés compartir hoy?
                  </label>
                  <textarea
                    id="content"
                    v-model="newPost.content"
                    class="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-turquesa"
                    placeholder="Escribí tu publicación..."
                    rows="4"
                  ></textarea>
                </div>

                <div>
                  <label class="block text-gray-300 mb-2 font-medium" for="image_url">
                    URL de imagen (opcional)
                  </label>
                  <input
                    id="image_url"
                    v-model="newPost.image_url"
                    class="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-turquesa"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    type="url"
                  />
                </div>

                <div>
                  <label class="block text-gray-300 mb-2 font-medium" for="tags">
                    Tags (separados por coma)
                  </label>
                  <input
                    id="tags"
                    v-model="newPost.tags"
                    class="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-turquesa"
                    placeholder="vue, javascript, supabase"
                  />
                </div>

                <button
                  :disabled="loadingCreate"
                  class="w-full bg-turquesa text-black font-bankgothic py-3 rounded-lg hover:bg-[#0db38f] disabled:opacity-50 flex items-center justify-center gap-2 transition"
                  type="submit"
                >
                  <span v-if="!loadingCreate">Publicar</span>
                  <span v-else class="flex items-center gap-2">
                <div class="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
                Publicando...
              </span>
                </button>
              </form>
            </div>
          </div>
        </transition>

        <!-- Modal Editar -->
        <transition name="fade-scale">
          <div
            v-if="showEditModal"
            class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div class="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-lg w-full shadow-xl">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bankgothic text-turquesa">
                  Editar publicación
                </h2>
                <button
                  class="text-2xl text-turquesa hover:text-white transition"
                  @click="showEditModal = false"
                >
                  ✕
                </button>
              </div>

              <form class="space-y-5" @submit.prevent="handleEditSubmit">
                <div>
                  <label class="block text-gray-300 mb-2 font-medium" for="edit-content">
                    Contenido
                  </label>
                  <textarea
                    id="edit-content"
                    v-model="editPostData.content"
                    class="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-turquesa"
                    placeholder="Escribí tu publicación..."
                    rows="4"
                  ></textarea>
                </div>

                <div>
                  <label class="block text-gray-300 mb-2 font-medium" for="edit-image_url">
                    URL de imagen (opcional)
                  </label>
                  <input
                    id="edit-image_url"
                    v-model="editPostData.image_url"
                    class="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-turquesa"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    type="url"
                  />
                </div>

                <div>
                  <label class="block text-gray-300 mb-2 font-medium" for="edit-tags">
                    Tags (separados por coma)
                  </label>
                  <input
                    id="edit-tags"
                    v-model="editPostData.tags"
                    class="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-turquesa"
                    placeholder="vue, javascript, supabase"
                  />
                </div>

                <div class="flex gap-3">
                  <button
                    class="flex-1 bg-gray-700 text-white font-bankgothic py-3 rounded-lg hover:bg-gray-600 transition"
                    type="button"
                    @click="showEditModal = false"
                  >
                    Cancelar
                  </button>
                  <button
                    :disabled="loadingUpdate"
                    class="flex-1 bg-turquesa text-black font-bankgothic py-3 rounded-lg hover:bg-[#0db38f] disabled:opacity-50 flex items-center justify-center gap-2 transition"
                    type="submit"
                  >
                    <span v-if="!loadingUpdate">Actualizar</span>
                    <span v-else class="flex items-center gap-2">
                  <div class="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
                  Actualizando...
                </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </transition>

        <!-- Loader de posts -->
        <div v-if="loadingPosts" class="text-center py-10 text-gray-400">
          <div
            class="animate-spin h-10 w-10 mx-auto border-4 border-turquesa border-t-transparent rounded-full mb-3"></div>
          Cargando publicaciones...
        </div>

        <!-- Lista de posts -->
        <div v-else class="space-y-5 ">
          <div
            v-for="post in posts"
            :key="post.id"
            class="bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-md hover:shadow-lg transition-all"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <RouterLink :to="`/usuario/${post.user_id}`" class="flex items-center gap-3">
                  <img
                    :src="post.user_profiles?.avatar_url || '/img/default-avatar.png'"
                    alt="Avatar"
                    class="w-10 h-10 rounded-full border border-gray-700"
                  />
                  <span class="font-bankgothic text-white">
                {{ post.user_profiles?.username || "Usuario" }}
              </span>
                </RouterLink>
                <span class="text-xs text-gray-500">
              {{ new Date(post.created_at).toLocaleString() }}
            </span>
              </div>

              <!-- Botones de editar/eliminar (solo para el dueño) -->
              <div v-if="isOwner(post)" class="flex items-center gap-2">
                <button
                  class="text-turquesa hover:text-white text-sm p-2 rounded-full hover:bg-gray-800 transition"
                  title="Editar publicación"
                  @click="openEditModal(post)"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
                <button
                  class="text-red-400 hover:text-red-300 text-sm p-2 rounded-full hover:bg-gray-800 transition"
                  title="Eliminar publicación"
                  @click="handleDelete(post)"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </div>
            </div>

            <p class="text-base text-gray-200 mb-3 whitespace-pre-line">
              {{ post.content }}
            </p>

            <div v-if="post.image_url" class="mb-3 max-h-[300px] overflow-hidden">
              <img
                :src="post.image_url"
                alt="Imagen"
                class="w-full rounded-lg shadow-md"
              />
            </div>


            <div v-if="post.tags && post.tags.length" class="flex flex-wrap gap-2 mb-3">
              <span
                v-for="tag in post.tags"
                :key="tag"
                class="bg-turquesa text-black text-xs font-semibold px-2 py-1 rounded-full hover:bg-[#0db38f] transition"
              >
                #{{ tag }}
              </span>
            </div>

            <!-- Botón de comentarios -->
            <div class="flex items-center gap-4 pt-3 border-t border-gray-700">
              <button
                class="flex items-center gap-2 text-gray-400 hover:text-turquesa transition"
                @click="openComments(post)"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M21,6H3A1,1,0,0,0,2,7V17a3,3,0,0,0,3,3H16.59l3.7,3.71A1,1,0,0,0,21,24a.84.84,0,0,0,.38-.08A1,1,0,0,0,22,23V7A1,1,0,0,0,21,6ZM20,20.59l-2.29-2.3A1,1,0,0,0,17,18H5a1,1,0,0,1-1-1V8H20Z"/>
                </svg>
                <span class="text-sm">
                  {{ commentsCount[post.id] || 0 }}
                  {{ (commentsCount[post.id] || 0) === 1 ? 'comentario' : 'comentarios' }}
                </span>
              </button>
            </div>
          </div>

          <div v-if="posts.length === 0 && !loadingPosts" class="text-center text-gray-500 py-8">
            No hay publicaciones aún.
          </div>
        </div>
      </div>

      <!-- Sidebar derecho con lista de usuarios/chats -->
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