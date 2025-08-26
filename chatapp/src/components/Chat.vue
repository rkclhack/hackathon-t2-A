<script setup>
import { inject, ref, reactive, onMounted } from "vue"
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
// #endregion

// #region lifecycle
onMounted(() => {
  registerSocketEvent()
})
// #endregion

// #region browser event handler
// 投稿メッセージをサーバに送信する
const onPublish = () => {
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
  <div>
    <Header />
    <div class="mx-auto my-5 px-4">
      <h1 class="text-h3 font-weight-medium">Vue.js Chat チャットルーム</h1>
      <div class="mt-10">
        <p>ログインユーザ：{{ userName }}さん</p>
        <textarea variant="outlined" placeholder="投稿文を入力してください" rows="4" class="area"></textarea>
        <div class="mt-5">
          <button class="button-normal">投稿</button>
          <button class="button-normal util-ml-8px">メモ</button>
        </div>
        <div class="mt-5" v-if="chatList.length !== 0">
          <ul>
            <li class="item mt-4" v-for="(chat, i) in chatList" :key="i">{{ chat }}</li>
          </ul>
        </div>
      </div>
      <router-link to="/" class="link">
        <button type="button" class="button-normal button-exit" @click="onExit">退室する</button>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
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