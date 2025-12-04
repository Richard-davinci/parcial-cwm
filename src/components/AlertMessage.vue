<script setup>
import {ref, computed} from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: "info", 
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
})

const isVisible = ref(true)

const colors = {
  success: "bg-turquesa text-black",
  danger: "bg-red-600 text-white",
  warning: "bg-yellow-400 text-black",
  info: "bg-blue-600 text-white",
}

const icons = {
  success: "fa-circle-check",
  danger: "fa-triangle-exclamation",
  warning: "fa-circle-exclamation",
  info: "fa-circle-info",
}

const colorClass = computed(() => {
  return colors[props.type] ?? colors.info
})

const iconClass = computed(() => {
  return icons[props.type] ?? icons.info
})

const hasContent = computed(() => {
  return props.message || (Array.isArray(props.errors) && props.errors.length > 0)
})
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
    <i class="fa-solid" :class="[iconClass, 'text-xl']"></i>
    <span v-if="message" class="flex-1">{{ message }}</span>
    <ul v-if="errors.length" class="flex-1 list-disc ml-4 space-y-1 text-sm">
      <li v-for="err in errors" :key="err">{{ err }}</li>
    </ul>
    <button
      v-if="closable && !small"
      @click="isVisible = false"
      class="ml-auto text-white/80 hover:text-white transition"
    >
      <i class="fa-solid fa-xmark"></i>
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
