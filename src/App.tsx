import DialogPage from './components/pages/DialogPage';

// 直接設定是否需要打API的參數
// true: 需要打API獲取用戶Profile和初始化會話
// false: 使用模擬的響應數據，不需要依賴後端API
const shouldFetchApi = true;

function App() {
  return (
    <div className="App">
      <DialogPage shouldFetchApi={shouldFetchApi} />
    </div>
  );
}

export default App;
