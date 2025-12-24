/// Check if Antigravity process is running
#[tauri::command]
pub async fn is_antigravity_running() -> bool {
    crate::platform::is_antigravity_running()
}
