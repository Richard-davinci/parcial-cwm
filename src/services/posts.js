/**
 * ===========================================================
 * posts.js — Servicio de posts
 * ===========================================================
 * Descripción:
 *   Servicio para crear y leer publicaciones (posts) desde Supabase,
 *   y suscribirse en tiempo real a nuevas inserciones usando canales
 *   de Postgres. Centraliza el acceso y el manejo de errores básicos.
 *
 * Relación con otros servicios:
 *   - services/supabase.js  → Provee el cliente `supabase`.
 *   - services/auth.js      → Obtiene el usuario autenticado para asociar `user_id` al crear posts.
 *
 * Índice de funciones (orden de aparición):
 *   1) createPost({ content, image_url = '', tags = [] })
 *   2) fetchPosts()
 *   3) subscribeToPosts(callback)
 *
 * Errores comunes:
 *   - Falta de sesión: si no hay usuario autenticado, `createPost` fallará al obtener `user.data.user.id`.
 *   - Reglas RLS: si las políticas de la tabla `post` no permiten insertar/seleccionar, Supabase devolverá "permission denied".
 *   - Esquema de columnas: tipos incompatibles (por ejemplo, `tags` definido como text[] y se envía como json o viceversa).
 *
 * Nota de performance:
 *   - `fetchPosts()` trae todos los posts ordenados por fecha descendente y hace un JOIN anidado a `user_profiles`.
 *     Para feeds grandes, considerar:
 *       • Paginación con `.range(from, to)` o `.limit(n)`.
 *       • Carga diferida/infinita (infinite scroll) en el frontend.
 *       • Remover campos costosos si no son necesarios en la vista.
 * ===========================================================
 */

import {supabase} from './supabase.js';

/**
 * -----------------------------------------------------------
 * 1) createPost({ content, image_url = '', tags = [] })
 * -----------------------------------------------------------
 * Objetivo:
 *   Crear una nueva publicación asociada al usuario autenticado.
 *
 * Flujo:
 *   a) Obtener el usuario actual con `supabase.auth.getUser()`.
 *   b) Insertar la fila en la tabla `post` con `content`, `image_url`, `tags` y `user_id`.
 *   c) Retornar la fila creada (.select().single()).
 *
 * Consideraciones:
 *   - Requiere sesión activa para obtener `user.data.user.id`.
 *   - Validar en UI que `content` no esté vacío.
 *   - Alinear el tipo de `tags` en DB y frontend (array de texto, jsonb, etc.).
 */
export async function createPost({content, image_url = '', tags = []}) {
  // Obtiene la sesión/usuario actual desde Supabase Auth.
  const user = await supabase.auth.getUser();

  // Inserta el nuevo post en la tabla `post` con el user_id del usuario autenticado.
  const {data, error} = await supabase
    .from('post')
    .insert({
      content,
      image_url,
      tags,
      user_id: user.data.user.id
    })
    .select()
    .single(); // Retorna exactamente una fila (la creada).

  if (error) {
    // Log de error técnico y propagación como excepción para manejo en el caller.
    console.error('[posts.js createPost] Error al crear el post.', error);
    throw new Error(error.message);
  }

  // Devuelve la fila creada para su uso inmediato en UI si fuera necesario.
  return data;
}

/**
 * -----------------------------------------------------------
 * 2) fetchPosts()
 * -----------------------------------------------------------
 * Objetivo:
 *   Obtener el listado de publicaciones ordenadas por `created_at` desc,
 *   incluyendo datos anidados de `user_profiles` (username, display_name, avatar_url).
 *
 * Flujo:
 *   a) Seleccionar columnas de `post` necesarias para el feed.
 *   b) JOIN anidado a `user_profiles` para mostrar autor en la UI.
 *   c) Ordenar por fecha de creación descendente.
 *
 * Recomendaciones:
 *   - Para feeds extensos, aplicar paginación (range/limit) o carga incremental.
 *   - Evitar traer campos innecesarios si no se muestran.
 */
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
        username,
        display_name,
        avatar_url
      )
    `)
    .order('created_at', {ascending: false}); // Más recientes primero.

  if (error) {
    // Log técnico y rethrow; el caller decide cómo mostrar el error al usuario.
    console.error('[posts.js fetchPosts] Error al traer los posts.', error);
    throw new Error(error.message);
  }

  // Devuelve el array de publicaciones (posiblemente vacío).
  return data;
}

/**
 * -----------------------------------------------------------
 * 3) subscribeToPosts(callback)
 * -----------------------------------------------------------
 * Objetivo:
 *  `.
 * Suscribirse en tiempo real a inserciones en la tabla `post`.
 *   Cada vez que se inserta un registro, se invoca `callback(payload.new)
 * Flujo:
 *   a) Crear un canal con `supabase.channel('post_changes')`.
 *   b) Registrar un handler para eventos `INSERT` en la tabla `post`.
 *   c) Suscribirse y devolver una función `unsubscribe` para cancelar.
 *
 * Uso típico:
 *   const unsubscribe = subscribeToPosts((newPost) => {
 *     // Agregar `newPost` al principio del feed, por ejemplo.
 *   });
 *   // Luego, cuando ya no quieras escuchar:
 *   unsubscribe();
 *
 * Consideraciones:
 *   - Este canal escucha sólo `INSERT`. Si necesitás `UPDATE`/`DELETE`,
 *     agregá más handlers con la misma API.
 *   - Asegurarse de cerrar la suscripción al desmontar el componente (cleanup).
 */
export function subscribeToPosts(callback) {
  // Crea un canal lógico para eventos sobre la tabla `post`.
  const postChannel = supabase.channel('post_changes');

  // Registra un listener para nuevos inserts (nuevos posts).
  postChannel.on(
    'postgres_changes',
    {event: 'INSERT', schema: 'public', table: 'post'},
    payload => {
      // Llama al callback del consumidor con la fila nueva.
      callback(payload.new);
    }
  );

  // Activa la suscripción del canal.
  postChannel.subscribe();

  // Devuelve función de cleanup para cancelar la suscripción cuando haga falta.
  return () => {
    postChannel.unsubscribe();
  }
}
