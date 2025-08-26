<script setup>
import { inject } from "vue"
import { useRouter } from "vue-router"

const userName = inject("userName")
const router = useRouter()

const logout = () => {
    userName.value = ""
    router.push("/")
}
</script>

<template>
    <header class="header">
        <img src="../images/logo.png" alt="logo" class="logo">
        <p v-if="userName !== ''" class="greeting">こんにちは、{{ userName }}さん</p>
        <button v-if="userName !== ''" @click="logout" class="logout-button">logout</button>
    </header>
</template>

<style scoped>
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 5px;
    background-color: #fefeff;
    border-bottom: 3px solid #dde2e9;
}
.greeting {
    color: #33078a;
    margin: 0;
    flex-grow: 1;
    text-align: left;
    padding-left: 10px;
}
.logo {
    width: 60px;
    height: 60px
}
.logout-button {
    font-size: 20px;
    background-color: #fefeff;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    color: #33078a;
    padding: 10px 15px;
    transition: all 0.3s ease;
}
.logout-button:hover {
    background-color: #33078a;
    color: #fefeff;
}
</style>