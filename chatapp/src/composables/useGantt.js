import { ref, unref } from 'vue'
import { GANTT_CONFIG, GANTT_HELPERS } from '../constants/gantt.js'

/**
 * ガントチャート機能を管理するコンポーザブル
 * @param {Ref} tasks - タスクリストのリアクティブ参照
 * @param {Function} onTaskUpdate - タスク更新時のコールバック関数
 * @returns {Object} ガントチャート操作用の関数と状態
 */
export function useGantt(tasks, onTaskUpdate) {
  // ガントチャート固有の機能のみを管理
  // tasksは外部から渡されるリアクティブ参照

  
  // リサイズ機能の状態管理
  const resizingTask = ref(null)      // 現在リサイズ中のタスク
  const resizeStartX = ref(0)         // リサイズ開始時のマウスX座標
  const resizeStartWidth = ref(0)     // リサイズ開始時のタスク幅
  
  // ドラッグ機能の状態管理
  const draggingTask = ref(null)      // 現在ドラッグ中のタスク
  const dragStartX = ref(0)           // ドラッグ開始時のマウスX座標
  const dragStartDate = ref(0)        // ドラッグ開始時のタスク開始日
  
  // ガントチャートコンテナの参照
  const chartContainer = ref(null)

  /**
   * 指定されたIDのタスクを削除（削除ロジックは外部で処理）
   * @param {number} taskId - 削除するタスクのメッセージID
   */
  const deleteTask = (taskId) => {
    // リアクティブな参照から現在の値を取得
    const tasksList = unref(tasks)
    const taskToDelete = tasksList.find(task => task.messageId === taskId)
    if (!taskToDelete) {
      return
    }

    if (onTaskUpdate) {
      onTaskUpdate(taskToDelete, 'delete')
    }
    
    return taskToDelete
  }

  /**
   * タスクの色を変更
   * @param {number} taskId - 変更するタスクのメッセージID
   * @param {string} color - 新しい色
   */
  const changeTaskColor = (taskId, color) => {
    // リアクティブな参照から現在の値を取得
    const tasksList = unref(tasks)
    const task = tasksList.find(t => t.messageId === taskId)
    if (!task) {
      return
    }

    // ローカル状態は変更せず、サーバーに通知のみ
    if (onTaskUpdate) {
      // 一時的に色を変更したタスクオブジェクトを作成
      const updatedTask = { 
        ...task, 
        assignee: { ...task.assignee, color: color } 
      }
      onTaskUpdate(updatedTask, 'color')
    }
  }

  /**
   * タスクの完了状態を切り替え
   * @param {number} taskId - 切り替えるタスクのメッセージID
   */
  const toggleTaskComplete = (taskId) => {
    // リアクティブな参照から現在の値を取得
    const tasksList = unref(tasks)
    const task = tasksList.find(t => t.messageId === taskId)
    if (!task) {
      return
    }

    // ローカル状態は変更せず、サーバーに通知のみ
    if (onTaskUpdate) {
      // 一時的に完了状態を変更したタスクオブジェクトを作成
      const updatedTask = { ...task, isDone: !task.isDone }
      onTaskUpdate(updatedTask, 'completed')
    }
  }

  /**
   * タスクの期間変更を開始
   * @param {Object} task - 期間変更するタスクオブジェクト
   * @param {MouseEvent} event - マウスイベント
   */
  const startTaskResize = (task, event) => {
    event.preventDefault()
    event.stopPropagation()
    resizingTask.value = task
    resizeStartX.value = event.clientX
    resizeStartWidth.value = task.duration
    document.addEventListener('mousemove', handleTaskResize)
    document.addEventListener('mouseup', stopTaskResize)
  }

  /**
   * タスクの期間変更処理
   * @param {MouseEvent} event - マウスイベント
   */
  const handleTaskResize = (event) => {
    if (resizingTask.value && chartContainer.value) {
      // 1. マウス移動量を計算
      const deltaX = event.clientX - resizeStartX.value
      
      // 2. 1日あたりの幅を計算
      const containerWidth = chartContainer.value.offsetWidth - 50 // チェックボックス分を除く
      const dayWidth = containerWidth / GANTT_CONFIG.TOTAL_DAYS
      
      // 3. 移動量を日数に変換（スナップ機能のため）
      const deltaDays = Math.round(deltaX / dayWidth)
      
      // 4. 新しい期間を計算（最小期間-最大日数の範囲内）
      const newDuration = Math.max(
        GANTT_CONFIG.MIN_DURATION, 
        Math.min(GANTT_CONFIG.TOTAL_DAYS, resizeStartWidth.value + deltaDays)
      )
      
      // 5. タスクの終了日がチャート範囲を超えないかチェック
      if (GANTT_HELPERS.isWithinRange(resizingTask.value.startDate, newDuration)) {
        resizingTask.value.duration = newDuration
      }
    }
  }

  /**
   * タスクの期間変更を終了
   */
  const stopTaskResize = () => {
    if (!resizingTask.value) return

    // 期間が変更された場合のみサーバーに送信
    if (resizingTask.value.duration !== resizeStartWidth.value) {
      if (onTaskUpdate) {
        onTaskUpdate(resizingTask.value, 'duration')
      }
    }

    resizingTask.value = null
    document.removeEventListener('mousemove', handleTaskResize)
    document.removeEventListener('mouseup', stopTaskResize)
  }

  /**
   * ドラッグを無効にする要素かチェック
   * @param {Element} target - チェック対象の要素
   * @returns {boolean} ドラッグを無効にするかどうか
   */
  const shouldPreventDrag = (target) => {
    const preventDragSelectors = [
      '.resize-handle',
      '.task-checkbox', 
      '.delete-button',
    ]
    
    return target.tagName === 'BUTTON' || 
           preventDragSelectors.some(selector => target.closest(selector))
  }

  /**
   * タスクの開始日変更を開始
   * @param {Object} task - 開始日変更するタスクオブジェクト
   * @param {MouseEvent} event - マウスイベント
   */
  const startTaskDrag = (task, event) => {
    if (shouldPreventDrag(event.target)) return
    
    draggingTask.value = task
    dragStartX.value = event.clientX
    dragStartDate.value = task.startDate
    
    document.addEventListener('mousemove', handleTaskDrag)
    document.addEventListener('mouseup', stopTaskDrag)
    event.preventDefault()
  }

  /**
   * タスクの開始日変更処理
   * @param {MouseEvent} event - マウスイベント
   */
  const handleTaskDrag = (event) => {
    if (draggingTask.value && chartContainer.value) {
      // 1. マウス移動量を計算
      const deltaX = event.clientX - dragStartX.value
      
      // 2. 1日あたりの幅を計算（期間変更と同じロジック）
      const containerWidth = chartContainer.value.offsetWidth - 50
      const dayWidth = containerWidth / GANTT_CONFIG.TOTAL_DAYS
      
      // 3. 移動量を日数に変換（スナップ機能のため）
      const deltaDays = Math.round(deltaX / dayWidth)
      
      // 4. 新しい開始日を計算
      const newStartDay = Math.max(
        GANTT_CONFIG.MIN_START_DAY, 
        Math.min(
          GANTT_HELPERS.getMaxStartDay(draggingTask.value.duration), 
          dragStartDate.value + deltaDays
        )
      )
      
      draggingTask.value.startDate = newStartDay
    }
  }

  /**
   * タスクの開始日変更を終了
   */
  const stopTaskDrag = () => {
    if (!draggingTask.value) return

    // 開始日が変更された場合のみサーバーに送信
    if (draggingTask.value.startDate !== dragStartDate.value) {
      if (onTaskUpdate) {
        onTaskUpdate(draggingTask.value, 'position')
      }
    }

    draggingTask.value = null
    document.removeEventListener('mousemove', handleTaskDrag)
    document.removeEventListener('mouseup', stopTaskDrag)
  }

  const cleanup = () => {
    document.removeEventListener('mousemove', handleTaskResize)
    document.removeEventListener('mouseup', stopTaskResize)
    document.removeEventListener('mousemove', handleTaskDrag)
    document.removeEventListener('mouseup', stopTaskDrag)
  }

  return {
    chartContainer,
    deleteTask,
    changeTaskColor,
    toggleTaskComplete,
    startTaskResize,
    startTaskDrag,
    cleanup
  }
}
