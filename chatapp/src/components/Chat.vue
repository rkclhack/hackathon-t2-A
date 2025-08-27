<script setup>
import { inject, ref, reactive, onMounted, computed } from "vue"
import socketManager from '../socketManager.js'
import Header from './Header.vue'
import MessageCard from './MessageCard.vue'
import ColorPalette from './ColorPalette.vue'
import GanttChart from './GanttChart.vue'
import { GANTT_CONFIG } from '../constants/gantt.js'

// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const socket = socketManager.getInstance()
// #endregion

// #region reactive variable
const chatContent = ref("")
const chatList = reactive([])
const users = reactive([])
const messages = reactive([])
const tasks = reactive([])
const isDragging = ref(false)
const draggedMessage = ref(null)
const isDebugVisible = ref(true)
const messageDisplayRef = ref(null)
const isSendDisable = computed(() => {
  return chatContent.value.trim() === "";
});
// #endregion

// #region lifecycle
onMounted(() => {
  registerSocketEvent()
  // 入室時にサーバーに通知してデータを同期
  socket.emit("enterEvent", { name: userName.value })
  // 初期表示時に一番下にスクロール
  scrollToBottom()
})
// #endregion

// #region browser event handler
// 投稿メッセージをサーバに送信する
const onPublish = () => {
  if (isSendDisable.value) {
    return;
  }
  const now = new Date()
  const sendAt = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
  socket.emit("publishEvent", { 
    name: userName.value, 
    message: chatContent.value, 
    sendAt: sendAt 
  })
  // 入力欄を初期化
  chatContent.value = ""
  // 送信後に自動スクロール
  scrollToBottom()
}

// 退室メッセージをサーバに送信する
const onExit = () => {
  socket.emit("exitEvent", { name: userName.value })
}

// メモを画面上に表示する
const onMemo = () => {
  // メモの内容を表示
  const message = `${userName.value}さんのメモ: ${chatContent.value}`
  chatList.unshift(message)
  // 入力欄を初期化
  chatContent.value = ""
}

// ドラッグ開始
const onDragStart = (message) => {
  isDragging.value = true
  draggedMessage.value = message
}

// ドラッグ終了
const onDragEnd = () => {
  isDragging.value = false
  draggedMessage.value = null
}

// ドロップ処理
const onDrop = (event) => {
  event.preventDefault()
  if (draggedMessage.value) {
    // registerTaskイベントを発火
    socket.emit("registerTask", {
      messageId: draggedMessage.value.id,
      assignId: draggedMessage.value.user.id,
      startDate: GANTT_CONFIG.MIN_START_DAY, // Day 1から開始
      duration: GANTT_CONFIG.DEFAULT_DURATION // デフォルト期間
    })
  }
  isDragging.value = false
  draggedMessage.value = null
}
// #endregion

// #region socket event handler
// サーバから受信したユーザー情報を更新する
const onReceiveEnter = (data) => {
  users.splice(0, users.length, ...data)
}

// サーバから受信した退室メッセージを受け取り画面上に表示する
const onReceiveExit = (data) => {
  const message = `${data.name}さんが退室しました。`
  chatList.unshift(message)
}

// メッセージリストを一番下にスクロールする
const scrollToBottom = () => {
  if (messageDisplayRef.value) {
    setTimeout(() => {
      messageDisplayRef.value.scrollTop = messageDisplayRef.value.scrollHeight
    }, 100)
  }
}

// サーバから受信したメッセージ配列を更新する
const onReceivePublish = (data) => {
  messages.splice(0, messages.length, ...data)
  scrollToBottom()
}

// サーバから受信したタスク配列を更新する
const onReceiveRegisterTask = (data) => {
  tasks.splice(0, tasks.length, ...data)
}

// サーバから受信したタスク削除を処理する
const onReceiveDeleteTask = (data) => {
  tasks.splice(0, tasks.length, ...data)
}

// サーバから受信したタスク更新を処理する
const onReceiveUpdateTask = (data) => {
  tasks.splice(0, tasks.length, ...data)
}
// #endregion

// #region local methods
// イベント登録をまとめる
const registerSocketEvent = () => {
  // 入室イベントを受け取ったら実行
  socket.on("enterEvent", (data) => {
    onReceiveEnter(data)
  })

  // 退室イベントを受け取ったら実行
  socket.on("exitEvent", (data) => {
    onReceiveExit(data)
  })

  // 投稿イベントを受け取ったら実行
  socket.on("publishEvent", (data) => {
    onReceivePublish(data)
  })

  // タスク登録イベントを受け取ったら実行
  socket.on("registerTask", (data) => {
    onReceiveRegisterTask(data)
  })

  // タスク削除イベントを受け取ったら実行
  socket.on("deleteTask", (data) => {
    onReceiveDeleteTask(data)
  })

  // タスク更新イベントを受け取ったら実行
  socket.on("updateTask", (data) => {
    onReceiveUpdateTask(data)
  })
}

// メッセージがタスクに登録済みかチェック
const isMessageInTasks = (messageId) => {
  return tasks.some(task => task.messageId === messageId)
}

// tasksとmessagesを結合した計算プロパティ
const ganttTasks = computed(() => {
  return tasks.map(task => {
    const message = messages.find(msg => msg.id === task.messageId)
    return {
      id: task.messageId,
      messageId: task.messageId,
      message: message ? message.message : 'Unknown message',
      assignee: task.assignee,
      startDate: task.startDate,
      duration: task.duration,
      isDone: task.isDone
    }
  })
})

// ガントチャートでのタスク更新処理
const handleTaskUpdate = (taskData, action) => {
  
  switch (action) {
    case 'delete':

      socket.emit("deleteTask", { messageId: taskData.messageId })
      break
    case 'position':
    case 'duration':
    case 'completed':

      socket.emit("updateTask", {
        messageId: taskData.messageId,
        assignId: taskData.assignee.id,
        startDate: taskData.startDate,
        duration: taskData.duration,
        isDone: taskData.isDone
      })
      break
    case 'color':
      // 色に対応するユーザーIDを見つける
      const userWithColor = users.find(user => user.color === taskData.assignee.color)

      if (userWithColor) {

        socket.emit("updateTask", {
          messageId: taskData.messageId,
          assignId: userWithColor.id,
          startDate: taskData.startDate,
          duration: taskData.duration,
          isDone: taskData.isDone
        })
      }
      break
  }
}
// #endregion
</script>

<template>
  <Header />
  <div class="app-layout">
    <div class="chat-container">
      <div class="message-display" ref="messageDisplayRef">
        <div class="mt-5">
          <div class="messages-list">
            <div v-for="message in messages" :key="message.id"
              :class="message.user.name === userName ? 'message-wrapper mine' : 'message-wrapper theirs'">
              <div 
                :draggable="!isMessageInTasks(message.id)"
                :class="{ 'task-registered': isMessageInTasks(message.id) }"
                @dragstart="onDragStart(message)"
                @dragend="onDragEnd"
              >
                <MessageCard 
                  :message="{
                    id: message.id,
                    userName: message.user.name,
                    message: message.message,
                    sendAt: message.sendAt,
                    color: message.user.color
                  }" 
                  :mine="message.user.name === userName" 
                />
              </div>
            </div>
          </div>
        </div>

        <!-- システムメッセージ（入退室など） -->
        <div class="mt-5" v-if="chatList.length !== 0">
          <ul>
            <li class="item mt-4" v-for="(chat, i) in chatList" :key="i">{{ chat }}</li>
          </ul>
        </div>
      </div>
      <div class="message-input">
        <textarea v-model="chatContent" placeholder="Type a message" class="message-textarea">
        </textarea>
        <img src="../images/sendIcon.svg" class="send-icon" :class="{ 'disable': isSendDisable }" @click="onPublish">
        </img>
      </div>
    </div>

    <div class="gantt-chart-container"
         @dragover.prevent
         @drop="onDrop">
      <!-- ドロップゾーン表示 -->
      <div v-if="isDragging && tasks.length >= 1" class="drop-zone">
        <p>メッセージをドラッグ&ドロップしてここに追加</p>
      </div>
      
      <!-- ガントチャート -->
      <GanttChart 
        :tasks="ganttTasks"
        :users="users"
        :on-task-update="handleTaskUpdate"
      />
      
      <!-- デバッグ情報 -->
      
    </div>
  </div>

  <!-- フローティングデバッグパネル -->
  <div v-if="isDebugVisible" class="debug-floating-panel">
    <div class="debug-header">
      <h3>Debug Info</h3>
      <button @click="isDebugVisible = false" class="debug-close-btn">×</button>
    </div>
    <div class="debug-content">
      <div class="debug-section">
        <h4>Users ({{ users.length }})</h4>
        <pre class="debug-json">{{ JSON.stringify(users, null, 2) }}</pre>
      </div>
      <div class="debug-section">
        <h4>Messages ({{ messages.length }})</h4>
        <pre class="debug-json">{{ JSON.stringify(messages, null, 2) }}</pre>
      </div>
      <div class="debug-section">
        <h4>Tasks ({{ tasks.length }})</h4>
        <pre class="debug-json">{{ JSON.stringify(tasks, null, 2) }}</pre>
      </div>
    </div>
  </div>

  <!-- デバッグパネル再表示ボタン -->
  <button v-if="!isDebugVisible" @click="isDebugVisible = true" class="debug-toggle-btn">
    Debug
  </button>
</template>

<style scoped>
.app-layout {
  display: flex;
  font-family: 'Instrument Sans';
  height: 83vh;
}

.chat-container {
  flex: 1;
  flex-direction: column;
  display: flex;
  height: 83vh;
}

.message-display {
  flex: 1;
  height: 65vh;
  overflow-y: auto;
  padding: 0 16px;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.message-wrapper {
  display: flex;
  width: 100%;
}

.message-wrapper.theirs {
  justify-content: flex-start;
}

.message-wrapper.mine {
  justify-content: flex-end;
}

.message-input {
  display: flex;
  align-items: center;
  border-top: solid 3px;
  border-color: #DDE2E9;
  bottom: 0;
  padding: 4px;
}

.message-textarea {
  border: solid 2px;
  border-radius: 10px;
  border-color: #DDE2E9;
  font-family: 'Instrument Sans';
  font-size: 20px;
  color: #584B73;
  resize: vertical;
  display: flex;
  margin-right: 12px;
  min-height: 40px;
  max-height: 50px;
  overflow-y: auto;
  field-sizing: content;
  width: 80%;
}

.message-textarea::placeholder {
  font-size: 24px;
  color: #DDE2E9;
  
}

.message-textarea:focus {
  outline-color: #584B73;
}

.send-icon {
  cursor: pointer;
  flex: 1;
  transform: scale(0.8);
}

.send-icon:hover {
  content: url('../images/sendIconHover.svg');
  transform: scale(0.8);
}

.send-icon.disable {
  cursor: default;
  content: url('../images/sendIconDisable.svg');
  transform: scale(0.8);
}

.gantt-chart-container {
  border-left: solid 2px;
  border-color: #DDE2E9;
  height: 83vh;
  flex: 1.5;
  position: relative;
  overflow-x: auto;
}

.link {
  text-decoration: none;
}

.area {
  width: 500px;
  border: 1px solid #000;
  margin-top: 8px;
}

.item {
  display: block;
}

.util-ml-8px {
  margin-left: 8px;
}

.button-exit {
  color: white;
  margin-top: 8px;
}

.debug-floating-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  max-height: 500px;
  background-color: rgba(245, 245, 245, 0.95);
  border: 2px solid #ddd;
  border-radius: 8px;
  font-family: monospace;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: rgba(51, 7, 138, 0.1);
  border-bottom: 1px solid #ddd;
  border-radius: 6px 6px 0 0;
}

.debug-header h3 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.debug-close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.debug-close-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.debug-content {
  padding: 16px;
  max-height: 420px;
  overflow-y: auto;
}

.debug-section {
  margin-bottom: 20px;
}

.debug-section h4 {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 13px;
}

.debug-json {
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  font-size: 11px;
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.debug-toggle-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #33078A;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transition: background-color 0.2s;
}

.debug-toggle-btn:hover {
  background-color: #4a1a9e;
}

.task-registered {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}

.drop-zone {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(51, 7, 138, 0.1);
  border: 2px dashed #33078A;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.drop-zone p {
  font-size: 18px;
  color: #33078A;
  font-weight: bold;
  margin: 0;
}
</style>