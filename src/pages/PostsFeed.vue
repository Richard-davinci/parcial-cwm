<script>
import { subscribeToAuthStateChanges, createInitialUserState } from "../services/auth.js";
import { createPost, fetchPosts, subscribeToPosts } from "../services/posts.js";

let unsubscribeFromAuth = () => {};
let unsubscribeFromPost = () => {};

export default {
  name: "PostsFeed",

  data() {
    return {
      user: createInitialUserState(),
      posts: [],
      newPost: {
        content: "",
        image_url: "",
        tags: "",
      },
      showModal: false,
      loadingPosts: false,
      loadingCreate: false,
      errorMessage: "",
    };
  },

  methods: {
    // ========================
    // CREAR PUBLICACION
    // ========================
    async handleSubmit() {
      this.errorMessage = "";

      // Validar login
      if (!this.user.id) {
        this.errorMessage = "Tenés que iniciar sesión para publicar.";
        return;
      }

      // Validación contenido vacío
      if (!this.newPost.content.trim()) {
        this.errorMessage = "El contenido no puede estar vacío.";
        return;
      }

      try {
        this.loadingCreate = true;

        await createPost({
          content: this.newPost.content,
          image_url: this.newPost.image_url || null,
          tags: this.newPost.tags
            ? this.newPost.tags.split(",").map(t => t.trim())
            : [],
        });

        // Limpiar formulario
        this.newPost.content = "";
        this.newPost.image_url = "";
        this.newPost.tags = "";
        this.showModal = false;

      } catch (error) {
        console.error("[PostsFeed.vue] Error al crear el post:", error);
        this.errorMessage = "No se pudo crear la publicación.";
      }

      this.loadingCreate = false;
    },

    // ========================
    // CARGAR POSTS
    // ========================
    async loadPosts() {
      try {
        this.loadingPosts = true;
        this.posts = await fetchPosts();
      } catch (error) {
        console.error("[PostsFeed.vue] Error al cargar posts:", error);
        this.errorMessage = "No se pudieron cargar las publicaciones.";
      }
      this.loadingPosts = false;
    },

    // Abrir modal limpiando errores
    openModal() {
      this.errorMessage = "";
      this.showModal = true;
    }
  },

  async mounted() {
    unsubscribeFromAuth = subscribeToAuthStateChanges(
      (newUserState) => (this.user = newUserState)
    );

    await this.loadPosts();

    unsubscribeFromPost = subscribeToPosts(async (newPost) => {
      this.posts.unshift(newPost);
      await this.$nextTick();
    });
  },

  unmounted() {
    unsubscribeFromAuth();
    unsubscribeFromPost();
  },
};
</script>

<template>
  <div class="max-w-5xl mx-auto p-8">

    <h1 class="font-bankgothic text-turquesa text-3xl mb-6">Publicaciones</h1>

    <!-- ALERT -->
    <AlertMessage
      v-if="errorMessage"
      type="danger"
      :message="errorMessage"
      class="mb-4"
    />

    <!-- Botón flotante -->
    <button
      v-if="user.id"
      class="fixed bottom-6 right-6 bg-turquesa font-bankgothic px-6 py-3 rounded-full shadow-lg hover:bg-[#0db38f] transition-all"
      @click="openModal"
    >
      Nueva publicación
    </button>

    <!-- Modal -->
    <transition name="fade-scale">
      <div
        v-if="showModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center">
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

            <!-- CONTENT -->
            <div>
              <label for="content" class="block text-gray-300 mb-2 font-medium">
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

            <!-- IMAGE URL -->
            <div>
              <label for="image_url" class="block text-gray-300 mb-2 font-medium">
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

            <!-- TAGS -->
            <div>
              <label for="tags" class="block text-gray-300 mb-2 font-medium">
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

    <!-- Loader de posts -->
    <div v-if="loadingPosts" class="text-center py-10 text-gray-400">
      <div class="animate-spin h-10 w-10 mx-auto border-4 border-turquesa border-t-transparent rounded-full mb-3"></div>
      Cargando publicaciones...
    </div>

    <!-- Lista de posts -->
    <div v-else class="space-y-5 mt-6">
      <div
        v-for="post in posts"
        :key="post.id"
        class="bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-md hover:shadow-lg transition-all"
      >
        <div class="flex items-center gap-3 mb-3">
          <RouterLink :to="`/usuario/${post.user_id}`" class="flex items-center gap-3">
            <img
              :src="post.user_profiles?.avatar_url || '/img/default-avatar.png'"
              alt="Avatar"
              class="w-10 h-10 rounded-full border border-gray-700"
            />

            <span class="font-bankgothic text-white">
              {{ post.user_profiles?.username ||
                "Usuario"
              }}
            </span>
          </RouterLink>

          <span class="text-xs text-gray-500 ml-auto">
            {{ new Date(post.created_at).toLocaleString() }}
          </span>
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
      </div>

      <div v-if="posts.length === 0 && !loadingPosts" class="text-center text-gray-500 py-8">
        No hay publicaciones aún.
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.25s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
