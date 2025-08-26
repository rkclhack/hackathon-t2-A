const messageList = [];
const taskList = [];


export default (io, socket) => {
  // 入室メッセージをクライアントに送信する
  socket.on("enterEvent", (data) => {
    socket.broadcast.emit("enterEvent", data)
  })

  // 退室メッセージをクライアントに送信する
  socket.on("exitEvent", (data) => {
    socket.broadcast.emit("exitEvent", data)
  })

  // 投稿メッセージを送信する
  socket.on("publishEvent", (data) => {
    io.sockets.emit("publishEvent", data)
  })

  // タスクを登録
  socket.on("registTask", (data) => {
    io.sockets.emit("registTask", data)
  })

  // タスクを削除
  socket.on("deleteTask", (data) => {
    io.sockets.emit("deleteTask", data)
  })

  // タスク担当を変更
  socket.on("changeAsignee", (data) => {
    io.sockets.emit("changeAsignee", data)
  })

  // タスク期限を変更
  socket.on("changeDuration", (data) => {
    io.sockets.emit("changeDuration", data)
  })

  // タスク開始日を変更
  socket.on("changeStartDate", (data) => {
    io.sockets.emit("changeDuration", data)
  })

  // タスク担当を完了
  socket.on("completeTask", (data) => {
    io.sockets.emit("completeTask", data)
    JSON.stringify
  })
}

class TaskItem{
  /** @type {string} タスク名 */
  #content;
  /** @type {} 開始日 */
  #startDate;
  /** @type {number} 期間 */
  #duration;
  /** @type {string} 担当者 */
  #asignee;
  /** @type {bool}  */ // statusにして{ "todo" | "inProgress" | "done" }みたいなのもあり
  #isDone
  /** @type {number} */
}
