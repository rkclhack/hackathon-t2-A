<script setup>
import { inject, ref } from "vue"
import { useRouter } from "vue-router"
import socketManager from '../socketManager.js'
import Header from './Header.vue'

// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const router = useRouter()
const socket = socketManager.getInstance()
// #endregion

// #region reactive variable
const inputUserName = ref("")
// #endregion

// #region browser event handler
// 入室メッセージをクライアントに送信する
const onEnter = () => {
  // ユーザー名が入力されているかチェック
  if (inputUserName.value === "") {
    alert("ユーザー名を入力してください")
    return
  } 

  // 入室メッセージを送信
  socket.emit("enterEvent", { name: inputUserName.value })

  // 全体で使用するnameに入力されたユーザー名を格納
  userName.value = inputUserName.value

  // チャット画面へ遷移
  router.push({ name: "chat" })
}
// #endregion
</script>

<template>
  <Header />
  <img src="../images/chat-screen.png" class="chat-screen"></img>
  <div class="container">
    <div>
    <h1 class="title">アプリ名</h1>
    <p class="subtitle">チャットとタスクが同時にできる開発の必需品</p>
    <div class="">
    </div>
      <p class="">すぐに始めよう</p>
      <input type="text" v-model="inputUserName" class="user-name-text" placeholder="enter your name"/>
    </div>
    <button type="button" @click="onEnter" class="send_alt_button">login</button>
  </div>
</template>

<style scoped>

p{
  margin-bottom: 10px;
}

.chat-screen{
  position: fixed;     
  top: 0;
  left: 0;
  width: 100vw;        
  height: 100vh;        
  object-fit: cover;   
  opacity: 0.4;         
  z-index: -1;          
  user-select: none;
  pointer-events: none;
}

.container{
  align-items: center;
  text-align: center;
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family:Arial, Helvetica, sans-serif
}

.title{
  font-size: 80px;
  margin-bottom: 10px;
}
.subtitle{
  font-size: 20px;
  margin-bottom: 50px;
}

.user-name-text {
  display: block;
  margin: 0 auto;
  width: 400px;
  height: 30px;
  border: 1px solid #888;
  border-radius: 10px;
  margin-bottom: 16px;
  padding-left: 12px;
  font-size: 16px;
  text-align: center;
}
.user-name-text:focus{
  outline: 1px solid #33078A;
}
.send_alt_button{
  display: block;
  margin: 0 auto;
  width: 70px;
  height: 40px;
  color:#33078A;
  background-color: white;
  border: 1px solid #33078A;
  border-radius: 10px;
  font-size: 20px;
  transition: all 0.3s ease;
  
}
.send_alt_button:hover{
  background-color: #33078A;
  color: white;
}

</style>
