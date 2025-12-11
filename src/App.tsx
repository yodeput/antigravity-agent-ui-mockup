import React, {useEffect, useState} from 'react';
import {useDevToolsShortcut} from './hooks/useDevToolsShortcut';
import {useAntigravityAccount} from './modules/use-antigravity-account.ts';
import {DATABASE_EVENTS, useDbMonitoringStore} from './modules/db-monitoring-store';
import {useAntigravityIsRunning} from './hooks/useAntigravityIsRunning';
import {Toaster} from 'react-hot-toast';
import AppToolbar from './components/app/AppToolbar.tsx';
import {TooltipProvider} from './components/ui/tooltip';
import {AppContent} from "@/components/app/AppContent.tsx";
import {AppLoader} from "@/components/app/AppLoader.tsx";
import {PlatformCommands} from "@/commands/PlatformCommands.ts";

function App() {
  // ========== 应用状态 ==========
  const [isDetecting, setIsDetecting] = useState(true);
  
  // ========== Hook 集成 ==========
  useDevToolsShortcut();

  // 用户管理
  const antigravityAccount = useAntigravityAccount();

  // 监听数据库变化事件
  const dbMonitoringActions = useDbMonitoringStore();

  useEffect(() => {
    // 初始化监控（自动启动）
    dbMonitoringActions.initializeMonitoring();

    // 添加事件监听器
    return dbMonitoringActions.addListener(DATABASE_EVENTS.DATA_CHANGED, antigravityAccount.insertOrUpdateCurrentAccount);
  }, []);

  // 启动 Antigravity 进程状态自动检查
  const antigravityIsRunning = useAntigravityIsRunning();

  useEffect(() => {
    antigravityIsRunning.startAutoCheck();
    return () => antigravityIsRunning.stopAutoCheck();
  }, []);

  // ========== 初始化启动流程 ==========
  const initializeApp = async () => {
    try {
      await PlatformCommands.detectInstallation()
    } catch (error) {

    } finally {
      setIsDetecting(false);
    }
  };

  // 组件启动时执行初始化
  useEffect(() => {
    initializeApp();
  }, []);

  // ========== 渲染逻辑 ==========
  if (isDetecting) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 mx-auto mb-6 text-blue-500"></div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
            正在检测 Antigravity...
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            请稍候，正在查找 Antigravity 安装路径
          </p>
        </div>
      </div>
    );
  }

  return <>
    <TooltipProvider>
      <AppToolbar />
      <AppContent />
    </TooltipProvider>
    <Toaster
      position="bottom-right"
      reverseOrder={false}
    />
    <AppLoader />
  </>;
}

export default App;
