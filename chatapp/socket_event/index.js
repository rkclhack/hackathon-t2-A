/** @type {User[]} */
const users = [];
/** @type {Message[]} */
const messages = [];
/** @type {Task[]} */
let tasks = [];

const colors = [
  "#C81717",
  "#FF9A00",
  "#008E74",
  "#33078A",
  "#67078A"
];

export default (io, socket) => {
  // 入室メッセージをクライアントに送信する
  socket.on("enterEvent", (data) => {
    // 同じ名前の人が入室したらUsersから検索して返す
    /** @type {User} */
    let enterUser = users.find(user=>user.getName()===data.name);
    if(typeof enterUser === "undefined"){
      enterUser = new User(data.name)
      users.push(enterUser)
    }
    socket.broadcast.emit("enterEvent", users)
  })

  // 退室メッセージをクライアントに送信する
  socket.on("exitEvent", (data) => {
    socket.broadcast.emit("exitEvent", data)
  })

  // 投稿メッセージを送信する
  socket.on("publishEvent", (data) => {
    userId = userNameToId(data.name)
    messages.push(new Message(data.message, userId, data.sendAt))
    io.sockets.emit("publishEvent", messages)
  })

  // タスクを登録
  socket.on("registerTask", (data) => {
    const task = new Task(data);
    tasks.push(task);
    io.sockets.emit("registerTask", tasks);
  })

  // タスクを削除
  // in: messageId
  socket.on("deleteTask", (data) => {
    tasks = tasks.filter(task=>task.getId()===data.messageId);
    io.sockets.emit("deleteTask", tasks)
  })

  // タスク内容を変更
  socket.on("updateTask", (data) => {
    const targetTask = tasks.filter(task=>task.getId()===data.messageId)[0];
    targetTask.update(data);
    io.sockets.emit("changeAsignee", tasks);
  })
}

/**
 * 
 * @param {string} name 
 * @returns {string}
 */
function userNameToId(name){
  users.find(user => user.getName() === name);
  return user.getId();
}

// 1スタートに統一
let nowColor = 1;
let nowUserId = 1;

class User {
  /** @type {number} ユーザーID */
  #id;
  /** @type {string} ユーザー名 */
  #name;
  /** @type {number} カラーID */
  #colorId;

  /**
   * @param {number} id - ユーザーID
   * @param {string} name - ユーザー名
   * @param {number} colorId - カラーID
   */
  constructor(name) {
    this.#id = nowUserId++;
    this.#name = name;
    this.#colorId = nowColor++;
  }

  /** JSON化用 */
  toJSON() {
    return {
      id: this.#id,
      name: this.#name,
      colorId: this.#colorId
    };
  }
  /**
   * @returns {string}
   */
  getName(){
    return this.#name;
  }
  /**
   * @returns {string}
   */
  getId(){
    return this.#id;
  }
}

// 1スタートに統一
let nowMessageId = 1;

class Message {
  /** @type {number} 一意なID */
  #id;
  /** @type {string} メッセージ本文 */
  #message;
  /** @type {User} ユーザー */
  #user;
  /** @type {string} 送信時刻 Vue.js側で設定 */
  #sendAt;

  constructor(message, userId, sendAt) {
    this.#id = nowMessageId++;
    this.#message = message;
    
    this.#user = userId;
    this.#sendAt = sendAt;
  }

  /** JSONにシリアライズできる形にする */
  toJSON() {
    return {
      id: this.#id,
      message: this.#message,
      user: this.#user,
      sendAt: this.#sendAt
    };
  }
}

class Task {
  /** @type {number} 元のメッセージID */
  #messageId;
  /** @type {string} 担当者 */
  #assigneeId;
  /** @type {string} 開始日 */
  #startDate;
  /** @type {number} 期間 */
  #duration;
  /** @type {boolean} 完了フラグ */
  #isDone;

  constructor(obj) {
    this.#messageId = obj.messageId;
    this.#assigneeId = obj.assigneeId;
    this.#startDate = obj.startDate;
    this.#duration = obj.duration;
    this.#isDone = false;
  }

  toJSON() {
    return {
      messageId: this.#messageId,
      assigneeId: this.#assigneeId,
      startDate: this.#startDate,
      duration: this.#duration,
      isDone: this.#isDone
    };
  }
  update(data){
    this.#messageId = data.messageId
    this.#assigneeId = data.assigneeId
    this.#startDate = data.startDate
    this.#duration = data.duration
    this.#isDone = data.isDone
  }
  /**
   * @returns {string}
   */
  getId(){
    return this.#messageId;
  }
}

