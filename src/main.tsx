import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from "./App";
import './index.css';
// 導入共用組件庫樣式
import '@shared/dist/styles/index.css';
// 導入載入動畫樣式
import '@shared/dist/styles/loading-animations.css';
// 導入共用工具函數
import { initInputBlurHandling } from "@shared/utils";

// 初始化輸入框失焦處理
initInputBlurHandling();

// 創建 QueryClient 實例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
