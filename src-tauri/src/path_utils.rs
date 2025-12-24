use dirs::*;
/// Unified cross-platform path handling tool
///
/// Provides cross-platform compatible path handling methods to avoid hard-coded paths
use std::path::{Path, PathBuf};

/// Application path manager
pub struct AppPaths;

impl AppPaths {
    /// Get Antigravity data directory
    ///
    /// Cross-platform paths:
    /// - Windows: %APPDATA%\Antigravity\User\globalStorage\
    /// - macOS: ~/Library/Application Support/Antigravity/User/globalStorage/
    /// - Linux: ~/.config/Antigravity/User/globalStorage/
    pub fn antigravity_data_dir() -> Option<PathBuf> {
        let result = antigravity_data_dir_impl();

        match &result {
            Some(path) => {
                let sanitized_path = sanitize_user_path(path);
                tracing::info!("🔍 Detect Antigravity data: {}", sanitized_path);
            }
            None => tracing::info!("🔍 Detect Antigravity data: Not found"),
        }

        result
    }

    /// Get Antigravity executable file paths
    ///
    /// Cross-platform search paths:
    /// - Windows: %LOCALAPPDATA%\Programs\Antigravity\Antigravity.exe
    /// - macOS: /Applications/Antigravity.app
    /// - Linux: /usr/bin/antigravity, ~/.local/bin/antigravity
    pub fn antigravity_executable_paths() -> Vec<PathBuf> {
        antigravity_executable_paths_impl()
    }
}

/// Cross-platform path desensitization function
/// Replaces the username with ****, supports Windows, macOS, Linux
fn sanitize_user_path(path: &Path) -> String {
    sanitize_user_path_impl(path)
}

// ----------------------------
// Windows 平台实现
// ----------------------------

#[cfg(target_os = "windows")]
fn antigravity_data_dir_impl() -> Option<PathBuf> {
    config_dir().map(|path| path.join("Antigravity").join("User").join("globalStorage"))
}

#[cfg(target_os = "windows")]
fn antigravity_executable_paths_impl() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    // User program directory: %LOCALAPPDATA%\Programs\
    if let Some(local_data) = data_local_dir() {
        paths.push(
            local_data
                .join("Programs")
                .join("Antigravity")
                .join("Antigravity.exe"),
        );
    }

    // Other locations of user data directory
    if let Some(home) = home_dir() {
        // %APPDATA%\Local\Programs\Antigravity\
        paths.push(
            home.join("AppData")
                .join("Local")
                .join("Programs")
                .join("Antigravity")
                .join("Antigravity.exe"),
        );

        // %APPDATA%\Roaming\Local\Programs\Antigravity\ (Although not common, some applications may install like this)
        paths.push(
            home.join("AppData")
                .join("Roaming")
                .join("Local")
                .join("Programs")
                .join("Antigravity")
                .join("Antigravity.exe"),
        );
    }

    // System program directory
    if let Some(program_files) = get_program_files_dir() {
        paths.push(program_files.join("Antigravity").join("Antigravity.exe"));
    }

    if let Some(program_files_x86) = get_program_files_x86_dir() {
        paths.push(
            program_files_x86
                .join("Antigravity")
                .join("Antigravity.exe"),
        );
    }

    paths
}

#[cfg(target_os = "windows")]
fn sanitize_user_path_impl(path: &Path) -> String {
    let path_str = path.to_string_lossy();

    // Windows: C:\Users\Kiki\AppData\Roaming\... -> C:\Users\****\AppData\Roaming\...
    if let Some(start) = path_str.find("\\Users\\") {
        let user_path_start = start + 7; // Skip "\\Users\\"
        if let Some(end) = path_str[user_path_start..].find('\\') {
            let end = user_path_start + end;
            return format!(
                "{}\\Users\\****\\{}",
                &path_str[..start],
                &path_str[end + 1..]
            );
        }
    }

    path_str.to_string()
}

#[cfg(target_os = "windows")]
fn get_program_files_dir() -> Option<PathBuf> {
    std::env::var("ProgramFiles").ok().map(PathBuf::from)
}

#[cfg(target_os = "windows")]
fn get_program_files_x86_dir() -> Option<PathBuf> {
    std::env::var("ProgramFiles(x86)").ok().map(PathBuf::from)
}

// ----------------------------
// macOS platform implementation
// ----------------------------

#[cfg(target_os = "macos")]
fn antigravity_data_dir_impl() -> Option<PathBuf> {
    data_dir().map(|path| path.join("Antigravity").join("User").join("globalStorage"))
}

#[cfg(target_os = "macos")]
fn antigravity_executable_paths_impl() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    let app_names = [
        "Antigravity.app",
        "Antigravity-electron.app",
        "Antigravity-alpha.app",
        "Antigravity-beta.app",
    ];

    // System application directory
    if let Some(applications) = get_applications_dir() {
        for app_name in &app_names {
            paths.push(applications.join(app_name));
        }
    }

    // User application directory
    if let Some(home) = home_dir() {
        let user_apps = home.join("Applications");
        for app_name in &app_names {
            paths.push(user_apps.join(app_name));
        }
    }

    paths
}

#[cfg(target_os = "macos")]
fn sanitize_user_path_impl(path: &Path) -> String {
    let path_str = path.to_string_lossy();

    // macOS: /Users/kiki/Library/Application Support/... -> /Users/****/Library/Application Support/...
    if let Some(start) = path_str.find("/Users/") {
        let user_path_start = start + 7; // Skip "/Users/"
        if let Some(end) = path_str[user_path_start..].find('/') {
            let end = user_path_start + end;
            return format!("{}/Users/****/{}", &path_str[..start], &path_str[end + 1..]);
        }
    }

    path_str.to_string()
}

#[cfg(target_os = "macos")]
fn get_applications_dir() -> Option<PathBuf> {
    Some(PathBuf::from("/Applications"))
}

// ----------------------------
// Linux platform implementation
// ----------------------------

#[cfg(target_os = "linux")]
fn antigravity_data_dir_impl() -> Option<PathBuf> {
    // Prioritize ~/.config, then ~/.local/share
    config_dir()
        .map(|path| path.join("Antigravity").join("User").join("globalStorage"))
        .or_else(|| {
            data_dir().map(|path| path.join("Antigravity").join("User").join("globalStorage"))
        })
}

#[cfg(target_os = "linux")]
fn antigravity_executable_paths_impl() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    // System binary directory
    paths.push(PathBuf::from("/usr/bin/antigravity"));
    paths.push(PathBuf::from("/usr/local/bin/antigravity"));
    paths.push(PathBuf::from("/usr/share/antigravity/antigravity"));

    // User binary directory
    if let Some(home) = home_dir() {
        paths.push(home.join(".local").join("bin").join("antigravity"));
        paths.push(home.join("bin").join("antigravity"));
    }

    // Snap package
    paths.push(PathBuf::from("/snap/bin/antigravity"));

    // AppImage and Flatpak
    if let Some(home) = home_dir() {
        paths.push(home.join("Applications").join("Antigravity.AppImage"));
    }

    paths.push(PathBuf::from("/var/lib/flatpak/exports/bin/antigravity"));
    if let Some(home) = home_dir() {
        paths.push(
            home.join(".local")
                .join("share")
                .join("flatpak")
                .join("exports")
                .join("bin")
                .join("antigravity"),
        );
    }

    paths
}

#[cfg(target_os = "linux")]
fn sanitize_user_path_impl(path: &Path) -> String {
    let path_str = path.to_string_lossy();

    // Linux: /home/user/.config/... -> /home/****/.config/...
    if let Some(start) = path_str.find("/home/") {
        let user_path_start = start + 6; // 跳过 "/home/"
        if let Some(end) = path_str[user_path_start..].find('/') {
            let end = user_path_start + end;
            return format!("{}/home/****/{}", &path_str[..start], &path_str[end + 1..]);
        }
    }

    path_str.to_string()
}

// ----------------------------
// Fallback implementation for other platforms
// ----------------------------

#[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
fn antigravity_data_dir_impl() -> Option<PathBuf> {
    data_dir().map(|path| path.join("Antigravity").join("User").join("globalStorage"))
}

#[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
fn antigravity_executable_paths_impl() -> Vec<PathBuf> {
    Vec::new()
}

#[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
fn sanitize_user_path_impl(path: &Path) -> String {
    path.to_string_lossy().to_string()
}
