//! System tray management module
//!
//! Uses Tauri 2.9 built-in API for backend tray control, frontend updates menu via commands

pub mod manager;
pub mod tray;

// Re-export the main structs for convenience
pub use manager::SystemTrayManager;
pub use tray::{create_tray_with_return, update_tray_menu};
