import { ref, onMounted, onUnmounted } from 'vue'

export function useColorPallet() {
  const activeColorPicker = ref(null)

  const toggleColorPicker = (taskId) => {
    activeColorPicker.value = activeColorPicker.value === taskId ? null : taskId
  }

  const handleClickOutside = (event) => {
    if (!event.target.closest('.color-picker-container')) {
      activeColorPicker.value = null
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })

  return {
    activeColorPicker,
    toggleColorPicker
  }
}
