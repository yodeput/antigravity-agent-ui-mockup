use tauri::{AppHandle, Manager};

use crate::app_settings::AppSettingsManager;

/// System tray manager
pub struct SystemTrayManager;

impl SystemTrayManager {
    /// Create a new manager
    pub fn new() -> Self {
        Self
    }

    /// Enable system tray
    pub fn enable(&self, app_handle: &AppHandle) -> Result<(), String> {
        // 1. Update settings
        let settings_manager = app_handle.state::<AppSettingsManager>();
        settings_manager
            .update_settings(|s| s.system_tray_enabled = true)
            .map_err(|e| e.to_string())?;

        // 2. Check if tray already exists
        if let Some(app_tray) = app_handle.tray_by_id("main") {
            tracing::info!("Showing existing tray");
            app_tray.set_visible(true).map_err(|e| {
                tracing::error!("Failed to show tray icon: {e}");
                e.to_string()
            })?;
        } else {
            // Create new tray
            crate::system_tray::create_tray_with_return(app_handle)?;
            tracing::info!("System tray created");
        }

        Ok(())
    }

    /// Disable system tray
    pub fn disable(&self, app_handle: &AppHandle) -> Result<(), String> {
        // 1. Update settings
        let settings_manager = app_handle.state::<AppSettingsManager>();
        settings_manager
            .update_settings(|s| s.system_tray_enabled = false)
            .map_err(|e| e.to_string())?;

        // 2. Hide tray
        if let Some(app_tray) = app_handle.tray_by_id("main") {
            app_tray.set_visible(false).map_err(|e| {
                tracing::error!("Failed to hide tray icon: {e}");
                e.to_string()
            })?;
            tracing::info!("Tray icon hidden");
        }

        Ok(())
    }

    /// Check if system tray should be enabled (based on settings)
    pub fn is_enabled_setting(&self, app_handle: &AppHandle) -> bool {
        app_handle
            .state::<AppSettingsManager>()
            .get_settings()
            .system_tray_enabled
    }

    /// Minimize window to tray
    pub fn minimize_to_tray(&self, app_handle: &AppHandle) -> Result<(), String> {
        if let Some(window) = app_handle.get_webview_window("main") {
            window.hide().map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    /// Restore window from tray
    pub fn restore_from_tray(&self, app_handle: &AppHandle) -> Result<(), String> {
        if let Some(window) = app_handle.get_webview_window("main") {
            window.show().map_err(|e| e.to_string())?;
            window.set_focus().map_err(|e| e.to_string())?;
        }
        Ok(())
    }
}
