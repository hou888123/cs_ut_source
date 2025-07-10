/**
 * 從 URL 參數中獲取指定參數值
 * @param paramName 參數名稱
 * @param defaultValue 默認值（可選）
 * @returns 參數值或默認值
 */
export const getUrlParam = (paramName: string, defaultValue: string = ''): string => {
  const urlParams = new URLSearchParams(window.location.search);
  const value = urlParams.get(paramName);
  return value || defaultValue;
};

/**
 * 從 URL 參數中獲取 code 值
 * @returns code 值或空字符串
 */
export const getCodeFromUrl = (): string => {
  return getUrlParam('code');
}; 