<script setup>
import { inject, ref, reactive, onMounted, computed } from "vue"
import socketManager from '../socketManager.js'
import Header from './Header.vue'

// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const socket = socketManager.getInstance()
// #endregion

// #region reactive variable
const chatContent = ref("")
const chatList = reactive([])
const isSendDisable = computed(() => {
  return chatContent.value.trim() === "";
});
// #endregion

// #region lifecycle
onMounted(() => {
  registerSocketEvent()
})
// #endregion

// #region browser event handler
// 投稿メッセージをサーバに送信する
const onPublish = () => {
  if (isSendDisable.value) {
    return;
  }
  socket.emit("publishEvent", { name: userName.value, message: chatContent.value })
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
// サーバから受信した入室メッセージ画面上に表示する
const onReceiveEnter = (data) => {
  const message = `${data.name}さんが入室しました。`
  chatList.unshift(message)
}

// サーバから受信した退室メッセージを受け取り画面上に表示する
const onReceiveExit = (data) => {
  const message = `${data.name}さんが退室しました。`
  chatList.unshift(message)
}

// サーバから受信した投稿メッセージを画面上に表示する
const onReceivePublish = (data) => {
  const message = `${data.name}さん:${data.message}`
  chatList.unshift(message)
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
</style>