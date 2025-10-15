<script>
import AppFooter from './components/AppFooter.vue';
import AppNavbar from './components/AppNavbar.vue';

export default {
  name: 'App',
  components: {AppNavbar, AppFooter,},
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-gray-950">
    <AppNavbar/>
    <main class="bg-gray-950 pt-20">
      <RouterView/>
    </main>
    <AppFooter/>
  </div>
</template>