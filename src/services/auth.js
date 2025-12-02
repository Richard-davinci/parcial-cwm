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

  // Validar username duplicado
  const {data: existingUser, error: usernameCheckError} = await supabase
    .from("user_profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingUser) {
    throw new Error("El nombre de usuario ya está en uso.");
  }

  if (usernameCheckError) {
    throw new Error("No se pudo validar el nombre de usuario.");
  }

  // Registro en Auth
  const {data, error} = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  // Crear perfil usando tu función ya existente
  await createUserProfile({
    id: data.user.id,
    email: data.user.email,
    username,
    display_name,

  });
  setUser({
    id: data.user.id,
    email: data.user.email,
    username,
    display_name,
  });
  return {success: true};
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

    // Seguridad: el usuario debe estar cargado
    if (!user.id) throw new Error("Usuario no autenticado");

    const profileUpdate = {
      display_name: data.display_name,
      username: data.username,
      bio: data.bio,
      career: data.career,
      location: data.location,
      website_url: data.website_url,
      skills: Array.isArray(data.skills)
        ? data.skills
        : (data.skills || "").split(",").map(s => s.trim()).filter(Boolean),
      experience_years: data.experience_years,
      current_project: data.current_project,
      available_for_work: data.available_for_work,
      github_url: data.github_url,
      linkedin_url: data.linkedin_url,
      instagram_url: data.instagram_url,
      avatar_url: data.avatar_url,
      updated_at: new Date(),
    };

    await updateUserProfile(user.id, profileUpdate);

    // Refrescar store global
    setUser({
      ...user,
      ...profileUpdate,
    });

    console.log("[auth.js] Perfil actualizado correctamente.");

  } catch (error) {
    console.error("[auth.js updateAuthUser] Error:", error.message);
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