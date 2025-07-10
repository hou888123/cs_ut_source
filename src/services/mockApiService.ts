// 定義 API 回應類型
export interface ChatResponse {
  code: string;
  message: string;
  data?: any;
  consumptionModule?: {
    type: string;
    data: any;
    systemResponse: string;
  };
}

// 定義錯誤代碼常量
export const API_ERROR_CODES = {
  SYSTEM_ERROR: '001',
  BUSINESS_KEYWORD_ERROR: '002',
  SENSITIVE_DATA_ERROR: '003',
  KEYWORD_ERROR: '004',
  TOPIC_CONTENT_ERROR: '005',
  TOKEN_LIMIT_ERROR: '006',
  IDLE_TIMEOUT_ERROR: '007',
  STORE_LIMIT_ERROR: '008',
  MULTIPLE_CATEGORIES_ERROR: '009',
  LOW_SIMILARITY_ERROR: '010',
  SUCCESS: '200'
};

// 定義消費總覽模組類型
export const CONSUMPTION_MODULE_TYPES = {
  CHART: 'chart',                   // 有線圖消費記錄
  DATE: 'date',                     // 無線圖指定日期消費記錄
  TWO_STORES_CHART: 'twoStoresChart', // 特店＋有折線消費記錄
  ONE_STORES_CHART: 'oneStoresChart', // 一間店面加一折線圖
  TWO_STORES: 'twoStores',          // 無線圖兩間店消費記錄
  CATEGORY: 'category',             // 日期區間消費類別消費記錄
  HIGHEST: 'highest',               // 最高消費記錄
  AMOUNT_COUNT: 'amountCount',          // 大於等於金額消費記錄
  NO_DATA: 'noData'                 // 查無資訊消費記錄
};


// 模擬 API 請求函數
export const mockchatRequest = (userInput: string): Promise<ChatResponse> => {
  return new Promise((resolve, reject) => {
    // 模擬 API 延遲 (3 秒)
    setTimeout(() => {
      // 根據用戶輸入內容判斷返回的錯誤代碼
      if (userInput.toLowerCase().includes('系統')) {
        resolve({
          code: API_ERROR_CODES.SYSTEM_ERROR,
          message: '目前系統發生非預期的狀況，請您稍後再試或聯繫客服。(Error Code)'
        });
      } else if (userInput.toLowerCase().includes('業務')) {
        resolve({
          code: API_ERROR_CODES.BUSINESS_KEYWORD_ERROR,
          message: '您的問題包含業務專屬關鍵字，請重新提問。'
        });
      } else if (userInput.toLowerCase().includes('機敏')) {
        resolve({
          code: API_ERROR_CODES.SENSITIVE_DATA_ERROR,
          message: '請勿輸入個人資料 (如身分證字號、聯絡方式等)。建議您詢問其他問題。'
        });
      } else if (userInput.toLowerCase().includes('關鍵字')) {
        resolve({
          code: API_ERROR_CODES.KEYWORD_ERROR,
          message: '您的問題包含無法處理的關鍵字，請重新提問。'
        });
      } else if (userInput.toLowerCase().includes('主題')) {
        resolve({
          code: API_ERROR_CODES.TOPIC_CONTENT_ERROR,
          message: '您的問題主題不適合在此討論，請重新提問。'
        });
      } else if (userInput.toLowerCase().includes('上限')) {
        resolve({
          code: API_ERROR_CODES.TOKEN_LIMIT_ERROR,
          message: '您的問題已達到處理上限，請縮短問題或分多次提問。'
        });
      } else if (userInput.toLowerCase().includes('閒置')) {
        resolve({
          code: API_ERROR_CODES.IDLE_TIMEOUT_ERROR,
          message: '因長時間未操作，系統已自動登出，請重新登入。'
        });
      } else if (userInput.toLowerCase().includes('特店') && userInput.toLowerCase().includes('超過')) {
        resolve({
          code: API_ERROR_CODES.STORE_LIMIT_ERROR,
          message: '目前一次只能查詢 2 間店家的消費資訊。'
        });
      } else if (userInput.toLowerCase().includes('類別') && userInput.toLowerCase().includes('超過')) {
        resolve({
          code: API_ERROR_CODES.MULTIPLE_CATEGORIES_ERROR,
          message: '目前一次只能查詢 1 種消費類別的資訊。'
        });
      } else if (userInput.toLowerCase().includes('相似度')) {
        resolve({
          code: API_ERROR_CODES.LOW_SIMILARITY_ERROR,
          message: '您的問題相似度過低，請重新提問。'
        });
      } else {
        // 默認成功回應
        resolve({
          code: API_ERROR_CODES.SUCCESS,
          message: '處理成功',
          data: {
            response: `您的問題「${userInput}」已成功處理。`
          }
        });
      }
    }, 3000); // 3 秒延遲
  });
};

// 根據 API 回應代碼獲取對應的系統回應
export const getSystemResponseByApiCode = (apiCode: string): string => {
  switch (apiCode) {
    case API_ERROR_CODES.SYSTEM_ERROR:
      return '目前系統發生非預期的狀況，請您稍後再試或聯繫客服。(Error Code)';
    case API_ERROR_CODES.BUSINESS_KEYWORD_ERROR:
      return '由於目前只提供信用卡「功能搜尋」的服務，建議您詢問其他問題。';
    case API_ERROR_CODES.SENSITIVE_DATA_ERROR:
      return '請勿輸入個人資料 (如身分證字號、聯絡方式等)。建議您詢問其他問題。';
    case API_ERROR_CODES.KEYWORD_ERROR:
      return '無法回應不合適的內容。建議您詢問其他問題。';
    case API_ERROR_CODES.TOPIC_CONTENT_ERROR:
      return '無法回應不合適的內容。建議您詢問其他問題。';
    case API_ERROR_CODES.TOKEN_LIMIT_ERROR:
      return '您今日的詢問次數已達上限，請至「信用卡總覽」繼續查詢，或於隔日再次使用。';
    case API_ERROR_CODES.IDLE_TIMEOUT_ERROR:
      return '因長時間未操作，系統已自動登出，請重新登入。';
    case API_ERROR_CODES.STORE_LIMIT_ERROR:
      return '目前一次只能查詢 2 間店家的消費資訊。建議您分批查詢或再次詢問。';
    case API_ERROR_CODES.MULTIPLE_CATEGORIES_ERROR:
      return '目前一次只能查詢 1 種消費類別的資訊。建議您分批查詢或再次詢問。';
    case API_ERROR_CODES.LOW_SIMILARITY_ERROR:
      return '感謝您的詢問與回覆。由於目前只提供信用卡「功能搜尋」的服務，建議您詢問其他問題。';
    case API_ERROR_CODES.SUCCESS:
      return '處理成功';
    default:
      return '無法識別的回應代碼';
  }
}; 