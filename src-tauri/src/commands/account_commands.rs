//! Account base commands: query, backup, restore, switch, cleanup

use crate::antigravity::account::decode_jetski_state_proto;
use base64::Engine;
use prost::Message;
use rusqlite::{Connection, OptionalExtension};
use serde_json::{from_str, Value};
use std::fs;
use tauri::State;
use tracing::instrument;

/// Get all Antigravity accounts (decode jetskiStateSync.agentManagerInitState, return complete SessionResponse JSON)
#[tauri::command]
#[instrument]
pub async fn get_antigravity_accounts(
    state: State<'_, crate::AppState>,
) -> Result<Vec<Value>, String> {
    tracing::debug!("📋 Start getting all Antigravity accounts");

    let start_time = std::time::Instant::now();

    let result = async {
        let mut accounts: Vec<(std::time::SystemTime, Value)> = Vec::new();

        // Get backup directory path
        let antigravity_dir = state.config_dir.join("antigravity-accounts");

        if !antigravity_dir.exists() {
            tracing::info!("📂 Backup directory does not exist, returning empty list");
            return Ok(Vec::new());
        }

        // Read all JSON files in the directory
        let entries =
            fs::read_dir(&antigravity_dir).map_err(|e| format!("Failed to read backup directory: {}", e))?;

        for entry in entries {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
            let path = entry.path();

            // Only process JSON files
            if path.extension().is_some_and(|ext| ext == "json") {
                let file_name = match path.file_stem() {
                    Some(name) => name.to_string_lossy().to_string(),
                    None => continue,
                };

                tracing::debug!("📄 Parsing backup file: {}", file_name);

                // Read and parse JSON file
                let content = fs::read_to_string(&path)
                    .map_err(|e| format!("Failed to read file {}: {}", file_name, e))?;

                let backup_data: Value = from_str(&content)
                    .map_err(|e| format!("Failed to parse JSON {}: {}", file_name, e))?;

                let jetski_state = backup_data
                    .get("jetskiStateSync.agentManagerInitState")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| {
                        format!(
                            "Backup file {} missing jetskiStateSync.agentManagerInitState",
                            file_name
                        )
                    })?;

                let decoded = decode_jetski_state_proto(jetski_state)?;

                let modified_time = fs::metadata(&path)
                    .and_then(|m| m.modified())
                    .unwrap_or(std::time::SystemTime::UNIX_EPOCH);

                accounts.push((modified_time, decoded));

                tracing::info!("✅ Successfully parsed account: {}", file_name);
            }
        }

        // Sort by file modification time (newest first), return only decoded objects
        accounts.sort_by(|a, b| b.0.cmp(&a.0));
        let decoded_only: Vec<Value> = accounts.into_iter().map(|(_, decoded)| decoded).collect();

        tracing::debug!("🎉 Successfully loaded {} accounts", decoded_only.len());

        Ok(decoded_only)
    }
    .await;

    let duration = start_time.elapsed();

    match result {
        Ok(accounts) => {
            tracing::debug!(
                duration_ms = duration.as_millis(),
                account_count = accounts.len(),
                "Successfully got account list"
            );
            Ok(accounts)
        }
        Err(e) => {
            tracing::error!(
                error = %e,
                duration_ms = duration.as_millis(),
                "Failed to get account list"
            );
            Err(e)
        }
    }
}

/// Get current Antigravity account info
#[tauri::command]
#[instrument]
pub async fn get_current_antigravity_account_info() -> Result<Value, String> {
    tracing::info!("Start getting current Antigravity account info");

    let start_time = std::time::Instant::now();

    let result = async {
        // Try to get Antigravity state database path
        let app_data = match crate::platform::get_antigravity_db_path() {
            Some(path) => path,
            None => {
                // If main path doesn't exist, try other possible locations
                let possible_paths = crate::platform::get_all_antigravity_db_paths();
                if possible_paths.is_empty() {
                    return Err("Antigravity installation path not found".to_string());
                }
                possible_paths[0].clone()
            }
        };

        if !app_data.exists() {
            return Err(format!(
                "Antigravity status database file not found: {}",
                app_data.display()
            ));
        }

        // Connect to SQLite database and get authentication info
        let conn = Connection::open(&app_data)
            .map_err(|e| format!("Failed to connect to database ({}): {}", app_data.display(), e))?;

        // jetski state (optional)
        let jetski_state: Option<String> = conn
            .query_row(
                "SELECT value FROM ItemTable WHERE key = 'jetskiStateSync.agentManagerInitState'",
                [],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| format!("Failed to query jetskiStateSync.agentManagerInitState: {}", e))?;

        let state_str = jetski_state
            .ok_or_else(|| " jetskiStateSync.agentManagerInitState not found".to_string())?;

        // Decode jetski state (base64 + proto); fail directly on error
        let decoded = decode_jetski_state_proto(&state_str)?;

        Ok(serde_json::json!(decoded))
    }
    .await;

    let duration = start_time.elapsed();

    match result {
        Ok(data) => {
            tracing::info!(
                duration_ms = duration.as_millis(),
                "Successfully got Antigravity account info"
            );
            Ok(data)
        }
        Err(e) => {
            tracing::error!(
                error = %e,
                duration_ms = duration.as_millis(),
                "Failed to get Antigravity account info"
            );
            Err(e)
        }
    }
}

/// Backup current Antigravity account
#[tauri::command]
#[instrument]
pub async fn save_antigravity_current_account() -> Result<String, String> {
    tracing::info!("📥 Starting to save jetskiStateSync.agentManagerInitState");

    let start_time = std::time::Instant::now();

    let result = async {
        // Try to get Antigravity state database path
        let app_data = match crate::platform::get_antigravity_db_path() {
            Some(path) => path,
            None => {
                // If main path doesn't exist, try other possible locations
                let possible_paths = crate::platform::get_all_antigravity_db_paths();
                if possible_paths.is_empty() {
                    return Err("Antigravity installation path not found".to_string());
                }
                possible_paths[0].clone()
            }
        };

        if !app_data.exists() {
            return Err(format!(
                "Antigravity status database file not found: {}",
                app_data.display()
            ));
        }

        // Connect to SQLite database and get authentication info
        let conn = Connection::open(&app_data)
            .map_err(|e| format!("Failed to connect to database ({}): {}", app_data.display(), e))?;

        // jetski state (required)
        let jetski_state: String = conn
            .query_row(
                "SELECT value FROM ItemTable WHERE key = 'jetskiStateSync.agentManagerInitState'",
                [],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| format!("Failed to query jetskiStateSync.agentManagerInitState: {}", e))?
            .ok_or_else(|| "jetskiStateSync.agentManagerInitState not found".to_string())?;

        // Decode email from jetski proto (only for filename)
        let bytes = base64::engine::general_purpose::STANDARD
            .decode(jetski_state.trim())
            .map_err(|e| format!("Failed to decode jetskiStateSync Base64: {}", e))?;
        let msg = crate::proto::SessionResponse::decode(bytes.as_slice())
            .map_err(|e| format!("jetskiStateSync Protobuf decode failed: {}", e))?;

        let email = msg
            .context
            .as_ref()
            .and_then(|c| {
                if c.email.is_empty() {
                    None
                } else {
                    Some(c.email.as_str())
                }
            })
            .ok_or_else(|| "jetskiStateSync: email field not found".to_string())?;

        // Save the original string directly without decoding, filename follows original logic: {email}.json
        let accounts_dir = crate::directories::get_accounts_directory();
        if let Err(e) = std::fs::create_dir_all(&accounts_dir) {
            return Err(format!("Failed to create accounts directory: {}", e));
        }

        let account_file = accounts_dir.join(format!("{email}.json"));
        let content = serde_json::json!({
            "jetskiStateSync.agentManagerInitState": jetski_state
        });
        std::fs::write(
            &account_file,
            serde_json::to_string_pretty(&content).unwrap(),
        )
        .map_err(|e| format!("Failed to write jetskiStateSync: {}", e))?;

        let message = format!(
            "Saved jetskiStateSync.agentManagerInitState to {}",
            account_file.display()
        );
        tracing::info!(file = %account_file.display(), "✅ Jetski state saved successfully");
        Ok(message)
    }
    .await;

    let duration = start_time.elapsed();

    match result {
        Ok(message) => {
            tracing::info!(
                duration_ms = duration.as_millis(),
                result_message = %message,
                "Account save operation completed"
            );
            Ok(message)
        }
        Err(e) => {
            tracing::error!(
                error = %e,
                duration_ms = duration.as_millis(),
                "Account save operation failed"
            );
            Err(e)
        }
    }
}

/// Clear all Antigravity data
#[tauri::command]
pub async fn clear_all_antigravity_data() -> Result<String, String> {
    crate::antigravity::cleanup::clear_all_antigravity_data().await
}

/// Restore Antigravity account
#[tauri::command]
pub async fn restore_antigravity_account(account_name: String) -> Result<String, String> {
    tracing::debug!(target: "account::restore", account_name = %account_name, "Calling restore_antigravity_account");

    // 1. Build backup file path
    let accounts_dir = crate::directories::get_accounts_directory();
    let account_file = accounts_dir.join(format!("{account_name}.json"));

    // 2. Call unified restore function
    crate::antigravity::restore::save_antigravity_account_to_file(account_file).await
}

/// Switch to Antigravity account (calls restore_antigravity_account)
#[tauri::command]
pub async fn switch_to_antigravity_account(account_name: String) -> Result<String, String> {
    crate::log_async_command!("switch_to_antigravity_account", async {
        // 1. Close Antigravity process (if exists)
        let kill_result = match crate::platform::kill_antigravity_processes() {
            Ok(result) => {
                if result.contains("not found") {
                    tracing::debug!(target: "account::switch::step1", "Antigravity process not running, skipping kill step");
                    "Antigravity process not running".to_string()
                } else {
                    tracing::debug!(target: "account::switch::step1", result = %result, "Antigravity process killed successfully");
                    result
                }
            }
            Err(e) => {
                if e.contains("not found") {
                    tracing::debug!(target: "account::switch::step1", "Antigravity process not running, skipping kill step");
                    "Antigravity process not running".to_string()
                } else {
                    tracing::error!(target: "account::switch::step1", error = %e, "Failed to kill Antigravity process");
                    return Err(format!("Failed to kill Antigravity process: {}", e));
                }
            }
        };

        // Wait one second to ensure process is fully closed
        tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;

        // 2. 清除原来的数据库
        clear_all_antigravity_data().await?;
        tracing::warn!(target: "account::switch::step2", "Antigravity 数据库清除完成");

        // 3. 恢复指定账户到 Antigravity 数据库
        let restore_result = restore_antigravity_account(account_name.clone()).await?;
        tracing::debug!(target: "account::switch::step3", result = %restore_result, "账户数据恢复完成");

        // Wait one second to ensure database operation is complete
        tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;

        // 4. 重新启动 Antigravity 进程
        let start_result = crate::antigravity::starter::start_antigravity();
        let start_message = match start_result {
            Ok(result) => {
                tracing::debug!(target: "account::switch::step4", result = %result, "Antigravity 启动成功");
                result
            }
            Err(e) => {
                tracing::warn!(target: "account::switch::step4", error = %e, "Antigravity 启动失败");
                format!("启动失败: {}", e)
            }
        };

        let final_message = format!("{} -> {} -> {}", kill_result, restore_result, start_message);

        Ok(final_message)
    })
}
