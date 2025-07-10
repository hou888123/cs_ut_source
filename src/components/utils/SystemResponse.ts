import { useState } from 'react';
import { SYSTEM_RESPONSES } from '../atoms/systemResponses';
import { chatRequest, API_ERROR_CODES, getSystemResponseByApiCode, ChatResponse, FeedbackResponse } from '../../services/apiService';
import { containsSensitiveData } from '../../utils/sensitiveDataPatterns';

// 只保留需要的系統回應，其他使用mockApiService
const EXTENDED_SYSTEM_RESPONSES = {
  GREETING: SYSTEM_RESPONSES.GREETING,
  INTRODUCTION: SYSTEM_RESPONSES.INTRODUCTION,
  IDLE_TIMEOUT_ERROR: SYSTEM_RESPONSES.IDLE_TIMEOUT_ERROR,
  FRONTEND_ERROR: SYSTEM_RESPONSES.FRONTEND_ERROR
};

// 定義系統回應類型
export type SystemResponse = {
  text: string;
  typingSpeed: number;
};

// 定義消費記錄類型
export type ConsumptionRecord = {
  period: string;
  times: number;
  amount: number;
  highestDate: string;
  highestAmount: number;
  detailsVisible?: boolean;
  storeName: string;  // 新增店家名稱
  details?: Array<{  // 新增消費明細
    date: string;
    amount: number;
    store: string;
    cardLastFour: string;
    category: string;
  }>;
  hasChart?: boolean;
  isCategory?: boolean;
  multipleStores?: boolean;
  isHighest?: boolean;
  noData?: boolean;
  hasNegativePie?: boolean; // 標記為負值餅圖
  twoStoresInfo?: Array<{
    storeName: string;
    times: number;
    amount: number;
    highestDate: string;
    highestAmount: number;
  }>;
  specialStore?: string;
};

// 定義推薦問題類型
export type RecommendedQuestion = {
  text: string;
  value?: string;
};

// 定義問題模塊狀態類型
export type QuestionModuleState = {
  questionId: string;
  showGoToButton: boolean;
  showRelatedQuestions: boolean;
  recommendedQuestions: string[]; // 每個問題模塊的推薦問題列表
};

// 定義對話歷史類型
export type DialogHistoryItem = {
  type: string;
  text: string;
  withCard?: boolean;
  consumptionData?: ConsumptionRecord;
  questionId?: string;
  isIntroduction?: boolean;
  // 添加錯誤狀態字段
  errorType?: 'system' | 'token_limit' | 'sensitive_data' | 'keyword' | 'business_keyword' | 'store_limit' | 'topic_content' | 'low_similarity' | 'idle_timeout' | 'frontend_error' | null;
  // 控制是否顯示"立即前往"按鈕
  showGoToAction?: boolean;
  // 新增屬性
  withFeedback?: boolean; // 是否顯示讚與倒讚
  deeplink?: string; // 深度連結
  recommendQuestions?: any[]; // 推薦問題
  questionTitle?: string; // 推薦問題標題
  requestId?: string; // 每個對話項的 requestId
  feedbackOptions?: string[]; // 每個對話項的倒讚選項
  feedbackResponse?: FeedbackResponse; // 每個對話項的完整 feedback 回應
};

// 創建對話分析模型
export const useDialogModel = () => {
  // 輸入框文本
  const [inputText, setInputText] = useState('');
  
  // 對話歷史
  const [dialogHistory, setDialogHistory] = useState<DialogHistoryItem[]>([]);
  
  // 選擇的問題
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // 是否顯示介紹
  const [showIntro, setShowIntro] = useState(true);
  
  // 錯誤狀態
  const [inappropriateContent, setInappropriateContent] = useState(false);
  const [isIdleTimeoutErrorVisible, setIsIdleTimeoutErrorVisible] = useState(false);
  const [isFrontendErrorVisible, setIsFrontendErrorVisible] = useState(false);
  const [showErrorButtons, setShowErrorButtons] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // 是否顯示立即前往按鈕
  const [showGoToButton, setShowGoToButton] = useState(false);
  
  // 顯示消費記錄
  const [showConsumptionRecord, setShowConsumptionRecord] = useState(false);
  
  // 消費記錄類型
  const [consumptionType, setConsumptionType] = useState<ConsumptionRecord | null>(null);
  
  // 添加載入狀態
  const [isLoading, setIsLoading] = useState(false);
  
  // 添加模態視窗狀態
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  
  // 添加兩個新的狀態來控制特殊UI顯示
  const [isMultipleStoresErrorVisible, setIsMultipleStoresErrorVisible] = useState(false);
  const [isMultipleCategoriesErrorVisible, setIsMultipleCategoriesErrorVisible] = useState(false);

  // 添加使用介紹文本狀態
  const [introductionText, setIntroductionText] = useState<string>('');
  
  // 添加注意事項按鈕文字狀態
  const [noticeButtonText, setNoticeButtonText] = useState<string>('注意事項');

  // 清除所有错误状态
  const clearAllErrorStates = () => {
    setIsIdleTimeoutErrorVisible(false);
    setIsFrontendErrorVisible(false);
    setInappropriateContent(false);
    setShowErrorButtons(false);
    setShowErrorModal(false);
    setErrorMessage('');
    setIsMultipleStoresErrorVisible(false);
    setIsMultipleCategoriesErrorVisible(false);
    // 清除消費記錄相關狀態
    setShowConsumptionRecord(false);
    setConsumptionType(null);
    setShowGoToButton(false);
  };

  // 添加處理單一對話項錯誤狀態的方法
  const addSystemErrorMessage = (errorType: string, text: string) => {
    setDialogHistory(prev => [
      ...prev,
      {
        type: 'system',
        text: text,
        errorType: errorType as any
      }
    ]);
    
    // 發送自定義事件，通知系統應該滾動到底部
    document.dispatchEvent(new CustomEvent('userMessageSent'));
  };

  // 修改錯誤處理函數，使用單一對話項錯誤狀態
  const handleSystemErrorButtonClick = () => {
    
    addSystemErrorMessage('system', getSystemResponseByApiCode(API_ERROR_CODES.SYSTEM_ERROR));
  };

  // 處理機敏資料按鈕點擊
  const handleSensitiveDataButtonClick = () => {
      clearAllErrorStates();
    
    // 新增用戶訊息
    const userMessage = {
      type: 'user',
      text: "請查詢 A123456789 的消費紀錄"
    };
    
    // 設置對話歷史
    setDialogHistory([userMessage]);
    
    // 發送自定義事件，通知系統用戶已發送訊息
    document.dispatchEvent(new CustomEvent('userMessageSent'));
    
    // 設置為loading狀態
    setIsLoading(true);

    // 延遲1秒後再顯示機敏資料錯誤訊息，模擬正常問題處理流程
    setTimeout(() => {
      // 新增系統回覆
      setDialogHistory(prev => [
        ...prev,
      { 
        type: 'system', 
          text: getSystemResponseByApiCode(API_ERROR_CODES.SENSITIVE_DATA_ERROR),
          errorType: 'sensitive_data'
        }
      ]);
      
      // 關閉loading狀態
      setIsLoading(false);
      
    }, 1000);
  };

  const handleKeywordErrorButtonClick = () => {
    clearAllErrorStates();
    
    // 新增用戶訊息
    const userMessage = {
      type: 'user',
      text: "明天天氣怎麼樣？"
    };
    
    // 設置對話歷史
    setDialogHistory([userMessage]);
    
    // 發送自定義事件，通知系統用戶已發送訊息
    document.dispatchEvent(new CustomEvent('userMessageSent'));

    // 設置為loading狀態
    setIsLoading(true);

    // 延遲1秒後再顯示不相關問題錯誤訊息，模擬正常問題處理流程
    setTimeout(() => {
      // 新增系統回覆
      setDialogHistory(prev => [
        ...prev,
      {
        type: 'system',
          text: getSystemResponseByApiCode(API_ERROR_CODES.KEYWORD_ERROR),
          errorType: 'keyword'
        }
      ]);
      
      // 關閉loading狀態
      setIsLoading(false);
    }, 1000);
  };

  const handleBusinessKeywordErrorButtonClick = () => {
    addSystemErrorMessage('business_keyword', getSystemResponseByApiCode(API_ERROR_CODES.BUSINESS_KEYWORD_ERROR));
  };

  // 處理 Token 限制錯誤按鈕點擊
  const handleTokenLimitErrorButtonClick = (customErrorMessage?: string) => {
    clearAllErrorStates();
    setSelectedOption("查詢次數已達上限");
    
    // 清空對話歷史
    setDialogHistory([]);
    
    // 使用自定義錯誤訊息或默認訊息
    const errorMessage = customErrorMessage || getSystemResponseByApiCode(API_ERROR_CODES.TOKEN_LIMIT_ERROR);
    
    // 添加系統錯誤訊息
    addSystemErrorMessage('token_limit', errorMessage);
  };

  const handleStoreLimitErrorButtonClick = () => {
    addSystemErrorMessage('store_limit', getSystemResponseByApiCode(API_ERROR_CODES.STORE_LIMIT_ERROR));
  };

  // 處理閒置超時錯誤按鈕
  const handleIdleTimeoutErrorButtonClick = () => {
    // 清空對話歷史
    setDialogHistory([{
      type: 'system',
      text: EXTENDED_SYSTEM_RESPONSES.IDLE_TIMEOUT_ERROR.text,
      errorType: 'idle_timeout'
    }]);
    
    // 顯示閒置超時錯誤畫面
    setIsIdleTimeoutErrorVisible(true);
    // 清空輸入框
    setInputText('');
    // 發送自定義事件，通知系統應該滾動到底部
    document.dispatchEvent(new CustomEvent('userMessageSent'));
    console.log("閒置超時錯誤狀態已設置:", true);
  };

  // 前端載入錯誤按鈕點擊處理
  const handleFrontendErrorButtonClick = () => {
    // 清空對話歷史
    setDialogHistory([{
      type: 'system',
      text: EXTENDED_SYSTEM_RESPONSES.FRONTEND_ERROR.text,
      errorType: 'frontend_error'
    }]);
    
    // 顯示前端加載失敗畫面
    setIsFrontendErrorVisible(true);
    // 清空輸入框
    setInputText('');
    // 發送自定義事件，通知系統應該滾動到底部
    document.dispatchEvent(new CustomEvent('userMessageSent'));
    console.log("前端加載失敗狀態已設置:", true);
  };

  // 處理關鍵字錯誤按鈕點擊2
  const handleKeywordErrorButtonClick2 = () => {
    addSystemErrorMessage('keyword', getSystemResponseByApiCode(API_ERROR_CODES.KEYWORD_ERROR));
  };

  // 處理主題內容錯誤按鈕點擊
  const handleTopicContentErrorButtonClick = () => {
    addSystemErrorMessage('topic_content', getSystemResponseByApiCode(API_ERROR_CODES.TOPIC_CONTENT_ERROR));
  };

  // 處理錯誤模態視窗按鈕
  const handleErrorModalButtonClick = () => {
    clearAllErrorStates();
    setShowErrorModal(true);
  };

  // 切換顯示消費詳情
  const toggleConsumptionDetails = () => {
    setShowConsumptionRecord(!showConsumptionRecord);
  };

  const handleRetry = () => {
    setShowErrorModal(false);
    clearAllErrorStates();
    setSelectedOption(null);
    setShowErrorButtons(false);
    // 確保所有錯誤狀態都被清除
    setIsIdleTimeoutErrorVisible(false);
    setIsFrontendErrorVisible(false);
  };

  const handleClose = () => {
    clearAllErrorStates();
    setSelectedOption(null);
    setShowErrorModal(false);
    setShowTermsModal(false);
    setShowReminderModal(false);
    setInputText('');
    setShowErrorButtons(false);
    setShowConsumptionRecord(false);
  };

  // 重置對話，返回初始狀態
  const resetConversation = () => {
    // 清除所有錯誤狀態
    clearAllErrorStates();
    // 重置對話歷史
    setDialogHistory([]);
    // 清除選項
    setSelectedOption(null);
    // 關閉所有模態窗
    setShowErrorModal(false);
    setShowTermsModal(false);
    setShowReminderModal(false);
    // 清空輸入文字
    setInputText('');
    // 關閉選項列表
    setShowErrorButtons(false);
    // 隱藏消費詳情
    setShowConsumptionRecord(false);
    // 重置消費記錄
    setConsumptionType(null);
    // 關閉介紹頁面
    setShowIntro(false);
  };

  // 處理使用介紹
  const handleIntroOptionClick = () => {
    // 清除錯誤狀態但保留對話歷史
    clearAllErrorStates();

    // 使用Introduction回應
    const questionId = `q_${Date.now()}`;
    
    // 添加系統消息並標記為使用介紹
    const userMessage = { type: 'user' as const, text: "對話式功能搜尋的「使用介紹」", questionId, isIntroduction: true };
    
    // 使用 API 返回的使用介紹文本（如果有）或默認文本
    const introText = introductionText || EXTENDED_SYSTEM_RESPONSES.INTRODUCTION.text;
    const systemMessage = { 
      type: 'system' as const, 
      text: introText, 
      questionId, 
      isIntroduction: true,
      // 添加注意事項按鈕文字
      noticeButtonText: noticeButtonText
    };

    // 保留現有對話歷史，只添加新的消息
    setDialogHistory(prev => [...prev, userMessage, systemMessage]);

    // 發送自定義事件，通知系統用戶已發送訊息
    document.dispatchEvent(new CustomEvent('userMessageSent'));
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 如果沒有輸入文字，則不處理
    if (inputText.trim() === '') {
      return;
    }
    
    console.log("處理用戶輸入:", inputText.trim());
    
    // 處理特殊關鍵詞
    if (inputText.trim() === '加載') {
      console.log("檢測到特殊關鍵詞: 加載");
      // 清空對話歷史
      setDialogHistory([{
        type: 'system',
        text: EXTENDED_SYSTEM_RESPONSES.FRONTEND_ERROR.text,
        errorType: 'frontend_error'
      }]);
      // 顯示前端加載失敗畫面
      setIsFrontendErrorVisible(true);
      // 清空輸入框
      setInputText('');
      // 發送自定義事件，通知系統應該滾動到底部
      document.dispatchEvent(new CustomEvent('userMessageSent'));
      console.log("前端加載失敗狀態已設置:", true);
      return;
    }
    
    if (inputText.trim() === '閒置') {
      console.log("檢測到特殊關鍵詞: 閒置");
      // 清空對話歷史
      setDialogHistory([{
        type: 'system',
        text: EXTENDED_SYSTEM_RESPONSES.IDLE_TIMEOUT_ERROR.text,
        errorType: 'idle_timeout'
      }]);
      // 顯示閒置超時錯誤畫面
      setIsIdleTimeoutErrorVisible(true);
      // 清空輸入框
      setInputText('');
      // 發送自定義事件，通知系統應該滾動到底部
      document.dispatchEvent(new CustomEvent('userMessageSent'));
      console.log("閒置超時錯誤狀態已設置:", true);
      return;
    }
    
    if (inputText.trim() === '上限') {
      console.log("檢測到特殊關鍵詞: 上限");
      // 不清空對話歷史，也不添加用戶訊息，只添加系統回覆訊息
      setDialogHistory(prevHistory => [...prevHistory, {
        type: 'system',
        text: getSystemResponseByApiCode(API_ERROR_CODES.TOKEN_LIMIT_ERROR),
        errorType: 'token_limit',
        showGoToAction: true
      }]);
      
      // 清空輸入框
      setInputText('');
      // 發送自定義事件，通知系統應該滾動到底部
      document.dispatchEvent(new CustomEvent('userMessageSent'));
      console.log("令牌限制錯誤狀態已設置:", true);
      return;
    }
    
    // 檢查是否包含敏感資訊
    if (containsSensitiveData(inputText.trim())) {
    // 創建新的用戶訊息
    const newUserMessage = { type: 'user', text: inputText, withCard: false };
    
    // 添加用戶訊息到對話歷史
    setDialogHistory(prevHistory => [...prevHistory, newUserMessage]);
    
      // 在處理新請求前清除所有錯誤狀態
      clearAllErrorStates();

      // 設置為loading狀態，顯示loading動畫
      setIsLoading(true);

      // 延遲1秒後顯示敏感資訊錯誤
      setTimeout(() => {
        // 關閉loading狀態
        setIsLoading(false);
        
        // 獲取對應的系統回應文字
        const systemResponseText = getSystemResponseByApiCode(API_ERROR_CODES.SENSITIVE_DATA_ERROR);
        
        // 添加系統回應到對話歷史
        setDialogHistory(prev => [
          ...prev,
          {
            type: 'system',
            text: systemResponseText,
            errorType: 'sensitive_data'
          }
        ]);
        
        // 發送自定義事件，通知系統用戶已收到新訊息
        document.dispatchEvent(new CustomEvent('userMessageSent'));
      }, 1000);
      
      // 清空輸入框
      setInputText('');
      return;
    }
    
    // 創建新的用戶訊息
    const newUserMessage = { type: 'user', text: inputText, withCard: false };

    // 添加用戶訊息到對話歷史
    setDialogHistory(prevHistory => [...prevHistory, newUserMessage]);

    // 在處理新請求前清除所有錯誤狀態
    clearAllErrorStates();

    // 設置為loading狀態，顯示loading動畫
    setIsLoading(true);

    // 調用 API 請求
    chatRequest(inputText)
      .then((response: ChatResponse) => {
        console.log('API 回應:', response);
        
        // 關閉loading狀態
        setIsLoading(false);
        
        // 檢查是否有購買摘要數據 (購買摘要作為系統回應)
        if (response.responseMessageObject?.genText) {
          // 決定要顯示的文本：如果 errorMessage 不為空，則顯示 errorMessage，否則顯示 genText
          const displayText = response.responseMessageObject.errorMessage ? 
                            response.responseMessageObject.errorMessage : 
                            response.responseMessageObject.genText;
          
          // 創建系統回應對象，使用API返回的系統回應文字
          let systemResponse: DialogHistoryItem = {
            type: 'system', 
            text: displayText,
            withFeedback: response.type === "200", // 當type為200時顯示讚與倒讚
          };
          
          // 添加系統回應到對話歷史
          setDialogHistory(prev => [...prev, systemResponse]);
          
          // 發送自定義事件，通知系統用戶已收到新訊息，應該滾動到底部
          document.dispatchEvent(new CustomEvent('userMessageSent'));
          return;
        }
        
        // 獲取對應的系統回應文字
        const systemResponseText = getSystemResponseByApiCode(response.code);
        
        // 創建系統回應對象
        let systemResponse: DialogHistoryItem = {
          type: 'system', 
          text: systemResponseText,
          withCard: false 
        };
        
        // 根據 API 回應代碼設置錯誤類型
        switch (response.code) {
          case API_ERROR_CODES.SYSTEM_ERROR:
            systemResponse.errorType = 'system';
            break;
          case API_ERROR_CODES.BUSINESS_KEYWORD_ERROR:
            systemResponse.errorType = 'business_keyword';
            break;
          case API_ERROR_CODES.SENSITIVE_DATA_ERROR:
            systemResponse.errorType = 'sensitive_data';
            break;
          case API_ERROR_CODES.KEYWORD_ERROR:
            systemResponse.errorType = 'keyword';
            break;
          case API_ERROR_CODES.TOPIC_CONTENT_ERROR:
            systemResponse.errorType = 'topic_content';
            break;
          case API_ERROR_CODES.TOKEN_LIMIT_ERROR:
            systemResponse.errorType = 'token_limit';
            systemResponse.showGoToAction = true;
            break;
          case API_ERROR_CODES.STORE_LIMIT_ERROR:
            systemResponse.errorType = 'store_limit';
            break;
          case API_ERROR_CODES.LOW_SIMILARITY_ERROR:
            systemResponse.errorType = 'low_similarity';
            break;
        }
        
        // 添加系統回應到對話歷史
        setDialogHistory(prev => [...prev, systemResponse]);
        
        // 發送自定義事件，通知系統用戶已收到新訊息，應該滾動到底部
        document.dispatchEvent(new CustomEvent('userMessageSent'));
      })
      .catch((error: Error) => {
        console.error('API 錯誤:', error);
        
        // 關閉loading狀態
        setIsLoading(false);
        
        // 添加錯誤回應到對話歷史
        setDialogHistory(prev => [
          ...prev,
          {
            type: 'system',
            text: getSystemResponseByApiCode(API_ERROR_CODES.SYSTEM_ERROR),
            errorType: 'system'
          }
        ]);

        // 發送自定義事件，通知系統用戶已收到新訊息，應該滾動到底部
        document.dispatchEvent(new CustomEvent('userMessageSent'));
      });
    
    // 清空輸入框
    setInputText('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  // 處理選項點擊
  const handleOptionClick = (option: string, existingQuestionId?: string) => {
    // 防止重複點擊或處理中
    if (isLoading) {
      console.log("正在載入中，忽略點擊", option);
      return;
    }

    // 立即設置載入狀態防止重複點擊
    setIsLoading(true);

    // 初始化標記當前操作的時間戳
    const operationTimestamp = Date.now();
    console.log(`處理問題點擊: ${option} (開始於 ${operationTimestamp})`);

    // 使用提供的questionId或生成新的
    const questionId = existingQuestionId || `q_${operationTimestamp}`;
    
    // 清除錯誤狀態
    clearAllErrorStates();
    
    // 設置選中選項
    setSelectedOption(option);

    // 只有在沒有現有的questionId時才添加使用者問題
    if (!existingQuestionId) {
      setDialogHistory(prev => [
        ...prev, 
        { type: 'user', text: option, questionId }
      ]);
    }

    // 調用 API 請求
    chatRequest(option)
      .then((response: ChatResponse) => {
        console.log('API 回應 (選項點擊):', response);
        
        // 關閉loading狀態
        setIsLoading(false);
        
        // 檢查是否有購買摘要數據 (購買摘要作為系統回應)
        if (response.responseMessageObject?.genText) {
          // 決定要顯示的文本：如果 errorMessage 不為空，則顯示 errorMessage，否則顯示 genText
          const displayText = response.responseMessageObject.errorMessage ? 
                            response.responseMessageObject.errorMessage : 
                            response.responseMessageObject.genText;
          
          // 創建系統回應對象，使用API返回的系統回應文字
          let systemResponse: DialogHistoryItem = {
            type: 'system', 
            text: displayText,
            withFeedback: response.type === "200", // 當type為200時顯示讚與倒讚
            questionId
          };
          
          // 檢查是否有深度連結
          if (response.responseMessageObject?.deeplink) {
            systemResponse.deeplink = response.responseMessageObject.deeplink;
          }
          
          // 檢查是否有推薦問題
          if (response.responseMessageObject?.questionSuggest?.length) {
            systemResponse.recommendQuestions = response.responseMessageObject.questionSuggest;
          }
          
          // 添加系統回應到對話歷史
          setDialogHistory(prev => [...prev, systemResponse]);
          
          // 發送自定義事件，通知系統用戶已收到新訊息，應該滾動到底部
          document.dispatchEvent(new CustomEvent('userMessageSent'));
          return;
        }
        
        // 獲取對應的系統回應文字
        const systemResponseText = getSystemResponseByApiCode(response.code);
        
        // 創建系統回應對象
        let systemResponse: DialogHistoryItem = {
          type: 'system', 
          text: response.data?.response || systemResponseText,
          withCard: false,
          questionId
        };
        
        // 根據 API 回應代碼設置錯誤類型
        switch (response.code) {
          case API_ERROR_CODES.SYSTEM_ERROR:
            systemResponse.errorType = 'system';
        break;
          case API_ERROR_CODES.BUSINESS_KEYWORD_ERROR:
            systemResponse.errorType = 'business_keyword';
        break;
          case API_ERROR_CODES.SENSITIVE_DATA_ERROR:
            systemResponse.errorType = 'sensitive_data';
        break;
          case API_ERROR_CODES.KEYWORD_ERROR:
            systemResponse.errorType = 'keyword';
        break;
          case API_ERROR_CODES.TOPIC_CONTENT_ERROR:
            systemResponse.errorType = 'topic_content';
        break;
          case API_ERROR_CODES.TOKEN_LIMIT_ERROR:
            systemResponse.errorType = 'token_limit';
            systemResponse.showGoToAction = true;
        break;
          case API_ERROR_CODES.STORE_LIMIT_ERROR:
            systemResponse.errorType = 'store_limit';
        break;
          case API_ERROR_CODES.LOW_SIMILARITY_ERROR:
            systemResponse.errorType = 'low_similarity';
        break;
    }
        
        // 添加系統回應到對話歷史
        setDialogHistory(prev => [...prev, systemResponse]);
        
        // 發送自定義事件，通知系統用戶已收到新訊息，應該滾動到底部
        document.dispatchEvent(new CustomEvent('userMessageSent'));
      })
      .catch(error => {
        console.error('API 錯誤 (選項點擊):', error);
        
        // 關閉loading狀態
        setIsLoading(false);
        
        // 添加錯誤回應到對話歷史
        setDialogHistory(prev => [
          ...prev,
          {
            type: 'system',
            text: getSystemResponseByApiCode(API_ERROR_CODES.SYSTEM_ERROR),
            errorType: 'system',
            questionId
          }
        ]);

        // 發送自定義事件，通知系統用戶已收到新訊息，應該滾動到底部
        document.dispatchEvent(new CustomEvent('userMessageSent'));
      });
  };

  // 添加用戶訊息到對話歷史
  const addUserMessage = (text: string, questionId?: string) => {
    const newUserMessage = { 
      type: 'user', 
      text, 
      questionId: questionId || `q_${Date.now()}`
    };
    setDialogHistory(prev => [...prev, newUserMessage]);
  };

  // 開始加載狀態
  const startLoading = () => {
    setIsLoading(true);
  };
  
  // 重置loading狀態
  const resetLoading = () => {
    setIsLoading(false);
  };

  // 處理相似度過低錯誤按鈕點擊
  const handleLowSimilarityErrorButtonClick = () => {
    addSystemErrorMessage('low_similarity', getSystemResponseByApiCode(API_ERROR_CODES.LOW_SIMILARITY_ERROR));
  };

  // 添加自定義招呼語方法
  const setCustomGreeting = (greeting: string) => {
    // 更新 EXTENDED_SYSTEM_RESPONSES 中的招呼語
    EXTENDED_SYSTEM_RESPONSES.GREETING = {
      text: greeting,
      typingSpeed: EXTENDED_SYSTEM_RESPONSES.GREETING.typingSpeed
    };
  };

  // 返回模型數據和方法，移除全局錯誤狀態
  return {
    inputText,
    setInputText,
    dialogHistory,
    setDialogHistory,
    selectedOption,
    showIntro,
    inappropriateContent,
    showGoToButton,
    showErrorModal,
    showConsumptionRecord,
    showErrorButtons,
    consumptionType,
    systemResponses: EXTENDED_SYSTEM_RESPONSES,
    isIdleTimeoutErrorVisible,
    isFrontendErrorVisible, 
    handleOptionClick,
    handleInputChange,
    handleInputSubmit,
    handleRetry,
    handleClose,
    resetConversation,
    handleIntroOptionClick,
    handleSystemErrorButtonClick,
    handleSensitiveDataButtonClick,
    handleStoreLimitErrorButtonClick,
    handleTokenLimitErrorButtonClick,
    handleIdleTimeoutErrorButtonClick,
    handleFrontendErrorButtonClick,
    handleBusinessKeywordErrorButtonClick,
    handleKeywordErrorButtonClick,
    handleKeywordErrorButtonClick2,
    handleTopicContentErrorButtonClick,
    handleLowSimilarityErrorButtonClick,
    handleErrorModalButtonClick,
    toggleConsumptionDetails,
    isLoading,
    setIsLoading,
    startLoading,
    resetLoading,
    addUserMessage,
    addSystemErrorMessage,
    setCustomGreeting,
    setIntroductionText,
    noticeButtonText,
    setNoticeButtonText
  };
};

// 修改默認導出
export default useDialogModel; 