<script>
import {subscribeToAuthStateChanges, createInitialUserState} from "../services/auth.js";
import {createPost, fetchPosts, subscribeToPosts} from "../services/posts.js";

let unsubscribeFromAuth = () => {
};
let unsubscribeFromPost = () => {
};

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
    };
  },
  methods: {
    async handleSubmit() {
      if (!this.newPost.content.trim()) {
        alert('El contenido de la publicación no puede estar vacío.');
        return;
      }
      try {
        await createPost({
          content: this.newPost.content,
          image_url: this.newPost.image_url || null,
          tags: this.newPost.tags
            ? this.newPost.tags.split(",").map((t) => t.trim())
            : [],
        });
        this.newPost.content = "";
        this.newPost.image_url = "";
        this.newPost.tags = "";
      } catch (error) {
        console.error('[PostsFeed.vue] Error al crear el post:', error);
        alert('No se pudo crear la publicación. Por favor intenta nuevamente.');
      }

    },
  },
  async mounted() {
    unsubscribeFromAuth = subscribeToAuthStateChanges(
      (newUserState) => (this.user = newUserState)
    );

    this.posts = await fetchPosts();

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
    <!-- Botón flotante -->
    <button
      class="fixed bottom-6 right-6 bg-turquesa font-bankgothic px-6 py-3 rounded-full shadow-lg hover:bg-[#0db38f] transition-all duration-300"
      @click="showModal = true"
    >
      Nueva publicación
    </button>

    <!-- Modal -->
    <transition name="fade-scale">
      <div
        v-if="showModal"
        class="fixed inset-0 bg-turquesa/70 flex items-center justify-center ">
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
                class="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-turquesa focus:outline-none"
                placeholder="Escribí tu publicación..."
                rows="4"
              ></textarea>
            </div>

            <div>
              <label
                class="block text-gray-300 mb-2 font-medium"
                for="image_url"
              >
                URL de imagen (opcional)
              </label>
              <input
                id="image_url"
                v-model="newPost.image_url"
                class="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-turquesa focus:outline-none"
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
                class="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-turquesa focus:outline-none"
                placeholder="vue, javascript, supabase"
              />
            </div>

            <button
              class="w-full bg-turquesa text-black font-bankgothic uppercase tracking-wider py-3 rounded-lg hover:bg-[#0db38f] transition-colors duration-200 disabled:opacity-50"
              type="submit"
            >
              Publicar
            </button>
          </form>
        </div>
      </div>
    </transition>


    <!-- Listado de posts -->
    <h1 class="font-bankgothic text-turquesa text-2xl">Publicaciones</h1>
    <div class="space-y-5 mt-6">
      <div
        v-for="post in posts"
        :key="post.id"
        class="bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 max-h-[600px] overflow-hidden"
      >
        <!-- Avatar + nombre + fecha -->
        <div class="flex items-center gap-3 mb-3 ">
          <RouterLink :to="`/usuario/${post.user_id}`" class="flex items-center gap-3 group">
            <img
              :src="`/img/${post.user_profiles?.avatar_url}`"
              alt="Avatar"
              class="w-10 h-10 rounded-full border border-gray-700 "
            />
            <span class="font-bankgothic text-white">
              {{
                post.user_profiles?.display_name ||
                post.user_profiles?.username ||
                'Usuario'
              }}
            </span>
          </RouterLink>
          <span class="text-xs text-gray-500 ml-auto">
            {{ new Date(post.created_at).toLocaleString() }}
          </span>
        </div>

        <!-- Contenido principal -->
        <p class="text-base text-gray-200 mb-3 whitespace-pre-line">
          {{ post.content }}
        </p>

        <!-- Imagen -->
        <div v-if="post.image_url" class="mb-3 max-h-[300px] overflow-hidden">
          <img
            :src="post.image_url"
            alt="Imagen de publicación"
            class="w-full rounded-lg shadow-md"
          />
        </div>

        <!-- Tags -->
        <div v-if="post.tags && post.tags.length" class="flex flex-wrap gap-2 mb-3">
          <span
            v-for="tag in post.tags"
            :key="tag"
            class="bg-turquesa text-black text-xs font-semibold px-2 py-1 rounded-full cursor-pointer hover:bg-[#0db38f] transition-colors duration-200"
          >
            #{{ tag }}
          </span>
        </div>

        <!-- Reacciones (solo visual) -->
        <div class="flex items-center gap-6 pt-2 border-t border-gray-700">
          <button class="flex items-center gap-2 text-gray-400 hover:text-turquesa transition-colors duration-200">
            ❤️ <span>23</span>
          </button>
          <button class="flex items-center gap-2 text-gray-400 hover:text-turquesa transition-colors duration-200">
            💬 <span>5</span>
          </button>
        </div>
      </div>

      <!-- Mensaje si no hay publicaciones -->
      <div v-if="posts.length === 0" class="text-center text-gray-500 py-8">
        No hay publicaciones aún. ¡Sé el primero en compartir algo!
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