import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfile, initializeSession, ProfileResponse, InitializeResponse, mockInitializeResponse, setSessionId } from '../services/apiService';
import { getCodeFromUrl } from '../utils/urlUtils';
import { getDeviceInfo } from '../utils/deviceUtils';
import { useEffect } from 'react';

/**
 * 處理應用初始化流程的 hook
 * @param shouldFetchApi - 是否需要打API獲取用戶Profile和初始化會話
 * 1. 獲取用戶 profile
 * 2. 使用 profile 中的 customerId 初始化會話
 */
export const useInitialization = (shouldFetchApi: boolean = true) => {
  const queryClient = useQueryClient();
  // 從 URL 獲取 code，如果沒有則使用默認值 'dev_test_code'
  const code = getCodeFromUrl() || 'dev_test_code';
  const deviceInfo = getDeviceInfo();
  
  // 獲取用戶 profile
  const profileQuery = useQuery<ProfileResponse, Error>({
    queryKey: ['profile', code],
    queryFn: () => getProfile(code),
    retry: 0, // 失敗時不重試
    enabled: shouldFetchApi && !!code, // 只有在需要打API且有code值時才啟用
  });
  
  // 檢查 customerId 是否有效
  const isCustomerIdValid = !!profileQuery.data?.customerId && 
                           profileQuery.data.customerId.trim() !== '';
  
  // 使用 profile 中的 customerId 初始化會話
  const initializeQuery = useQuery<InitializeResponse, Error>({
    queryKey: ['initialize'],
    queryFn: () => {
      if (!isCustomerIdValid || !profileQuery.data) {
        throw new Error('CustomerId not available');
      }
      return initializeSession(
        profileQuery.data.customerId, 
        deviceInfo.device, 
        deviceInfo.deviceVersion
      );
    },
    retry: 0, // 失敗時不重試
    enabled: shouldFetchApi && isCustomerIdValid, // 只有在需要打API且獲取到有效的 customerId 後才執行
  });
  
  // 使用 useEffect 保存 sessionId
  useEffect(() => {
    if (initializeQuery.data?.sessionId) {
      setSessionId(initializeQuery.data.sessionId);
    } else if (!shouldFetchApi && mockInitializeResponse.sessionId) {
      setSessionId(mockInitializeResponse.sessionId);
    }
  }, [initializeQuery.data, shouldFetchApi]);
  
  // 判斷是否應該顯示 TOKEN_LIMIT_ERROR 狀態
  const shouldShowTokenLimitError = 
    shouldFetchApi && 
    initializeQuery.isSuccess && 
    (
      (initializeQuery.data?.requestLimitAmount !== undefined && 
       initializeQuery.data?.usedAmount !== undefined && 
       initializeQuery.data.requestLimitAmount === initializeQuery.data.usedAmount)
    );
  
  // 如果 requestLimitAmount 等於 usedAmount，則顯示 token limit error
  useEffect(() => {
    if (shouldShowTokenLimitError) {
      // 可以在這裡添加額外的處理邏輯，例如禁用輸入框
      console.log('Token limit error: requestLimitAmount === usedAmount');
    }
  }, [shouldShowTokenLimitError]);

  // 判斷是否應該顯示前端加載失敗
  const shouldShowFrontendError = 
    shouldFetchApi && 
    (profileQuery.isError || 
    (initializeQuery.isError && profileQuery.isSuccess) ||
    !code || 
    (profileQuery.isSuccess && !isCustomerIdValid)); // 如果 customerId 無效也顯示錯誤
  
  // 獲取數據，如果不需要打API則使用模擬數據
  const data = shouldFetchApi ? initializeQuery.data : mockInitializeResponse;
  
  // 從 questionSuggest 中提取使用介紹的系統回覆文本
  const introductionText = data?.questionSuggest?.find(
    item => item.questionContent.includes('使用介紹')
  )?.questionText || '';
  
  return {
    isLoading: shouldFetchApi && (profileQuery.isLoading || (initializeQuery.isLoading && profileQuery.isSuccess)),
    isError: shouldShowFrontendError,
    shouldShowTokenLimitError,
    data,
    introductionText, // 添加使用介紹文本
  };
}; 