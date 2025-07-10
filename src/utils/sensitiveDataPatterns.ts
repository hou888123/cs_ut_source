// 敏感資訊的正則表達式
export const SENSITIVE_DATA_PATTERNS = {
    // ID: 英文字母後包含8~9碼數字
    ID: /[A-Za-z]([\s\-_.,]*)\d([\s\-_.,]*\d){8,9}/,
    
    // 帳號/健保卡號/信用卡號: 可能有任意分隔的12碼以上數字
    ACCOUNT_NUMBER: /(\d[\s\-_.,]*){12}/,
    
    // 手機號碼: 8~10碼數字
    MOBILE_NUMBER: /^09\d{8}$/,
    
    // 居留證號碼/護照號碼: 1~2碼英文+6~9碼數字
    RESIDENCE_PASSPORT: /[A-Za-z]{1,2}[\s\-_.,]*[0-9]{6,9}/,
    
    // Email: 用戶名@域名
    EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    
    // 室內電話號碼: 2-3碼的區碼(可能有括號)+6-8個數字
    PHONE_NUMBER: /^(?:(?:\(0[2-8]\)|0[2-8])(?:[\s\-_])?\d{6,8}|(?:\(037\)|037|(?:\(049\)|049)|(?:\(082\)|082)|(?:\(0826\)|0826)|(?:\(0836\)|0836)|(?:\(089\)|089))(?:[\s\-_])?\d{6,8})$/,
    
    // IPv4 地址: 四組1-3位介於0-255的數字，以"."區隔
    IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  };
  
  /**
   * 檢查文本是否含有敏感資訊
   * @param text 要檢查的文本
   * @returns boolean 是否含有敏感資訊
   */
  export const containsSensitiveData = (text: string): boolean => {
    // 如果輸入為 null 或 undefined，則直接返回 false
    if (!text) {
      return false;
    }
    
    // 檢查每個正則表達式模式
    for (const pattern of Object.values(SENSITIVE_DATA_PATTERNS)) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }; 