/**
 * ガントチャート関連の定数定義
 */

// スケジュール関連
export const GANTT_CONFIG = {
  TOTAL_DAYS: 7,                    // ガントチャートの総日数
  MIN_START_DAY: 1,                 // タスクの最小開始日
  MIN_DURATION: 1,                  // タスクの最小期間
  DEFAULT_DURATION: 2,              // 新規タスクのデフォルト期間
  MAX_START_DAY_OFFSET: 1,          // 最大開始日計算用オフセット (TOTAL_DAYS + 1)
}

// UI レイアウト関連
export const GANTT_LAYOUT = {
  TASK_ROW_HEIGHT: 70,              // タスク行の高さ
  TASK_ROW_OFFSET: 24,              // タスク行の上部オフセット
  TASK_BAR_HEIGHT: 48,              // タスクバーの高さ
  TASK_MIN_WIDTH: 140,              // タスクバーの最小幅 (px)
  PERCENT_PER_DAY: 100 / GANTT_CONFIG.TOTAL_DAYS,  // 1日あたりのパーセンテージ
}

// 計算用のヘルパー関数
export const GANTT_HELPERS = {
  /**
   * 開始日の最大値を取得
   * @param {number} duration - タスクの期間
   * @returns {number} 最大開始日
   */
  getMaxStartDay: (duration) => {
    return GANTT_CONFIG.TOTAL_DAYS + GANTT_CONFIG.MAX_START_DAY_OFFSET - duration
  },

  /**
   * タスクの終了日を取得
   * @param {number} startDay - 開始日
   * @param {number} duration - 期間
   * @returns {number} 終了日
   */
  getEndDay: (startDay, duration) => {
    return startDay + duration - 1
  },

  /**
   * タスクがチャート範囲内かチェック
   * @param {number} startDay - 開始日
   * @param {number} duration - 期間
   * @returns {boolean} 範囲内かどうか
   */
  isWithinRange: (startDay, duration) => {
    return GANTT_HELPERS.getEndDay(startDay, duration) <= GANTT_CONFIG.TOTAL_DAYS
  }
}
