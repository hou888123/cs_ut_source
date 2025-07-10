import React, { useEffect } from 'react';
import { SystemResponseMessage as SharedSystemResponseMessage } from '@shared';

interface SystemResponseMessageProps {
  // 消費資料相關屬性
  period?: string;
  storeName?: string;
  times?: number;
  amount?: number;
  noData?: boolean;
  isHighest?: boolean;
  isCategory?: boolean;
  highestDate?: string;
  highestAmount?: number;
  hasChart?: boolean;
  multipleStores?: boolean;
  specialStore?: string;
  twoStoresInfo?: Array<{
    storeName: string;
    times: number;
    amount: number;
    highestDate: string;
    highestAmount: number;
  }>;

  // 純文本模式的屬性
  text?: string;
  typingSpeed?: number;
  isGreeting?: boolean;
  isLoading?: boolean;
  enableTyping?: boolean;
  className?: string;
  
  // 打字效果完成事件回調
  onTypingComplete?: () => void;
  
  // 添加跳過打字效果的屬性
  skipTypingEffect?: boolean;
}

/**
 * 系統回覆消息元件
 * 使用共享組件庫中的 SystemResponseMessage 元件
 * 支持純文本和消費數據格式
 */
const SystemResponseMessage: React.FC<SystemResponseMessageProps> = (props) => {
  // 添加useEffect來處理消費總覽模組的顯示
  useEffect(() => {
    // 如果有消費數據相關屬性，可以在這裡處理額外的邏輯
    if (props.hasChart || props.period || props.storeName) {
      console.log("消費總覽模組數據:", {
        period: props.period,
        storeName: props.storeName,
        times: props.times,
        amount: props.amount
      });
    }
  }, [props.period, props.storeName, props.times, props.amount, props.hasChart]);

  // 創建包含額外屬性的對象
  // 將isLoading和打字效果分開處理，使用enableTyping控制打字效果
  const enhancedProps: any = {
    ...props,
    typingSpeed: props.typingSpeed || 30,
    enableTyping: props.skipTypingEffect ? false : true // 根據skipTypingEffect設置enableTyping
  };
  
  // 移除skipTypingEffect屬性，避免傳遞給共享組件
  delete enhancedProps.skipTypingEffect;

  // 使用增強的屬性渲染共享組件
  return <SharedSystemResponseMessage {...enhancedProps} />;
};

export default SystemResponseMessage; 