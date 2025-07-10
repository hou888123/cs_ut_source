import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

import Arrow from '../../../assets/arrow.svg';

// 定義推薦問題類型
export type RecommendedQuestion = {
  text: string;
  questionContent?: string; // API 返回的問題內容
  questionText?: string;    // API 返回的問題文本
};

interface RecommendQuestionsProps {
  questions: string[] | RecommendedQuestion[];
  onQuestionClick?: (question: string, responseText?: string) => void;
  questionId?: string;
  isSimilarityError?: boolean;
  title?: string; // 添加標題屬性
}

const RecommendQuestions: React.FC<RecommendQuestionsProps> = ({
  questions,
  onQuestionClick,
  questionId,
  isSimilarityError = false,
  title = "相關問題", // 默認標題為"相關問題"
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 定義動畫變體
  const containerVariants = {
    hidden: { 
      opacity: 0, 
      y: 30
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  // 使用一次性CSS注入確保樣式強制應用
  useEffect(() => {
    try {
      // 使用CSS選擇器確保組件可見性
      const styleEl = document.createElement('style');
      styleEl.innerHTML = `
        .recommend-questions {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: relative !important;
          z-index: 50 !important;
        }
        .recommend-question-item {
          transition: opacity 0.2s ease-in-out, background-color 0.2s ease-in-out;
        }
        .recommend-question-item[disabled] {
          opacity: 0.6 !important;
          cursor: not-allowed !important;
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(styleEl);

      return () => {
        document.head.removeChild(styleEl);
      };
    } catch (error) {
      console.error("無法注入推薦問題樣式:", error);
    }
  }, []);

  // 安全的問題點擊處理
  const handleQuestionClick = (question: RecommendedQuestion) => {
    // 防止在處理中重複點擊
    if (isProcessing) return;

    // 設置處理中狀態
    setIsProcessing(true);

    try {
      // 立即禁用所有問題按鈕
      if (containerRef.current) {
        const buttons = containerRef.current.querySelectorAll('button');
        buttons.forEach(button => {
          button.setAttribute('disabled', 'true');
        });
      }

      // 發送自定義事件，通知系統用戶已發送訊息，與輸入框送出對話相同
      document.dispatchEvent(new CustomEvent('userMessageSent'));
      
      // 調用傳入的點擊處理程序
      if (onQuestionClick) {
        const questionText = question.text;
        const responseText = question.questionText; // 使用 API 返回的預設回應文本（如果有的話）
        onQuestionClick(questionText, responseText);
      }
    } catch (error) {
      console.error("問題點擊處理錯誤:", error);
      // 出錯時重置處理狀態
      setIsProcessing(false);
    }
  };

  // 檢查是否為空或未定義
  if (!questions || questions.length === 0) return null;

  // 將問題轉換為統一的格式
  const formattedQuestions = questions.map(q => {
    if (typeof q === 'string') {
      return { text: q };
    } else if (q.questionContent) { 
      // API 返回的 questionSuggest 格式
      return { 
        text: q.questionContent,
        questionText: q.questionText
      };
    } else {
      return q;
    }
  });

  return (
    <motion.div
      ref={containerRef}
      className="recommend-questions u-w-full u-pt-3"
      data-question-id={questionId || 'global'}
      style={{ display: 'block', visibility: 'visible', opacity: 1 }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="u-text-sm u-text-gray-600 u-h-9 u-flex u-items-center"
        variants={itemVariants}
      >
        <span>{title}</span>
      </motion.div>
      <div className="u-flex u-flex-col u-w-full">
        {formattedQuestions.map((q, index) => (
          <button
            key={`${q.text}-${index}`}
            className={`${index > 0 ? 'u-border-t u-border-opacity-10 u-border-black' : ''} u-py-3 u-pr-3 u-flex u-justify-between u-items-center u-cursor-pointer u-text-left u-w-full recommend-question-item`}
            onClick={() => handleQuestionClick(q)}
            disabled={isProcessing}
          >
            <span className="u-text-base u-text-gray-900">{q.text}</span>
            <img src={Arrow} className="u-w-5 u-h-5" />
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default RecommendQuestions; 