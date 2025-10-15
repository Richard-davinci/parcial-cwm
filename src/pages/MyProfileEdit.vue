<script>
import { updateUserProfile, getUserProfileById } from "../services/user-profiles.js";
import { supabase } from "../services/supabase.js";

export default {
  name: "MyProfileEdit",
  data() {
    return {
      user: {
        id: null,
        display_name: "",
        bio: "",
        location: "",
        career: "",
        skills: "",
        experience_years: "",
        current_project: "",
        available_for_work: false,
        website_url: "",
        github_url: "",
        linkedin_url: "",
        instagram_url: "",
        avatar_url: "",
      },
      loading: false,
    };
  },
  async mounted() {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      const profile = await getUserProfileById(data.user.id);
      this.user = { ...profile, skills: profile.skills?.join(", ") || "" };
    }
  },
  methods: {
    async handleSubmit() {
      this.loading = true;
      const updatedData = {
        ...this.user,
        skills: this.user.skills
          ? this.user.skills.split(",").map((s) => s.trim())
          : [],
      };

      await updateUserProfile(this.user.id, updatedData);

      this.loading = false;
      this.$router.push("/mi-perfil");
    },
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
            v-model="user.display_name"
            type="text"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="Ej: Ricardo García"
          />
        </div>

        <!-- Ubicación -->
        <div>
          <label class="block text-sm font-medium mb-1">Ubicación</label>
          <input
            v-model="user.location"
            type="text"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="Ciudad, país"
          />
        </div>

        <!-- Biografía -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium mb-1">Biografía</label>
          <textarea
            v-model="user.bio"
            rows="3"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="Contanos un poco sobre vos..."
          ></textarea>
        </div>

        <!-- Carrera -->
        <div>
          <label class="block text-sm font-medium mb-1">Carrera / Rol</label>
          <input
            v-model="user.career"
            type="text"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="Ej: Fullstack Developer"
          />
        </div>

        <!-- Años de experiencia -->
        <div>
          <label class="block text-sm font-medium mb-1">Años de experiencia</label>
          <input
            v-model.number="user.experience_years"
            type="number"
            min="0"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="Ej: 3"
          />
        </div>

        <!-- Proyecto actual -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium mb-1">Proyecto actual</label>
          <input
            v-model="user.current_project"
            type="text"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="En qué estás trabajando ahora"
          />
        </div>

        <!-- Skills -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium mb-1">Habilidades (separadas por comas)</label>
          <input
            v-model="user.skills"
            type="text"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="Ej: Vue.js, PHP, Laravel, Tailwind"
          />
        </div>

        <!-- Disponible para trabajar -->
        <div class="flex items-center gap-2 md:col-span-2">
          <input
            id="available"
            v-model="user.available_for_work"
            type="checkbox"
            class="h-5 w-5 text-turquesa bg-gray-800 border-gray-700 rounded focus:ring-turquesa"
          />
          <label for="available" class="text-sm">Disponible para nuevos proyectos</label>
        </div>

        <!-- Avatar URL -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium mb-1">Avatar (URL)</label>
          <input
            v-model="user.avatar_url"
            type="url"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="https://ejemplo.com/avatar.jpg"
          />
        </div>

        <!-- Redes -->
        <div>
          <label class="block text-sm font-medium mb-1">GitHub</label>
          <input
            v-model="user.github_url"
            type="url"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="https://github.com/usuario"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">LinkedIn</label>
          <input
            v-model="user.linkedin_url"
            type="url"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="https://linkedin.com/in/usuario"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Instagram</label>
          <input
            v-model="user.instagram_url"
            type="url"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="https://instagram.com/usuario"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Website</label>
          <input
            v-model="user.website_url"
            type="url"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-turquesa"
            placeholder="https://mi-sitio.com"
          />
        </div>

        <!-- Botón -->
        <div class="md:col-span-2">
          <button
            type="submit"
            class="w-full py-3 bg-turquesa text-black font-bankgothic uppercase rounded-lg hover:bg-[#0db38f] transition-colors"
            :disabled="loading"
          >
            {{ loading ? "Guardando..." : "Guardar cambios" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
