use crate::directories;
/// Configuration manager
/// Unified management of all configuration directories and file paths
use std::path::PathBuf;

/// Configuration manager structure
pub struct ConfigManager;

impl ConfigManager {
    /// Create a new configuration manager
    pub fn new() -> Result<Self, String> {
        // Directory creation is handled in the directories module
        Ok(Self)
    }

    /// Get the window state file path
    pub fn window_state_file(&self) -> PathBuf {
        directories::get_window_state_file()
    }
}
