<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  post: {
    type: Object,
    required: true
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  currentUserId: {
    type: String,
    required: true
  },
  showUserLink: {
    type: Boolean,
    default: false
  }

});

defineEmits(['edit', 'delete', 'comments']);

// Verificar si el usuario actual es dueño del post
const isOwner = computed(() => {
  return props.currentUserId && props.post.user_id === props.currentUserId;
});

// Función para formatear la fecha
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>
<template>
  <div
    class="bg-gray-900 border border-gray-400 rounded-xl p-4 shadow-md hover:shadow-lg transition-all"
  >
    <div class="flex items-center gap-3">
      <!-- Si showUserLink es true, mostrar RouterLink, si no mostrar solo div -->
      <RouterLink
        v-if="showUserLink"
        :to="`/usuario/${post.user_id}`"
        class="flex items-center gap-3 hover:opacity-80 transition"
      >
        <img
          :src="post.user_profiles?.avatar_url || '/img/default-avatar.png'"
          alt="Avatar"
          class="w-10 h-10 rounded-full border border-gray-700 object-cover"
        />
        <div class="flex flex-col">
            <span class="font-bankgothic text-white hover:text-turquesa transition">
              {{ post.user_profiles?.username || "Usuario" }}
            </span>
          <span class="text-xs text-gray-500">
              {{ formatDate(post.created_at) }}
            </span>
        </div>
      </RouterLink>    
      <div v-if="isOwner" class="flex items-center gap-2 ml-auto">
        <button
          class="text-turquesa hover:text-white text-sm p-2 rounded-full hover:bg-gray-800 transition"
          title="Editar publicación"
          @click="$emit('edit', post)"
        >
          <i class="fa-solid fa-pen"></i>
        </button>
        <button
          class="text-red-400 hover:text-red-300 text-sm p-2 rounded-full hover:bg-gray-800 transition"
          title="Eliminar publicación"
          @click="$emit('delete', post)"
        >
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>

    <!-- Contenido -->
    <p class="text-base text-gray-200 mb-3 whitespace-pre-line leading-relaxed">
      {{ post.content }}
    </p>

    <!-- Imagen(falta terminar y agregar el input imagen) -->
    <div v-if="post.image_url" class="mb-3 max-h-[400px] overflow-hidden rounded-lg">
      <img
        :src="post.image_url"
        alt="Imagen del post"
        class="w-full h-auto object-cover shadow-md hover:scale-105 transition-transform duration-300"
      />
    </div>

    <!-- Tags -->
    <div v-if="post.tags && post.tags.length" class="flex flex-wrap gap-2 mb-3">
      <RouterLink
        v-for="tag in post.tags"
        :key="tag"
        :to="`/posts?tag=${tag}`"
        class="bg-turquesa text-black text-xs font-semibold px-3 py-1 rounded-full hover:bg-[#0db38f] transition duration-200 cursor-pointer"
      >
        #{{ tag }}
      </RouterLink>
    </div>


  <!-- Comentarios -->
  <div class="flex items-center gap-4 pt-3 border-t border-gray-700">
    <button
      class="flex items-center gap-2 text-gray-400 hover:text-turquesa transition duration-200"
      @click="$emit('comments', post)"
    >
      <i class="fa-solid fa-comment text-lg"></i>
      <span class="text-sm font-medium">
          {{ commentsCount }}
          {{ commentsCount === 1 ? 'comentario' : 'comentarios' }}
        </span>
    </button>
  </div>
  </div>
</template>