use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::AppHandle;

/// Application settings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct AppSettings {
    /// Whether to enable system tray
    pub system_tray_enabled: bool,
    /// Whether to enable silent start (minimize to tray or background on startup)
    pub silent_start_enabled: bool,
    /// Debug mode: record debug level logs (write to file)
    pub debug_mode: bool,
    /// Privacy mode: user information obfuscation (email/username)
    pub private_mode: bool,
}

fn default_private_mode() -> bool {
    true
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            system_tray_enabled: false,
            silent_start_enabled: false,
            debug_mode: false,
            private_mode: default_private_mode(),
        }
    }
}

pub fn load_settings_from_disk(config_path: &PathBuf) -> AppSettings {
    if config_path.exists() {
        match fs::read_to_string(config_path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => AppSettings::default(),
        }
    } else {
        AppSettings::default()
    }
}

impl AppSettings {
    /// Validate settings to ensure no dangerous configuration combinations
    pub fn validate(&mut self) -> bool {
        let mut changed = false;

        // If silent start is enabled but system tray is disabled, this is a dangerous configuration
        // Automatically disable silent start to ensure safety
        if self.silent_start_enabled && !self.system_tray_enabled {
            tracing::warn!(
                target: "app_settings::validate",
                "Detected dangerous configuration combination: silent start enabled but system tray is disabled. Automatically disabling silent start for safety."
            );
            self.silent_start_enabled = false;
            changed = true;
        }

        changed
    }
}

/// Application settings manager
pub struct AppSettingsManager {
    settings: Mutex<AppSettings>,
    config_path: PathBuf,
}

impl AppSettingsManager {
    /// Create a new settings manager
    pub fn new(_app_handle: &AppHandle) -> Self {
        // Use the unified configuration directory
        let config_path = crate::directories::get_app_settings_file();

        // Try to load existing settings
        let mut settings = load_settings_from_disk(&config_path);

        // 验证并修正已存在的设置
        if settings.validate() {
            tracing::warn!(
                target: "app_settings::init",
                "Loaded settings contain dangerous configurations, automatically corrected"
            );
        }

        Self {
            settings: Mutex::new(settings),
            config_path,
        }
    }

    /// Get a copy of the current settings
    pub fn get_settings(&self) -> AppSettings {
        self.settings.lock().unwrap().clone()
    }

    /// Update settings
    pub fn update_settings<F>(&self, update_fn: F) -> Result<(), String>
    where
        F: FnOnce(&mut AppSettings),
    {
        let mut settings = self.settings.lock().unwrap();

        // Record the old state for logging
        let old_silent_start = settings.silent_start_enabled;
        let old_system_tray = settings.system_tray_enabled;

        update_fn(&mut settings);

        // Validate settings and log if any changes were made
        if settings.validate() {
            tracing::info!(
                target: "app_settings::update",
                old_silent_start = old_silent_start,
                old_system_tray = old_system_tray,
                new_silent_start = settings.silent_start_enabled,
                new_system_tray = settings.system_tray_enabled,
                "Settings validated and automatically corrected"
            );
        }

        // Save to file
        let json = serde_json::to_string_pretty(&*settings)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;

        if let Some(parent) = self.config_path.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
        }

        fs::write(&self.config_path, json).map_err(|e| format!("Failed to write settings file: {}", e))?;

        Ok(())
    }
}
