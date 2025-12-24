//! Platform support commands
//! Responsible for getting platform info, installation location validation, and other cross-platform operations

use serde_json::Value;

/// Get platform info
#[tauri::command]
pub async fn get_platform_info() -> Result<Value, String> {
    let os_type = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    let family = std::env::consts::FAMILY;

    let antigravity_available = crate::platform::is_antigravity_available();
    let antigravity_paths = crate::platform::get_all_antigravity_db_paths();

    Ok(serde_json::json!({
        "os": os_type,
        "arch": arch,
        "family": family,
        "antigravity_available": antigravity_available,
        "antigravity_paths": antigravity_paths.iter().map(|p| p.to_string_lossy()).collect::<Vec<_>>(),
        "config_dir": dirs::config_dir().map(|p| p.to_string_lossy().to_string()),
        "data_dir": dirs::data_dir().map(|p| p.to_string_lossy().to_string()),
        "home_dir": dirs::home_dir().map(|p| p.to_string_lossy().to_string())
    }))
}

/// Find Antigravity installation locations
#[tauri::command]
pub async fn find_antigravity_installations() -> Result<Vec<String>, String> {
    let paths = crate::platform::find_antigravity_installations();
    Ok(paths
        .iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect())
}

/// Validate Antigravity executable path
#[tauri::command]
pub async fn validate_antigravity_executable(path: String) -> Result<bool, String> {
    Ok(crate::antigravity::path_config::validate_executable_path(
        &path,
    ))
}

/// Detect Antigravity installation status (database path)
#[tauri::command]
pub async fn detect_antigravity_installation() -> Result<serde_json::Value, String> {
    // Auto-detect Antigravity database path
    if let Some(db_path) = crate::platform::get_antigravity_db_path() {
        if db_path.exists() {
            let data_dir = db_path
                .parent()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();

            println!("📁 Detected Antigravity database: {}", db_path.display());
            println!("📂 Antigravity data directory: {}", data_dir);

            return Ok(serde_json::json!({
                "found": true,
                "path": data_dir,
                "isCustomPath": false
            }));
        }
    }

    // Not found
    println!("⚠️ Antigravity database not found");
    Ok(serde_json::json!({
        "found": false,
        "path": null,
        "isCustomPath": false
    }))
}

/// Detect Antigravity executable
#[tauri::command]
pub async fn detect_antigravity_executable() -> Result<serde_json::Value, String> {
    // 1. Try to read custom executable path from config
    let custom_exec = crate::antigravity::path_config::get_custom_executable_path().unwrap_or(None);

    // 2. Check if custom executable path is valid
    if let Some(ref path) = custom_exec {
        if crate::antigravity::path_config::validate_executable_path(path) {
            return Ok(serde_json::json!({
                "found": true,
                "path": path,
                "isCustomPath": true
            }));
        }
    }

    // 3. Try auto-detection
    let detected_path = crate::antigravity::starter::detect_antigravity_executable();
    if let Some(exec_path) = detected_path {
        println!("✅ Detected Antigravity executable: {}", exec_path.display());

        return Ok(serde_json::json!({
            "found": true,
            "path": exec_path.to_string_lossy().to_string(),
            "isCustomPath": false
        }));
    }

    // 4. Not found
    println!("⚠️ Antigravity executable not found, start function may be unavailable");
    Ok(serde_json::json!({
        "found": false,
        "path": null,
        "isCustomPath": false
    }))
}

/// Save user custom Antigravity executable path
#[tauri::command]
pub async fn save_antigravity_executable(path: String) -> Result<String, String> {
    // 1. Validate path
    if !crate::antigravity::path_config::validate_executable_path(&path) {
        return Err(format!("Invalid path: file '{}' does not exist or is not an executable", path));
    }

    // 2. Save path to config
    crate::antigravity::path_config::save_custom_executable_path(path.clone())?;

    Ok(format!("Saved Antigravity executable path: {}", path))
}

/// Get currently configured paths
#[tauri::command]
pub async fn get_current_paths() -> Result<serde_json::Value, String> {
    let exec_path = crate::antigravity::path_config::get_custom_executable_path().unwrap_or(None);

    Ok(serde_json::json!({
        "executablePath": exec_path
    }))
}
