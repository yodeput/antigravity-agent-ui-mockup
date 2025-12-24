pub mod account_commands;
/// Command module unified export
/// Manage all Tauri commands grouped by function
// Account management commands
pub mod account_manage_commands;

// Process management commands
pub mod process_commands;

// Platform support commands
pub mod platform_commands;

// Window state commands
pub mod window_commands;

// System tray commands
pub mod tray_commands;

// Logging related commands
pub mod logging_commands;

// Application settings commands
pub mod settings_commands;

// Database monitoring commands
pub mod db_monitor_commands;
// Language server related commands (under src/language_server)

// Re-export all commands to maintain compatibility with main.rs
pub use account_commands::*;
pub use account_manage_commands::*;
pub use db_monitor_commands::*;
pub use logging_commands::*;
pub use platform_commands::*;
pub use process_commands::*;
pub use settings_commands::*;
pub use tray_commands::*;
