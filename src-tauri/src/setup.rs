use crate::{app_settings, db_monitor, system_tray, window};
use std::sync::Arc;
use tauri::{App, Manager};

pub fn init(app: &mut App) -> std::result::Result<(), Box<dyn std::error::Error>> {
    tracing::info!(target: "app::setup", "Starting application setup");

    // Initialize app settings manager
    let app_handle = app.handle();
    app.manage(app_settings::AppSettingsManager::new(app_handle));

    // Initialize system tray manager
    app.manage(system_tray::SystemTrayManager::new());

    // Tracing logger is initialized in main(), skip here

    // Disable context menu in release builds
    #[cfg(not(debug_assertions))]
    {
        if let Some(window) = app.get_webview_window("main") {
            // Disabling the context menu in Tauri 2.x requires eval'ing JavaScript
            let _ = window.eval("window.addEventListener('contextmenu', e => e.preventDefault());");
        }
    }

    // Initialize database monitor
    let db_monitor = Arc::new(db_monitor::DatabaseMonitor::new(app.handle().clone()));
    app.manage(db_monitor.clone());

    // Database monitoring will be started via a frontend command; avoid tokio::spawn in setup
    tracing::debug!(target: "app::setup::db_monitor", "Database monitor will auto-start based on frontend settings");

    tracing::info!(target: "app::setup::db_monitor", "Database monitor initialized");

    // Initialize window event handler
    if let Err(e) = window::init_window_event_handler(app) {
        tracing::error!(target: "app::setup::window", error = %e, "Window event handler initialization failed");
    } else {
        tracing::info!(target: "app::setup::window", "Window event handler initialized");
    }

    // Check silent-start settings
    let settings_manager = app.state::<app_settings::AppSettingsManager>();
    let settings = settings_manager.get_settings();

    // Decide whether to create a system tray based on settings
    if settings.system_tray_enabled {
        tracing::info!(target: "app::setup::tray", "System tray enabled, creating tray");
        let system_tray = app.state::<system_tray::SystemTrayManager>();
        if let Err(e) = system_tray.enable(app.handle()) {
            tracing::error!(target: "app::setup::tray", error = %e, "Failed to create system tray on startup");
        } else {
            tracing::info!(target: "app::setup::tray", "System tray created");
        }
    } else {
        tracing::info!(target: "app::setup::tray", "System tray disabled, skipping creation");
    }

    // Double-check: silent-start without system tray is not allowed
    if settings.silent_start_enabled && !settings.system_tray_enabled {
        tracing::warn!(
            target: "app::setup::silent_start",
            "Dangerous configuration detected: silent-start enabled but system tray disabled. Disabling silent-start automatically for safety."
        );

        // Auto-correct this configuration
        if let Err(e) = settings_manager.update_settings(|s| {
            s.silent_start_enabled = false;
        }) {
            tracing::error!(
                target: "app::setup::silent_start",
                error = %e,
                "Failed to auto-correct settings"
            );
        }

        tracing::info!(target: "app::setup::silent_start", "Silent start disabled; showing window normally");
    } else if settings.silent_start_enabled && settings.system_tray_enabled {
        tracing::info!(target: "app::setup::silent_start", "Silent start enabled (system tray enabled), preparing to hide main window");

        // Delay silent start to ensure window state restoration and other initialization complete
        let app_handle_for_silent = app.handle().clone();

        tauri::async_runtime::spawn(async move {
            // Wait 1.5 seconds to ensure window state restoration and other initialization complete
            tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;

            tracing::debug!(target: "app::setup::silent_start", "Performing silent start window hide operation");

            if let Some(main_window) = app_handle_for_silent.get_webview_window("main") {
                // Hide window
                match main_window.hide() {
                    Ok(()) => {
                        tracing::info!(target: "app::setup::silent_start", "Silent start: window hidden");
                        tracing::info!(target: "app::setup::silent_start", "Application can be accessed via system tray icon");
                    }
                    Err(e) => {
                        tracing::error!(target: "app::setup::silent_start", error = %e, "Failed to hide window for silent start");
                    }
                }
            } else {
                tracing::error!(target: "app::setup::silent_start", "Unable to obtain main window for silent start");
            }
        });
    } else {
        tracing::debug!(target: "app::setup::silent_start", "Silent start not enabled, showing window normally");
    }

    tracing::info!(target: "app::setup", "Application setup complete");
    Ok(())
}
