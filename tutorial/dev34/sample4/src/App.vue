<script setup>
const handleClick = () => {
  alert("ボタンがクリックされました")
}
const handleMouseOevr = ()=>{
  alert("ボタンがマウスオーバーされました")
}
</script>

<template>
  <h1>Sample4</h1>
  <button @click="handleClick">click</button>
  <button @mouseover="handleMouseOevr">MouseOver</button>
</template>


