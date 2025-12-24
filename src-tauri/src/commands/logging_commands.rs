/// Logging and encryption commands
/// Responsible for log management, file writing, data encryption and decryption
use std::fs;
use std::path::Path;

/// Write text file
/// Write text content to a file at the specified path
#[tauri::command]
pub async fn write_text_file(path: String, content: String) -> Result<String, String> {
    crate::log_async_command!("write_text_file", async {
        let file_path = Path::new(&path);

        // Ensure parent directory exists
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
        }

        // Write to file
        fs::write(file_path, content).map_err(|e| format!("Failed to write file: {}", e))?;

        Ok(format!("File written successfully: {}", path))
    })
}

/// Write frontend log
/// Write frontend log entries to the backend logging system
#[tauri::command]
pub async fn write_frontend_log(log_entry: serde_json::Value) -> Result<(), String> {
    use tracing::{debug, error, info, warn};

    // level: 'info' | 'warn' | 'error' | 'debug'
    let level_str = log_entry
        .get("level")
        .and_then(|v| v.as_str())
        .unwrap_or("info");

    // message
    let message = log_entry
        .get("message")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    // details (frontend will JSON.stringify objects to strings)
    let details = log_entry.get("details").and_then(|v| v.as_str());

    // module: prefer top-level; otherwise try to extract module field from details(JSON)
    let module = log_entry
        .get("module")
        .and_then(|v| v.as_str())
        .map(ToOwned::to_owned)
        .or_else(|| {
            let details_str = details?;
            let details_json = serde_json::from_str::<serde_json::Value>(details_str).ok()?;
            details_json
                .get("module")
                .and_then(|v| v.as_str())
                .map(ToOwned::to_owned)
        })
        .unwrap_or_else(|| "frontend".to_string());

    let full_message = if message.is_empty() {
        format!("[{}]", module)
    } else {
        format!("[{}] {}", module, message)
    };

    // tracing's target requires a static string; use "frontend" uniformly for easy filtering (RUST_LOG / Debug Mode)
    match level_str {
        "error" => match details {
            Some(details) => error!(
                target: "frontend",
                module = module.as_str(),
                details = %details,
                "{}",
                full_message
            ),
            None => error!(target: "frontend", module = module.as_str(), "{}", full_message),
        },
        "warn" => match details {
            Some(details) => warn!(
                target: "frontend",
                module = module.as_str(),
                details = %details,
                "{}",
                full_message
            ),
            None => warn!(target: "frontend", module = module.as_str(), "{}", full_message),
        },
        "debug" => match details {
            Some(details) => debug!(
                target: "frontend",
                module = module.as_str(),
                details = %details,
                "{}",
                full_message
            ),
            None => debug!(target: "frontend", module = module.as_str(), "{}", full_message),
        },
        _ => match details {
            Some(details) => info!(
                target: "frontend",
                module = module.as_str(),
                details = %details,
                "{}",
                full_message
            ),
            None => info!(target: "frontend", module = module.as_str(), "{}", full_message),
        },
    }

    Ok(())
}

/// Get log directory path
#[tauri::command]
pub async fn get_log_directory_path() -> Result<String, String> {
    crate::log_async_command!("get_log_directory_path", async {
        let log_dir = crate::directories::get_log_directory();

        Ok(log_dir.display().to_string())
    })
}

/// Open log directory
/// Open the log directory in the system file manager (e.g., Windows Explorer / macOS Finder / Linux file manager)
#[tauri::command]
pub async fn open_log_directory() -> Result<(), String> {
    crate::log_async_command!("open_log_directory", async {
        let log_dir = crate::directories::get_log_directory();

        tauri_plugin_opener::open_path(&log_dir, None::<&str>)
            .map_err(|e| format!("Failed to open log directory: {}", e))?;

        Ok(())
    })
}
