//! Application settings commands
//! Responsible for managing and storing application configuration, using State pattern

use tauri::{AppHandle, Manager};

/// Save system tray state
#[tauri::command]
pub async fn save_system_tray_state(app: AppHandle, enabled: bool) -> Result<bool, String> {
    crate::log_async_command!("save_system_tray_state", async {
        let system_tray = app.state::<crate::system_tray::SystemTrayManager>();

        if enabled {
            system_tray.enable(&app)?;
        } else {
            system_tray.disable(&app)?;
        }

        let settings_manager = app.state::<crate::app_settings::AppSettingsManager>();
        let settings = settings_manager.get_settings();
        Ok(settings.system_tray_enabled)
    })
}

/// Save silent start state
#[tauri::command]
pub async fn save_silent_start_state(app: AppHandle, enabled: bool) -> Result<bool, String> {
    crate::log_async_command!("save_silent_start_state", async {
        let settings_manager = app.state::<crate::app_settings::AppSettingsManager>();

        settings_manager.update_settings(|settings| {
            settings.silent_start_enabled = enabled;
        })?;

        let settings = settings_manager.get_settings();
        Ok(settings.silent_start_enabled)
    })
}

/// Save privacy mode state
#[tauri::command]
pub async fn save_private_mode_state(app: AppHandle, enabled: bool) -> Result<bool, String> {
    crate::log_async_command!("save_private_mode_state", async {
        let settings_manager = app.state::<crate::app_settings::AppSettingsManager>();

        settings_manager.update_settings(|settings| {
            settings.private_mode = enabled;
        })?;

        let settings = settings_manager.get_settings();
        Ok(settings.private_mode)
    })
}

/// Save Debug Mode state
#[tauri::command]
pub async fn save_debug_mode_state(app: AppHandle, enabled: bool) -> Result<bool, String> {
    crate::log_async_command!("save_debug_mode_state", async {
        let settings_manager = app.state::<crate::app_settings::AppSettingsManager>();

        settings_manager.update_settings(|settings| {
            settings.debug_mode = enabled;
        })?;

        let settings = settings_manager.get_settings();
        Ok(settings.debug_mode)
    })
}

/// Get all application settings
#[tauri::command]
pub async fn get_all_settings(app: AppHandle) -> Result<serde_json::Value, String> {
    crate::log_async_command!("get_all_settings", async {
        let settings_manager = app.state::<crate::app_settings::AppSettingsManager>();
        let settings = settings_manager.get_settings();

        Ok(serde_json::json!({
            "system_tray_enabled": settings.system_tray_enabled,
            "silent_start_enabled": settings.silent_start_enabled,
            "debugMode": settings.debug_mode,
            "privateMode": settings.private_mode
        }))
    })
}
