/**
 * ===========================================================
 * services/auth.js — Servicio de autenticación
 * ===========================================================
 * Descripción:
 *  Servicio centralizado para gestionar la autenticación del
 *  usuario en el cliente (frontend) usando Supabase Auth, y
 *  mantener un "estado global" mínimo del usuario autenticado
 *  con un patrón de observers (suscriptores).
 *
 * Funcionalidades:
 *  1) Cargar el estado de autenticación actual (si hay sesión).
 *  2) Registrar usuario y crear su perfil en la tabla user_profiles.
 *  3) Iniciar sesión (email/password) y refrescar datos de perfil.
 *  4) Cerrar sesión y limpiar el estado local del usuario.
 *  5) Actualizar datos del perfil del usuario.
 *  6) Suscribirse a cambios del estado del usuario (observers).
 *
 * Componentes relacionados:
 *  - services/supabase.js → Cliente Supabase (Auth + DB).
 *  - services/user-profiles.js → CRUD de user_profiles.
 *  - router.js → Rutas protegidas según sesión.
 *  - Vistas (Login, Register, Perfil, Feed) → Consumen este servicio.
 *
 * Índice de funciones (orden de aparición):
 *  1. loadCurrentUserAuthState() → Carga sesión y perfil al iniciar.
 *  2. fetchFullProfile() → Carga datos completos del perfil.
 *  3. register(email, password, ...) → Registrar usuario + perfil.
 *  4. login(email, password)→ Iniciar sesión + perfil.
 *  5. logout()→ Cerrar sesión y limpiar estado.
 *  6. updateAuthUser(data)→ Actualizar perfil del usuario.
 *  7. subscribeToAuthStateChanges(cb)→ Suscribirse a cambios de user.
 *  8. notify(cb) / notifyAll()→ Notificación a observers.
 *  9. setUser(data) → Mezcla y propaga el estado user.
 *
 * Notas y errores comunes:
 *  - Supabase.auth.getUser():
 *      • Si no hay sesión, devuelve error y data.user = null.
 *  - Supabase.auth.signUp():
 *      • Puede requerir verificación por email según configuración.
 *      • Si el email ya existe, retorna error.
 *  - Supabase.auth.signInWithPassword():
 *      • Error si credenciales inválidas o sesión expirada.
 *  - Acceso a tabla user_profiles:
 *      • fetchFullProfile() asume que el perfil existe (creado en register()).
 *      • Si no existe, deberías manejarlo (crear o mostrar aviso).
 * ===========================================================
 */
import {supabase} from './supabase.js';
import {createUserProfile, getUserProfileById, updateUserProfile} from "./user-profiles";

let user = {
  id: null,
  email: null,
  username: null,
  display_name: null,
  avatar_url: null,
  bio: null,
  location: null,
  website_url: null,
  career: null,
  skills: [],
  experience_years: null,
  current_project: null,
  available_for_work: false,
  github_url: null,
  linkedin_url: null,
  instagram_url: null,
  created_at: null,
  updated_at: null,
};

let observers = [];
loadCurrentUserAuthState();

async function loadCurrentUserAuthState() {
  const {data, error} = await supabase.auth.getUser();
  if (error) {
    console.warn('No hay usuario autenticado.');
    return;
  }
  setUser({
    id: data.user.id,
    email: data.user.email,
  });
  // await????
  await fetchFullProfile();
}

async function fetchFullProfile() {
  try {
    setUser(await getUserProfileById(user.id));
  } catch (error) {
    console.error('[auth.js fetchFullProfile] Error al cargar el perfil completo.', error.message);
  }
}

export async function register({email, password, username, display_name}) {
  try {
    const {data, error} = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('[auth.js register] Error al registrar el usuario.', error);
      throw new Error(error.message);
    }

    // Crear fila inicial del perfil asociado al nuevo user_id
    await createUserProfile({
      id: data.user.id,
      email: data.user.email,
      username,
      display_name,
    });

    // Actualizar estado global con datos mínimos
    setUser({
      id: data.user.id,
      email: data.user.email,
      username,
      display_name,
    });
  } catch (error) {
    console.error('[auth.js register] Error inesperado:', error.message);
    throw error;
  }
}


export async function login(email, password) {
  const {data, error} = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
/*
    console.error('[auth.js login] Error al iniciar sesión:', error.message);
*/
    throw new Error(error.message);
  }

  setUser({
    id: data.user.id,
    email: data.user.email,
  });

  await fetchFullProfile();
}

export async function logout() {
  await supabase.auth.signOut();
  setUser({
    id: null,
    email: null,
  });
}

export async function updateAuthUser(data) {
  try {
    await updateUserProfile(user.id, data);

    setUser(data);
    console.log('[auth.js updateAuthUser] Perfil actualizado correctamente.');

  } catch (error) {
    console.error('[auth.js updateUserProfile] Error al actualizar el perfil:', error.message);
  }
}

/**
 * -----------------------------------------------------------
 * 7) subscribeToAuthStateChanges(callback)
 * -----------------------------------------------------------
 * Objetivo:
 *  - Permitir que otros módulos se suscriban a cambios en el estado
 *    del usuario autenticado. Muy útil para componentes Vue reactivos.
 *
 * Uso:
 *  - Devuelve una función para cancelar la suscripción.
 */
export function subscribeToAuthStateChanges(callback) {
  observers.push(callback);
  notify(callback);
  return () => {
    observers = observers.filter(obs => callback != obs);
  }
}

/**
 * -----------------------------------------------------------
 * 8) notify(callback)
 * -----------------------------------------------------------
 * Objetivo:
 *  - Ejecutar un callback pasándole una copia del estado actual del usuario.
 *
 * Nota:
 *  - Se usa internamente por notifyAll() y al registrar nuevos observers.
 */
function notify(callback) {
  callback({
    ...user
  });
}

/**
 * -----------------------------------------------------------
 * 9) notifyAll()
 * -----------------------------------------------------------
 * Objetivo:
 *  - Ejecutar todos los callbacks suscritos para propagar el nuevo estado.
 */
function notifyAll() {
  observers.forEach(notify);
}

/**
 * -----------------------------------------------------------
 * 10) setUser(data)
 * -----------------------------------------------------------
 * Objetivo:
 *  - Mezclar el estado global actual del usuario con nuevos datos.
 *  - Notificar automáticamente a todos los suscriptores del cambio.
 *
 * Nota:
 *  - Esta función es el núcleo del estado local del usuario.
 */
function setUser(data) {
  user = {
    ...user,
    ...data,
  };
  notifyAll();
}
