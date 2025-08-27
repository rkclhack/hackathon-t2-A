<script setup>
  //プロップスの確認
  const props = defineProps({
    message: {
      type: Object,
      required: true
    },
    mine: {
      type: Boolean,
      default: false
    }
  })
  
  // ユーザーごとのストリップ色
  const stripColor = props.message.color || "#FF9A00"

  // ドラッグ開始時の処理
  const handleDragStart = (event) => {
    event.dataTransfer.setData('text/plain', JSON.stringify(props.message))
    event.dataTransfer.effectAllowed = 'copy'
  }
  </script>

<template>
    <article
      class="sticky-msg"
      :class="mine ? 'mine' : 'theirs'"
      draggable="true"
      @dragstart="handleDragStart"
    >
      <div class="strip" :style="{ backgroundColor: stripColor }"></div>
  
      <div class="body">
        <header class="row">
          <strong class="author">{{ message.userName }}</strong>
          <time class="time">{{ message.sendAt }}</time>
        </header>
        <p class="content">{{ message.message }}</p>
      </div>
  
      <div class="shadow"></div>
    </article>
  </template>
  
  <style scoped>  
  /* ===== ベース ===== */
.sticky-msg {
  position: relative;
  display: flex;
  align-items: stretch;
  min-height: 60px;
  background: #F9F6E8; 
  border-radius: 4px;
  margin: 10px 0;
  cursor: grab;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.sticky-msg:active {
  cursor: grabbing;
}

.sticky-msg:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
/* ===== ストリップ部分 ===== */
.strip {
  width: 18px;
  flex-shrink: 0;
}
.theirs .strip { order: 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px; }
.mine   .strip { order: 2; border-top-right-radius: 4px; border-bottom-right-radius: 4px; }

/* ===== 影のカスタマイズ（hover時のみ） ===== */
/* 相手（左側に糊）→ 右側3分の1に影 */
  .theirs:hover::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 33.33%; /* 右側3分の1 */
    height: 100%;
    background: rgba(0,0,0,0.20);
    filter: blur(10px);
    z-index: -1;
    transform: translateX(8px) translateY(10px);
    border-radius: 4px;
    transition: transform 1.0s ease;
  }

  /* 自分（右側に糊）→ 左側3分の1に影 */
  .mine:hover::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 33.33%; /* 左側3分の1 */
    height: 100%;
    background: rgba(0,0,0,0.20);
    filter: blur(10px);
    z-index: -1;
    transform: translateX(-8px) translateY(10px);
    border-radius: 4px;
    transition: transform 1.0s ease;
  }

  .body{
    flex: 1;
    padding: 12px 16px;
    color: #33078A;
  }
  .row{ display:flex; align-items:baseline; gap:10px; }
  .author{ font-weight: 700; }
  .time{ font-size: 11px; color:#DDE2E9; }
  .content{ margin-top: 6px; line-height:1.55; color:#584B73; }
  
  /* 影 */
  .shadow{
    position:absolute; left:5%; right:5%; bottom:-10px; height:20px;
    background: radial-gradient(ellipse at center,
      rgba(0,0,0,0.25) 0%,
      rgba(0,0,0,0.15) 40%,
      rgba(0,0,0,0) 80%);
    filter: blur(6px);
    z-index: -1;
  }
</style>