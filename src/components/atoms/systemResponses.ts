// 定義各種系統回應文本
export const SYSTEM_RESPONSES = {
  GREETING: {
    text: "您好，想了解什麼資訊嗎？",
    typingSpeed: 60
  },
  INTRODUCTION: {
    text: "您好，此為「對話式功能搜尋」服務。您可以詢問信用卡消費的相關問題，我們將提供對應的分析結果。關於使用規定 (例：無法詢問單一卡別)，請點擊「注意事項」進行查看。",
    typingSpeed: 60
  },
  IDLE_TIMEOUT_ERROR: {
    text: "您的操作已逾時，請重新開啟以繼續使用。",
    typingSpeed: 60
  },
  FRONTEND_ERROR: {
    text: "前端加載失敗，請重新整理頁面。",
    typingSpeed: 60
  }
}; 