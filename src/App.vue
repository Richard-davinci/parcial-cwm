<script>
import AppFooter from './components/AppFooter.vue';
import AppNavbar from './components/AppNavbar.vue';

export default {
  name: 'App',
  components: {AppNavbar, AppFooter,},
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-blanco">
    <AppNavbar/>
    <main class="pt-15 bg-azul">
      <RouterView/>
    </main>
    <AppFooter/>
  </div>
</template>