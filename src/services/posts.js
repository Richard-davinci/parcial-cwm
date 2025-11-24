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
      content,
      image_url,
      tags,
      created_at,
      user_id,
      user_profiles (
        username,
        display_name,
        avatar_url
      )
    `)
    .order('created_at', {ascending: false}); // Más recientes primero.

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

  return data;
}


