// Window state management module
// Responsible for saving and restoring application window state

use serde::{Deserialize, Serialize};
use std::fs;

use crate::config_manager::ConfigManager;

// Window state structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowState {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub maximized: bool,
}

impl Default for WindowState {
    fn default() -> Self {
        Self {
            x: 100.0,
            y: 100.0,
            width: 800.0,
            height: 600.0,
            maximized: false,
        }
    }
}

impl WindowState {
    /// Validate if window state is valid
    ///
    /// Filters the following invalid states:
    /// - Window position out of reasonable range (e.g. -32000, means window is hidden)
    /// - Window size too small (width or height < 400)
    /// - Window size too large (width > 4000 or height > 3000)
    pub fn is_valid(&self) -> bool {
        // Check if position is in reasonable range (-1000 to 10000)
        let position_valid =
            self.x > -1000.0 && self.x < 10000.0 && self.y > -1000.0 && self.y < 10000.0;

        // Check if window size is reasonable (400x400 to 4000x3000)
        let size_valid = self.width >= 400.0
            && self.width <= 4000.0
            && self.height >= 400.0
            && self.height <= 3000.0;

        position_valid && size_valid
    }
}

/// Save window state
pub async fn save_window_state(state: WindowState) -> Result<(), String> {
    // Validate if window state is valid, refuse to save abnormal values
    if !state.is_valid() {
        println!(
            "⚠️ Detected invalid window state, skipping save: position({:.1}, {:.1}), size({:.1}x{:.1})",
            state.x, state.y, state.width, state.height
        );
        return Ok(()); // Don't return error, silently ignore
    }

    // Use ConfigManager to unify config directory management
    let config_manager = ConfigManager::new()?;
    let state_file = config_manager.window_state_file();

    let json_content =
        serde_json::to_string(&state).map_err(|e| format!("Failed to serialize window state: {}", e))?;

    fs::write(state_file, json_content).map_err(|e| format!("Failed to save window state: {}", e))?;

    println!(
        "💾 Window state saved: position({:.1}, {:.1}), size({:.1}x{:.1}), maximized:{}",
        state.x, state.y, state.width, state.height, state.maximized
    );

    Ok(())
}

/// Load window state
pub async fn load_window_state() -> Result<WindowState, String> {
    // Use ConfigManager to unify config directory management
    let config_manager = ConfigManager::new()?;
    let state_file = config_manager.window_state_file();

    if state_file.exists() {
        let content =
            fs::read_to_string(&state_file).map_err(|e| format!("Failed to read window state file: {}", e))?;

        let state: WindowState =
            serde_json::from_str(&content).map_err(|e| format!("Failed to parse window state: {}", e))?;

        // Validate if loaded state is valid
        if !state.is_valid() {
            println!(
                "⚠️ Loaded window state is invalid (position({:.1}, {:.1}), size({:.1}x{:.1})), using default state",
                state.x, state.y, state.width, state.height
            );
            return Ok(WindowState::default());
        }

        Ok(state)
    } else {
        Ok(WindowState::default())
    }
}
