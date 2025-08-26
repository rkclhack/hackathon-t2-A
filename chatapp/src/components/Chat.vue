<script setup>
import { inject, ref, reactive, onMounted, computed } from "vue"
import socketManager from '../socketManager.js'
import Header from './Header.vue'
import MessageCard from './MessageCard.vue'
import ColorPalette from './ColorPalette.vue'

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
const selectedColor = ref("#FF6B6B")

// ダミーデータ（UI確認用）
const dummyMessages = [
  {
    id: 1,
    userName: "田中太郎",
    message: "こんにちは！今日は良い天気ですね。",
    sendAt: "14:30",
    color: "#FF6B6B"
  },
  {
    id: 2,
    userName: userName.value || "自分",
    message: "はい、本当に良い天気です！",
    sendAt: "14:31",
    color: "#4ECDC4"
  },
  {
    id: 3,
    userName: "佐藤花子",
    message: "明日も晴れるといいですね。",
    sendAt: "14:32",
    color: "#45B7D1"
  }
]

// ColorPalette用のダミーデータ
const colorOptions = [
  "#C81717", "#FF9A00", "#008E74", "#33078A", "#67078A"
]
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
        <!-- UI確認用のダミーメッセージ -->
        <div class="mt-5">
          <div class="messages-list">
            <div v-for="message in dummyMessages" :key="message.id"
              :class="message.userName === (userName || '自分') ? 'message-wrapper mine' : 'message-wrapper theirs'">
              <MessageCard :message="message" :mine="message.userName === (userName || '自分')" />
            </div>
          </div>
        </div>

        <!-- 実際のチャットメッセージ（現在は非表示） -->
        <div class="mt-5" v-if="chatList.length !== 0" style="display: none;">
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
      <ColorPalette 
        :colors="colorOptions" 
        v-model="selectedColor"
        size="md"
        :allow-clear="true"
        label="Choose your color"
      />
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

.color-palette-demo {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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