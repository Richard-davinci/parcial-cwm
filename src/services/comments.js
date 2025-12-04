import {supabase} from './supabase.js';

export async function createComment({content, post_id, parent_comment_id = null}) {
  const user = await supabase.auth.getUser();

  if (!user.data.user) {
    throw new Error('Usuario no autenticado');
  }

  const {data, error} = await supabase
    .from('comments')
    .insert({
      content,
      post_id,
      parent_comment_id,
      user_id: user.data.user.id
    })
    .select(`
      id,
      content,
      post_id,
      parent_comment_id,
      created_at,
      updated_at,
      user_id,
      user_profiles (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    console.error('[comments.js createComment] Error al crear el comentario.', error);
    throw new Error(error.message);
  }

  return data;
}

// traigo los comentarios de un post
export async function fetchPostComments(postId) {
  const {data, error} = await supabase
    .from('comments')
    .select(`
      id,
      content,
      post_id,
      parent_comment_id,
      created_at,
      updated_at,
      user_id,
      user_profiles (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('post_id', postId)
    .order('created_at', {ascending: true});

  if (error) {
    console.error('[comments.js fetchPostComments] Error al obtener comentarios.', error);
    throw new Error(error.message);
  }

  const comments = data || [];
  const commentMap = new Map();
  const rootComments = [];

  comments.forEach(comment => {
    comment.replies = [];
    commentMap.set(comment.id, comment);
  });

  comments.forEach(comment => {
    if (comment.parent_comment_id) {
      const parent = commentMap.get(comment.parent_comment_id);
      if (parent) {
        parent.replies.push(comment);
      }
    } else {
      rootComments.push(comment);
    }
  });

  return rootComments;
}

export async function updateComment(commentId, {content}) {
  const user = await supabase.auth.getUser();

  if (!user.data.user) {
    throw new Error('Usuario no autenticado');
  }

  const {data, error} = await supabase
    .from('comments')
    .update({
      content,
      updated_at: new Date().toISOString()
    })
    .eq('id', commentId)
    .eq('user_id', user.data.user.id)
    .select(`
      id,
      content,
      post_id,
      parent_comment_id,
      created_at,
      updated_at,
      user_id,
      user_profiles (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    console.error('[comments.js updateComment] Error al actualizar el comentario.', error);
    throw new Error(error.message);
  }

  return data;
}

export async function deleteComment(commentId) {
  const user = await supabase.auth.getUser();

  if (!user.data.user) {
    throw new Error('Usuario no autenticado');
  }

  const {error} = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.data.user.id);

  if (error) {
    console.error('[comments.js deleteComment] Error al eliminar el comentario.', error);
    throw new Error(error.message);
  }
}

export function subscribeToPostComments(postId, callback) {
  const channel = supabase.channel(`comments_post_${postId}`);

  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'comments',
      filter: `post_id=eq.${postId}`
    },
    payload => {
      callback(payload);
    }
  );

  channel.subscribe();

  return () => {
    channel.unsubscribe();
  };
}

export async function getCommentsCount(postId) {
  const {count, error} = await supabase
    .from('comments')
    .select('*', {count: 'exact', head: true})
    .eq('post_id', postId);

  if (error) {
    console.error('[comments.js getCommentsCount] Error al contar comentarios.', error);
    throw new Error(error.message);
  }

  return count || 0;
}