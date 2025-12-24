use crate::directories;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProfileInfo {
    pub name: String,
    pub source_path: String,
    pub backup_path: String,
    pub created_at: String,
    pub last_updated: String,
}

// Antigravity 账户信息结构
#[derive(Debug, Serialize, Deserialize)]
pub struct AntigravityAccount {
    pub id: String,
    pub name: String,
    pub email: String,
    pub api_key: String,
    pub profile_url: String,   // Base64 encoded avatar
    pub user_settings: String, // Base64 encoded user settings
    pub created_at: String,
    pub last_switched: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppState {
    pub profiles: HashMap<String, ProfileInfo>,
    pub config_dir: PathBuf,
    pub antigravity_accounts: HashMap<String, AntigravityAccount>,
    pub current_account_id: Option<String>,
}

impl Default for AppState {
    fn default() -> Self {
        // Use the unified configuration directory
        let config_dir = directories::get_config_directory();

        Self {
            profiles: HashMap::new(),
            config_dir,
            antigravity_accounts: HashMap::new(),
            current_account_id: None,
        }
    }
}
