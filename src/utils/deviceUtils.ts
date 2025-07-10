/**
 * 設備信息接口
 */
export interface DetailedDeviceInfo {
  userAgent: string;
  browser: {
    name?: string;
    version?: string;
  };
  os: {
    name?: string;
    version?: string;
  };
  device: {
    type?: string;
    model?: string;
  };
  screen?: {
    width: number;
    height: number;
    colorDepth: number;
    pixelRatio: number;
  };
  viewport?: {
    width: number;
    height: number;
  };
  language?: string;
  languages?: readonly string[];
  platform?: string;
  cookieEnabled?: boolean;
  onLine?: boolean;
}

/**
 * 解析用戶代理字符串，獲取詳細的設備和瀏覽器信息
 * @returns 詳細的設備信息對象
 */
export const parseUserAgent = (): DetailedDeviceInfo => {
  const ua = navigator.userAgent;
  const result: DetailedDeviceInfo = {
    userAgent: ua,
    browser: {},
    os: {},
    device: {}
  };

  // 瀏覽器版本檢測
  const browserPatterns = [
    { name: 'Chrome', pattern: /Chrome\/(\d+(?:\.\d+)*)/i },
    { name: 'Firefox', pattern: /Firefox\/(\d+(?:\.\d+)*)/i },
    { name: 'Safari', pattern: /Version\/(\d+(?:\.\d+)*)/i },
    { name: 'Edge', pattern: /Edg\/(\d+(?:\.\d+)*)/i },
    { name: 'Opera', pattern: /OPR\/(\d+(?:\.\d+)*)/i },
    { name: 'Samsung Browser', pattern: /SamsungBrowser\/(\d+(?:\.\d+)*)/i },
    { name: 'UC Browser', pattern: /UCBrowser\/(\d+(?:\.\d+)*)/i }
  ];

  // 作業系統版本檢測
  const osPatterns = [
    // Windows
    { name: 'Windows 11', pattern: /Windows NT 10\.0.*Win64.*x64/i, version: '11' },
    { name: 'Windows 10', pattern: /Windows NT 10\.0/i, version: '10' },
    { name: 'Windows 8.1', pattern: /Windows NT 6\.3/i, version: '8.1' },
    { name: 'Windows 8', pattern: /Windows NT 6\.2/i, version: '8' },
    { name: 'Windows 7', pattern: /Windows NT 6\.1/i, version: '7' },
    
    // macOS
    { name: 'macOS', pattern: /Mac OS X (\d+[._]\d+(?:[._]\d+)*)/i },
    
    // iOS
    { name: 'iOS', pattern: /OS (\d+[._]\d+(?:[._]\d+)*)/i },
    
    // Android
    { name: 'Android', pattern: /Android (\d+(?:\.\d+)*)/i },
    
    // Linux
    { name: 'Linux', pattern: /Linux/i, version: 'Unknown' }
  ];

  // 檢測瀏覽器
  for (const browser of browserPatterns) {
    const match = ua.match(browser.pattern);
    if (match) {
      result.browser.name = browser.name;
      result.browser.version = match[1];
      break;
    }
  }

  // Safari 特殊處理
  if (ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Edg')) {
    const safariMatch = ua.match(/Version\/(\d+(?:\.\d+)*)/i);
    if (safariMatch) {
      result.browser.name = 'Safari';
      result.browser.version = safariMatch[1];
    }
  }

  // 檢測作業系統
  for (const os of osPatterns) {
    if (os.pattern.test(ua)) {
      result.os.name = os.name;
      
      if (os.name === 'macOS' || os.name === 'iOS' || os.name === 'Android') {
        const match = ua.match(os.pattern);
        if (match) {
          result.os.version = match[1].replace(/_/g, '.');
        }
      } else {
        result.os.version = os.version;
      }
      break;
    }
  }

  // 裝置類型檢測
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry/i.test(ua)) {
    result.device.type = 'Mobile';
    
    // iPhone 型號檢測
    if (/iPhone/i.test(ua)) {
      const iPhoneModels = {
        'iPhone OS 15_': 'iPhone 13 系列或更新',
        'iPhone OS 14_': 'iPhone 12 系列',
        'iPhone OS 13_': 'iPhone 11 系列',
        'iPhone OS 12_': 'iPhone XS/XR 系列'
      };
      
      result.device.model = 'iPhone';
      for (const [pattern, model] of Object.entries(iPhoneModels)) {
        if (ua.includes(pattern)) {
          result.device.model = model;
          break;
        }
      }
    }
    
    // iPad 檢測
    if (/iPad/i.test(ua)) {
      result.device.model = 'iPad';
    }
    
    // Android 裝置檢測
    if (/Android/i.test(ua)) {
      const androidModel = ua.match(/\(([^)]*)\)/);
      if (androidModel) {
        result.device.model = androidModel[1];
      }
    }
  } else if (/Tablet|iPad/i.test(ua)) {
    result.device.type = 'Tablet';
  } else {
    result.device.type = 'Desktop';
  }

  // 其他資訊
  if (typeof window !== 'undefined') {
    result.screen = {
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1
    };

    result.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  result.language = navigator.language;
  result.languages = navigator.languages;
  result.platform = navigator.platform;
  result.cookieEnabled = navigator.cookieEnabled;
  result.onLine = navigator.onLine;

  return result;
};

/**
 * 從 navigator.userAgent 獲取設備和瀏覽器信息
 * @returns {Object} 包含設備和瀏覽器信息的對象
 */
export const getDeviceInfo = (): { 
  device: {
    0: string;
    1: string;
  }; 
  deviceVersion: {
    0: string;
    1: string;
  }; 
} => {
  const info = parseUserAgent();
  
  // 設備類型和瀏覽器
  const deviceType = info.os.name || 'Unknown';
  const browserType = info.browser.name || 'Unknown';
  
  // 設備版本和瀏覽器版本
  const deviceVersion = info.os.version || 'Unknown';
  const browserVersion = info.browser.version || 'Unknown';
  
  // 返回指定格式的對象
  return {
    device: {
      0: deviceType,
      1: browserType
    },
    deviceVersion: {
      0: deviceVersion,
      1: browserVersion
    }
  };
}; 