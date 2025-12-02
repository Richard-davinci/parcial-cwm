<script>
import {createInitialUserState, subscribeToAuthStateChanges, updateAuthUser} from "../services/auth.js";

let unsubscribeFromAuth = () => {
};


export default {
  name: "MyProfileEdit",
  data() {
    return {
      userData: createInitialUserState(),
      loading: false,
    };
  },

  methods: {
    async handleSubmit() {
      try {
        this.loading = true;

        await updateAuthUser({
          ...this.userData,
        });
      } catch (error) {
        console.error('[MyProfileEdit.vue] Error al actualizar el perfil:', error.message);
        this.loading = false;
      }
      this.loading = false;
      this.$router.push("/mi-perfil");
    },
  },
  async mounted() {
    unsubscribeFromAuth = subscribeToAuthStateChanges(newUserState => {
      this.userData = {
        display_name: newUserState.display_name,
        bio: newUserState.bio,
        career: newUserState.career,
        location: newUserState.location,
        website_url: newUserState.website_url,
        skills: Array.isArray(newUserState.skills)
          ? newUserState.skills.join(', ')
          : newUserState.skills || '',
        experience_years: newUserState.experience_years,
        current_project: newUserState.current_project,
        available_for_work: newUserState.available_for_work,
        github_url: newUserState.github_url,
        linkedin_url: newUserState.linkedin_url,
        instagram_url: newUserState.instagram_url,
        avatar_url: newUserState.avatar_url
      }
    });
  },
  unmounted() {
    unsubscribeFromAuth();
  },
};
</script>


<template>
  <div class="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-3xl bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-800">
      <h1 class="text-3xl font-bankgothic text-turquesa mb-8 text-center">
        Editar perfil
      </h1>

      <form class="grid grid-cols-1 md:grid-cols-2 gap-6" @submit.prevent="handleSubmit">
        <!-- Nombre público -->
        <div>
          <label class="block text-sm font-medium mb-1">Nombre público</label>
          <input
            v-model="userData.display_name"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="Ej: Ricardo García"
            type="text"
          />
        </div>

        <!-- Ubicación -->
        <div>
          <label class="block text-sm font-medium mb-1">Ubicación</label>
          <input
            v-model="userData.location"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="Ciudad, país"
            type="text"
          />
        </div>

        <!-- Biografía -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium mb-1">Biografía</label>
          <textarea
            v-model="userData.bio"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa resize-none"
            placeholder="Contanos un poco sobre vos..."
            rows="9"
            style="field-sizing: content; min-height: 80px; max-height: 200px;"
          ></textarea>
        </div>

        <!-- Carrera -->
        <div>
          <label class="block text-sm font-medium mb-1">Carrera / Rol</label>
          <input
            v-model="userData.career"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="Ej: Fullstack Developer"
            type="text"
          />
        </div>

        <!-- Años de experiencia -->
        <div>
          <label class="block text-sm font-medium mb-1">Años de experiencia</label>
          <input
            v-model.number="userData.experience_years"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            min="0"
            placeholder="Ej: 3"
            type="number"
          />
        </div>

        <!-- Proyecto actual -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium mb-1">Proyecto actual</label>
          <input
            v-model="userData.current_project"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="En qué estás trabajando ahora"
            type="text"
          />
        </div>

        <!-- Skills -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium mb-1">Habilidades (separadas por comas)</label>
          <input
            v-model="userData.skills"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="Ej: Vue.js, PHP, Laravel, Tailwind"
            type="text"
          />
        </div>

        <!-- Disponible para trabajar -->
        <div class="flex items-center gap-2 md:col-span-2">
          <input
            id="available"
            v-model="userData.available_for_work"
            class="h-5 w-5 text-turquesa bg-gray-800 border-gray-700 rounded focus:ring-turquesa"
            type="checkbox"
          />
          <label class="text-sm" for="available">Disponible para nuevos proyectos</label>
        </div>

        <!-- Avatar URL -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium mb-1">Avatar (URL)</label>
          <input
            v-model="userData.avatar_url"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="https://ejemplo.com/avatar.jpg"
            type="input"
          />
        </div>

        <!-- Redes -->
        <div>
          <label class="block text-sm font-medium mb-1">GitHub</label>
          <input
            v-model="userData.github_url"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="https://github.com/usuario"
            type="url"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">LinkedIn</label>
          <input
            v-model="userData.linkedin_url"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="https://linkedin.com/in/usuario"
            type="url"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Instagram</label>
          <input
            v-model="userData.instagram_url"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="https://instagram.com/usuario"
            type="url"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Website</label>
          <input
            v-model="userData.website_url"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="https://mi-sitio.com"
            type="url"
          />
        </div>

        <!-- Botón -->
        <div class="md:col-span-2">
          <button
            :disabled="loading"
            class="w-full py-3 bg-turquesa text-black font-bankgothic uppercase rounded-lg hover:bg-[#0db38f] transition-colors"
            type="submit"
          >
            {{ loading ? "Guardando..." : "Guardar cambios" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
