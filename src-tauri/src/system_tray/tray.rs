//! System tray module
//!
//! Uses Tauri 2.9 built-in tray API for backend tray control

use crate::app_settings::AppSettingsManager;
use tauri::menu::{Menu, MenuBuilder, MenuItem};
use tauri::tray::{TrayIcon, TrayIconBuilder};
use tauri::{AppHandle, Emitter, Manager};

/// Create system tray (returns tray instance)
pub fn create_tray_with_return(app: &AppHandle) -> Result<TrayIcon, String> {
    // Create basic menu (account list will be dynamically updated by frontend)
    let menu = create_basic_menu(app)?;

    // Build tray icon
    let tray = TrayIconBuilder::with_id("main")
        .menu(&menu)
        .on_menu_event(handle_tray_menu_event)
        .show_menu_on_left_click(true)
        .build(app)
        .map_err(|e| format!("Failed to create system tray: {e}"))?;

    // Set tray icon
    if let Some(icon) = app.default_window_icon() {
        tray.set_icon(Some(icon.clone()))
            .map_err(|e| format!("Failed to set tray icon: {e}"))?;
    }

    Ok(tray)
}

/// Create basic menu (without account list)
fn create_basic_menu(app: &AppHandle) -> Result<Menu<tauri::Wry>, String> {
    MenuBuilder::new(app)
        .item(
            &MenuItem::with_id(app, "show_main", "Show Main Window", true, None::<&str>)
                .map_err(|e| format!("Failed to create show main window menu: {e}"))?,
        )
        .separator()
        .item(
            &MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)
                .map_err(|e| format!("Failed to create quit menu: {e}"))?,
        )
        .build()
        .map_err(|e| format!("Failed to build basic menu: {e}"))
}

/// Handle tray menu events
fn handle_tray_menu_event(app: &AppHandle, event: tauri::menu::MenuEvent) {
    tracing::info!("Handling tray menu event: {}", event.id.0);

    match event.id.0.as_str() {
        "show_main" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        "quit" => {
            tracing::info!("Quitting application");
            app.exit(0);
        }
        // Account switch event
        account_id if account_id.starts_with("account_") => {
            let account_email = account_id.strip_prefix("account_").unwrap_or("");
            tracing::info!("Requesting switch to account: {account_email}");

            // Emit event to frontend
            if let Err(e) = app.emit("tray-switch-account", account_email) {
                tracing::error!("Failed to emit account switch event: {e}");
            }
        }
        _ => {
            tracing::warn!("Unhandled menu event: {}", event.id.0);
        }
    }
}

/// Update tray menu (add account list)
pub fn update_tray_menu(app: &AppHandle, accounts: Vec<String>) -> Result<(), String> {
    // Check if tray should be enabled
    let settings_manager = app.state::<AppSettingsManager>();
    let settings = settings_manager.get_settings();

    if !settings.system_tray_enabled {
        tracing::info!("Tray disabled, skipping menu update");
        return Ok(());
    }

    let Some(tray) = app.tray_by_id("main") else {
        return Err("System tray not found".to_string());
    };

    // Create complete menu with account list
    let mut menu_builder = MenuBuilder::new(app);

    // Show main window
    menu_builder = menu_builder.item(
        &MenuItem::with_id(app, "show_main", "Show Main Window", true, None::<&str>)
            .map_err(|e| format!("Failed to create show main window menu: {e}"))?,
    );

    // Add account list
    if !accounts.is_empty() {
        menu_builder = menu_builder.separator();

        for account in &accounts {
            let masked_email = mask_email(account);
            menu_builder = menu_builder.item(
                &MenuItem::with_id(
                    app,
                    format!("account_{}", account),
                    &masked_email,
                    true,
                    None::<&str>,
                )
                .map_err(|e| format!("Failed to create account menu: {e}"))?,
            );
        }
    }

    // Quit application
    menu_builder = menu_builder.separator().item(
        &MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)
            .map_err(|e| format!("Failed to create quit menu: {e}"))?,
    );

    // Build and set new menu
    let new_menu = menu_builder
        .build()
        .map_err(|e| format!("Failed to build new menu: {e}"))?;

    tray.set_menu(Some(new_menu))
        .map_err(|e| format!("Failed to set tray menu: {e}"))?;

    tracing::info!("✅ Tray menu updated with {} accounts", accounts.len());
    Ok(())
}

/// Email masking function
fn mask_email(email: &str) -> String {
    let parts: Vec<&str> = email.split('@').collect();
    if parts.len() != 2 {
        return email.to_string();
    }

    let (local_part, domain) = (parts[0], parts[1]);

    match local_part.len() {
        0 => email.to_string(),
        1 => format!("{}*@{}", &local_part[..1], domain),
        2 => format!("{}*@{}", &local_part[..1], domain),
        _ => format!(
            "{}***{}@{}",
            &local_part[..1],
            &local_part[local_part.len() - 1..],
            domain
        ),
    }
}
