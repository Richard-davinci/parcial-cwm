<script setup>
import {nextTick, onMounted, onUnmounted, ref} from 'vue';
import {useRoute} from 'vue-router';
import {subscribeToAuthStateChanges} from '../../services/auth.js';
import {
  fetchLastPrivateChatMessages,
  sendPrivateChatMessage,
  subscribeToNewPrivateChatMessages
} from '../../services/private-chat.js';
import {getUserProfileById} from '../../services/user-profiles.js';

const route = useRoute();
const messages = ref([]);
const loadingMessages = ref(false);
const loadingUser = ref(false);
const chatContainer = ref(null);

const newMessage = ref({
  content: '',
});

const user = ref({
  id: null,
  email: null,
  display_name: null,
});

const otherUser = ref({
  id: null,
  email: null,
  display_name: null,
});

let unsubscribeFromAuth = () => {
};
let unsubscribeFromChat = () => {
};

const handleSubmit = async () => {
  try {
    await sendPrivateChatMessage(
      user.value.id,
      route.params.id,
      newMessage.value.content,
    );
  } catch (error) {
    console.error('[PrivateChat.vue] Error sending message:', error);
  }

  newMessage.value.content = '';
}

onMounted(async () => {
  try {
    loadingUser.value = true;
    loadingMessages.value = true;

    unsubscribeFromAuth = subscribeToAuthStateChanges(newUserState => user.value = newUserState);

    const userProfile = await getUserProfileById(route.params.id);
    otherUser.value = userProfile;

    unsubscribeFromChat = await subscribeToNewPrivateChatMessages(
      user.value.id,
      route.params.id,
      async newMessage => {
        messages.value.push(newMessage);

        await nextTick();
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
      },
    );

    const lastMessages = await fetchLastPrivateChatMessages(user.value.id, route.params.id);
    messages.value = lastMessages.reverse(); // ← Agregá esto si es necesario

    await scrollToBottom();
    loadingMessages.value = false;

  } catch (error) {
    console.error('[PrivateChat.vue] Error handling submit:', error);
    loadingMessages.value = false;
  }
  loadingUser.value = false;
  loadingMessages.value = false;
});

onUnmounted(() => {
  unsubscribeFromAuth();
  unsubscribeFromChat();
});
</script>
<template>
  <div class="min-h-screen bg-gray-950 text-white py-10 px-20">
    <h1 class="text-3xl font-bankgothic text-turquesa mb-6">
      Chat privado con {{ otherUser.display_name || otherUser.email }}
    </h1>

    <section
      ref="chatContainer"
      class="h-[60vh] overflow-y-auto bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg mb-6"
    >
      <h2 class="sr-only">Mensajes del chat</h2>

      <ol class="flex flex-col gap-4">
        <li
          v-for="message in messages"
          :key="message.id"
          :class="{
            'bg-gray-800 self-start border border-gray-700 text-gray-200': user.id !== message.sender_id,
            'bg-turquesa text-black self-end': user.id === message.sender_id,
          }"
          class="max-w-[75%] px-4 py-3 rounded-xl shadow-md text-sm leading-relaxed"
        >
          <p class="whitespace-pre-line">{{ message.content }}</p>
          <span
            :class="user.id === message.sender_id ? 'text-black/70' : 'text-gray-400'"
            class="text-xs block mt-1 opacity-70"
          >
            {{ new Date(message.created_at).toLocaleString() }}
          </span>
        </li>
      </ol>
    </section>

    <section class="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg ">
      <h2 class="sr-only">Enviar un mensaje</h2>

      <form class="flex gap-4 items-start" @submit.prevent="handleSubmit">

        <textarea
          id="content"
          v-model="newMessage.content"
          class="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-turquesa resize-none"
          placeholder="Escribí un mensaje..."
          rows="3"
        ></textarea>

        <button
          class="bg-turquesa text-black font-bankgothic px-6 py-3 rounded-lg hover:bg-[#0db38f] transition-colors"
          type="submit"
        >
          Enviar
        </button>
      </form>
    </section>
  </div>
</template>