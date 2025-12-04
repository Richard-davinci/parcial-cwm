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

export async function fetchUserPrivateChats(userId) {
  console.log('fetchUserPrivateChats: Buscando chats para usuario:', userId);

  const {data, error} = await supabase
    .from('private_chats')
    .select(`
      id,
      user_id1,
      user_id2,
      created_at,
      updated_at
    `)
    .or(`user_id1.eq.${userId},user_id2.eq.${userId}`)
    .order('updated_at', {ascending: false});

  if (error) {
    console.error('[private-chat.js fetchUserPrivateChats] Error al obtener chats:', error);
    throw new Error(error.message);
  }

  // Deduplicar en el código por si acaso hay duplicados en BD
  const seenChats = new Set();
  const uniqueChats = [];

  for (const chat of data || []) {
    // Crear clave única (siempre en el mismo orden)
    const key = [chat.user_id1, chat.user_id2].sort().join('|');
    
    if (!seenChats.has(key)) {
      seenChats.add(key);
      uniqueChats.push(chat);
    } else {
      console.log('fetchUserPrivateChats: Duplicado encontrado y saltado:', key);
    }
  }

  console.log('fetchUserPrivateChats: Chats encontrados (sin duplicados):', uniqueChats.length);
  return uniqueChats;
}

// Obtener chats con información del último mensaje y perfil del otro usuario
export async function fetchUserChatsWithDetails(userId) {
  try {
    console.log('fetchUserChatsWithDetails: Iniciando para usuario:', userId);

    // busco los chats del usuario actual
    const chats = await fetchUserPrivateChats(userId);

    if (chats.length === 0) {
      console.log('fetchUserChatsWithDetails: No se encontraron chats');
      return [];
    }

    console.log('fetchUserChatsWithDetails: Procesando', chats.length, 'chats');
    const chatsWithDetails = [];

    for (const chat of chats) {
      console.log('fetchUserChatsWithDetails: Procesando chat:', chat);

      const otherUserId = chat.user_id1 === userId ? chat.user_id2 : chat.user_id1;
      console.log('fetchUserChatsWithDetails: Otro usuario ID:', otherUserId);

      const {data: userProfile, error: profileError} = await supabase
        .from('user_profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', otherUserId)
        .single();

      if (profileError) {
        console.error('Error al obtener perfil de usuario:', otherUserId, profileError);
        continue;
      }

      console.log('fetchUserChatsWithDetails: Perfil obtenido:', userProfile);

      // Obtener último mensaje del chat
      const {data: lastMessage, error: messageError} = await supabase
        .from('private_chat_messages')
        .select('content, created_at, sender_id')
        .eq('chat_id', chat.id)
        .order('created_at', {ascending: false})
        .limit(1)
        .single();

      if (messageError && messageError.code !== 'PGRST116') {
        console.error('Error al obtener último mensaje:', messageError);
      }

      console.log('fetchUserChatsWithDetails: Último mensaje:', lastMessage);

      const chatDetail = {
        chat_id: chat.id,
        other_user_id: otherUserId,
        other_user_profile: userProfile,
        last_message: lastMessage || null,
        updated_at: chat.updated_at
      };

      console.log('fetchUserChatsWithDetails: Chat detail creado:', chatDetail);
      chatsWithDetails.push(chatDetail);
    }

    // Ordeno por último mensaje
    chatsWithDetails.sort((a, b) => {
      const timeA = a.last_message?.created_at || a.updated_at;
      const timeB = b.last_message?.created_at || b.updated_at;
      return new Date(timeB) - new Date(timeA);
    });

    console.log('fetchUserChatsWithDetails: Resultado final:', chatsWithDetails);
    return chatsWithDetails;

  } catch (error) {
    console.error('[private-chat.js fetchUserChatsWithDetails] Error:', error);
    throw error;
  }
}

// Obtener contador de mensajes no leídos
export async function getUnreadMessagesCount(chatId, userId) {
  const {count, error} = await supabase
    .from('private_chat_messages')
    .select('*', {count: 'exact', head: true})
    .eq('chat_id', chatId)
    .neq('sender_id', userId)
    .eq('is_read', false); // Necesitarías agregar este campo a tu tabla

  if (error) {
    console.error('[private-chat.js getUnreadMessagesCount] Error:', error);
    return 0;
  }

  return count || 0;
}