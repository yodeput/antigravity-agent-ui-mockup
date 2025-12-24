use crate::path_utils::AppPaths;
use std::path::PathBuf;

/// Get Antigravity application data directory (cross-platform)
pub fn get_antigravity_data_dir() -> Option<PathBuf> {
    AppPaths::antigravity_data_dir()
}

/// Get Antigravity state database file path
/// Uses auto-detected path
pub fn get_antigravity_db_path() -> Option<PathBuf> {
    get_antigravity_data_dir().map(|dir| dir.join("state.vscdb"))
}

/// Check if Antigravity is installed and running
pub fn is_antigravity_available() -> bool {
    get_antigravity_db_path()
        .map(|path| path.exists())
        .unwrap_or(false)
}

/// Search for possible Antigravity installation locations
pub fn find_antigravity_installations() -> Vec<PathBuf> {
    let mut possible_paths = Vec::new();

    // User data directory
    if let Some(user_data) = dirs::data_dir() {
        possible_paths.push(user_data.join("Antigravity"));
    }

    // Config directory
    if let Some(config_dir) = dirs::config_dir() {
        possible_paths.push(config_dir.join("Antigravity"));
    }

    possible_paths
}

/// Get all possible Antigravity database paths
pub fn get_all_antigravity_db_paths() -> Vec<PathBuf> {
    let mut db_paths = Vec::new();

    // Primary path
    if let Some(main_path) = get_antigravity_db_path() {
        db_paths.push(main_path);
    }

    // Search other possible locations
    for install_dir in find_antigravity_installations() {
        if install_dir.exists() {
            // Recursively search for state.vscdb file
            if let Ok(entries) = std::fs::read_dir(&install_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_file() && path.file_name().is_some_and(|name| name == "state.vscdb")
                    {
                        db_paths.push(path);
                    }
                }
            }
        }
    }

    db_paths
}
