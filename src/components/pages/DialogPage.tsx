import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
// 已經在main.tsx中導入了共享組件的loading-animations.css
import TermsModal from '@shared/components/modals/TermsModal';
import ReminderModal from '@shared/components/modals/ReminderModal';
// 使用共享組件中的TypingText替代本地組件
// import TypingText from '../ui/TypingText';
import useDialogModel from '../utils/SystemResponse';
// 使用共享組件庫中的DialogLayout替代本地組件
// import ChatPage from '../common/layout/ChatPage';
// 直接從常量文件導入錯誤訊息
import { ERROR_MESSAGES } from '@shared/constants/errorMessages';
// 使用共享組件 ToastMessage
// 從共享組件導入所有需要的組件
import { 
  PrivacyNotice,
  ChatInput,
  ToastMessage,
  ErrorContent,
  TypingText,
} from '@shared';

// 直接從文件路徑導入 DialogLayout
import DialogLayout from '@shared/components/layout/DialogLayout';

import PlusIcon from '../../assets/plus.svg';
import SubmitIcon from '../../assets/submit.svg';
import { MainMenuOptions, ChatContent } from '../modules/interface';
// 導入初始化 hook
import { useInitialization } from '../../hooks/useInitialization';
// 導入相關問題選項
// import { RELATED_OPTIONS, DEFAULT_RELATED_OPTIONS } from '../modules/interface/RelatedOptions';
// 導入QuestionSuggest類型
import { QuestionSuggest } from '../../services/apiService';
// 導入 API 服務相關函數和常量
import { 
  chatRequest, 
  API_ERROR_CODES, 
  getSystemResponseByApiCode, 
  ChatResponse, 
  getSessionId, 
  getRequestId, 
  sendComment,
  sendFeedback,
  FeedbackResponse
} from '../../services/apiService';
// 導入對話歷史項類型
import { DialogHistoryItem } from '../utils/SystemResponse';
// 導入機敏資訊檢測函數
import { containsSensitiveData } from '../../utils/sensitiveDataPatterns';

// 添加全局變數聲明
declare global {
  interface Window {
    _lastFeedbackResponse?: FeedbackResponse;
  }
}

// 消費分析詳細說明內容
const CONSUMPTION_ANALYSIS_CONTENT = [''];

/**
 * 對話式消費分析頁面
 * 整合了聊天、消費數據展示等功能
 * @param shouldFetchApi - 是否需要打API獲取用戶Profile和初始化會話，默認為true
 */
interface DialogPageProps {
  shouldFetchApi?: boolean;
}

const DialogPage: React.FC<DialogPageProps> = ({ shouldFetchApi = true }) => {
  // 使用模型
  const model = useDialogModel();
  
  // 使用初始化 hook，傳入是否需要打API的參數
  const { 
    isLoading: isInitializing, 
    isError: isInitError, 
    shouldShowTokenLimitError,
    data: initData,
    introductionText
  } = useInitialization(shouldFetchApi);
  
  // 添加 headerDescription 狀態
  const [headerDescription, setHeaderDescription] = useState<string | null>(null);
  // 添加解析後的 headerDescription 狀態
  const [parsedHeaderDescription, setParsedHeaderDescription] = useState<React.ReactNode | null>(null);
  
  // 添加倒讚選項狀態
  const [feedbackOptions, setFeedbackOptions] = useState<string[]>([
    "回應速度太慢", "對話流程複雜", "問題理解有誤", "金額計算有誤"
  ]);

  // 解析 headerDescription 中的佔位符
  const parseHeaderDescription = (text: string, urlObjects?: Array<{urlText: string, urlLink?: string, urlContent?: string}>) => {
    if (!urlObjects || urlObjects.length < 2) return text;
    
    // 分割文本
    const parts = text.split(/(\{[0-1]\})/g);
    
    return (
      <>
        {parts.map((part, index) => {
          if (part === '{0}' && urlObjects[0]) {
            return (
              <a 
                key={index}
                href="#" 
                className="u-text-blue-500 u-underline u-mx-1"
                onClick={(e) => handleTermsClick(e, urlObjects[0].urlLink)}
              >
                {urlObjects[0].urlText}
              </a>
            );
          } else if (part === '{1}' && urlObjects[1]) {
            return (
              <a 
                key={index}
                href="#" 
                className="u-text-blue-500 u-underline u-mx-1"
                onClick={(e) => handleReminderClick(e, urlObjects[1].urlContent)}
              >
                {urlObjects[1].urlText}
              </a>
            );
          }
          return part;
        })}
      </>
    );
  };
  
  // 添加API返回的注意事項按鈕文字和內容的狀態
  const [apiNoticeButtonText, setApiNoticeButtonText] = useState<string>('注意事項');
  const [apiNoticeContent, setApiNoticeContent] = useState<React.ReactNode | string>('');
  
  // 添加推薦問題狀態
  const [recommendedQuestions, setRecommendedQuestions] = useState<QuestionSuggest[]>([]);
  
  // 處理API返回的問題建議
  const handleQuestionSuggestions = (initData: any) => {
    if (initData?.questionSuggest && initData.questionSuggest.length > 0) {
      // 創建推薦問題數組，過濾掉包含"使用介紹"的問題
      const filteredQuestions = initData.questionSuggest.filter(
        (question: QuestionSuggest) => !question.questionContent.includes('使用介紹')
      );
      
      // 設置推薦問題狀態，使用過濾後的問題
      setRecommendedQuestions(filteredQuestions);
      
      // 更新對話歷史中的系統回應，添加推薦問題
      if (model.dialogHistory.length > 0) {
        const lastSystemMessage = model.dialogHistory.find(item => 
          item.type === 'system' && item.isIntroduction
        );
        
        if (lastSystemMessage) {
          lastSystemMessage.recommendQuestions = filteredQuestions;
        }
      }
    } else {
      // 如果沒有API返回的問題建議，則使用空數組
      setRecommendedQuestions([]);
    }
  };
  
  // 使用 useEffect 處理初始化數據
  useEffect(() => {
    if (initData) {
      // 如果有 returnDesc，顯示 TOKEN_LIMIT_ERROR 狀態
      if (shouldShowTokenLimitError && initData.returnDesc) {
        model.handleTokenLimitErrorButtonClick();
      }
      
      // 更新招呼語
      if (initData.greetContent) {
        // 更新 SYSTEM_RESPONSES.GREETING
        model.setCustomGreeting(initData.greetContent);
      }

      // 更新頁面頭部描述
      if (initData.headerDescription) {
        setHeaderDescription(initData.headerDescription);
        // 解析 headerDescription 中的佔位符
        setParsedHeaderDescription(parseHeaderDescription(initData.headerDescription, initData.urlObject));
        
        // 保存 API 返回的注意事項內容
        if (initData.urlObject && initData.urlObject.length > 0) {
          // 查找 urlText 包含"事項"的對象
          const noticeObj = initData.urlObject.find(obj => obj.urlText && obj.urlText.includes('事項'));
          
          if (noticeObj && noticeObj.urlContent) {
            // 保存注意事項按鈕文字
            setApiNoticeButtonText(noticeObj.urlText);
            
            // 將注意事項按鈕文字傳遞給模型
            model.setNoticeButtonText && model.setNoticeButtonText(noticeObj.urlText);
            
            // 保存注意事項內容
            const noticeContent = noticeObj.urlContent;
            // 檢查內容是否為字符串且包含 HTML 標籤
            if (typeof noticeContent === 'string' && noticeContent.includes('<')) {
              setApiNoticeContent(
                <div dangerouslySetInnerHTML={{ __html: noticeContent }} />
              );
            } else {
              setApiNoticeContent(noticeContent);
            }
          }
        }
      }
      
      // 保存使用介紹的系統回覆文本
      if (introductionText) {
        // 將使用介紹文本保存到模型中的自定義屬性
        model.setIntroductionText && model.setIntroductionText(introductionText);
      }
      
      // 處理API返回的問題建議
      handleQuestionSuggestions(initData);
    }
  }, [initData, shouldShowTokenLimitError, introductionText]);
  
  // 處理使用介紹選項點擊 - 修改原有的 model.handleIntroOptionClick 調用
  const handleIntroClick = () => {
    // 使用原有的模型方法，但在調用後手動更新系統回應的 recommendQuestions
    model.handleIntroOptionClick();
    
    // 延遲一下，確保系統回應已添加到對話歷史中
    setTimeout(() => {
      // 更新最後一個系統回應，添加推薦問題
      model.setDialogHistory(prev => {
        const lastSystemMessage = [...prev].reverse().find(item => 
          item.type === 'system' && item.isIntroduction
        );
        
        if (lastSystemMessage) {
          // 找到最後一個系統回應的索引
          const index = prev.findIndex(item => 
            item === lastSystemMessage
          );
          
          // 創建新的對話歷史
          const newHistory = [...prev];
          
          // 更新系統回應
          newHistory[index] = {
            ...newHistory[index],
            recommendQuestions: recommendedQuestions
          };
          
          return newHistory;
        }
        
        return prev;
      });
    }, 600); // 延遲比 model.handleIntroOptionClick 中的 setTimeout 多 100ms
  };
  
  // 處理初始化錯誤
  useEffect(() => {
    if (isInitError) {
      model.handleFrontendErrorButtonClick();
    }
  }, [isInitError]);
  
  // 添加自動聚焦輸入框功能
  useEffect(() => {
    // 一段延遲，確保DOM已完全加載
    const timer = setTimeout(() => {
      // 獲取輸入框元素並聚焦
      const textarea = document.querySelector('textarea');
      if (textarea && !model.isLoading && !isInitializing) {
        textarea.focus();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [model.isLoading, isInitializing]);
  
  // 本地狀態
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showNewChatButton, setShowNewChatButton] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [termsLink, setTermsLink] = useState('');
  const [reminderContent, setReminderContent] = useState<string | string[] | React.ReactNode>(CONSUMPTION_ANALYSIS_CONTENT);
  
  // 新增招呼語打字完成狀態
  const [greetingTypingComplete, setGreetingTypingComplete] = useState(false);
  
  // 智能滾動依賴項
  const scrollDependencies = [
    model.dialogHistory, 
    model.isLoading, 
    model.showConsumptionRecord,
    model.showErrorButtons,
    // 招呼語打字完成狀態，影響主選單選項顯示
    greetingTypingComplete
  ];
  
  // 添加一個ref來引用整個對話頁面
  const dialogPageRef = useRef<HTMLDivElement>(null);
  
  // 切換新對話按鈕顯示狀態
  const toggleNewChatButton = () => {
    setShowNewChatButton(!showNewChatButton);
  };
  
  // 添加點擊事件處理函數，用於檢測點擊是否在對話頁面外部
  useEffect(() => {
    // 如果新對話按鈕不顯示，不需要添加事件監聽器
    if (!showNewChatButton) return;
    
    // 處理點擊事件的函數
    const handleClickOutside = (event: MouseEvent) => {
      // 檢查點擊是否在新對話按鈕之外
      // 這裡假設新對話按鈕有一個特定的類名或ID可以識別
      const newChatButton = document.querySelector('.u-absolute.-u-top-8.u-left-5');
      const plusButton = document.querySelector('button img[alt="新增"]')?.parentElement;
      
      // 如果點擊的元素不是新對話按鈕，也不是加號按鈕，則關閉新對話按鈕
      if (newChatButton && 
          !newChatButton.contains(event.target as Node) && 
          plusButton && 
          !plusButton.contains(event.target as Node)) {
        setShowNewChatButton(false);
      }
    };
    
    // 添加點擊事件監聽器到整個文檔
    document.addEventListener('click', handleClickOutside);
    
    // 清理函數，移除事件監聽器
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showNewChatButton]); // 依賴於showNewChatButton狀態
  
  // 重置招呼語打字狀態的函數
  const resetGreetingState = () => {
    setGreetingTypingComplete(false);
  };
  
  // 開啟新對話
  const handleNewChat = () => {
    model.resetConversation();
    resetGreetingState();
    setShowNewChatButton(false);
  };
  
  // 關閉對話框，重置所有狀態
  const handleCloseDialog = () => {
    window.location.reload();
  };
  
  // 顯示Toast提示
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };
  
  // 處理重新提問選項點擊
  const handleReinquiryOptionClick = (option: string) => {
    // 不清除現有的對話歷史或狀態
    
    // 移除 HTML 標籤，只保留純文字
    const cleanText = option.replace(/<[^>]*>/g, '');
    
    // 設置輸入框文字
    model.setInputText(cleanText);
    
    // 顯示Toast提示
    showToastMessage('已自動帶入您選擇的提問例句');
    
    // 自動聚焦輸入框
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  };

  // 處理點讚事件
  const handleLike = (questionId?: string) => {
    const sessionId = getSessionId();
    
    // 如果沒有提供 questionId，使用全局 requestId
    let requestId = getRequestId();
    
    // 如果提供了 questionId，從對話歷史中找到對應的系統回應
    if (questionId) {
      const systemResponse = model.dialogHistory.find(
        item => item.type === 'system' && item.questionId === questionId
      );
      
      if (systemResponse?.requestId) {
        requestId = systemResponse.requestId;
      }
    }
    
    if (sessionId && requestId) {
      // 調用 comment API，設置 optionContent 為 'good'
      sendComment(sessionId, requestId, 'good')
        .then(() => {
    showToastMessage('謝謝您的回饋');
        })
        .catch((error) => {
          console.error('發送讚回饋失敗:', error);
          showToastMessage('回饋發送失敗，請稍後再試');
        });
    } else {
      showToastMessage('謝謝您的回饋');
    }
  };

  // 處理倒讚選項選擇事件
  const handleDislikeOptionSelect = (option: string, questionId?: string) => {
    const sessionId = getSessionId();
    
    // 如果沒有提供 questionId，使用全局 requestId
    let requestId = getRequestId();
    let feedbackResponseToUse = window._lastFeedbackResponse;
    
    // 如果提供了 questionId，從對話歷史中找到對應的系統回應
    if (questionId) {
      const systemResponse = model.dialogHistory.find(
        item => item.type === 'system' && item.questionId === questionId
      );
      
      if (systemResponse?.requestId) {
        requestId = systemResponse.requestId;
        feedbackResponseToUse = systemResponse.feedbackResponse;
      }
    }
    
    // 如果點擊關閉按鈕或點擊倒讚選項視窗之外處，設置 optionContent 為 'bad'
    if (option === 'close') {
      if (sessionId && requestId) {
        // 調用 comment API，設置 optionContent 為 'bad'
        sendComment(sessionId, requestId, 'bad')
          .then(() => {
    showToastMessage(`謝謝您的回饋`);
          })
          .catch((error) => {
            console.error('發送倒讚回饋失敗:', error);
            showToastMessage('回饋發送失敗，請稍後再試');
          });
      } else {
        showToastMessage(`謝謝您的回饋`);
      }
      return;
    }
    
    // 尋找選項對應的 optionId
    let optionId = "";
    if (sessionId && requestId) {
      // 從對應的 feedback 回應中找到對應的 optionId
      if (feedbackResponseToUse?.feedbackComment) {
        const foundOption = feedbackResponseToUse.feedbackComment.find(
          (item: { optionId: string; optionCentent: string }) => item.optionCentent === option
        );
        if (foundOption) {
          optionId = foundOption.optionId;
        }
      }
      
      // 調用 comment API
      sendComment(sessionId, requestId, option, optionId)
        .then(() => {
          showToastMessage(`謝謝您的回饋`);
        })
        .catch((error) => {
          console.error('發送倒讚回饋失敗:', error);
          showToastMessage('回饋發送失敗，請稍後再試');
        });
    } else {
      showToastMessage(`謝謝您的回饋`);
    }
  };

  // 統一處理用戶問題的函數，無論是從輸入框送出還是點擊問題列表
  const processUserQuestion = (question: string, responseText?: string) => {
    // 如果已經在處理中或加載中，忽略請求
    if (model.isLoading) {
      console.log("正在載入中，忽略請求:", question);
      return;
    }

    // 檢測是否包含機敏資訊
    if (containsSensitiveData(question)) {
      // 生成問題ID
      const questionId = `q_${Date.now()}`;
      
      // 在處理新問題前清除所有錯誤狀態
      model.handleRetry();
      
      // 先添加使用者問題到對話歷史
      model.addUserMessage(question, questionId);
      
      // 觸發用戶訊息事件，使聊天室自動滾動
      document.dispatchEvent(new CustomEvent('userMessageSent'));
      
      // 設置為loading狀態
      model.startLoading();
      
      // 短暫延遲模擬 API 請求
      setTimeout(() => {
        // 添加系統回應到對話歷史
        model.setDialogHistory(prev => [
          ...prev,
          {
            type: 'system',
            text: getSystemResponseByApiCode(API_ERROR_CODES.SENSITIVE_DATA_ERROR),
            errorType: 'sensitive_data' as const,
            questionId,
            withFeedback: true, // 預設顯示讚與倒讚
            recommendQuestions: recommendedQuestions
          }
        ]);
        
        // 關閉loading狀態
        model.setIsLoading(false);
        
        // 發送自定義事件，通知系統用戶已收到新訊息，應該滾動到底部
        document.dispatchEvent(new CustomEvent('userMessageSent'));
      }, 500);
      return;
    }
    
    // 處理使用介紹 - 直接調用不需要loading效果
    if (question.includes("使用介紹")) {
      handleIntroClick();
      return;
    }

    // 如果有預設的回覆文本，直接使用它而不是調用 API
    if (responseText) {
      // 生成問題ID
      const questionId = `q_${Date.now()}`;
      
      // 在處理新問題前清除所有錯誤狀態
      model.handleRetry();
      
      // 先添加使用者問題到對話歷史
      model.addUserMessage(question, questionId);
      
      // 觸發用戶訊息事件，使聊天室自動滾動
      document.dispatchEvent(new CustomEvent('userMessageSent'));
      
      // 設置為loading狀態
      model.startLoading();
      
      // 短暫延遲模擬 API 請求
      setTimeout(() => {
        // 添加系統回應到對話歷史
        model.setDialogHistory(prev => [
          ...prev,
          {
            type: 'system',
            text: responseText,
            questionId,
            withFeedback: true, // 預設顯示讚與倒讚
            recommendQuestions: recommendedQuestions
          }
        ]);
        
        // 關閉loading狀態
      model.setIsLoading(false);
      }, 500);
      return;
    }
    
    // 添加用戶問題到對話歷史
    const questionId = `q_${Date.now()}`;
    model.addUserMessage(question, questionId);
    
    // 在處理新問題前清除所有錯誤狀態
    model.handleRetry();
    
    // 設置為loading狀態
    model.startLoading();
    
    // 調用 API 請求
    chatRequest(question)
      .then((response: ChatResponse) => {
        console.log('API 回應:', response);
        
        // 關閉loading狀態
        model.setIsLoading(false);
        
        // 檢查是否達到查詢次數上限
        if (response.requestLimitAmount !== undefined && 
            response.usedAmount !== undefined && 
            response.requestLimitAmount === response.usedAmount) {
          
          // 先顯示 API 回傳的 errorMessage 或 genText
          if (response.responseMessageObject) {
            // 決定要顯示的文本：如果 errorMessage 不為空，則顯示 errorMessage，否則顯示 genText
            const displayText = response.responseMessageObject.errorMessage ? 
                              response.responseMessageObject.errorMessage : 
                              response.responseMessageObject.genText;
            
            if (displayText) {
              // 創建系統回應對象，使用API返回的系統回應文字
              let systemResponse: DialogHistoryItem = {
                type: 'system', 
                text: displayText,
                withFeedback: true, // 預設顯示讚與倒讚
                questionId,
                requestId: response.requestId, // 保存 requestId
                deeplink: response.responseMessageObject?.deeplink, // 保留深度連結
                showGoToAction: !!response.responseMessageObject?.deeplink // 如果有深度連結，顯示"立即前往"按鈕
              };
              
              // 添加系統回應到對話歷史
              model.setDialogHistory(prev => [...prev, systemResponse]);
            }
          }
          
          // 然後添加 token limit error 系統回覆訊息
          setTimeout(() => {
            model.setDialogHistory(prev => [
              ...prev,
              {
                type: 'system',
                text: getSystemResponseByApiCode(API_ERROR_CODES.TOKEN_LIMIT_ERROR),
                errorType: 'token_limit',
                showGoToAction: true,
                questionId,
                // 不顯示推薦問題模組
                recommendQuestions: []
              }
            ]);
            
            // 發送自定義事件，通知系統用戶已收到新訊息，應該滾動到底部
            document.dispatchEvent(new CustomEvent('userMessageSent'));
          }, 500); // 延遲 500ms 後顯示 token limit error 訊息
          
          return;
        }
        
        // 從 API 回應中獲取推薦問題
        let apiRecommendedQuestions: QuestionSuggest[] = [];
        let questionTitle = "推薦問題"; // 預設標題
        
        // 處理 similarQuestion 和 questionSuggest
        if (response.responseMessageObject) {
          // 情況1: similarQuestion 有值且 questionSuggest 無值
          if (
            response.responseMessageObject.similarQuestion && 
            response.responseMessageObject.similarQuestion.length > 0 && 
            (!response.responseMessageObject.questionSuggest || 
             response.responseMessageObject.questionSuggest.length === 0)
          ) {
            questionTitle = "相關問題";
            apiRecommendedQuestions = response.responseMessageObject.similarQuestion;
          } 
          // 情況2: questionSuggest 有值且 similarQuestion 無值
          else if (
            response.responseMessageObject.questionSuggest && 
            response.responseMessageObject.questionSuggest.length > 0 && 
            (!response.responseMessageObject.similarQuestion || 
             response.responseMessageObject.similarQuestion.length === 0)
          ) {
            questionTitle = "推薦問題";
            apiRecommendedQuestions = response.responseMessageObject.questionSuggest;
          }
          // 情況3: 兩者都有值或都無值，使用 questionSuggest（如果有的話）
          else if (response.responseMessageObject.questionSuggest && 
                  response.responseMessageObject.questionSuggest.length > 0) {
            apiRecommendedQuestions = response.responseMessageObject.questionSuggest;
          }
        }
        
        // 如果 API 返回成功且有 requestId，嘗試獲取 feedback 選項
        if (response.code === API_ERROR_CODES.SUCCESS && response.requestId && getSessionId()) {
          sendFeedback(getSessionId()!, response.requestId)
            .then((feedbackResponse: FeedbackResponse) => {
              // 保存最後一次 feedback 回應
              window._lastFeedbackResponse = feedbackResponse;
              
              // 如果有倒讚選項，提取它們
              let options: string[] = [];
              if (feedbackResponse.feedbackComment && feedbackResponse.feedbackComment.length > 0) {
                // 提取所有選項的 optionCentent
                options = feedbackResponse.feedbackComment.map(item => item.optionCentent);
                setFeedbackOptions(options);
              }
              
              // 更新對應的系統回應，添加 requestId 和 feedbackOptions
              model.setDialogHistory(prev => {
                // 找到最後一個系統回應
                const lastSystemResponseIndex = [...prev].reverse().findIndex(item => item.type === 'system' && item.questionId === questionId);
                if (lastSystemResponseIndex !== -1) {
                  // 計算實際索引（從後往前數）
                  const actualIndex = prev.length - 1 - lastSystemResponseIndex;
                  // 創建新的對話歷史
                  const newHistory = [...prev];
                  // 更新系統回應
                  newHistory[actualIndex] = {
                    ...newHistory[actualIndex],
                    requestId: response.requestId,
                    feedbackOptions: options,
                    feedbackResponse: feedbackResponse,
                    recommendQuestions: apiRecommendedQuestions.length > 0 ? apiRecommendedQuestions : recommendedQuestions,
                    questionTitle: questionTitle // 添加問題標題
                  };
                  return newHistory;
                }
                return prev;
              });
            })
            .catch(error => {
              console.error('獲取倒讚選項失敗:', error);
            });
        }
        
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
            withFeedback: true, // 預設顯示讚與倒讚，除非 API 回傳狀態為 500
            questionId,
            requestId: response.requestId // 保存 requestId
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
          model.setDialogHistory(prev => [...prev, systemResponse]);
          
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
          withCard: false,
          withFeedback: true, // 預設顯示讚與倒讚，除非 API 回傳狀態為 500
          questionId,
          requestId: response.requestId // 保存 requestId
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
        model.setDialogHistory(prev => [...prev, systemResponse]);
        
        // 發送自定義事件，通知系統用戶已收到新訊息，應該滾動到底部
        document.dispatchEvent(new CustomEvent('userMessageSent'));
      })
      .catch(error => {
        console.error('API 錯誤:', error);
        
        // 關閉loading狀態
        model.setIsLoading(false);
        
        // 檢查是否為 500 錯誤
        const isServerError = error.response && error.response.status === 500;
        
        // 添加錯誤回應到對話歷史
        model.setDialogHistory(prev => [
          ...prev,
          {
            type: 'system',
            text: getSystemResponseByApiCode(API_ERROR_CODES.SYSTEM_ERROR),
            errorType: 'system' as const,
            questionId,
            // 當回傳狀態為 500 時，不顯示讚與倒讚
            withFeedback: !isServerError
          }
        ]);

        // 發送自定義事件，通知系統用戶已收到新訊息，應該滾動到底部
        document.dispatchEvent(new CustomEvent('userMessageSent'));
      });
  };

  // 處理問題點擊事件
  const handleQuestionClick = (question: string, responseText?: string) => {
    // 如果是使用介紹問題，使用特殊處理
    if (question.includes("使用介紹")) {
      handleIntroClick();
      return;
    }
    
    // 其他問題使用通用處理
    processUserQuestion(question, responseText);
  };

  // 模擬獲取問題模組信息的函數
  const getQuestionModuleInfo = (questionId: string) => {
    // 目前簡單返回null，後續可根據需要擴展
    return null;
  };

  // 添加一個函數來檢查對話歷史中是否有特定錯誤類型的對話項
  const hasErrorTypeInHistory = (errorType: string) => {
    return model.dialogHistory.some(item => item.errorType === errorType);
  };

  // 檢查是否有前端錯誤
  const hasFrontendError = model.isFrontendErrorVisible;
  
  // 檢查是否有閒置超時錯誤
  const hasIdleTimeoutError = model.isIdleTimeoutErrorVisible;

  // 修改決定是否顯示招呼語的條件判斷
  const shouldShowGreeting = model.dialogHistory.length === 0 && !model.isLoading && 
    !hasErrorTypeInHistory('system') && !hasErrorTypeInHistory('store_limit') && !hasErrorTypeInHistory('token_limit') && 
    !model.showErrorButtons && !model.isFrontendErrorVisible && !model.isIdleTimeoutErrorVisible;

  // 修改決定是否禁用輸入框的條件判斷
  const isInputDisabled = model.isLoading || 
    hasErrorTypeInHistory('token_limit') ||
    model.isFrontendErrorVisible || 
    model.isIdleTimeoutErrorVisible;

  // 決定是否顯示主選單選項
  const shouldShowMainMenu = shouldShowGreeting && greetingTypingComplete;

  // 處理服務條款點擊
  const handleTermsClick = (e: React.MouseEvent, link?: string) => {
    e.preventDefault();
    if (link) {
      setTermsLink(link);
    }
    setShowTermsModal(true);
  };

  // 處理提醒事項點擊
  const handleReminderClick = (e: React.MouseEvent, content?: string | string[] | React.ReactNode) => {
    e.preventDefault();
    if (content) {
      // 檢查內容是否為字符串且包含 HTML 標籤
      if (typeof content === 'string' && content.includes('<')) {
        // 創建 React 元素來渲染 HTML 內容
        setReminderContent(
          <div dangerouslySetInnerHTML={{ __html: content }} />
        );
      } else {
        setReminderContent(content);
      }
    } else {
      setReminderContent(CONSUMPTION_ANALYSIS_CONTENT);
    }
    setShowReminderModal(true);
  };

  // 處理模態窗口關閉
  const handleModalClose = () => {
    setShowTermsModal(false);
    setShowReminderModal(false);
  };

  // 修改 getChatContentProps 函數，使用單一對話項的錯誤狀態
  const getChatContentProps = () => {
    return {
      dialogHistory: model.dialogHistory,
      isLoading: model.isLoading,
      getQuestionModuleInfo,
      onLike: handleLike,
      onDislikeOptionSelect: handleDislikeOptionSelect,
      handleQuestionClick: handleQuestionClick,
      onReaskOptionClick: handleReinquiryOptionClick,
      onGoToClick: (item?: any) => {
        // 檢查是否為使用介紹訊息的注意事項按鈕
        const isIntroductionNoticeButton = item?.isIntroduction === true;
        
        if (isIntroductionNoticeButton) {
          // 打開提醒事項模態窗口，使用 API 返回的注意事項內容
          setReminderContent(apiNoticeContent);
          setShowReminderModal(true);
        } else if (item?.deeplink) {
          // 使用 API 返回的深度連結
          window.open(item.deeplink, '_blank');
        } else {
          // 處理「立即前往」按鈕點擊 - 原有功能
          window.open('https://www.cathaybk.com.tw/cathaybk/', '_blank');
        }
      },
      renderAdditionalContent: (item: any, index: number) => {
        // 根據對話項的錯誤狀態渲染不同的內容
        if (item.errorType === 'token_limit') {
    return (
            <div className="u-mt-3">
          <ErrorContent
                errorMessage="查詢次數已達上限，請前往信用卡總覽頁面"
                buttonText="立即前往"
                onButtonClick={() => window.open('https://www.cathaybk.com.tw/cathaybk/', '_blank')}
            showUserQuestion={false}
          />
        </div>
          );
        }
        
        // 渲染其他錯誤內容...
        return null;
      },
      // 自定義按鈕文字
      getButtonText: (item: any) => {
        // 如果是使用介紹訊息，返回 API 返回的注意事項按鈕文字
        if (item?.isIntroduction === true) {
          return item.noticeButtonText || apiNoticeButtonText;
        }
        return undefined; // 使用默認按鈕文字
      },
      showFeedback: true,
      feedbackOptions: feedbackOptions // 傳遞倒讚選項
    };
  };

    return (
    <>
      {/* 服務條款模態窗口 */}
      <TermsModal 
        isOpen={showTermsModal} 
        onClose={handleModalClose}
        confirmLink={termsLink}
        title="確定要離開嗎？"
        content="您即將離開 CUBE App 前往其他網頁。"
        confirmText="確認"
      />
      
      {/* 提醒事項模態窗口 */}
      <ReminderModal
        isOpen={showReminderModal}
        onClose={handleModalClose}
        content={reminderContent}
      />

      <DialogLayout
        title="對話式消費分析"
        onClose={handleCloseDialog}
        scrollDependencies={scrollDependencies as any}
        forceScrollOnUserMessage={true}
        footerComponent={
          !model.isFrontendErrorVisible && !model.isIdleTimeoutErrorVisible ? (
          <ChatInput
            inputText={model.inputText}
            handleInputChange={model.handleInputChange}
            handleInputSubmit={(e) => {
              e.preventDefault();
              const question = model.inputText.trim();
              if (question) {
                processUserQuestion(question);
                model.setInputText('');
              }
            }}
            isDisabled={isInputDisabled}
            showNewChatButton={showNewChatButton}
            toggleNewChatButton={toggleNewChatButton}
            handleNewChat={handleNewChat}
            showPlusButton={true}
            submitIconSrc={SubmitIcon}
            plusIconSrc={PlusIcon}
            />
          ) : null
        }
      >
        {/* 初始化加載中 */}
        {isInitializing ? (
          <div className="u-flex u-items-center u-justify-center u-h-full">
            <div className="u-flex u-flex-col u-items-center u-justify-center u-p-5">
              <div className="u-loading-spinner u-mb-4"></div>
              <p className="u-text-gray-600">正在初始化，請稍候...</p>
        </div>
          </div>
        ) : /* 特殊錯誤內容 */
        model.isFrontendErrorVisible ? (
          <div className="u-flex u-items-center u-justify-center u-h-full">
            <ErrorContent
              errorMessage={ERROR_MESSAGES.FRONTEND_LOADING_ERROR.MESSAGE}
              errorCode={ERROR_MESSAGES.FRONTEND_LOADING_ERROR.CODE}
              onButtonClick={() => window.location.reload()}
              buttonText="重新整理"
              showUserQuestion={false}
            />
          </div>
        ) : model.isIdleTimeoutErrorVisible ? (
          <div className="u-flex u-items-center u-justify-center u-h-full">
            <ErrorContent
              errorMessage={ERROR_MESSAGES.IDLE_TIMEOUT_ERROR.MESSAGE}
              onButtonClick={model.handleRetry}
              buttonText=""
              showUserQuestion={false}
            />
          </div>
        ) : (
          <div className="u-px-5 u-py-3">
            {/* 隱私聲明 */}
            {(
            <div className="u-pb-10 u-text-custom-gray">
              {/* 如果有解析後的 headerDescription，顯示它，否則顯示默認的 PrivacyNotice */}
              {parsedHeaderDescription ? (
                <div className="u-text-xs u-text-gray-600">{parsedHeaderDescription}</div>
              ) : (
              <PrivacyNotice 
                  onTermsClick={handleTermsClick}
                  onNoticeClick={handleReminderClick}
              />
              )}
          </div>
        )}
        
            {/* 招呼語 */}
            {shouldShowGreeting && (
              <div className="u-pb-5 u-text-xl">
              <TypingText 
                text={initData?.greetContent || "您好，想了解什麼資訊嗎？"} 
                typingSpeed={40} 
                onTypingComplete={() => setGreetingTypingComplete(true)}
              />
            </div>
          )}
          
          {/* 聊天內容 */}
            <ChatContent {...getChatContentProps()} />
          
          {/* 主選單選項 */}
            {shouldShowMainMenu && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
            <MainMenuOptions 
              onOptionClick={handleQuestionClick}
              isLoading={model.isLoading}
              questionSuggestions={initData?.questionSuggest}
            />
              </motion.div>
          )}
        </div>
        )}
      </DialogLayout>
      
      {/* Toast提示 */}
        <ToastMessage 
          message={toastMessage}
          show={showToast}
          onClose={() => setShowToast(false)}
        duration={2000}
        />
    </>
  );
};

export default DialogPage; 