import "./lib/dayjs-setup"
import React, {useEffect, useState} from 'react';
import {useDevToolsShortcut} from './hooks/use-devTools-shortcut.ts';
import {useAntigravityAccount} from './modules/use-antigravity-account.ts';
import {DATABASE_EVENTS, useDbMonitoringStore} from './modules/db-monitoring-store';
import {useAntigravityIsRunning} from './hooks/use-antigravity-is-running.ts';
import {Toaster} from 'react-hot-toast';
import AppDock from './components/app/AppDock.tsx';
import {AppContent} from "@/components/app/AppContent.tsx";
import {AppLoader} from "@/components/app/AppLoader.tsx";
import {PlatformCommands} from "@/commands/PlatformCommands.ts";
import {useAppSettings} from "@/modules/use-app-settings.ts";

function App() {
  // ========== Application State ==========
  const [isDetecting, setIsDetecting] = useState(true);

  // ========== Hook Integration ==========
  useDevToolsShortcut();
  const hydrateAppSettings = useAppSettings(state => state.hydrate);

  // User management
  const antigravityAccount = useAntigravityAccount();

  // Listen for database change events
  const dbMonitoringActions = useDbMonitoringStore();

  useEffect(() => {
    // Initialize monitoring (auto-start)
    dbMonitoringActions.start();

    // Add event listener
    const unlisten = dbMonitoringActions.addListener(DATABASE_EVENTS.DATA_CHANGED, antigravityAccount.insertOrUpdateCurrentAccount);

    // Remove listener on component unmount
    return () => {
      unlisten()
      dbMonitoringActions.stop()
    };
  }, []);

  // Start Antigravity process status auto-check
  const antigravityIsRunning = useAntigravityIsRunning();

  useEffect(() => {
    antigravityIsRunning.start();
    antigravityAccount.insertOrUpdateCurrentAccount()

    return () => antigravityIsRunning.stop();
  }, []);

  // ========== Initialization Flow ==========
  const initializeApp = async () => {
    try {
      await PlatformCommands.detectInstallation()
    } catch (error) {

    } finally {
      setIsDetecting(false);
    }
  };

  // Execute initialization on component mount
  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    hydrateAppSettings();
  }, []);

  // ========== Render Logic ==========
  if (isDetecting) {
    return (
      <div
        className="flex items-center justify-center min-h-screen from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 mx-auto mb-6 text-blue-500"></div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
            Detecting Antigravity database...
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Please wait, searching for Antigravity database path
          </p>
        </div>
      </div>
    );
  }

  return <>
    <AppDock />
    <AppContent />
    <Toaster
      position="bottom-right"
      reverseOrder={false}
    />
    <AppLoader />
  </>;
}

export default App;
