// Button Types
export interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

// Chat Input Types
export interface ChatInputProps {
  inputText: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleInputSubmit: (e: React.FormEvent) => void;
  isDisabled?: boolean;
  showNewChatButton?: boolean;
  toggleNewChatButton?: () => void;
  handleNewChat?: () => void;
  showPlusButton?: boolean;
  className?: string;
  submitIconSrc?: string;
  plusIconSrc?: string;
  bgColor?: string;
}

// Toast Types
export interface ToastMessageProps {
  message: string;
  show?: boolean;
  onClose?: () => void;
  duration?: number;
}

// Privacy Notice Types
export interface PrivacyNoticeProps {
  /**
   * 服務條款的連結
   */
  termsLink?: string;
  /**
   * 提醒事項的連結
   */
  noticeLink?: string;
  /**
   * 自定義樣式類名
   */
  className?: string;
  /**
   * 服務條款點擊事件處理函數
   */
  onTermsClick?: (e: React.MouseEvent) => void;
  /**
   * 提醒事項點擊事件處理函數
   */
  onNoticeClick?: (e: React.MouseEvent) => void;
}

// Error Buttons Type
export interface ErrorButton {
  label: string;
  onClick: () => void;
}

export interface ErrorButtonsListProps {
  buttons: ErrorButton[];
}

// Consumption Buttons Type
export interface ConsumptionButton {
  label: string;
  onClick: () => void;
}

export interface ConsumptionButtonsListProps {
  buttons: ConsumptionButton[];
}

// TermsModal元件的Props介面
export interface TermsModalProps {
  /**
   * 控制模態窗是否開啟
   */
  isOpen: boolean;
  
  /**
   * 關閉模態窗的回調函數
   */
  onClose: () => void;
  
  /**
   * 確認按鈕點擊後的連結，如果提供則跳轉到該連結
   */
  confirmLink?: string;
  
  /**
   * 模態窗標題，默認為「確定要離開嗎？」
   */
  title?: string;
  
  /**
   * 模態窗內容，默認為「您即將離開 CUBE App 前往其他網頁。」
   */
  content?: string;

  /**
   * 自定義樣式類名
   */
  className?: string;
  
  /**
   * 取消按鈕文字，默認為「取消」
   */
  cancelText?: string;
  
  /**
   * 確認按鈕文字，默認為「確認」
   */
  confirmText?: string;
  
  /**
   * 自定義圖標URL
   */
  iconSrc?: string;
}

// ReminderModal元件的Props介面
export interface ReminderModalProps {
  /**
   * 控制模態窗是否開啟
   */
  isOpen: boolean;
  
  /**
   * 關閉模態窗的回調函數
   */
  onClose: () => void;
  
  /**
   * 模態窗標題，默認為「提醒事項」
   */
  title?: string;
  
  /**
   * 提醒事項內容，可以是字串、ReactNode或字串陣列
   * - 如果是字串，直接顯示
   * - 如果是字串陣列，將每個項目顯示為列表項
   * - 如果是ReactNode，直接渲染
   */
  content: string | string[] | React.ReactNode;
  
  /**
   * 自定義樣式類名
   */
  className?: string;
  
  /**
   * 是否自動調整大小以適應聊天室
   */
  autoResize?: boolean;
  
  /**
  * 自定義圖標URL
  */
 iconSrc?: string;
} 