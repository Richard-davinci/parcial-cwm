<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-6 py-20">
    <div class="text-center max-w-3xl">
      <h1 class="text-4xl md:text-5xl font-bankgothic text-turquesa mb-4">
        Bienvenido a Lili-Studio Comunidad Dev
      </h1>
      <p class="text-gray-300 text-lg leading-relaxed mb-8">
        Unite a una comunidad donde los desarrolladores comparten ideas, proyectos y experiencias.
        Inspirate con lo que otros están creando y mostrá tu propio trabajo.
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <router-link
          class="bg-turquesa hover:bg-[#0db38f] text-black font-bankgothic py-3 px-8 rounded-lg transition-colors text-lg"
          to="/feed"
        >
          Ver muro
        </router-link>

        <router-link
          class="bg-gray-800 hover:bg-gray-700 text-white font-bankgothic py-3 px-8 rounded-lg transition-colors text-lg"
          to="/crear-publicacion"
        >
          Crear publicación
        </router-link>
      </div>
    </div>

    <div class="mt-16 grid gap-8 md:grid-cols-3 max-w-5xl w-full text-center">
      <div class="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-turquesa transition-all">
        <i class="bi bi-code-slash text-turquesa text-4xl mb-3"></i>
        <h2 class="font-bankgothic text-xl mb-2 text-turquesa">Compartí tus proyectos</h2>
        <p class="text-gray-400 text-sm">
          Subí avances, capturas y snippets de código para mostrar tu trabajo a la comunidad.
        </p>
      </div>

      <div class="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-turquesa transition-all">
        <i class="bi bi-chat-dots text-turquesa text-4xl mb-3"></i>
        <h2 class="font-bankgothic text-xl mb-2 text-turquesa">Conectá con otros devs</h2>
        <p class="text-gray-400 text-sm">
          Intercambiá ideas, consejos y opiniones con desarrolladores de distintos niveles y especialidades.
        </p>
      </div>

      <div class="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-turquesa transition-all">
        <i class="bi bi-lightbulb text-turquesa text-4xl mb-3"></i>
        <h2 class="font-bankgothic text-xl mb-2 text-turquesa">Inspirate y aprendé</h2>
        <p class="text-gray-400 text-sm">
          Descubrí nuevas tecnologías, frameworks y buenas prácticas en publicaciones de la comunidad.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>
