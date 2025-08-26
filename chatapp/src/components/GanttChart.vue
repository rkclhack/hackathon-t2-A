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
                    <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.82422 3.08682C10.0979 1.08106 13.9571 0.884684 17.7861 2.85342V2.8544C23.2953 5.68396 25.4197 11.3746 23.585 17.3368C23.01 19.2073 21.8617 21.0626 20.3271 22.2782C18.785 23.4983 16.8453 24.0772 14.7236 23.3515C13.2305 22.8407 12.3401 22.0598 11.8115 21.1474V21.1464C11.2859 20.2407 11.1243 19.2268 11.0479 18.2792H11.0488C11.0272 18.001 11.0086 17.7219 10.9932 17.4433L10.9922 17.4413L10.9609 16.9081C10.939 16.5142 10.8865 16.1222 10.8047 15.7362C10.7402 15.4243 10.6096 15.1294 10.4219 14.872L10.4121 14.8583L10.4014 14.8456C10.1944 14.5988 9.91683 14.4219 9.60645 14.3368H9.60742C8.87182 14.111 8.30616 14.1173 7.83496 14.2314L7.64062 14.2851C7.2154 14.4188 6.87644 14.6292 6.53711 14.8339L6.25195 15.0058C5.81222 15.2643 5.3385 15.4993 4.74707 15.4696H4.74609C4.15479 15.4408 3.48822 15.1516 2.64551 14.4648C1.8722 13.8346 1.52433 12.9639 1.47949 11.994L1.47461 11.7987C1.4712 10.8892 1.72059 9.89608 2.12988 8.91495L2.31543 8.49503C3.28358 6.40635 4.95016 4.36971 6.5127 3.28995L6.82422 3.08682ZM16.2852 16.3671C15.7695 16.3671 15.2748 16.5719 14.9102 16.9364C14.5455 17.3011 14.3408 17.7967 14.3408 18.3124C14.3409 18.828 14.5456 19.3228 14.9102 19.6874C15.2748 20.052 15.7695 20.2567 16.2852 20.2567C16.8008 20.2567 17.2955 20.052 17.6602 19.6874C18.0248 19.3228 18.2294 18.828 18.2295 18.3124C18.2295 17.7967 18.0249 17.3011 17.6602 16.9364C17.2955 16.5719 16.8008 16.3671 16.2852 16.3671ZM19.1748 13.4784C18.6591 13.4784 18.1645 13.6831 17.7998 14.0478C17.4351 14.4125 17.2295 14.907 17.2295 15.4228C17.2295 15.9385 17.4351 16.4331 17.7998 16.7978C18.1645 17.1623 18.6591 17.3671 19.1748 17.3671C19.6905 17.367 20.1852 17.1624 20.5498 16.7978C20.9144 16.4331 21.1191 15.9384 21.1191 15.4228C21.1191 14.9071 20.9144 14.4124 20.5498 14.0478C20.1852 13.6831 19.6905 13.4785 19.1748 13.4784ZM19.1748 9.14444C18.6591 9.14444 18.1645 9.34915 17.7998 9.71378C17.4351 10.0785 17.2295 10.573 17.2295 11.0888C17.2295 11.6045 17.4351 12.0991 17.7998 12.4638C18.1645 12.8283 18.6591 13.0331 19.1748 13.0331C19.6905 13.033 20.1852 12.8284 20.5498 12.4638C20.9144 12.0991 21.1191 11.6044 21.1191 11.0888C21.1191 10.5731 20.9144 10.0785 20.5498 9.71378C20.1852 9.34915 19.6905 9.14452 19.1748 9.14444ZM16.6465 5.89346C16.1309 5.89346 15.6362 6.09827 15.2715 6.4628C14.9069 6.8274 14.7023 7.32218 14.7021 7.8378C14.7021 8.3535 14.9069 8.84812 15.2715 9.2128C15.6362 9.57749 16.1307 9.78311 16.6465 9.78311C17.1622 9.78307 17.6568 9.57746 18.0215 9.2128C18.386 8.84813 18.5908 8.35343 18.5908 7.8378C18.5907 7.32219 18.3861 6.8274 18.0215 6.4628C17.6568 6.09822 17.1621 5.8935 16.6465 5.89346ZM12.3125 4.44913C11.7968 4.44913 11.3022 4.65384 10.9375 5.01846C10.5728 5.38314 10.3682 5.87773 10.3682 6.39346C10.3682 6.90922 10.5728 7.40377 10.9375 7.76846C11.3022 8.13313 11.7968 8.3378 12.3125 8.3378C12.8282 8.33776 13.3228 8.13312 13.6875 7.76846C14.0521 7.40378 14.2568 6.90917 14.2568 6.39346C14.2568 5.87775 14.0522 5.38314 13.6875 5.01846C13.3228 4.6538 12.8282 4.44917 12.3125 4.44913Z" fill="white" stroke="rgba(255, 255, 255, 0.8)" stroke-width="0.5"/>
                    </svg>
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
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resize-handle {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 28px;
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
