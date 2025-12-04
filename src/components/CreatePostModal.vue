<script setup>
import { ref } from 'vue';

defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'submit']);

const formData = ref({
  content: '',
  image_url: '',
  tags: '',
});

function handleSubmit() {
  emit('submit', {
    content: formData.value.content,
    image_url: formData.value.image_url || null,
    tags: formData.value.tags
      ? formData.value.tags.split(",").map(t => t.trim())
      : [],
  });

  // Limpiar formulario
  formData.value.content = '';
  formData.value.image_url = '';
  formData.value.tags = '';
}

function closeModal() {
  emit('close');
}
</script>

<template>
  <transition name="fade-scale">
    <div
      v-if="show"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div class="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-lg w-full shadow-xl">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bankgothic text-turquesa">
            Crear nueva publicación
          </h2>
          <button
            class="text-2xl text-turquesa hover:text-white transition"
            @click="closeModal"
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
              v-model="formData.content"
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
              v-model="formData.image_url"
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
              v-model="formData.tags"
              class="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-turquesa"
              placeholder="vue, javascript, supabase"
            />
          </div>

          <button
            :disabled="loading"
            class="w-full bg-turquesa text-black font-bankgothic py-3 rounded-lg hover:bg-[#0db38f] disabled:opacity-50 flex items-center justify-center gap-2 transition"
            type="submit"
          >
            <span v-if="!loading">Publicar</span>
            <span v-else class="flex items-center gap-2">
              <div class="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
              Publicando...
            </span>
          </button>
        </form>
      </div>
    </div>
  </transition>
</template>