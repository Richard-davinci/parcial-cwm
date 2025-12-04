<script setup>
import {computed, onMounted, ref} from 'vue';
import {fetchUserChatsWithDetails} from '../services/private-chat.js';
import {createInitialUserState, subscribeToAuthStateChanges} from '../services/auth.js';
import {useRouter} from 'vue-router';

const router = useRouter();

const user = ref(createInitialUserState());
const chats = ref([]);
const loading = ref(false);
const errorMessage = ref('');

let unsubscribeFromAuth = () => {
};

// para revisar si hay chats disponibles
const hasChats = computed(() => chats.value.length > 0);

async function loadChats() {
  if (!user.value.id) {
    console.log('ChatList: No hay usuario logueado');
    return;
  }

  console.log('ChatList: Cargando chats para usuario:', user.value.id);

  try {
    loading.value = true;
    errorMessage.value = '';
    const result = await fetchUserChatsWithDetails(user.value.id);
    console.log('ChatList: Chats obtenidos:', result);
    chats.value = result;
  } catch (error) {
    console.error('Error al cargar chats:', error);
    errorMessage.value = 'No se pudieron cargar los chats.';
  } finally {
    loading.value = false;
  }
}

function goToChat(otherUserId) {
  router.push(`/usuario/${otherUserId}/chat`);
}

/**
 * Formatea la fecha del último mensaje
 * Si el mensaje es de hoy, muestra la hora (HH:mm)
 * Si el mensaje es de otro día, muestra la fecha (dd/mm)
 * @param {string} date - Fecha del mensaje en formato ISO
 * @returns {string} Fecha formateada
 */
function formatLastMessageTime(date) {
  if (!date) return '';

  const now = new Date();
  const messageDate = new Date(date);
  const diffInHours = (now - messageDate) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return messageDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } else {
    return messageDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
  }
}

/**
 * Trunca un mensaje si excede la longitud máxima
 * @param {string} message - Mensaje a truncar
 * @param {number} maxLength - Longitud máxima permitida
 * @returns {string} Mensaje truncado
 */
function truncateMessage(message, maxLength = 40) {
  if (!message) return '';
  return message.length > maxLength
    ? message.substring(0, maxLength) + '...'
    : message;
}

onMounted(async () => {
  unsubscribeFromAuth = subscribeToAuthStateChanges(async (newUserState) => {
    user.value = newUserState;
    if (newUserState.id) {
      await loadChats();
    }
  });

  if (user.value.id) {
    await loadChats();
  }
});
</script>

<template>
  <div>
    <h2 class="mb-6 text-3xl font-bankgothic text-turquesa">Chats privados</h2>
    <div class="bg-gray-900 border border-gray-400 rounded-xl p-4 shadow-md">
      <div class="flex items-center justify-between mb-4">
        <button
          :disabled="loading || !user.id"
          class="text-turquesa hover:text-white p-1 rounded transition disabled:opacity-50"
          title="Actualizar chats"
          @click="loadChats"
        >
          <i :class="{'animate-spin': loading, 'fas fa-sync': true}"
             class="w-4 h-4"
          ></i>
        </button>
      </div>

      <!-- Error -->
      <div v-if="errorMessage" class="text-red-400 text-sm mb-4 p-2 bg-red-900/20 rounded">
        {{ errorMessage }}
      </div>

      <!-- Loading -->
      <div v-else-if="loading" class="text-center py-4">
        <div class="animate-spin h-6 w-6 mx-auto border-2 border-turquesa border-t-transparent rounded-full mb-2"></div>
        <span class="text-gray-400 text-sm">Cargando chats...</span>
      </div>

      <!-- sin chats -->
      <div v-else-if="!hasChats" class="text-gray-500 text-sm text-center py-4">
        No tenés chats privados aún.
        <br>
        <span class="text-xs mt-1 block">
          Visitá un perfil de usuario para iniciar un chat.
        </span>
      </div>

      <!-- LIstado de chats -->
      <div v-else class="space-y-2 max-h-96 overflow-y-auto">
        <div
          v-for="chat in chats"
          :key="chat.chat_id"
          class="flex items-center gap-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer transition group"
          @click="goToChat(chat.other_user_id)"
        >
          <!-- imagen de perfil(falta terminar) -->
          <div class="relative flex-shrink-0">
            <img
              :alt="chat.other_user_profile?.username || 'Usuario'"
              :src="chat.other_user_profile?.avatar_url || '/img/default-avatar.png'"
              class="w-10 h-10 rounded-full border border-gray-600"
            />
            <!-- indicador online(dalta terminar)  -->
            <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
          </div>

          <!-- Chat info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="font-medium text-white text-sm truncate">
                {{ chat.other_user_profile?.username || 'Usuario' }}
              </span>
              <span class="text-xs text-gray-500 flex-shrink-0 ml-2">
                {{ formatLastMessageTime(chat.last_message?.created_at) }}
              </span>
            </div>

            <div class="flex items-center justify-between mt-1">
              <p class="text-xs text-gray-400 truncate">
                <span v-if="chat.last_message">
                  <span v-if="chat.last_message.sender_id === user.id" class="text-turquesa">
                    Tú:
                  </span>
                  {{ truncateMessage(chat.last_message.content) }}
                </span>
                <span v-else class="italic">
                  Sin mensajes aún
                </span>
              </p>
            </div>
          </div>

          <div class="text-gray-500 group-hover:text-turquesa transition flex-shrink-0">
            <i class="fas fa-chevron-right w-4 h-4"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>