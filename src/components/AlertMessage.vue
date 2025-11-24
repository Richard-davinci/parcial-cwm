<script>
export default {
  name: "AlertMessage",

  props: {
    type: {
      type: String,
      default: "info", // success | danger | warning | info
    },
    message: {
      type: String,
      default: null,
    },
    errors: {
      type: Array,
      default: () => [],
    },
    small: {
      type: Boolean,
      default: false,
    },
    closable: {
      type: Boolean,
      default: true,
    },
  },

  data() {
    return {
      isVisible: true,
      colors: {
        success: "bg-turquesa text-black",
        danger: "bg-red-600 text-white",
        warning: "bg-yellow-400 text-black",
        info: "bg-blue-600 text-white",
      },
      icons: {
        success: "fa-circle-check",
        danger: "fa-triangle-exclamation",
        warning: "fa-circle-exclamation",
        info: "fa-circle-info",
      },
    };
  },

  computed: {
    colorClass() {
      return this.colors[this.type] ?? this.colors.info;
    },
    iconClass() {
      return this.icons[this.type] ?? this.icons.info;
    },
    hasContent() {
      return this.message || (Array.isArray(this.errors) && this.errors.length > 0);
    },
  },
};
</script>

<template>
  <div
    v-if="isVisible && hasContent"
    :class="[
      colorClass,
      small
        ? 'px-3 py-2 rounded text-sm'
        : 'p-4 rounded-lg shadow-md text-base',
      'font-bankgothic flex items-start gap-3 animate-fade-in'
    ]"
  >
    <!-- Icono -->
    <i class="fa-solid" :class="[iconClass, 'text-xl']"></i>

    <!-- Mensaje único -->
    <span v-if="message" class="flex-1">{{ message }}</span>

    <!-- Lista de errores -->
    <ul v-if="errors.length" class="flex-1 list-disc ml-4 space-y-1 text-sm">
      <li v-for="err in errors" :key="err">{{ err }}</li>
    </ul>

    <!-- Botón cerrar -->
    <button
      v-if="closable && !small"
      @click="isVisible = false"
      class="ml-auto text-white/80 hover:text-white transition"
    >
      ✕
    </button>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

.animate-fade-in {
  animation: fade-in 0.25s ease-out;
}
</style>
