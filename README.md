# MCP-Cursor-analysis-source

一個基於React和Vite的對話分析系統，可以顯示對話歷史、消費記錄和視覺化圖表。

## 專案目錄結構

```
src/
├── assets/ # 靜態資源文件
├── components/ # 組件目錄
│ ├── atoms/ # 原子組件 - 最小可重複使用單元
│ ├── common/ # 通用元件 - 跨功能模組重複使用
│ ├── hooks/ # 自訂hooks
│ ├── icons/ # 圖示元件
│ ├── modules/ # 功能模組組件
│ │ ├── chat/ # 聊天模組
│ │ ├── consumption/ # 消費性總覽模組
│ │ ├── feedback/ # 回饋模組
│ │ └── pagination/ # 換頁模組
│ ├── pages/ # 頁面層級元件
│ ├── store/ # 狀態管理
│ ├── ui/ # UI元件
│ │ └── charts/ # 圖表組件(圓餅圖,折線圖,長條圖等)
│ └── utils/ # 工具函數
├── docs/ # 文檔
├── styles/ # 樣式文件
├── types/ # 類型定義
└── utils/ # 通用工具函數
```

## 主要功能模組

- **消費性總覽模組**: 提供使用者消費記錄和分析的視覺化介面
- **圖表模組**: 包含圓餅圖、折線圖、長條圖等視覺化組件
- **換頁模組**: 處理大量資料的分頁展示功能
- **聊天模組**: 提供對話介面與互動功能
- **回饋模組**: 收集使用者回饋和評分

## 開發

『`bash
# 安裝依賴
yarn install

# 啟動開發伺服器
yarn dev
```

## 建構

『`bash
# 建置生產版本
yarn build
```

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh