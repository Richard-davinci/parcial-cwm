import {supabase} from './supabase.js';


export async function createPost({content, image_url = '', tags = []}) {
  const user = await supabase.auth.getUser();

  const {error} = await supabase
    .from('post')
    .insert({
      content,
      image_url,
      tags,
      user_id: user.data.user.id
    })
    .select()
    .single();

  if (error) {
    console.error('[posts.js createPost] Error al crear el post.', error);
    throw new Error(error.message);
  }
}

export async function fetchPosts() {
  const {data, error} = await supabase
    .from('post')
    .select(`      
      id,
      content,
      image_url,
      tags,
      created_at,
      user_id,
      user_profiles (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .order('created_at', {ascending: false});

  if (error) {
    console.error('[posts.js fetchPosts] Error al traer los posts.', error);
    throw new Error(error.message);
  }

  return data;
}

export function subscribeToPosts(callback) {
  const postChannel = supabase.channel('post_changes');

  postChannel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'post'
    },
    payload => {
      callback(payload.new);
    }
  );

  postChannel.subscribe();

  return () => {
    postChannel.unsubscribe();
  }
}

export async function fetchUserPosts(userId) {
  const {data, error} = await supabase
    .from('post')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {ascending: false});

  if (error) {
    console.error('[posts.js fetchUserPosts] Error al obtener los posts del usuario', userId, error);
    throw new Error(error.message);
  }

  return {data, error};
}

export async function updatePost(postId, {content, image_url = '', tags = []}) {
  const user = await supabase.auth.getUser();

  if (!user.data.user) {
    throw new Error('Usuario no autenticado');
  }

  // Validar que postId no sea undefined o null
  if (!postId) {
    throw new Error('ID del post no válido');
  }

  const {data, error} = await supabase
    .from('post')
    .update({
      content,
      image_url: image_url || null, // Convertir string vacío a null
      tags,
      updated_at: new Date().toISOString()
    })
    .eq('id', postId)
    .eq('user_id', user.data.user.id)
    .select()
    .single();

  if (error) {
    console.error('[posts.js updatePost] Error al actualizar el post.', error);
    throw new Error(error.message);
  }

  return data;
}

// Eliminar un post
export async function deletePost(postId) {
  const user = await supabase.auth.getUser();

  if (!user.data.user) {
    throw new Error('Usuario no autenticado');
  }

  // Validar que postId no sea undefined o null
  if (!postId) {
    throw new Error('ID del post no válido');
  }

  const {error} = await supabase
    .from('post')
    .delete()
    .eq('id', postId)
    .eq('user_id', user.data.user.id);

  if (error) {
    console.error('[posts.js deletePost] Error al eliminar el post.', error);
    throw new Error(error.message);
  }
}