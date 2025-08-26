import { ref, computed } from 'vue'
import { GANTT_CONFIG } from '../constants/gantt.js'

export function useDragDrop(onTaskUpdate) {
  const isDragOver = ref(false)
  
  const handleDragOver = (event) => {
    event.preventDefault()
    isDragOver.value = true
  }

  const handleDragLeave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      isDragOver.value = false
    }
  }

  const handleMessageDrop = (event, draggedMessage, onClearCallback) => {
    event.preventDefault()
    isDragOver.value = false
    
    if (!draggedMessage) {
      if (onClearCallback) onClearCallback()
      return null
    }

    const newTask = {
      messageId: draggedMessage.id,
      startDate: GANTT_CONFIG.MIN_START_DAY,
      duration: GANTT_CONFIG.DEFAULT_DURATION,
      isDone: false,
      assignee: {
        id: draggedMessage.id,
        name: draggedMessage.userName,
        color: draggedMessage.color
      }
    }

    // ローカル状態は更新せず、サーバーに送信のみ
    if (onTaskUpdate) onTaskUpdate(newTask, 'create')

    if (onClearCallback) onClearCallback()

    return newTask
  }

  const removeDroppedTask = (taskId) => {
    // ローカル状態は変更せず、サーバーからの更新を待つ
    const taskToRemove = droppedTasks.value.find(task => task.id === taskId)
    return taskToRemove || null
  }

  return {
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleMessageDrop,
    removeDroppedTask
  }
}
