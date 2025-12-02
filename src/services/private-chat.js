import {supabase} from "./supabase";

const privateChatsCache = {}

function addToPrivateChatCache(userId1, userId2, value) {
  const cacheKey = [userId1, userId2].sort().join('_');
  privateChatsCache[cacheKey] = value;
}

function getFromPrivateChatCache(userId1, userId2) {
  const cacheKey = [userId1, userId2].sort().join('_');
  return privateChatsCache[cacheKey] || null;
}

async function createPrivateChat(senderId, receiverId) {
  const [userId1, userId2] = [senderId, receiverId].sort();

  const {data, error} = await supabase
    .from('private_chats')
    .insert({
      user_id1: userId1,
      user_id2: userId2,
    })
    .select();

  if (error) {
    console.error('[private-chat.js createPrivateChat] Error al crear el chat privado: ', error);
    throw new Error(error.message);
  }

  return data[0];
}

async function getPrivateChatById(senderId, receiverId) {
  const [userId1, userId2] = [senderId, receiverId].sort();

  const {data, error} = await supabase
    .from('private_chats')
    .select()
    .eq('user_id1', userId1)
    .eq('user_id2', userId2);

  if (error) {
    console.error('[private-chat.js getPrivateChatById] Error al buscar el chat privado: ', error);
    throw new Error(error.message);
  }

  return data[0] || null;
}

async function getOrCreatePrivateChat(senderId, receiverId) {
  const cachedChat = getFromPrivateChatCache(senderId, receiverId);
  if (cachedChat) return cachedChat;

  let privateChat = await getPrivateChatById(senderId, receiverId);

  if (privateChat == null) {
    privateChat = await createPrivateChat(senderId, receiverId);
  }
  addToPrivateChatCache(senderId, receiverId, privateChat);

  return privateChat;
}

export async function sendPrivateChatMessage(senderId, receiverId, content) {
  const privateChat = await getOrCreatePrivateChat(senderId, receiverId);

  const {error} = await supabase
    .from('private_chat_messages')
    .insert({
      chat_id: privateChat.id,
      sender_id: senderId,
      content,
    });

  if (error) {
    console.error('[private-chat.js sendPrivateChatMessage] Error al enviar el mensaje privado: ', error);
    throw new Error(error.message);
  }
}

export async function fetchLastPrivateChatMessages(senderId, receiverId) {
  const privateChat = await getOrCreatePrivateChat(senderId, receiverId);

  const {data, error} = await supabase
    .from('private_chat_messages')
    .select()
    .eq('chat_id', privateChat.id)
    .limit(10)

  if (error) {
    console.error('[private-chat.js fetchLastPrivateChatMessages] Error al traer los mensajes privados: ', error);
    throw new Error(error.message);
  }

  return data;
}

export async function subscribeToNewPrivateChatMessages(senderId, receiverId, callback) {
  const privateChat = await getOrCreatePrivateChat(senderId, receiverId);

  const privateChannel = supabase.channel('private_chat_messages');

  privateChannel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      table: 'private_chat_messages',
      filter: 'chat_id=eq.' + privateChat.id,
    },
    payload => {
      callback(payload.new);
    }
  );

  privateChannel.subscribe();

  return () => {
    privateChannel.unsubscribe();
  }
}