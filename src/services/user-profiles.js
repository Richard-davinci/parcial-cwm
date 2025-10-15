import { supabase } from "./supabase";

export async function getUserProfileById(id) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select()
    .eq('id', id)
    .limit(1)
    .single();

  if(error) {
    console.error('[user-profiles.js createUserProfile] Error al crear el perfil del usuario', data, error);
    throw new Error(error.message);
  }

  return data;
}

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
