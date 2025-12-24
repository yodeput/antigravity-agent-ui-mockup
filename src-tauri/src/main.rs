// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::filter::LevelFilter;
use tracing_subscriber::{prelude::*, EnvFilter};

// Modules
mod antigravity;
mod app_settings;
mod config_manager;
mod constants;
mod directories;
mod platform;
mod proto;
mod system_tray;
mod utils;
mod window;

mod commands;
mod db_monitor;
mod path_utils;
mod setup;
mod state;

// Re-export AppState for compatibility with other modules
pub use state::{AntigravityAccount, AppState, ProfileInfo};

// Use commands
use crate::commands::*;

/// Initialize double-layer logging system (console + file)
fn init_tracing() -> WorkerGuard {
    let app_settings_path = crate::directories::get_app_settings_file();
    let settings = crate::app_settings::load_settings_from_disk(&app_settings_path);

    // Log filter: default info, reduce h2/hyper noise (can be overridden by RUST_LOG)
    // Debug Mode 开启时：仅放开应用相关的 debug（以及 frontend），避免依赖库（如 reqwest）刷屏。
    let default_filter = if settings.debug_mode {
        "info,antigravity_agent=debug,frontend=debug,app=debug,window=debug,account=debug,restore=debug,cleanup=debug,backup=debug,h2=warn,hyper=warn"
    } else {
        "info,h2=warn,hyper=warn"
    };
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new(default_filter));

    // Create log directory
    let log_dir = crate::directories::get_log_directory();
    if let Err(e) = fs::create_dir_all(&log_dir) {
        eprintln!("Warning: Failed to create log directory {}: {}", log_dir.display(), e);
    }

    // Create rolling file writer (with sanitization)
    let file_writer =
        crate::utils::sanitizing_layer::SanitizingFileWriter::new().expect("Failed to create file writer");
    let (non_blocking, guard) = tracing_appender::non_blocking(file_writer);

    // Set up console and file double-layer output
    tracing_subscriber::registry()
        .with(env_filter)
        .with(
            tracing_subscriber::fmt::layer()
                .with_writer(std::io::stdout) // Console output, no sanitization
                .with_target(false)
                .compact()
                .with_ansi(true) // Console enable color
                .with_filter(LevelFilter::INFO),
        )
        .with(
            tracing_subscriber::fmt::layer()
                .with_writer(non_blocking) // File output, automatic sanitization
                .with_target(true)
                .with_ansi(false) // File disable color code
                .compact(), // Use compact format instead of JSON, 便于脱敏处理
        )
        .init();

    guard // Return guard to prevent log buffer from being prematurely cleaned
}

fn main() {
    // Initialize double-layer logging system (console + file)
    let _guard = init_tracing();

    tracing::info!(target: "app::startup", "🚀 Starting Antigravity Agent");
    tracing::info!(target: "app::startup", "📝 Logging system initialized (console + file)");
    tracing::info!(target: "app::startup", "📁 Log directory: {}", crate::directories::get_log_directory().display());

    // Record system startup information
    crate::utils::tracing_config::log_system_info();

    // Block the main thread to perform a single account directory migration check
    match crate::directories::migrate_legacy_accounts_if_needed() {
        Ok(()) => tracing::info!(target: "app::startup", "📦 Account directory migration check completed"),
        Err(e) => tracing::error!(target: "app::startup", "⚠️ Account directory migration check failed: {}", e),
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_http::init())
        .manage(AppState::default())
        .setup(|app| setup::init(app))
        .invoke_handler(tauri::generate_handler![
            collect_account_contents,
            restore_backup_files,
            delete_backup,
            clear_all_backups,
            // Account base commands
            get_antigravity_accounts,
            get_current_antigravity_account_info,
            save_antigravity_current_account,
            restore_antigravity_account,
            switch_to_antigravity_account,
            clear_all_antigravity_data,
            is_antigravity_running,
            sign_in_new_antigravity_account,
            // Platform support commands
            get_platform_info,
            find_antigravity_installations,
            get_current_paths,
            // Database path related
            detect_antigravity_installation,
            // Executable file path related
            validate_antigravity_executable,
            detect_antigravity_executable,
            save_antigravity_executable,
            minimize_to_tray,
            restore_from_tray,
            update_tray_menu_command,
            save_system_tray_state,
            save_silent_start_state,
            save_private_mode_state,
            save_debug_mode_state,
            get_all_settings,
            // Database monitoring commands
            is_database_monitoring_running,
            start_database_monitoring,
            stop_database_monitoring,
            decrypt_config_data,
            encrypt_config_data,
            write_text_file,
            write_frontend_log,
            get_log_directory_path,
            open_log_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
