//! Database monitoring related commands
//! Provides query and control functions for database monitoring status

use crate::db_monitor::DatabaseMonitor;
use std::sync::Arc;
use tauri::{AppHandle, Manager};

/// Get database monitoring running status
#[tauri::command]
pub async fn is_database_monitoring_running(_app: AppHandle) -> Result<bool, String> {
    crate::log_async_command!("is_database_monitoring_running", async {
        // Smart monitoring is now the default feature, always returns true
        Ok(true)
    })
}

/// Manually start database monitoring
#[tauri::command]
pub async fn start_database_monitoring(app: AppHandle) -> Result<String, String> {
    crate::log_async_command!("start_database_monitoring", async {
        let monitor = app.state::<Arc<DatabaseMonitor>>();
        monitor
            .start_monitoring()
            .await
            .map_err(|e| format!("Failed to start monitoring: {}", e))?;
        Ok("Database monitoring started".to_string())
    })
}

/// Manually stop database monitoring
#[tauri::command]
pub async fn stop_database_monitoring(app: AppHandle) -> Result<String, String> {
    crate::log_async_command!("stop_database_monitoring", async {
        let monitor = app.state::<Arc<DatabaseMonitor>>();
        monitor.stop_monitoring().await;
        Ok("Database monitoring stopped".to_string())
    })
}
