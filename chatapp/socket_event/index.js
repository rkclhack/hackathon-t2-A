/** @type {User[]} */
const users = [];
/** @type {Message[]} */
const messages = [];
/** @type {Task[]} */
let tasks = [];

const colorPalette = [
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
    console.log(JSON.stringify(users));
    
    // 入室したユーザーに既存のデータを送信
    socket.emit("enterEvent", users)
    socket.emit("publishEvent", messages)
    socket.emit("registerTask", tasks)
    
    // 他のユーザーにユーザー情報を送信
    socket.broadcast.emit("enterEvent", users)
  })

  // 退室メッセージをクライアントに送信する
  socket.on("exitEvent", (data) => {
    socket.broadcast.emit("exitEvent", data)
  })

  // 投稿メッセージを送信する
  socket.on("publishEvent", (data) => {
    const sendUser = userNameToObject(data.name)
    messages.push(new Message(data.message, sendUser, data.sendAt))
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
    tasks = tasks.filter(task=>task.getId()!=data.messageId);
    io.sockets.emit("deleteTask", tasks)
  })

  // タスク内容を変更
  socket.on("updateTask", (data) => {
    const targetTask = tasks.find(task=>task.getId()==data.messageId);
    if (targetTask) {
      targetTask.update(data);
      io.sockets.emit("updateTask", tasks);
    }
  })
}

/**
 * 
 * @param {string} name 
 * @returns {User}
 */
function userNameToObject(name){
  const targetUser = users.find(user => user.getName() === name);
  return targetUser;
}

let nowColor = 0;
let nowUserId = 1;

class User {
  /** @type {number} ユーザーID */
  #id;
  /** @type {string} ユーザー名 */
  #name;
  /** @type {number} カラーID */
  #color;

  /**
   * @param {string} name
   */
  constructor(name) {
    this.#id = nowUserId++;
    this.#name = name;
    this.#color = colorPalette[(nowColor++)%5];
  }

  /** JSON化用 */
  toJSON() {
    return {
      id: this.#id,
      name: this.#name,
      color: this.#color
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

  constructor(message, user, sendAt) {
    this.#id = nowMessageId++;
    this.#message = message;
    this.#user = user;
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
  /** @type {User} 担当者 */
  #assignee;
  /** @type {number} 開始日 (1=Day 1, 2=Day 2, ..., 7=Day 7) */
  #startDate;
  /** @type {number} 期間 */
  #duration;
  /** @type {boolean} 完了フラグ */
  #isDone;

  constructor(obj) {
    this.#messageId = obj.messageId;
    const assignUser = users.find(user=>user.getId()==obj.assignId);
    this.#assignee = assignUser;
    this.#startDate = obj.startDate;
    this.#duration = obj.duration;
    this.#isDone = false;
  }

  toJSON() {
    return {
      messageId: this.#messageId,
      assignee: this.#assignee,
      startDate: this.#startDate,
      duration: this.#duration,
      isDone: this.#isDone
    };
  }
  update(obj){
    this.#messageId = obj.messageId
    const assignUser = users.find(user=>user.getId()==obj.assignId);
    if (assignUser) {
      this.#assignee = assignUser;
    }
    this.#startDate = obj.startDate
    this.#duration = obj.duration
    this.#isDone = obj.isDone
  }
  /**
   * @returns {string}
   */
  getId(){
    return this.#messageId;
  }
}

