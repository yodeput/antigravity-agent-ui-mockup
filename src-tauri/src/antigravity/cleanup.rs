// Antigravity user data cleanup module
// Responsible for clearing all user authentication and settings information of Antigravity app

use rusqlite::{params, Connection};
use std::path::Path;

// Import platform_utils module
use crate::platform;

fn clear_database(db_path: &Path, db_name: &str) -> Result<usize, String> {
    tracing::info!(target: "cleanup::database", db_name = %db_name, "Starting database cleanup");
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    // Delete jetskiStateSync.agentManagerInitState
    let key = "jetskiStateSync.agentManagerInitState";
    let rows = conn
        .execute("DELETE FROM ItemTable WHERE key = ?", [key])
        .unwrap_or(0);

    // According to user reports, in some cases not deleting antigravityAuthStatus prevents Antigravity from generating a new one
    let antigravity_auth_status_key = "antigravityAuthStatus";
    let antigravity_auth_status_rows = conn
        .execute("DELETE FROM ItemTable WHERE key = ?", [antigravity_auth_status_key])
        .unwrap_or(0);

    // Set antigravityOnboarding to boolean true (written as string "true") to skip first-time onboarding
    let onboarding_key = "antigravityOnboarding";
    let onboarding_rows = conn
        .execute(
            "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)",
            params![onboarding_key, "true"],
        )
        .unwrap_or(0);

    if rows > 0 {
        tracing::debug!(target: "cleanup::database", key = %key, "Field deleted");
    }

    Ok(rows + onboarding_rows + antigravity_auth_status_rows)
}

pub async fn clear_all_antigravity_data() -> Result<String, String> {
    tracing::info!(target: "cleanup::main", "Starting to clear Antigravity user authentication data (preserving device fingerprint)");

    let app_data = match platform::get_antigravity_db_path() {
        Some(p) => p,
        None => {
            let possible_paths = platform::get_all_antigravity_db_paths();
            if possible_paths.is_empty() {
                return Err("Antigravity installation not found".to_string());
            }
            possible_paths[0].clone()
        }
    };

    if !app_data.exists() {
        return Err(format!(
            "Antigravity state database does not exist: {}",
            app_data.display()
        ));
    }

    let mut msg = String::new();

    // Clean main database
    tracing::info!(target: "cleanup::main", "Step 1: Clear state.vscdb database");
    match clear_database(&app_data, "state.vscdb") {
        Ok(c) => {
            tracing::info!(target: "cleanup::main", cleaned_count = %c, "Main database cleared");
            msg.push_str(&format!("Main database cleaned {} items", c));
        }
        Err(e) => return Err(e),
    }

    // Delete backup database
    tracing::info!(target: "cleanup::main", "Step 2: Delete state.vscdb.backup (if exists)");
    let backup_db = app_data.with_extension("vscdb.backup");
    if backup_db.exists() {
        match std::fs::remove_file(&backup_db) {
            Ok(_) => {
                tracing::info!(target: "cleanup::main", file = %backup_db.display(), "Backup database file deleted");
                msg.push_str("; Backup database file deleted");
            }
            Err(e) => {
                tracing::warn!(target: "cleanup::main", file = %backup_db.display(), error = %e, "Failed to delete backup database file")
            }
        }
    } else {
        tracing::debug!(target: "cleanup::main", "Backup database does not exist, skipping");
    }

    Ok(format!("✅ Logout successful: {}", msg))
}
