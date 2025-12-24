//! Account backup/import-export and encryption/decryption commands

use crate::log_async_command;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::time::SystemTime;
use tauri::State;

/// Backup data collection structure
#[derive(Serialize, Deserialize, Debug)]
pub struct AccountExportedData {
    filename: String,
    #[serde(rename = "content")]
    content: Value,
    #[serde(rename = "timestamp")]
    timestamp: u64,
}

/// Restore result
#[derive(Serialize, Deserialize, Debug)]
pub struct RestoreResult {
    #[serde(rename = "restoredCount")]
    restored_count: u32,
    failed: Vec<FailedAccountExportedData>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FailedAccountExportedData {
    filename: String,
    error: String,
}

/// Collect complete content of all account files for export
#[tauri::command]
pub async fn collect_account_contents(
    state: State<'_, crate::AppState>,
) -> Result<Vec<AccountExportedData>, String> {
    let mut backups_with_content = Vec::new();

    // Read JSON files from Antigravity accounts directory
    let antigravity_dir = state.config_dir.join("antigravity-accounts");

    if !antigravity_dir.exists() {
        return Ok(backups_with_content);
    }

    for entry in fs::read_dir(&antigravity_dir).map_err(|e| format!("Failed to read user directory: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.extension().is_some_and(|ext| ext == "json") {
            let filename = path
                .file_name()
                .and_then(|name| name.to_str())
                .map(|s| s.to_string())
                .unwrap_or_default();

            if filename.is_empty() {
                continue;
            }

            match fs::read_to_string(&path).map_err(|e| format!("Failed to read file {}: {}", filename, e))
            {
                Ok(content) => match serde_json::from_str::<serde_json::Value>(&content) {
                    Ok(json_value) => {
                        backups_with_content.push(AccountExportedData {
                            filename,
                            content: json_value,
                            timestamp: SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH)
                                .unwrap_or_default()
                                .as_secs(),
                        });
                    }
                    Err(e) => {
                        tracing::warn!(target: "backup::scan", filename = %filename, error = %e, "Failed to parse JSON from file");
                    }
                },
                Err(_) => {
                    tracing::warn!(target: "backup::scan", filename = %filename, "Failed to read file");
                }
            }
        }
    }

    Ok(backups_with_content)
}

/// Restore backup files to local
#[tauri::command]
pub async fn restore_backup_files(
    account_file_data: Vec<AccountExportedData>,
    state: State<'_, crate::AppState>,
) -> Result<RestoreResult, String> {
    let mut results = RestoreResult {
        restored_count: 0,
        failed: Vec::new(),
    };

    // Get target directory
    let antigravity_dir = state.config_dir.join("antigravity-accounts");

    // Ensure directory exists
    if let Err(e) = fs::create_dir_all(&antigravity_dir) {
        return Err(format!("Failed to create directory: {}", e));
    }

    // Iterate each backup
    for account_file in account_file_data {
        let file_path = antigravity_dir.join(&account_file.filename);

        match fs::write(
            &file_path,
            serde_json::to_string_pretty(&account_file.content).unwrap_or_default(),
        )
        .map_err(|e| format!("Failed to write file: {}", e))
        {
            Ok(_) => {
                results.restored_count += 1;
            }
            Err(e) => {
                results.failed.push(FailedAccountExportedData {
                    filename: account_file.filename,
                    error: e,
                });
            }
        }
    }

    Ok(results)
}

/// Delete specified backup
#[tauri::command]
pub async fn delete_backup(
    name: String,
    state: State<'_, crate::AppState>,
) -> Result<String, String> {
    // Only delete Antigravity account JSON file
    let antigravity_dir = state.config_dir.join("antigravity-accounts");
    let antigravity_file = antigravity_dir.join(format!("{}.json", name));

    if antigravity_file.exists() {
        fs::remove_file(&antigravity_file).map_err(|e| format!("Failed to delete file: {}", e))?;
        Ok(format!("Deleted user: {}", name))
    } else {
        Err("User file does not exist".to_string())
    }
}

/// Clear all backups
#[tauri::command]
pub async fn clear_all_backups(state: State<'_, crate::AppState>) -> Result<String, String> {
    let antigravity_dir = state.config_dir.join("antigravity-accounts");

    if antigravity_dir.exists() {
        // Read all files in directory
        let mut deleted_count = 0;
        for entry in
            fs::read_dir(&antigravity_dir).map_err(|e| format!("Failed to read directory: {}", e))?
        {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
            let path = entry.path();

            // Only delete JSON files
            if path.extension().is_some_and(|ext| ext == "json") {
                fs::remove_file(&path)
                    .map_err(|e| format!("Failed to delete file: {}", path.display()))?;
                deleted_count += 1;
            }
        }

        Ok(format!(
            "Cleared all user backups, deleted {} files",
            deleted_count
        ))
    } else {
        Ok("User directory does not exist, no action taken".to_string())
    }
}

/// Encrypt config data (for account export)
#[tauri::command]
pub async fn encrypt_config_data(json_data: String, password: String) -> Result<String, String> {
    log_async_command!("encrypt_config_data", async {
        use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};

        if password.is_empty() {
            return Err("Password cannot be empty".to_string());
        }

        let password_bytes = password.as_bytes();
        let mut result = Vec::new();

        // XOR 加密
        for (i, byte) in json_data.as_bytes().iter().enumerate() {
            let key_byte = password_bytes[i % password_bytes.len()];
            result.push(byte ^ key_byte);
        }

        // Base64 编码
        let encoded = BASE64.encode(&result);

        Ok(encoded)
    })
}

/// Decrypt config data (for account import)
#[tauri::command]
pub async fn decrypt_config_data(
    encrypted_data: String,
    password: String,
) -> Result<String, String> {
    log_async_command!("decrypt_config_data", async {
        use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};

        if password.is_empty() {
            return Err("Password cannot be empty".to_string());
        }

        let decoded = BASE64
            .decode(encrypted_data)
            .map_err(|_| "Base64 decoding failed".to_string())?;

        let password_bytes = password.as_bytes();
        let mut result = Vec::new();

        for (i, byte) in decoded.iter().enumerate() {
            let key_byte = password_bytes[i % password_bytes.len()];
            result.push(byte ^ key_byte);
        }

        let decrypted =
            String::from_utf8(result).map_err(|_| "Decryption failed, data may be corrupted".to_string())?;

        Ok(decrypted)
    })
}

/// Backup and restart Antigravity (migrated from process_commands)
#[tauri::command]
pub async fn sign_in_new_antigravity_account() -> Result<String, String> {
    println!("🔄 Starting sign_in_new_antigravity_account command");

    // 1. Close process (if exists)
    println!("🛑 Step 1: Checking and closing Antigravity processes");
    let kill_result = match crate::platform::kill_antigravity_processes() {
        Ok(result) => {
            if result.contains("not found") {
                println!("ℹ️ Antigravity process not running, skipping close step");
                "Antigravity process not running".to_string()
            } else {
                println!("✅ Process close result: {}", result);
                result
            }
        }
        Err(e) => {
            if e.contains("not found") {
                println!("ℹ️ Antigravity process not running, skipping close step");
                "Antigravity process not running".to_string()
            } else {
                return Err(format!("Error closing processes: {}", e));
            }
        }
    };

    // Wait 500ms to ensure process is fully closed (shortened wait time to avoid frontend timeout)
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

    // 2. Backup current account info (directly call save_antigravity_current_account)
    println!("💾 Step 2: Calling save_antigravity_current_account to backup current account info");
    let backup_info = match crate::commands::save_antigravity_current_account().await {
        Ok(msg) => {
            println!("✅ Backup completed: {}", msg);
            Some(msg)
        }
        Err(e) => {
            println!("⚠️ Backup failed: {}", e);
            None
        }
    };

    // 3. Clear all Antigravity data (complete logout)
    println!("🗑️ Step 3: Clearing all Antigravity data (completely logout)");
    match crate::antigravity::cleanup::clear_all_antigravity_data().await {
        Ok(result) => {
            println!("✅ Clearing completed: {}", result);
        }
        Err(e) => {
            // Clearing failed possibly because database was already empty, this is normal
            println!("ℹ️ Clearing data failed: {} (Database is already empty)", e);
        }
    }

    // Wait 300ms to ensure operation is complete (shortened wait time to avoid frontend timeout)
    tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;

    // 4. Restart process
    println!("🚀 Step 4: Restarting Antigravity");
    let start_result = crate::antigravity::starter::start_antigravity();
    let start_message = match start_result {
        Ok(result) => {
            println!("✅ Start result: {}", result);
            result
        }
        Err(e) => {
            println!("⚠️ Start failed: {}", e);
            format!("Start failed: {}", e)
        }
    };

    let final_message = if let Some(backup_message) = backup_info {
        format!(
            "{} -> Backup completed: {} -> Clearing data completed -> {}",
            kill_result, backup_message, start_message
        )
    } else {
        format!(
            "{} -> No login user detected (skipping backup) -> Clearing data completed -> {}",
            kill_result, start_message
        )
    };
    println!("🎉 All operations completed: {}", final_message);

    Ok(final_message)
}
