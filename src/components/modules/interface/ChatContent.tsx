import React, { useState, useRef, useEffect, memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DialogHistoryItem } from '../../utils/SystemResponse';
import { LoadingCircles } from '@shared';
import { FeedbackModule } from '@shared';
import GoToButton from '@shared/components/ui/GoToButton';
import RecommendQuestions from '../feedback/RecommendQuestions';
import { useContainerHeight } from '@shared/components/layout/DialogLayout';


// 匯入系統回覆訊息組件
import SystemResponseMessage from '../chat/SystemResponseMessage';

// 導入共享圖標
import LikeIcon from '@shared/assets/Like.svg';
import LikeFillIcon from '@shared/assets/Like_fill.svg';
import DislikeIcon from '@shared/assets/Dislike.svg';
import DislikeFillIcon from '@shared/assets/Dislike_fill.svg';
import CloseIcon from '@shared/assets/close.svg';

interface ChatContentProps {
  dialogHistory: DialogHistoryItem[];
  isLoading: boolean;
  getQuestionModuleInfo: (questionId: string) => any | null;
  onLike: (questionId?: string) => void;
  onDislikeOptionSelect: (option: string, questionId?: string) => void;
  onGoToClick?: (item?: any) => void;
  handleQuestionClick?: (question: string) => void;
  onReaskOptionClick?: (option: string) => void;
  showSystemError?: boolean; // 控制是否顯示系統錯誤UI
  hideQuestionList?: boolean; // 控制是否隱藏問題列表
  hideReinquiryButtons?: boolean; // 控制是否隱藏重新提問按鈕
  getButtonText?: (item: any) => string | undefined; // 獲取按鈕文字的函數
  renderAdditionalContent?: (item: any, index: number) => React.ReactNode; // 渲染額外內容的函數
  showFeedback?: boolean; // 是否顯示反饋按鈕
  feedbackOptions?: string[]; // 倒讚選項
}

/**
 * 聊天內容組件
 * 用於顯示對話歷史和當前對話狀態
 * 整合讚與倒讚和立即前往功能
 */
const ChatContent: React.FC<ChatContentProps> = memo(({
  dialogHistory,
  isLoading,
  getQuestionModuleInfo,
  onLike,
  onDislikeOptionSelect,
  onGoToClick,
  handleQuestionClick,
  onReaskOptionClick,
  showSystemError = false, // 控制是否顯示系統錯誤UI
  hideQuestionList = false, // 控制是否隱藏問題列表
  hideReinquiryButtons = false, // 控制是否隱藏重新提問按鈕
  getButtonText, // 獲取按鈕文字的函數
  renderAdditionalContent, // 渲染額外內容的函數
  showFeedback = true, // 是否顯示反饋按鈕
  feedbackOptions = [], // 倒讚選項，不提供默認值
  
}) => {
  // 添加狀態跟踪每個訊息的打字完成狀態 (messageId -> boolean)
  const [completedTypingMap, setCompletedTypingMap] = useState<Record<string, boolean>>({});
  
  // 添加消費總覽模組顯示狀態
  const [showConsumptionCard, setShowConsumptionCard] = useState<Record<string, boolean>>({});

  // 使用 Context 獲取容器高度
  const containerHeight = useContainerHeight();

  // 用於測量用戶氣泡的 ref
  const contentRef = useRef<HTMLDivElement>(null);
  const [lastMessageMinHeight, setLastMessageMinHeight] = useState<number>(0);
  
  // 使用 useEffect 計算最後一條系統訊息的最小高度
  useEffect(() => {
    const calculateMinHeight = () => {
      if (!contentRef.current) return;
      
      // 使用從 Context 獲取的容器高度
      const chatContainerHeight = containerHeight || 500; // 如果未提供，使用默認值
      
      // 獲取最後一個用戶氣泡元素
      const userBubbles = contentRef.current.querySelectorAll('[data-user-bubble="true"]');
      const lastUserBubble = userBubbles.length > 0 ? userBubbles[userBubbles.length - 1] : null;
      
      // 計算用戶氣泡高度（包括margin）
      let userBubbleHeight = 0;
      if (lastUserBubble) {
        const bubbleRect = lastUserBubble.getBoundingClientRect();
        userBubbleHeight = bubbleRect.height + 32; // 32px 是 margin-bottom 的值
      }
      
      // 計算系統回覆的最小高度 = 容器高度 - 用戶氣泡高度 - 額外間距
      const minHeight = Math.max(chatContainerHeight - userBubbleHeight - 40); // 40px 為額外間距
      
      // 設置最小高度
      setLastMessageMinHeight(minHeight);
    };
    
    // 初始計算
    calculateMinHeight();
    
    // 添加 resize 事件監聽器
    window.addEventListener('resize', calculateMinHeight);
    
    // 清理函數
    return () => {
      window.removeEventListener('resize', calculateMinHeight);
    };
  }, [dialogHistory, containerHeight]);
  
  // 使用 useMemo 優化 iconSources，避免每次都創建新對象
  const iconSources = useMemo(() => ({
    likeIcon: LikeIcon,
    likeFillIcon: LikeFillIcon,
    dislikeIcon: DislikeIcon,
    dislikeFillIcon: DislikeFillIcon,
    closeIcon: CloseIcon
  }), []);
  
  // 使用 useCallback 優化事件處理函數
  const handleTypingComplete = useCallback((messageId: string, isLastMessage: boolean) => {
    setCompletedTypingMap(prev => ({
      ...prev,
      [messageId]: true
    }));
    
    // 如果是消費卡片的打字完成，延遲顯示消費總覽模組
    if (messageId.includes('-card')) {
      const baseMessageId = messageId.replace('-card', '');
      setTimeout(() => {
        setShowConsumptionCard(prev => ({
          ...prev,
          [baseMessageId]: true
        }));
      }, 300); // 延遲300ms後顯示消費總覽模組
    }
    
    // 不再在此處理loading狀態，由外部控制
  }, []);
  
  // 使用 useCallback 優化檢查函數
  const isMessageTypingComplete = useCallback((messageId: string) => {
    return completedTypingMap[messageId] === true;
  }, [completedTypingMap]);

  const shouldShowConsumptionCard = useCallback((messageId: string) => {
    return showConsumptionCard[messageId] === true;
  }, [showConsumptionCard]);

  // 判斷是否為系統錯誤訊息
  const isSystemErrorMessage = useCallback((text: string, errorType?: string | null) => {
    // 如果 errorType 為 'system'，則直接判定為系統錯誤訊息
    if (errorType === 'system') {
      return true;
    }
    
    // 檢查訊息內容是否包含系統錯誤的關鍵詞
    return text && (
      text.includes('系統發生非預期的狀況') || 
      text.includes('系統錯誤') || 
      text.includes('Error Code')
    );
  }, []);

  // 判斷是否為特店超過或類別超過的訊息
  const isLimitErrorMessage = useCallback((text: string) => {
    // 檢查訊息內容是否包含特店超過或類別超過的關鍵詞
    return text && (
      text.includes('目前一次只能查詢 2 間店家的消費資訊') || 
      text.includes('目前最多只能同時查詢 2 間店家的消費資訊') || 
      text.includes('目前一次只能查詢 1 種消費類別的資訊')
    );
  }, []);
  
  // 判斷是否應該顯示推薦問題模組
  const shouldShowRecommendQuestions = useCallback((item: DialogHistoryItem, isLastMessage: boolean, index: number) => {
    // 如果設置了隱藏問題列表，則不顯示
    if (hideQuestionList) return false;
    
    // 如果是消費卡片，則不顯示
    if (item.withCard) return false;
    
    // 如果不是最後一組對話，則不顯示推薦問題
    // 找出最後一個用戶訊息的索引
    const lastUserMessageIndex = [...dialogHistory].reverse().findIndex(item => item.type === 'user');
    const lastUserMessagePosition = lastUserMessageIndex >= 0 ? dialogHistory.length - 1 - lastUserMessageIndex : -1;
    
    // 如果當前系統訊息不是在最後一個用戶訊息之後，則不顯示推薦問題
    if (index <= lastUserMessagePosition && dialogHistory.length > 2) return false;
    
    // 特定錯誤狀態，需要顯示推薦問題模組
    const isSpecificErrorState = item.errorType === 'sensitive_data' || 
                               item.errorType === 'keyword' || 
                               item.errorType === 'business_keyword' || 
                               item.errorType === 'topic_content' || 
                               item.errorType === 'low_similarity';
    
    // 如果是特定錯誤狀態，則顯示
    if (isSpecificErrorState) return true;
    
    // 如果是系統錯誤訊息，則不顯示
    if (isSystemErrorMessage(item.text, item.errorType)) return false;
    
    // 如果是特店超過或類別超過的訊息，則不顯示
    if (isLimitErrorMessage(item.text)) return false;
    
    // 如果是最後一條訊息且顯示系統錯誤，則不顯示
    if (isLastMessage && showSystemError) return false;
    
    // 如果是令牌限制錯誤，則不顯示
    if (item.errorType === 'token_limit') return false;
    
    // 如果是使用介紹訊息，且有推薦問題，則顯示
    if (item.isIntroduction && item.recommendQuestions && item.recommendQuestions.length > 0) {
      return true;
    }
    
    // 如果有推薦問題，則顯示
    return item.recommendQuestions && item.recommendQuestions.length > 0;
  }, [hideQuestionList, showSystemError, isSystemErrorMessage, isLimitErrorMessage, dialogHistory]);

  // 使用 useCallback 優化重新提問選項點擊處理
  const handleReaskOptionClickInternal = useCallback((option: string) => {
    // 如果提供了外部處理函數，使用它；否則使用原來的 handleQuestionClick
    if (onReaskOptionClick) {
      onReaskOptionClick(option);
    } else if (handleQuestionClick) {
      handleQuestionClick(option);
    }
  }, [onReaskOptionClick, handleQuestionClick]);

  // 如果對話歷史為空且不在加載中，則不顯示任何內容
  if (dialogHistory.length === 0 && !isLoading) {
    return null;
  }
  
  // 找出最後一個用戶訊息的索引
  const lastUserMessageIndex = [...dialogHistory].reverse().findIndex(item => item.type === 'user');
  const lastUserMessagePosition = lastUserMessageIndex >= 0 ? dialogHistory.length - 1 - lastUserMessageIndex : -1;

  return (
    <div className="u-flex u-flex-col u-w-full" ref={contentRef}>
      {/* 渲染對話歷史 */}
      {dialogHistory.map((item: DialogHistoryItem, index: number) => {
        const messageId = item.questionId || `msg-${index}`;
        const questionInfo = item.questionId ? getQuestionModuleInfo(item.questionId) : null;
        // 檢查是否是最後一條系統訊息
        const isLastMessage = item.type === 'system' && index === dialogHistory.length - 1;
        // 檢查這條系統訊息是否屬於最近的對話 (在最後一條用戶訊息之後)
        const isInLatestConversation = item.type === 'system' && index > lastUserMessagePosition;
        
        // 檢查是否是最後一個有消費卡片的系統消息（最下方的消費總覽模組）
        const isLastConsumptionCard = item.withCard && item.consumptionData && isLastMessage;
        
        // 如果是用戶訊息，則顯示用戶氣泡
        if (item.type === 'user') {
          return (
            <motion.div 
              key={`user-message-${index}`} 
              className="u-flex u-justify-end u-mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              data-user-bubble="true"
            >
              <div className="u-max-w-[80%] u-px-3 u-py-2 u-bg-white u-rounded-md u-break-words">
                <p>{item.text}</p>
              </div>
            </motion.div>
          );
        } else if (item.type === 'system') {
          // 系統訊息
          return (
            <div 
              key={`system-message-${index}`} 
              className={`u-flex u-flex-col u-items-start u-mb-8 u-w-full`}
              style={(isLastMessage ? { minHeight: (item.errorType === 'token_limit') ? containerHeight - 46 : lastMessageMinHeight - 16 } : {})}
            >
              <div className='u-w-full'>
                {/* 對於只有純文本的消息，直接顯示 */}
                {item.text && !item.withCard && (
                  <SystemResponseMessage 
                    text={item.text} 
                    typingSpeed={60}
                    isLoading={isLoading && isLastMessage}
                    onTypingComplete={() => handleTypingComplete(messageId, isLastMessage)}
                    skipTypingEffect={isMessageTypingComplete(messageId) || 
                      ((item.errorType === 'sensitive_data' || item.errorType === 'keyword' || 
                       item.errorType === 'business_keyword' || item.errorType === 'topic_content' || 
                       item.errorType === 'low_similarity') && !isLastMessage)}
                  />
                )}
                
              </div>
              
              {/* 加入讚與倒讚與「立即前往」按鈕 - 只有在訊息打字效果完成後才顯示，並添加動畫 */}
              {!item.isIntroduction && (
                (item.withCard && item.consumptionData && shouldShowConsumptionCard(messageId)) ||
                (!item.withCard && isMessageTypingComplete(messageId))
              ) && (
                // 只有系統錯誤訊息不顯示讚與倒讚，特店超過/類別超過訊息需要顯示
                // 同時檢查 withFeedback 屬性，如果明確設置為 false 則不顯示讚與倒讚
                !isSystemErrorMessage(item.text, item.errorType) && !(isLastMessage && showSystemError) && item.withFeedback !== false
              ) && (
                <motion.div 
                  className="u-mt-3 u-w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    ease: "easeOut",
                    delay: item.withCard ? 0.2 : 0 // 如果有消費卡片，延遲更久
                  }}
                >
                  {/* 查詢限制錯誤狀態下顯示「立即前往」按鈕 */}
                  {item.errorType === 'token_limit' ? (
                    <div className="u-flex u-justify-between u-items-center u-relative u-w-full">
                      <div className="u-flex u-items-center">
                        <GoToButton
                          onClick={() => onGoToClick && onGoToClick(item)}
                        />
                      </div>
                    </div>
                  ) : (
                    /* 機敏資料頁面只顯示讚與倒讚 */
                    (item.errorType === 'sensitive_data' || item.errorType === 'keyword' || 
                     item.errorType === 'business_keyword' || item.errorType === 'topic_content' || 
                     item.errorType === 'low_similarity') || hideReinquiryButtons ? (
                      <FeedbackModule
                        type={"default" as "reask"}
                        showActionButton={false}
                        onLike={() => onLike(item.questionId)}
                        onDislikeOptionSelect={(option) => onDislikeOptionSelect(option, item.questionId)}
                        feedbackOptions={item.feedbackOptions || feedbackOptions}
                        iconSources={iconSources}
                      />
                    ) : (
                        /* 普通文本回復顯示讚/倒讚按鈕，如果有深度連結則顯示立即前往按鈕 */
                        <FeedbackModule
                          type={!!item.deeplink ? "goto" : ("default" as "reask")}
                          showActionButton={!!item.deeplink}
                          actionButtonText="立即前往"
                          onActionClick={() => onGoToClick && onGoToClick(item)}
                          onLike={item.withFeedback ? () => onLike(item.questionId) : undefined}
                          onDislikeOptionSelect={item.withFeedback ? (option) => onDislikeOptionSelect(option, item.questionId) : undefined}
                          feedbackOptions={item.feedbackOptions || feedbackOptions}
                          iconSources={iconSources}
                        />
                    )
                  )}
                </motion.div>
              )}

              {/* 使用介紹訊息 - 顯示"注意事項"按鈕 */}
              {item.isIntroduction && isMessageTypingComplete(messageId) && (
                <motion.div 
                  className="u-mt-3 u-w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="u-flex u-justify-start u-items-center">
                    <GoToButton
                      onClick={() => onGoToClick && onGoToClick(item)}
                      label={getButtonText ? getButtonText(item) || "注意事項" : "注意事項"}
                    />
                  </div>
                </motion.div>
              )}

              {/* 顯示相關問題列表 */}
              {handleQuestionClick && 
                (!item.withCard && isMessageTypingComplete(messageId)) &&
                shouldShowRecommendQuestions(item, isLastMessage, index) && (
                  <motion.div 
                    className="u-w-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
                  >
                    <RecommendQuestions
                      questions={item.recommendQuestions || []}
                      onQuestionClick={handleQuestionClick}
                      title={item.questionTitle} // 使用對話項的 questionTitle 屬性
                    />
                  </motion.div>
                )
              }
            </div>
          );
        }
      })}
      
      {/* 加載中狀態 - 使用共享組件 */}
      {isLoading && (
        <div className="u-py-1 u-mb-4" style={{ minHeight: lastMessageMinHeight }}>
          <LoadingCircles />
        </div>
      )}
    </div>
  );
});

// 設置 displayName 便於調試
ChatContent.displayName = 'ChatContent';

export default ChatContent; 