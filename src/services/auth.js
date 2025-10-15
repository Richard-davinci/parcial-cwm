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
    await createUserProfile({
      id: data.user.id,
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
    console.error('[auth.js login] Error al iniciar sesión:', error.message);
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

export function subscribeToAuthStateChanges(callback) {
  observers.push(callback);
  notify(callback);
  return () => {
    observers = observers.filter(obs => callback != obs);
  }
}

// Notificar un cambio de usuario a un observer
function notify(callback) {
  callback({...user});
}

// Notificar a todos los observers
function notifyAll() {
  observers.forEach(notify);
}

// Actualizar el estado global del usuario
function setUser(data) {
  user = {
    ...user,
    ...data,
  };
  notifyAll();
}