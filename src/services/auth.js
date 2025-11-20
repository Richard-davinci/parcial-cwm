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

/**
 * Estado local mínimo del usuario autenticado.
 * - Se inicializa con null/valores vacíos.
 * - Se va completando con setUser() a medida que se obtienen datos
 *   desde Supabase Auth (id, email) y desde user_profiles (resto).
 */
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

/**
 * Lista de observers (callbacks) que se notifican cada vez que
 * cambia el estado del usuario (setUser → notifyAll).
 * - subscribeToAuthStateChanges() agrega/remueve callbacks.
 */

/**
 * Lista de observers (callbacks) que se notifican cada vez que
 * cambia el estado del usuario (setUser → notifyAll).
 * - subscribeToAuthStateChanges() agrega/remueve callbacks.
 */
let observers = [];

/**
 * Al cargar el módulo, se intenta recuperar el estado de sesión
 * actual desde Supabase (si hay un usuario logueado) y, en caso
 * afirmativo, se trae el perfil completo.
 *
 * Nota: se ejecuta de forma inmediata al importar este archivo.
 */
loadCurrentUserAuthState();

/**
 * -----------------------------------------------------------
 * 1) loadCurrentUserAuthState()
 * -----------------------------------------------------------
 * Objetivo:
 *  - Consultar a Supabase si hay un usuario autenticado (sesión activa).
 *  - Si lo hay, actualizar el estado local con id, email y cargar
 *    el resto del perfil llamando a fetchFullProfile().
 *
 * Flujo:
 *  a) supabase.auth.getUser() → obtiene user de la sesión actual.
 *  b) Si hay error o no hay user, se registra un warn y se sale.
 *  c) Si existe user, se llama setUser(id, email) y luego
 *     fetchFullProfile() para completar datos del perfil.
 *
 * Errores comunes:
 *  - Si no hay sesión, getUser() puede devolver error y/o data.user = null.
 *    Este caso no es "excepción"; es un estado esperado (usuario no logueado).
 */
async function loadCurrentUserAuthState() {
  const {data, error} = await supabase.auth.getUser();
  if (error) {
    // No se considera error fatal; simplemente no hay sesión activa.
    console.warn('No hay usuario autenticado.');
    return;
  }
  // data.user existe: actualizar estado mínimo (id/email)…
  setUser({
    id: data.user.id,
    email: data.user.email,
  });
  // y luego intentar completar el resto del perfil.
  await fetchFullProfile();
}

/**
 * -----------------------------------------------------------
 * 2) fetchFullProfile()
 * -----------------------------------------------------------
 * Objetivo:
 *  - Completar el estado del usuario con los campos de la fila
 *    correspondiente en la tabla user_profiles.
 *
 * Requisitos:
 *  - Debe existir user.id (establecido por loadCurrentUserAuthState()
 *    o por login()).
 *
 * Flujo:
 *  a) Llama a getUserProfileById(user.id).
 *  b) setUser(perfil) para mezclar y propagar los campos del perfil.
 *
 * Manejo de errores:
 *  - Cualquier error al consultar el perfil se loggea en consola.
 *    No rompe la experiencia, pero el estado puede quedar "incompleto".
 */
async function fetchFullProfile() {
  try {
    // Trae el objeto completo del perfil y lo mezcla con el estado actual.
    setUser(await getUserProfileById(user.id));
  } catch (error) {
    console.error('[auth.js fetchFullProfile] Error al cargar el perfil completo.', error.message);
  }
}

/**
 * -----------------------------------------------------------
 * 3) register({ email, password, username, display_name })
 * -----------------------------------------------------------
 * Objetivo:
 *  - Registrar un nuevo usuario en Supabase Auth y crear su perfil
 *    inicial en la tabla `user_profiles`.
 *
 * Flujo:
 *  a) Llamar a supabase.auth.signUp() para registrar el usuario.
 *  b) Si hay error (email existente, formato inválido, etc.), se lanza excepción.
 *  c) Crear la fila en user_profiles con createUserProfile().
 *  d) Actualizar el estado global del usuario con los datos básicos.
 *
 * Errores comunes:
 *  - "User already registered": el email ya está en uso.
 *  - Configuración de verificación por email activada: el usuario puede
 *    estar en estado "pendiente" hasta que confirme su correo.
 */
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
      bio: 'Aún no completado',
      location: 'No especificado',
      website_url: '',
      career: 'No especificado',
      skills: [],
      experience_years: 0,
      current_project: '',
      available_for_work: false,
      github_url: '',
      linkedin_url: '',
      instagram_url: '',
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

/**
 * -----------------------------------------------------------
 * 4) login(email, password)
 * -----------------------------------------------------------
 * Objetivo:
 *  - Autenticar al usuario con credenciales y refrescar su perfil completo.
 *
 * Flujo:
 *  a) Llamar a supabase.auth.signInWithPassword().
 *  b) Si hay error (credenciales inválidas, usuario inexistente), se lanza excepción.
 *  c) Actualizar estado mínimo con id y email.
 *  d) Llamar a fetchFullProfile() para traer el resto del perfil.
 *
 * Errores comunes:
 *  - "Invalid login credentials": email o contraseña incorrectos.
 *  - "Email not confirmed": si el correo no fue verificado (si está activado).
 */
export async function login(email, password) {
  const {data, error} = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('[auth.js login] Error al iniciar sesión:', error.message);
    throw new Error(error.message);
  }

  setUser({
    id: data.user.id,
    email: data.user.email,
  });

  await fetchFullProfile();
}

/**
 * -----------------------------------------------------------
 * 5) logout()
 * -----------------------------------------------------------
 * Objetivo:
 *  - Cerrar la sesión activa del usuario autenticado.
 *
 * Flujo:
 *  a) Llamar a supabase.auth.signOut().
 *  b) Resetear el estado global del usuario a valores nulos.
 *
 * Nota:
 *  - No lanza error si no hay sesión activa.
 *  - Ideal para usar en botones de "Cerrar sesión".
 */
export async function logout() {
  await supabase.auth.signOut();
  setUser({
    id: null,
    email: null,
  });
}

/**
 * -----------------------------------------------------------
 * 6) updateAuthUser(data)
 * -----------------------------------------------------------
 * Objetivo:
 *  - Actualizar datos del perfil del usuario autenticado en la base.
 *
 * Flujo:
 *  a) Llamar a updateUserProfile(user.id, data) para persistir los cambios.
 *  b) Actualizar el estado local user con los nuevos valores.
 *
 * Errores comunes:
 *  - "Row not found": si no existe perfil asociado al user_id.
 *  - "Permission denied": si la política RLS no permite update().
 */
export async function updateAuthUser(data) {
  try {
    await updateUserProfile(user.id, data);

    // Mezclamos la data actualizada con el estado existente
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
  /*return () => {
    observers = observers.filter(obs => callback != obs);
  }*/
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
  callback({...user});
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
