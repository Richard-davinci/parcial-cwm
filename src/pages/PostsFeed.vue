<script>
import {subscribeToAuthStateChanges} from "../services/auth.js";
import {createPost, fetchPosts, subscribeToPosts} from "../services/posts.js";

let unsubscribeFromAuth = () => {
};
let unsubscribeFromPost = () => {
};

export default {
  name: "PostsFeed",
  data() {
    return {
      user: {
        id: null,
        email: null,
        username: null,
        display_name: null,
        avatar_url: null,
        bio: null,
        location: null,
        website_url: null,
        career: null,
        skills: [],
        experience_years: null,
        current_project: null,
        available_for_work: false,
        github_url: null,
        linkedin_url: null,
        instagram_url: null,
        created_at: null,
        updated_at: null,
      },
      posts: [],
      newPost: {
        content: "",
        image_url: "",
        tags: "",
      },
    };
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
  methods: {
    async handleSubmit() {
      if (!this.newPost.content.trim()) return;

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
    },
  },
};
</script>

<template>
  <div class="max-w-5xl mx-auto p-8">
    <div class="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-10 shadow-lg">
      <h2 class="text-2xl font-bankgothic text-turquesa mb-6">
        Crear nueva publicación
      </h2>

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
            required
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

    <div class="space-y-8">
      <div
        v-for="post in posts"
        :key="post.id"
        class="bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300"
      >
        <div class="text-xs text-gray-400 mb-2">
          {{ new Date(post.created_at).toLocaleString() }}
        </div>

        <p class="text-lg text-gray-200 mb-4">{{ post.content }}</p>

        <div v-if="post.image_url" class="mb-4">
          <img
            :src="post.image_url"
            alt="Imagen de publicación"
            class="w-full rounded-lg shadow-md"
          />
        </div>

        <div v-if="post.tags && post.tags.length" class="flex flex-wrap gap-2">
          <span
            v-for="tag in post.tags"
            :key="tag"
            class="bg-turquesa text-black text-xs font-semibold px-3 py-1 rounded-full cursor-pointer hover:bg-[#0db38f] transition-colors duration-200"
          >
            #{{ tag }}
          </span>
        </div>
      </div>

      <div v-if="posts.length === 0" class="text-center text-gray-500 py-12">
        No hay publicaciones aún. ¡Sé el primero en compartir algo!
      </div>
    </div>
  </div>
</template>
