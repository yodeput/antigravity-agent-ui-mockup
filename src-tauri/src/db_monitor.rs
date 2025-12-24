// Database monitoring module - Simplified version: newData, oldData, diff

use serde::Serialize;
use serde_json::Value;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;
use tokio::time::{interval, Duration};
use tracing::{error, info, warn};

// Data difference structure
#[derive(Debug, Clone, Serialize)]
pub struct DataDiff {
    pub has_changes: bool,
    pub changed_fields: Vec<String>,
    pub summary: String,
}

// Database monitor
pub struct DatabaseMonitor {
    app_handle: AppHandle,
    last_data: Arc<Mutex<Option<Value>>>,
    is_running: Arc<Mutex<bool>>,
}

impl DatabaseMonitor {
    /// Create a new database monitor
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            app_handle,
            last_data: Arc::new(Mutex::new(None)),
            is_running: Arc::new(Mutex::new(false)),
        }
    }

    /// Start database monitoring
    pub async fn start_monitoring(&self) -> Result<(), Box<dyn std::error::Error>> {
        info!("🔧 Start database automatic monitoring (simplified version)");

        let last_data = self.last_data.clone();
        let is_running = self.is_running.clone();
        let app_handle = self.app_handle.clone();

        // Mark the monitor as running
        *is_running.lock().await = true;

        tokio::spawn(async move {
            let mut interval = interval(Duration::from_secs(3)); // 3 seconds interval, more sensitive

            loop {
                interval.tick().await;

                // Check if the monitor is still running
                let running = is_running.lock().await;
                if !*running {
                    info!("⏹️ Database monitoring stopped");
                    break;
                }
                drop(running);

                // Get current complete data
                match Self::get_complete_data().await {
                    Ok(new_data) => {
                        let mut last = last_data.lock().await;

                        // Check for data changes
                        if let Some(ref old_data) = *last {
                            // Analyze differences
                            let diff = Self::analyze_diff(old_data, &new_data);

                            if diff.has_changes {
                                info!("📢 Detected database changes: {}", diff.summary);

                                // Build simplified event data: newData, oldData, diff
                                let event_data = serde_json::json!({
                                    "newData": new_data,
                                    "oldData": old_data,
                                    "diff": diff
                                });

                                // Push event to frontend
                                if let Err(e) = app_handle.emit("database-changed", &event_data) {
                                    error!("❌ Failed to push database change event: {}", e);
                                } else {
                                    info!("✅ Database change event pushed successfully");
                                }
                            }
                        }

                        *last = Some(new_data);
                    }
                    Err(e) => {
                        warn!("⚠️ Failed to get complete data: {}", e);
                    }
                }
            }
        });

        Ok(())
    }

    /// Stop database monitoring
    pub async fn stop_monitoring(&self) {
        info!("⏹️ Stop database automatic monitoring");
        *self.is_running.lock().await = false;
    }

    /// Get complete database data
    async fn get_complete_data() -> Result<Value, Box<dyn std::error::Error + Send + Sync>> {
        // Detect database path
        let db_path = if cfg!(windows) {
            dirs::home_dir()
                .unwrap_or_default()
                .join("AppData")
                .join("Roaming")
                .join("Antigravity")
                .join("User")
                .join("globalStorage")
                .join("state.vscdb")
        } else {
            dirs::config_dir()
                .unwrap_or_default()
                .join("Antigravity")
                .join("User")
                .join("globalStorage")
                .join("state.vscdb")
        };

        let mut complete_data = serde_json::Map::new();

        if db_path.exists() {
            let conn = rusqlite::Connection::open(&db_path)?;

            // Query all data (complete ItemTable)
            let mut stmt = conn.prepare("SELECT key, value FROM ItemTable ORDER BY key")?;

            let rows: Vec<(String, String)> = stmt
                .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
                .collect::<Result<Vec<_>, _>>()?;

            // Build complete data object
            for (key, value) in rows {
                // Try to parse as JSON, keep original string if parsing fails
                let json_value: Value = match serde_json::from_str(&value) {
                    Ok(parsed) => parsed,
                    Err(_) => Value::String(value.clone()),
                };

                complete_data.insert(key, json_value);
            }
        }

        Ok(Value::Object(complete_data))
    }

    /// Analyze the differences between two data sets
    fn analyze_diff(old: &Value, new: &Value) -> DataDiff {
        let mut changed_fields = Vec::new();

        // Compare data
        match (old, new) {
            (Value::Object(old_obj), Value::Object(new_obj)) => {
                // 检查新增的字段
                for key in new_obj.keys() {
                    match old_obj.get(key) {
                        Some(old_value) => {
                            if old_value != new_obj.get(key).unwrap() {
                                changed_fields.push(format!("{}: changed", key));
                            }
                        }
                        None => {
                            changed_fields.push(format!("{}: added", key));
                        }
                    }
                }

                // 检查删除的字段
                for key in old_obj.keys() {
                    if !new_obj.contains_key(key) {
                        changed_fields.push(format!("{}: removed", key));
                    }
                }
            }
            (Value::Null, Value::Object(_)) => {
                changed_fields.push("data: added".to_string());
            }
            (Value::Object(_), Value::Null) => {
                changed_fields.push("data: removed".to_string());
            }
            (Value::Null, Value::Null) => {
                // 都没有数据，无变化
            }
            _ => {
                changed_fields.push("data: structure_changed".to_string());
            }
        }

        let has_changes = !changed_fields.is_empty();
        let summary = if has_changes {
            format!("{} fields changed", changed_fields.len())
        } else {
            "No changes".to_string()
        };

        DataDiff {
            has_changes,
            changed_fields,
            summary,
        }
    }
}
