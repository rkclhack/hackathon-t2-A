<script setup>
import { inject, ref, reactive, onMounted, computed } from "vue"
import socketManager from '../socketManager.js'
import Header from './Header.vue'
import MessageCard from './MessageCard.vue'

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
const isSendDisable = computed(() => {
  return chatContent.value.trim() === "";
});
// #endregion

// #region lifecycle
onMounted(() => {
  registerSocketEvent()
  // 入室時にサーバーに通知してデータを同期
  socket.emit("enterEvent", { name: userName.value })
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

// サーバから受信したメッセージ配列を更新する
const onReceivePublish = (data) => {
  messages.splice(0, messages.length, ...data)
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
}
// #endregion
</script>

<template>
  <Header />
  <div class="app-layout">
    <div class="chat-container">
      <div class="message-display">
        <div class="mt-5">
          <div class="messages-list">
            <div v-for="message in messages" :key="message.id"
              :class="message.user.name === userName ? 'message-wrapper mine' : 'message-wrapper theirs'">
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

    <div class="gantt-chart-container">
      <!-- デバッグ用表示 -->
      <div class="debug-panel">
        <h3>Debug Info</h3>
        <div class="debug-section">
          <h4>Users ({{ users.length }})</h4>
          <pre class="debug-json">{{ JSON.stringify(users, null, 2) }}</pre>
        </div>
        <div class="debug-section">
          <h4>Messages ({{ messages.length }})</h4>
          <pre class="debug-json">{{ JSON.stringify(messages, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
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
  border-top: solid 3px;
  border-color: #DDE2E9;
  bottom: 0;
  padding: 16px;
}

.message-textarea {
  border: solid 2px;
  border-radius: 10px;
  border-color: #DDE2E9;
  font-family: 'Instrument Sans';
  font-size: 16px;
  color: #584B73;
  resize: vertical;
  display: flex;
  margin-right: 16px;
  min-height: 50px;
  max-height: 80px;
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

.debug-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  background-color: #f5f5f5;
  font-family: monospace;
}

.debug-panel h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
  border-bottom: 2px solid #ddd;
  padding-bottom: 8px;
}

.debug-section {
  margin-bottom: 24px;
}

.debug-section h4 {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
}

.debug-json {
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>