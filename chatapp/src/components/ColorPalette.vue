<template>
  <div class="cp-root">
    <div
      v-for="(hex, i) in colors"
      :key="`${hex}-${i}`"
      class="cp-swatch"
      :class="sizeClass"
      @click="select(hex)"
    >
      <!-- 上半分（色） -->
      <div
        class="cp-top"
        :style="{
          backgroundColor: hex,
          borderTopLeftRadius: `${radius}px`,
          borderTopRightRadius: `${radius}px`,
          height: `${topH}px`
        }"
      />
      <!-- 下半分（付箋ベージュ） -->
      <div
        class="cp-bottom"
        :style="{
          backgroundColor: STICKY_BEIGE,
          height: `${bottomH}px`
        }"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const STICKY_BEIGE = '#F9F6E8'

const props = defineProps({
  colors: { type: Array, required: true },
  modelValue: { type: String, default: '' },
  size: { type: String, default: 'md' }
})

const emit = defineEmits(['update:modelValue'])

const sizeMap = {
  sm: { w: 36, h: 28, radius: 8 },
  md: { w: 48, h: 38, radius: 10 },
  lg: { w: 64, h: 48, radius: 12 }
}

const sizeConf = computed(() => sizeMap[props.size] ?? sizeMap.md)
const radius = computed(() => sizeConf.value.radius)
const topH = computed(() => Math.round(sizeConf.value.h * 0.52))
const bottomH = computed(() => sizeConf.value.h - topH.value)

const sizeClass = computed(() => `cp-${props.size}`)

function select(hex) {
  emit('update:modelValue', hex)
}
</script>

<style scoped>
.cp-root {
  padding-top: 20px;
  padding-left: 10px;
  padding-right: 10px;
  display: inline-flex;
  gap: 8px;
  border: 2px solid #000;
}

.cp-swatch {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  background: transparent;
  cursor: pointer;
  outline: none;
  transition: transform .12s ease;
}

.cp-swatch:hover { 
  transform: scale(1.03); 
}

.cp-sm { 
  width: 36px; 
  height: 28px; 
  border-radius: 8px; 
}

.cp-md { 
  width: 48px; 
  height: 38px; 
  border-radius: 10px; 
}

.cp-lg { 
  width: 64px; 
  height: 48px; 
  border-radius: 12px; 
}

.cp-top, .cp-bottom { 
  width: 100%; 
}
</style>