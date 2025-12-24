use crate::system_tray::{update_tray_menu, SystemTrayManager};
use tauri::Manager;

/// Update tray menu (new command, for frontend to call)
#[tauri::command]
pub async fn update_tray_menu_command(
    app: tauri::AppHandle,
    accounts: Vec<String>,
) -> Result<String, String> {
    update_tray_menu(&app, accounts)?;
    Ok("Tray menu updated".to_string())
}

/// Minimize to tray
#[tauri::command]
pub async fn minimize_to_tray(app: tauri::AppHandle) -> Result<String, String> {
    let system_tray = app.state::<SystemTrayManager>();
    system_tray.minimize_to_tray(&app)?;
    Ok("Windows minimized to tray".to_string())
}

/// Restore from tray
#[tauri::command]
pub async fn restore_from_tray(app: tauri::AppHandle) -> Result<String, String> {
    let system_tray = app.state::<SystemTrayManager>();
    system_tray.restore_from_tray(&app)?;
    Ok("Windows restored".to_string())
}
