<script setup>
import {computed, onMounted, onUnmounted, ref} from 'vue';
import {
  createComment,
  deleteComment,
  fetchPostComments,
  subscribeToPostComments,
  updateComment
} from '../services/comments.js';
import {createInitialUserState, subscribeToAuthStateChanges} from '../services/auth.js';
import AlertMessage from "./AlertMessage.vue";

const props = defineProps({
  postId: {
    type: [String, Number],
    required: true
  },
  showComments: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const user = ref(createInitialUserState());
const comments = ref([]);
const newComment = ref('');
const replyToComment = ref(null);
const editingComment = ref(null);
const editContent = ref('');
const loading = ref(false);
const loadingSubmit = ref(false);
const errorMessage = ref('');

let unsubscribeFromAuth = () => {
};
let unsubscribeFromComments = () => {
};

// Computed
const canComment = computed(() => user.value.id);

// Cargar comentarios
async function loadComments() {
  try {
    loading.value = true;
    comments.value = await fetchPostComments(props.postId);
  } catch (error) {
    console.error('Error al cargar comentarios:', error);
    errorMessage.value = 'No se pudieron cargar los comentarios.';
  } finally {
    loading.value = false;
  }
}

// Crear comentario
async function handleCreateComment() {
  if (!newComment.value.trim()) {
    errorMessage.value = 'El comentario no puede estar vacío.';
    return;
  }

  if (!canComment.value) {
    errorMessage.value = 'Tenés que iniciar sesión para comentar.';
    return;
  }

  try {
    loadingSubmit.value = true;
    errorMessage.value = '';

    await createComment({
      content: newComment.value,
      post_id: props.postId,
      parent_comment_id: replyToComment.value?.id || null
    });

    newComment.value = '';
    replyToComment.value = null;
    await loadComments(); // Recargar comentarios

  } catch (error) {
    console.error('Error al crear comentario:', error);
    errorMessage.value = 'No se pudo crear el comentario.';
  } finally {
    loadingSubmit.value = false;
  }
}

// Iniciar respuesta
function startReply(comment) {
  replyToComment.value = comment;
  newComment.value = `@${comment.user_profiles?.username || 'Usuario'} `;
}

// Cancelar respuesta
function cancelReply() {
  replyToComment.value = null;
  newComment.value = '';
}

// Iniciar edición
function startEdit(comment) {
  editingComment.value = comment;
  editContent.value = comment.content;
}

// Guardar edición
async function saveEdit() {
  if (!editContent.value.trim()) {
    errorMessage.value = 'El comentario no puede estar vacío.';
    return;
  }

  try {
    loadingSubmit.value = true;
    errorMessage.value = '';

    await updateComment(editingComment.value.id, {
      content: editContent.value
    });

    editingComment.value = null;
    editContent.value = '';
    await loadComments();

  } catch (error) {
    console.error('Error al actualizar comentario:', error);
    errorMessage.value = 'No se pudo actualizar el comentario.';
  } finally {
    loadingSubmit.value = false;
  }
}

// Cancelar edición
function cancelEdit() {
  editingComment.value = null;
  editContent.value = '';
}

// Eliminar comentario
async function handleDelete(comment) {
  if (!confirm('¿Estás seguro de que querés eliminar este comentario?')) {
    return;
  }

  try {
    await deleteComment(comment.id);
    await loadComments();
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    errorMessage.value = 'No se pudo eliminar el comentario.';
  }
}

// Verificar si es el dueño del comentario
function isOwner(comment) {
  return user.value.id && comment.user_id === user.value.id;
}

// Formatear fecha
function formatDate(date) {
  return new Date(date).toLocaleString();
}

onMounted(async () => {
  unsubscribeFromAuth = subscribeToAuthStateChanges(
    (newUserState) => (user.value = newUserState)
  );

  if (props.showComments) {
    await loadComments();

    unsubscribeFromComments = subscribeToPostComments(
      props.postId,
      async () => {
        await loadComments();
      }
    );
  }
});

onUnmounted(() => {
  unsubscribeFromAuth();
  unsubscribeFromComments();
});
</script>

<template>
  <div
    v-if="showComments"
    class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
  >
    <div class="bg-gray-900 border border-gray-400 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
      <div class="flex justify-between items-center px-6 py-2 border-b border-gray-700">
        <h2 class="text-xl font-bankgothic text-turquesa">Comentarios</h2>
        <button
          class="text-2xl text-turquesa hover:text-white transition"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- Alert -->
      <AlertMessage
        v-if="errorMessage"
        :message="errorMessage"
        class="mx-6 mt-4"
        type="danger"
      />

      <!-- Comments List -->
      <div class="flex-1 overflow-y-auto p-6 space-y-4">
        <div v-if="loading" class="text-center text-gray-400">
          <div
            class="animate-spin h-8 w-8 mx-auto border-4 border-turquesa border-t-transparent rounded-full mb-2"></div>
          Cargando comentarios...
        </div>

        <div v-else-if="comments.length === 0" class="text-center text-gray-500 py-8">
          No hay comentarios aún. ¡Sé el primero en comentar!
        </div>

        <!-- Comment Item -->
        <div v-for="comment in comments" v-else :key="comment.id" class="space-y-4">
          <!-- Main Comment -->
          <div class="bg-gray-800 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <img
                  :src="comment.user_profiles?.avatar_url || '/img/default-avatar.png'"
                  alt="Avatar"
                  class="w-8 h-8 rounded-full border border-gray-600"
                />
                <div>
                  <span class="font-medium text-white">
                    {{ comment.user_profiles?.username || 'Usuario' }}
                  </span>
                  <span class="text-xs text-gray-500 ml-2">
                    {{ formatDate(comment.created_at) }}
                    <span v-if="comment.updated_at !== comment.created_at">(editado)</span>
                  </span>
                </div>
              </div>

              <!-- Actions for owner -->
              <div v-if="isOwner(comment)" class="flex items-center gap-2">
                <button
                  class="text-turquesa hover:text-white text-xs p-1 rounded transition"
                  title="Editar"
                  @click="startEdit(comment)"
                >
                  <i class="fa-solid fa-pen me-2"></i>
                </button>
                <button
                  class="text-red-400 hover:text-red-300 text-xs p-1 rounded transition"
                  title="Eliminar"
                  @click="handleDelete(comment)"
                >
                  <i class="fa-solid fa-trash me-2"></i>
                </button>
              </div>
            </div>

            <!-- Comment Content or Edit Form -->
            <div v-if="editingComment?.id === comment.id">
              <textarea
                v-model="editContent"
                class="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 focus:ring-2 focus:ring-turquesa resize-none"
                rows="3"
              ></textarea>
              <div class="flex gap-2 mt-2">
                <button
                  :disabled="loadingSubmit"
                  class="bg-turquesa text-black px-3 py-1 rounded text-sm hover:bg-[#0db38f] disabled:opacity-50"
                  @click="saveEdit"
                >
                  Guardar
                </button>
                <button
                  class="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-500"
                  @click="cancelEdit"
                >
                  Cancelar
                </button>
              </div>
            </div>
            <div v-else>
              <p class="text-gray-200 whitespace-pre-line">{{ comment.content }}</p>
              <button
                v-if="canComment"
                class="text-turquesa hover:text-white text-sm mt-2 transition"
                @click="startReply(comment)"
              >
                Responder
              </button>
            </div>

            <!-- Replies -->
            <div v-if="comment.replies && comment.replies.length" class="mt-4 ml-6 space-y-3">
              <div
                v-for="reply in comment.replies"
                :key="reply.id"
                class="bg-gray-700 rounded-lg p-3"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <img
                      :src="reply.user_profiles?.avatar_url || '/img/default-avatar.png'"
                      alt="Avatar"
                      class="w-6 h-6 rounded-full border border-gray-600"
                    />
                    <span class="font-medium text-white text-sm">
                      {{ reply.user_profiles?.username || 'Usuario' }}
                    </span>
                    <span class="text-xs text-gray-500">
                      {{ formatDate(reply.created_at) }}
                    </span>
                  </div>

                  <div v-if="isOwner(reply)" class="flex items-center gap-1">
                    <button
                      class="text-turquesa hover:text-white text-xs p-1 rounded transition"
                      @click="startEdit(reply)"
                    >
                      <i class="fa-solid fa-pen me-2"></i>
                    </button>
                    <button
                      class="text-red-400 hover:text-red-300 text-xs p-1 rounded transition"
                      @click="handleDelete(reply)"
                    >
                      <i class="fa-solid fa-trash me-2"></i>
                    </button>
                  </div>
                </div>

                <div v-if="editingComment?.id === reply.id">
                  <textarea
                    v-model="editContent"
                    class="w-full bg-gray-600 text-white p-2 rounded border border-gray-500 focus:ring-2 focus:ring-turquesa resize-none text-sm"
                    rows="2"
                  ></textarea>
                  <div class="flex gap-2 mt-2">
                    <button
                      :disabled="loadingSubmit"
                      class="bg-turquesa text-black px-2 py-1 rounded text-xs hover:bg-[#0db38f] disabled:opacity-50"
                      @click="saveEdit"
                    >
                      Guardar
                    </button>
                    <button
                      class="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-400"
                      @click="cancelEdit"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
                <p v-else class="text-gray-200 text-sm whitespace-pre-line">{{ reply.content }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Comment Form -->
      <div class="border-t border-gray-700 p-6">
        <div v-if="replyToComment" class="mb-3 p-3 bg-gray-800 rounded-lg">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-400">
              Respondiendo a @{{ replyToComment.user_profiles?.username }}
            </span>
            <button
              class="text-gray-500 hover:text-white text-sm"
              @click="cancelReply"
            >
              ✕
            </button>
          </div>
        </div>

        <div class="flex gap-3">
          <img
            :src="user.avatar_url || '/img/default-avatar.png'"
            alt="Tu avatar"
            class="w-8 h-8 rounded-full border border-gray-600 flex-shrink-0"
          />
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <textarea
                v-model="newComment"
                :disabled="!canComment"
                :placeholder="canComment ? 'Escribí un comentario...' : 'Iniciá sesión para comentar'"
                class="flex-1 bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-turquesa resize-none disabled:opacity-50"
                rows="1"
                @keydown.ctrl.enter="handleCreateComment"
              ></textarea>
              <button
                :disabled="!canComment || !newComment.trim() || loadingSubmit"
                class="bg-turquesa text-black px-4 py-2 rounded-lg hover:bg-[#0db38f] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition h-fit"
                @click="handleCreateComment"
              >
                <span v-if="loadingSubmit">Enviando...</span>
                <span v-else>{{ replyToComment ? 'Responder' : 'Comentar' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>