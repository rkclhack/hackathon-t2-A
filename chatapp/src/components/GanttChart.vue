<script setup>
import { onUnmounted, computed, toRef } from 'vue'
import { useGantt } from '../composables/useGantt.js'
import { useColorPallet } from '../composables/useUI.js'
import { GANTT_CONFIG, GANTT_LAYOUT } from '../constants/gantt.js'
import ColorPalette from './ColorPalette.vue'

const props = defineProps({
  tasks: {
    type: Array,
    required: true
  },
  users: {
    type: Array,
    required: true
  },
  onTaskUpdate: {
    type: Function,
    default: null
  }
})

const colorPallet = computed(() => props.users.map(user => user.color))

const {
  chartContainer,
  deleteTask,
  changeTaskColor,
  toggleTaskComplete,
  startTaskResize,
  startTaskDrag,
  cleanup
} = useGantt(toRef(props, 'tasks'), props.onTaskUpdate)

const {
  activeColorPicker,
  toggleColorPicker
} = useColorPallet()

onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <div class="gantt-section">
    <div class="gantt-container-wrapper">
      <div
        ref="chartContainer"
        class="gantt-chart"
      >
        <div class="days-header">
          <div class="checkbox-column-header"></div>
          <div
            v-for="day in GANTT_CONFIG.TOTAL_DAYS"
            :key="day"
            class="day-column"
          >
            Day {{ day }}
          </div>
        </div>

        <div class="tasks-container">
          <div
            v-for="(task, index) in tasks"
            :key="task.messageId"
            class="task-row"
          >
            <div class="task-checkbox-cell">
              <div
                @click.stop="toggleTaskComplete(task.messageId)"
                @mousedown.stop.prevent
                class="task-checkbox"
                :class="{ 'checkbox-checked': task.isDone }"
              >
                <span v-if="task.isDone" class="checkmark">✓</span>
              </div>
            </div>

            <!-- Day列のグリッドセル -->
            <div
              v-for="day in GANTT_CONFIG.TOTAL_DAYS"
              :key="day"
              class="day-cell"
            >
              <!-- タスクがこの範囲にある場合のみ表示 -->
              <div
                v-if="day >= task.startDate && day < task.startDate + task.duration"
                class="task-bar-segment"
                :class="{ 
                  'task-completed': task.isDone,
                  'task-start': day === task.startDate,
                  'task-end': day === task.startDate + task.duration - 1,
                  'palette-open': activeColorPicker === task.messageId
                }"
                :style="{
                  backgroundColor: task.assignee.color
                }"
                :data-message-id="task.messageId"
                @mousedown="startTaskDrag(task, $event)"
              >
                <!-- 削除ボタン（最初のセグメントのみ） -->
                <button
                  v-if="day === task.startDate"
                  @click.stop="deleteTask(task.messageId)"
                  @mousedown.stop.prevent
                  class="task-delete-button"
                  :data-task-id="task.messageId"
                >
                  ✕
                </button>

                <!-- タスクコンテンツ（最初のセグメントのみ） -->
                <div v-if="day === task.startDate" class="task-content">
                  <div class="task-text">
                    <div
                      class="task-message"
                      :class="{ 'task-message-completed': task.isDone }"
                    >
                      {{ task.message }}
                    </div>
                  </div>
                </div>

                <!-- カラーパレット（最後のセグメントのみ、duration >= 2の場合） -->
                <div 
                  v-if="day === task.startDate + task.duration - 1 && task.duration >= 2"
                  class="task-color-control"
                  :data-task-id="task.messageId"
                >
                  <button
                    @click.stop="toggleColorPicker(task.messageId)"
                    @mousedown.stop.prevent
                    class="color-picker-button"
                  >
                    <div 
                      class="color-picker-icon"
                      :style="{ backgroundColor: task.assignee.color }"
                    ></div>
                  </button>
                  <div
                    v-if="activeColorPicker === task.messageId"
                    class="color-picker-palette floating-palette"
                  >
                    <ColorPalette
                      :colors="colorPallet"
                      :model-value="task.assignee.color"
                      @update:model-value="(color) => changeTaskColor(task.messageId, color)"
                      size="sm"
                    />
                  </div>
                </div>

                <!-- リサイズハンドル（最後のセグメントのみ） -->
                <div
                  v-if="day === task.startDate + task.duration - 1"
                  class="resize-handle"
                  @mousedown.stop="startTaskResize(task, $event)"
                >
                  <div class="resize-indicator"></div>
                </div>
              </div>
            </div>
          </div>


        </div>

        <div v-if="tasks.length === 0" class="drop-zone">
          <div class="drop-zone-content">
            <div class="drop-icon">📋</div>
            <p>チャットメッセージをここにドラッグ&ドロップしてタスクを作成</p>
            <div class="drop-hint">
              <div class="hint-arrow">←</div>
              <span>左のメッセージをドラッグできます</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gantt-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.gantt-header {
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.section-title {
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: bold;
}

.section-subtitle {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.gantt-container-wrapper {
  flex: 1;
  padding: 15px;
}

.gantt-chart {
  background: white;
  border: 2px dashed #ddd;
  border-radius: 4px;
  height: 100%;
  position: relative;
  overflow-x: auto;
  overflow-y: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.gantt-chart.drag-over {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.days-header {
  position: sticky;
  display: grid;
  grid-template-columns: 75px repeat(7, minmax(120px, 1fr));
  border-bottom: 2px solid #DDE2E9;
  background: #f8f9fa;
  top: 0;
  z-index: 10;
  min-width: fit-content;
}

.checkbox-column-header {
  border-right: 2px dashed #ddd;
  background: #f8f9fa;
}

.day-column {
  padding: 12px;
  border-right: 2px dashed #ddd;
  text-align: center;
  font-weight: bold;
  font-size: 14px;
}

.day-column:last-child {
  border-right: none;
}

.tasks-container {
  display: flex;
  flex-direction: column;
  position: relative;
}

.tasks-container::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 25px;
  z-index: 1;
  pointer-events: none;
}

.tasks-container::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 25px;
  display: grid;
  grid-template-columns: 75px repeat(7, minmax(120px, 1fr));
  z-index: 2;
  pointer-events: none;
}

.tasks-container::before::after {
  content: '';
  border-right: 1px dashed #ddd;
  height: 100%;
}



.task-row {
  width: 100%;
  display: grid;
  grid-template-columns: 75px repeat(7, minmax(120px, 1fr));
  height: 70px;
  margin-bottom: 5px;
}

.task-row:first-child {
  margin-top: 20px;
}

.task-row:last-child {
  margin-bottom: 25px;
}

.task-checkbox-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  position: relative;
}

.task-checkbox-cell::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background: repeating-linear-gradient(
    to bottom,
    #ddd 0px,
    #ddd 3px,
    transparent 3px,
    transparent 6px
  );
  z-index: 5;
}

.task-row:first-child .task-checkbox-cell::after {
  top: -20px;
  height: calc(100% + 20px);
}

.task-row:last-child .task-checkbox-cell::after {
  height: calc(100% + 25px);
}

.day-cell {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0;
}

.day-cell:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background: repeating-linear-gradient(
    to bottom,
    #ddd 0px,
    #ddd 3px,
    transparent 3px,
    transparent 6px
  );
  z-index: 5;
}

.task-row:first-child .day-cell:not(:last-child)::after {
  top: -20px;
  height: calc(100% + 20px);
}

.task-row:last-child .day-cell:not(:last-child)::after {
  height: calc(100% + 25px);
}

.task-bar-segment {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  cursor: move;
  color: white;
  font-size: 14px;
  z-index: 15;
  position: relative;
  width: 100%;
  margin: 11px 0;
}

.task-bar-segment.palette-open {
  z-index: 10000;
}

.task-bar-segment.task-start {
  border-top-left-radius: 16px;
  border-bottom-left-radius: 16px;
}

.task-bar-segment.task-end {
  border-top-right-radius: 16px;
  border-bottom-right-radius: 16px;
}

.task-bar-segment.task-start.task-end {
  border-radius: 16px;
}

.task-bar-segment.task-completed {
  opacity: 0.6;
}

.task-bar-segment .task-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
}

.task-checkbox {
  width: 30px;
  height: 30px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: white;
  box-shadow: 2px 3px 4px 2px #00000040;
}

.checkbox-checked {
  background: #f97316;
  border-color: #f97316;
}

.checkmark {
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.task-text {
  flex: 1;
  min-width: 0;
}

.task-name {
  font-size: 11px;
  opacity: 0.9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-message {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-message-completed {
  text-decoration: line-through;
  opacity: 0.7;
}

.task-bar-segment .task-delete-button {
  position: absolute;
  top: -10px;
  left: -10px;
  width: 20px;
  height: 20px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.task-bar-segment .task-color-control {
  position: absolute;
  right: 26px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

/* 同じタスクの任意のセグメントをホバーした時に削除ボタン、カラーパレット、リサイズハンドルを表示 */
.task-row:hover .task-delete-button,
.task-row:hover .task-color-control,
.task-row:hover .resize-handle {
  opacity: 1;
}

.color-picker-container {
  position: relative;
}

.color-picker-button {
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-picker-icon {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.resize-handle {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 24px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  cursor: ew-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.resize-indicator {
  width: 2px;
  height: 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 1px;
}

.drop-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
  font-size: 14px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  margin: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  transition: all 0.3s ease;
}

.drop-zone:hover {
  border-color: #007bff;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.drop-zone-content {
  text-align: center;
}

.drop-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.drop-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 12px;
  color: #666;
}

.hint-arrow {
  font-size: 18px;
  color: #007bff;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-5px); }
}

.color-picker-palette {
  position: absolute;
  top: 25px;
  bottom: 30px;
  right: 0;
  z-index: 9999;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 0;
  overflow: hidden;
}

.floating-palette {
  border: none !important;
  border-radius: 8px;
  overflow: visible;
  z-index: 9999;
}

.floating-palette :deep(.cp-root) {
  border: 1px solid #000;
  border-radius: 8px;
  padding: 8px 12px 12px 12px;
  background: white;
}
</style>
