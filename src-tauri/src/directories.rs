/// Directory retrieval module
/// Unified management of all configuration and data directory paths
use std::fs;
use std::io;
use std::path::PathBuf;
use serde_json::{self, Value};
use tracing::{info, warn};

/// Get the main application configuration directory
/// All configurations, logs, and data are stored uniformly under the .antigravity-agent directory in the user's home directory.
#[cfg(windows)]
pub fn get_config_directory() -> PathBuf {
    let config_dir = dirs::home_dir()
        .expect("Home directory not found")
        .join(".antigravity-agent");

    // Ensure directory exists
    if let Err(e) = fs::create_dir_all(&config_dir) {
        eprintln!("Warning: Unable to create config directory {}: {}", config_dir.display(), e);
    }

    config_dir
}

/// Get main application configuration directory
#[cfg(not(windows))]
pub fn get_config_directory() -> PathBuf {
    let config_dir = dirs::home_dir()
        .expect("Home directory not found")
        .join(".antigravity-agent");

    // Ensure directory exists
    if let Err(e) = fs::create_dir_all(&config_dir) {
        eprintln!("Warning: Unable to create config directory {}: {}", config_dir.display(), e);
    }

    config_dir
}

/// Get log directory path
#[cfg(windows)]
pub fn get_log_directory() -> PathBuf {
    get_config_directory().join("logs")
}

/// Get log directory path
#[cfg(not(windows))]
pub fn get_log_directory() -> PathBuf {
    get_config_directory().join("logs")
}

/// Get accounts backup directory
pub fn get_accounts_directory() -> PathBuf {
    let accounts_dir = get_config_directory().join("antigravity-accounts");

    // Ensure directory exists
    if let Err(e) = fs::create_dir_all(&accounts_dir) {
        eprintln!("Warning: Unable to create accounts directory {}: {}", accounts_dir.display(), e);
    }

    accounts_dir
}

/// Get app settings file path
pub fn get_app_settings_file() -> PathBuf {
    get_config_directory().join("app_settings.json")
}

/// Get window state file path
pub fn get_window_state_file() -> PathBuf {
    get_config_directory().join("window_state.json")
}

/// Get Antigravity path configuration file path
pub fn get_antigravity_path_file() -> PathBuf {
    get_config_directory().join("antigravity_path.json")
}

/// Check and migrate legacy accounts directory to new path on application startup.
/// Currently empty implementation, actual migration logic to be added later.
pub fn migrate_legacy_accounts_if_needed() -> io::Result<()> {
    let new_config_dir = get_config_directory();
    let new_accounts_dir = get_accounts_directory();
    info!(
        target: "app::startup",
        "Current config directory: {}",
        new_config_dir.display()
    );

    // Legacy accounts directory (under Roaming config directory)
    let Some(config_dir) = dirs::config_dir() else {
        info!(target: "app::startup", "System config directory not found (dirs::config_dir), skipping legacy accounts directory detection");
        return Ok(());
    };
    let legacy_accounts_dir = config_dir
        .join(".antigravity-agent")
        .join("antigravity-accounts");
    info!(
        target: "app::startup",
        "Detecting legacy accounts directory: {}",
        legacy_accounts_dir.display()
    );

    // Collect list of JSON files in legacy accounts directory (ignore subdirectories)
    let mut legacy_files = Vec::new();
    let read_dir = match fs::read_dir(&legacy_accounts_dir) {
        Ok(rd) => rd,
        Err(err) if err.kind() == io::ErrorKind::NotFound => return Ok(()),
        Err(err) => return Err(err),
    };
    for entry in read_dir {
        let entry = entry?;
        let path = entry.path();
        if path.is_file() {
            if path
                .extension()
                .and_then(|s| s.to_str())
                .map(|s| s.eq_ignore_ascii_case("json"))
                .unwrap_or(false)
            {
                legacy_files.push(path);
            }
        }
    }
    info!(
        target: "app::startup",
        "Legacy accounts directory file count: {}",
        legacy_files.len()
    );

    // Read JSON and only keep jetskiStateSync.agentManagerInitState field (stored as single key)
    let mut legacy_account_states: Vec<Value> = Vec::new();
    let mut migrated_count = 0usize;
    let mut skipped_existing = 0usize;
    let mut renamed_count = 0usize;
    for json_path in legacy_files {
        let file_name = json_path.file_name().map(|f| f.to_owned());

        if let Some(file_name) = file_name {
            match fs::read_to_string(&json_path) {
                Ok(content) => {
                    match serde_json::from_str::<Value>(&content) {
                        Ok(v) => {
                            // Only use top-level key jetskiStateSync.agentManagerInitState
                            if let Some(state) = v.get("jetskiStateSync.agentManagerInitState") {
                                let mut filtered = serde_json::Map::new();
                                filtered.insert(
                                    "jetskiStateSync.agentManagerInitState".to_string(),
                                    state.clone(),
                                );
                                let filtered_value = Value::Object(filtered);
                                legacy_account_states.push(filtered_value.clone());

                                // Target write path
                                let new_path = new_accounts_dir.join(&file_name);

                                if new_path.exists() {
                                    warn!(
                                        target: "app::startup",
                                        "File with same name already exists in new directory, skipping write: {}",
                                        new_path.display()
                                    );
                                    skipped_existing += 1;
                                } else {
                                    match serde_json::to_string_pretty(&filtered_value) {
                                        Ok(serialized) => {
                                            if let Err(e) = fs::write(&new_path, serialized) {
                                                warn!(
                                                    target: "app::startup",
                                                    "Failed to write new file: {}, error: {}",
                                                    new_path.display(),
                                                    e
                                                );
                                            } else {
                                                migrated_count += 1;
                                            }
                                        }
                                        Err(e) => {
                                            warn!(
                                                target: "app::startup",
                                                "Failed to serialize JSON: {}, error: {}",
                                                json_path.display(),
                                                e
                                            );
                                        }
                                    }
                                }
                            } else {
                                warn!(
                                    target: "app::startup",
                                    "jetskiStateSync.agentManagerInitState not found, file ignored: {}",
                                    json_path.display()
                                );
                            }
                        }
                        Err(e) => {
                            warn!(
                                target: "app::startup",
                                "Failed to parse JSON (ignoring this file): {}, error: {}",
                                json_path.display(),
                                e
                            );
                        }
                    }
                }
                Err(e) => {
                    warn!(
                        target: "app::startup",
                        "Failed to read file (ignoring this file): {}, error: {}",
                        json_path.display(),
                        e
                    );
                }
            }
        } else {
            warn!(
                target: "app::startup",
                "Invalid filename, skipping: {}",
                json_path.display()
            );
        }

        // Regardless of whether write/parse succeeds, try to rename old file to .bak
        let bak_path = json_path.with_extension("bak");
        match fs::rename(&json_path, &bak_path) {
            Ok(()) => {
                renamed_count += 1;
            }
            Err(e) => {
                warn!(
                    target: "app::startup",
                    "Failed to rename old file to .bak: {} -> {}, error: {}",
                    json_path.display(),
                    bak_path.display(),
                    e
                );
            }
        }
    }
    info!(
        target: "app::startup",
        "Extracted legacy account states: {}, successfully migrated: {}, skipped due to same name: {}, renamed to .bak: {}",
        legacy_account_states.len(),
        migrated_count,
        skipped_existing,
        renamed_count
    );

    // TODO: Detect legacy accounts directory under Roaming and migrate to new directory, handle conflicts and errors.
    Ok(())
}
