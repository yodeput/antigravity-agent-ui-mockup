/// 日志和加密命令
/// 负责日志管理、文件写入、数据加密解密等功能
use std::fs;
use std::path::Path;

/// 写入文本文件
/// 将文本内容写入指定路径的文件
#[tauri::command]
pub async fn write_text_file(path: String, content: String) -> Result<String, String> {
    crate::log_async_command!("write_text_file", async {
        let file_path = Path::new(&path);

        // 确保父目录存在
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
        }

        // 写入文件
        fs::write(file_path, content).map_err(|e| format!("写入文件失败: {}", e))?;

        Ok(format!("文件写入成功: {}", path))
    })
}

/// 写入前端日志
/// 将前端日志条目写入到后端日志系统
#[tauri::command]
pub async fn write_frontend_log(log_entry: serde_json::Value) -> Result<(), String> {
    use tracing::{debug, error, info, warn};

    // level: 'info' | 'warn' | 'error' | 'debug'
    let level_str = log_entry
        .get("level")
        .and_then(|v| v.as_str())
        .unwrap_or("info");

    // message
    let message = log_entry
        .get("message")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    // details（前端会把对象 JSON.stringify 成字符串）
    let details = log_entry.get("details").and_then(|v| v.as_str());

    // module：优先顶层；否则尝试从 details(JSON) 提取 module 字段
    let module = log_entry
        .get("module")
        .and_then(|v| v.as_str())
        .map(ToOwned::to_owned)
        .or_else(|| {
            let details_str = details?;
            let details_json = serde_json::from_str::<serde_json::Value>(details_str).ok()?;
            details_json
                .get("module")
                .and_then(|v| v.as_str())
                .map(ToOwned::to_owned)
        })
        .unwrap_or_else(|| "frontend".to_string());

    let full_message = if message.is_empty() {
        format!("[{}]", module)
    } else {
        format!("[{}] {}", module, message)
    };

    // tracing 的 target 需要静态字符串；统一用 "frontend" 方便过滤（RUST_LOG / Debug Mode）
    match level_str {
        "error" => match details {
            Some(details) => error!(
                target: "frontend",
                module = module.as_str(),
                details = %details,
                "{}",
                full_message
            ),
            None => error!(target: "frontend", module = module.as_str(), "{}", full_message),
        },
        "warn" => match details {
            Some(details) => warn!(
                target: "frontend",
                module = module.as_str(),
                details = %details,
                "{}",
                full_message
            ),
            None => warn!(target: "frontend", module = module.as_str(), "{}", full_message),
        },
        "debug" => match details {
            Some(details) => debug!(
                target: "frontend",
                module = module.as_str(),
                details = %details,
                "{}",
                full_message
            ),
            None => debug!(target: "frontend", module = module.as_str(), "{}", full_message),
        },
        _ => match details {
            Some(details) => info!(
                target: "frontend",
                module = module.as_str(),
                details = %details,
                "{}",
                full_message
            ),
            None => info!(target: "frontend", module = module.as_str(), "{}", full_message),
        },
    }

    Ok(())
}

/// 获取日志目录路径
#[tauri::command]
pub async fn get_log_directory_path() -> Result<String, String> {
    crate::log_async_command!("get_log_directory_path", async {
        let log_dir = crate::directories::get_log_directory();

        Ok(log_dir.display().to_string())
    })
}

/// 打开日志目录
/// 在系统文件管理器中打开日志目录（例如 Windows 资源管理器 / macOS Finder / Linux 文件管理器）
#[tauri::command]
pub async fn open_log_directory() -> Result<(), String> {
    crate::log_async_command!("open_log_directory", async {
        let log_dir = crate::directories::get_log_directory();

        tauri_plugin_opener::open_path(&log_dir, None::<&str>)
            .map_err(|e| format!("打开日志目录失败: {}", e))?;

        Ok(())
    })
}
