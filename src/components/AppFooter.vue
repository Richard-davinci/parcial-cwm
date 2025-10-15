
<template>
  <footer class="py-4 bg-black border-t border-gray-700">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div class="lg:col-span-4 flex justify-center lg:justify-start">
          <RouterLink class="flex items-center" to="/">
            <img alt="logo" class="w-1/2" src="/img/logo.png">
          </RouterLink>
        </div>
        <div class="lg:col-span-8">
          <ul class="flex flex-col md:flex-row items-center md:justify-end gap-3 text-sm text-white mb-0">
            <li><i class="bi bi-person me-1 text-teal-400"></i> Ricardo Rodolfo Garcia</li>
            <li><i class="bi bi-calendar3 me-1 text-teal-400"></i> 37 años</li>
            <li><i class="bi bi-envelope me-1 text-teal-400"></i>
              <a class="text-white hover:text-teal-400 no-underline" href="mailto:ricardo.garcia@davinci.edu.ar">ricardo.garcia@davinci.edu.ar</a>
            </li>
            <li><i class="bi bi-instagram me-1 text-teal-400"></i>
              <a class="text-white hover:text-teal-400 no-underline" href="https://www.instagram.com/lilitech_laplata"
                 rel="noopener" target="_blank">@lilitech_laplata</a>
            </li>
            <li><i class="bi bi-globe2 me-1 text-teal-400"></i>
              <a class="text-white hover:text-teal-400 no-underline" href="https://lili-studio.lilitech.shop/"
                 rel="noopener"
                 target="_blank">lilitech.shop</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'AppFooter',
}
</script>


