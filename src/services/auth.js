/**
 * ===========================================================
 * services/auth.js — Servicio de autenticación
 * ===========================================================
 */
import {supabase} from './supabase.js';
import {createUserProfile, getUserProfileById, updateUserProfile} from "./user-profiles";

let user = createInitialUserState();
let observers = [];
let isInitialized = false; // Nueva bandera para controlar la inicialización
let initPromise = null; // Promise para la inicialización

// Inicializar automáticamente
initPromise = loadCurrentUserAuthState();

async function loadCurrentUserAuthState() {
  try {
    const {data, error} = await supabase.auth.getUser();
    
    if (error || !data.user) {
      console.warn('No hay usuario autenticado.');
      setUser({
        id: null,
        email: null,
      });
    } else {
      setUser({
        id: data.user.id,
        email: data.user.email,
      });
      await fetchFullProfile();
    }
  } catch (error) {
    console.error('Error al cargar el estado de autenticación:', error);
    setUser({
      id: null,
      email: null,
    });
  } finally {
    isInitialized = true;
  }
}

// Nueva función para esperar la inicialización
export async function waitForAuthInitialization() {
  if (!isInitialized) {
    await initPromise;
  }
  return user;
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
    console.error('[auth.js updateAuthUser] Error al actualizar el perfil:', error.message);
    throw error; 
  }
}

export function subscribeToAuthStateChanges(callback) {
  observers.push(callback);
  notify(callback);
  return () => {
    observers = observers.filter(obs => callback != obs);
  }
}

function notify(callback) {
  callback({
    ...user
  });
}

function notifyAll() {
  observers.forEach(notify);
}

function setUser(data) {
  user = {
    ...user,
    ...data,
  };
  notifyAll();
}

export function createInitialUserState() {
  return {
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
}