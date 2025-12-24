// Window event handling module
// Responsible for restoring window state on application startup

use super::state_manager::{load_window_state, save_window_state, WindowState};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::Manager;

/// Initialize window event handler
pub fn init_window_event_handler(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // Get main window
    let main_window = app.get_webview_window("main").ok_or("Unable to get main window")?;

    // Create shared state for save operations, used for debounce and restore flag
    let is_restoring = Arc::new(Mutex::new(true)); // Restore flag to prevent saving state
    let debounce_timer = Arc::new(Mutex::new(None::<tauri::async_runtime::JoinHandle<()>>)); // Debounce timer handle
    const DEBOUNCE_DURATION: Duration = Duration::from_secs(2); // Debounce delay time

    // On application startup, try to restore the last saved window state
    let window_clone = main_window.clone();
    let is_restoring_clone = is_restoring.clone();
    tauri::async_runtime::spawn(async move {
        match load_window_state().await {
            Ok(saved_state) => {
                tracing::debug!(
                    target: "window::restore",
                    x = %saved_state.x,
                    y = %saved_state.y,
                    width = %saved_state.width,
                    height = %saved_state.height,
                    maximized = %saved_state.maximized,
                    "Restoring window state"
                );

                // Set window position
                if let Err(e) =
                    window_clone.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                        x: saved_state.x as i32,
                        y: saved_state.y as i32,
                    }))
                {
                    tracing::warn!(target: "window::restore", error = %e, "Failed to restore window position, using default position");
                }

                // Set window size
                if let Err(e) = window_clone.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                    width: saved_state.width as u32,
                    height: saved_state.height as u32,
                })) {
                    tracing::warn!(target: "window::restore", error = %e, "Failed to restore window size, using default size");
                }

                // If previously maximized, restore maximized state
                if saved_state.maximized {
                    if let Err(e) = window_clone.maximize() {
                        eprintln!("⚠️ Failed to restore window maximized state: {}", e);
                    } else {
                        println!("✅ Window state restored (including maximized)");
                    }
                } else {
                    println!("✅ Window state restored");
                }
            }
            Err(e) => {
                eprintln!("⚠️ Failed to load window state: {}, will use default state", e);
                println!("✅ Using default window state");
            }
        }

        // After restore completes, wait a short time to ensure all window events are processed, then clear restore flag
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        // Safe lock acquisition to avoid poisoned lock panic
        match is_restoring_clone.lock() {
            Ok(mut flag) => {
                *flag = false;
                println!("✅ Window state restore flag cleared, now responding to window change events");
            }
            Err(_) => {
                eprintln!("⚠️ Restore flag lock poisoned, unable to clear flag");
            }
        }
    });

    // Debounced save function - simpler implementation to avoid complex borrowing
    let window_for_save = main_window.clone();
    let is_restoring_for_save = is_restoring.clone();
    let timer_for_save = debounce_timer.clone();

    let schedule_save = move || {
        // Cancel previous timer
        let timer = timer_for_save.clone();
        {
            if let Ok(mut timer_guard) = timer.try_lock() {
                if let Some(handle) = timer_guard.take() {
                    handle.abort();
                }
            }
        } // Lock is automatically released here

        // Clone variables needed for async task
        let window = window_for_save.clone();
        let restoring = is_restoring_for_save.clone();
        let timer_clone = timer_for_save.clone();

        // Start a new delayed save task
        let handle = tauri::async_runtime::spawn(async move {
            tokio::time::sleep(DEBOUNCE_DURATION).await;

            // Check if restore is in progress
            let should_save = match restoring.try_lock() {
                Ok(is_restoring_flag) => !*is_restoring_flag,
                Err(_) => {
                    tracing::warn!(target: "window::event", "Restore flag lock occupied, skipping save");
                    false
                }
            };

            if should_save {
                save_current_window_state(&window).await;
                tracing::debug!(target: "window::event", "Window state saved (after debounce delay)");
            }

            // Clear timer
            if let Ok(mut timer_guard) = timer_clone.try_lock() {
                *timer_guard = None;
            }
        });

        // Save timer handle
        if let Ok(mut timer_guard) = timer_for_save.try_lock() {
            *timer_guard = Some(handle);
        }
    };

    // Listen for window events, including size change, move, and close
    let window_for_events = main_window.clone();
    let schedule_save_clone = schedule_save.clone();

    window_for_events.clone().on_window_event(move |event| {
        match event {
            // On window resize or move, use debounce mechanism for delayed save
            tauri::WindowEvent::Resized { .. } | tauri::WindowEvent::Moved { .. } => {
                tracing::debug!(target: "window::event", "Window change detected, starting debounced save");
                schedule_save_clone();
            }
            // Note: Tauri 2.x doesn't have Maximized/Unmaximized events
            // Maximize/restore state will be captured and handled in Resized events
            // Handle system tray logic on window close
            tauri::WindowEvent::CloseRequested { api, .. } => {
                tracing::info!(target: "window::event", "Received window close request event");

                // Check if system tray is enabled
                let app_handle = window_for_events.app_handle();
                let system_tray = app_handle.state::<crate::system_tray::SystemTrayManager>();
                let tray_enabled = system_tray.is_enabled_setting(app_handle);

                if tray_enabled {
                    tracing::info!(target: "window::event", "System tray enabled, preventing close and minimizing to tray");
                    // Prevent window from closing
                    api.prevent_close();

                    // Execute minimize operation in async runtime
                    let app_handle = window_for_events.app_handle().clone();
                    tauri::async_runtime::spawn(async move {
                        let system_tray =
                            app_handle.state::<crate::system_tray::SystemTrayManager>();
                        if let Err(e) = system_tray.minimize_to_tray(&app_handle) {
                            tracing::error!(target: "window::event", error = %e, "Failed to minimize to tray");
                        }
                    });
                    return;
                }

                tracing::info!(target: "window::event", "System tray not enabled, saving state immediately and allowing close");

                // If system tray is not enabled, save state immediately and allow close (no debounce needed)
                let window = window_for_events.clone();
                tauri::async_runtime::spawn(async move {
                    save_current_window_state(&window).await;
                    tracing::debug!(target: "window::event", "Window state saved before close");
                });
            }
            _ => {}
        }
    });

    Ok(())
}

/// Helper function to save current window state
async fn save_current_window_state(window: &tauri::WebviewWindow) {
    if let (Ok(outer_position), Ok(outer_size), Ok(is_maximized)) = (
        window.outer_position(),
        window.outer_size(),
        window.is_maximized(),
    ) {
        let current_state = WindowState {
            x: outer_position.x as f64,
            y: outer_position.y as f64,
            width: outer_size.width as f64,
            height: outer_size.height as f64,
            maximized: is_maximized,
        };

        if let Err(e) = save_window_state(current_state).await {
            eprintln!("Failed to save window state: {}", e);
        }
    }
}
