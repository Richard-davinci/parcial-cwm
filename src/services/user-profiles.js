/**
 * ===========================================================
 * user-profiles.js — Servicio de perfiles de usuario
 * ===========================================================
 * Descripción:
 *  Servicio para gestionar el acceso a la tabla `user_profiles`
 *  de Supabase. Provee operaciones básicas de lectura/creación/
 *  actualización del perfil, y centraliza la captura de errores.
 *
 * Relación con otros módulos:
 *  - services/supabase.js    → cliente Supabase (DB).
 *  - services/auth.js        → usa getUserProfileById() en el login y
 *                              loadCurrentUserAuthState(); usa createUserProfile()
 *                              luego de signUp(); y updateUserProfile() para editar perfil.
 *
 * Esquema resumido esperado (tabla `user_profiles`):
 *  - id (uuid)                         → PK, coincide con user_id de Auth.
 *  - username (text)                   → identificador público.
 *  - display_name (text)               → nombre visible.
 *  - avatar_url (text)                 → URL de avatar público.
 *  - bio (text)                        → biografía.
 *  - location (text)                   → ubicación.
 *  - website_url (text)                → web personal/portfolio principal.
 *  - career (text)                     → rol/carrera.
 *  - skills (text[]/jsonb)             → listado de habilidades.
 *  - experience_years (int)            → años de experiencia.
 *  - current_project (text)            → proyecto actual.
 *  - available_for_work (boolean)      → disponibilidad.
 *  - github_url (text)                 → enlace GitHub.
 *  - linkedin_url (text)               → enlace LinkedIn.
 *  - instagram_url (text)              → enlace Instagram.
 *  - status (text)                     → estado (ej. Freelancer disponible).
 *  - main_stack (text)                 → stack principal (ej. Vue/Tailwind/Supabase).
 *  - projects (text[]/jsonb)           → listado de proyectos actuales.
 *  - twitter (text)                    → enlace a X/Twitter.
 *  - portfolio (text)                  → enlace a portafolio adicional (Notion/Behance/etc).
 *  - created_at (timestamp)            → fecha creación.
 *  - updated_at (timestamp)            → fecha actualización.
 *
 * Índice de funciones (orden de aparición):
 *  1) getUserProfileById(id)
 *  2) createUserProfile(data)
 *  3) updateUserProfile(id, data)
 *
 * Errores comunes:
 *  - Falta de permisos por RLS: verificar políticas de lectura/escritura
 *    para la tabla `user_profiles` (auth.uid() = id, etc.).
 *  - Perfil inexistente: getUserProfileById() puede no encontrar fila.
 *  - Validaciones de esquema: tipos incompatibles (ej. skills como text[] vs jsonb).
 * ===========================================================
 */

import { supabase } from "./supabase";

/**
 * -----------------------------------------------------------
 * 1) getUserProfileById(id)
 * -----------------------------------------------------------
 * Objetivo:
 *  - Obtener el perfil de usuario por su `id` (uuid),
 *    que generalmente coincide con auth.user.id.
 *
 * Flujo:
 *  a) Consulta a la tabla `user_profiles` filtrando por id.
 *  b) Usa .limit(1).single() para traer exactamente una fila.
 *  c) Si hay error (no existe o permisos), se lanza excepción.
 *
 * Notas:
 *  - En proyectos con RLS, asegurar que la política permita
 *    leer el perfil requerido (p. ej. público o propio).
 */
export async function getUserProfileById(id) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select()
    .eq('id', id)
    .limit(1)
    .single();

  if(error) {
    // Nota: el mensaje de consola menciona "createUserProfile" pero la operación es de lectura.
    // Se mantiene el texto original para respetar tu código, solo se deja constancia aquí.
    console.error('[user-profiles.js createUserProfile] Error al crear el perfil del usuario', data, error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * -----------------------------------------------------------
 * 2) createUserProfile(data)
 * -----------------------------------------------------------
 * Objetivo:
 *  - Insertar una fila en `user_profiles` con los datos iniciales
 *    del perfil (generalmente tras un signUp exitoso).
 *
 * Flujo:
 *  a) Insertar `data` en la tabla.
 *  b) .select().single() para retornar la fila creada.
 *  c) Si hay error (conflicto, RLS, validación), lanza excepción.
 *
 * Notas:
 *  - `data.id` debe ser el uuid del usuario de Auth (para enlazar cuentas).
 *  - Asegurar tipos coherentes con el esquema (ej. arrays vs json).
 */
export async function createUserProfile(data) {
  const { data: created, error } = await supabase
    .from('user_profiles')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('[user-profiles.js createUserProfile] Error al crear el perfil del usuario', data, error);
    throw new Error(error.message);
  }

  return created;
}

/**
 * -----------------------------------------------------------
 * 3) updateUserProfile(id, data)
 * -----------------------------------------------------------
 * Objetivo:
 *  - Actualizar la fila del perfil identificada por `id` con los
 *    campos provistos en `data`.
 *
 * Flujo:
 *  a) Ejecutar update(data).eq('id', id).
 *  b) .select().single() para devolver la fila actualizada.
 *  c) Ante error (RLS, tipos, inexistente) lanzar excepción.
 *
 * Notas:
 *  - Si usás RLS, asegurá que la política permita que el usuario
 *    autenticado con auth.uid() = id pueda actualizar su fila.
 *  - Manejá con cuidado campos opcionales vacíos para no sobrescribir
 *    con valores nulos no deseados.
 */
export async function updateUserProfile(id, data) {
  const { data: updated, error } = await supabase
    .from('user_profiles')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[user-profiles.js updateUserProfile] Error al actualizar el perfil del usuario', id, error);
    throw new Error(error.message);
  }

  return updated;
}
