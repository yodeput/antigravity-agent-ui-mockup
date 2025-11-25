use std::time::Duration;

use super::cache::{get_csrf_token, get_ports, clear_all, get_stats};
use super::types::{
    RequestMetadata, UserStatusRequest, HttpConfig, CacheInitResult
};
use super::utils::initialize_cache;

/// 前端调用 GetUserStatus 的公开命令
#[tauri::command]
pub async fn language_server_get_user_status(
    api_key: String,
) -> Result<serde_json::Value, String> {

    if api_key.trim().is_empty() {
        return Err("apiKey 不能为空".to_string());
    }

    // 1) 获取端口信息
    let port_info = get_ports().await
        .map_err(|e| format!("获取端口信息失败: {e}"))?;
    let port = port_info.https_port
        .ok_or_else(|| "端口信息中未找到 HTTPS 端口".to_string())?;

    // 2) 构造 URL 和请求体
    let target_url = format!(
        "https://127.0.0.1:{}/exa.language_server_pb.LanguageServerService/GetUserStatus",
        port
    );

    let http_config = HttpConfig::default();
    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .timeout(Duration::from_millis(http_config.request_timeout_ms))
        .build()
        .map_err(|e| format!("构建 HTTP 客户端失败: {e}"))?;

    let metadata = RequestMetadata {
        api_key: api_key.clone(),
        ..Default::default()
    };

    let request_body = UserStatusRequest { metadata };
    let body_bytes = serde_json::to_vec(&request_body)
        .map_err(|e| format!("序列化请求体失败: {e}"))?;

    // 获取 CSRF token
    let csrf = get_csrf_token().await
        .map_err(|e| format!("提取 csrf_token 失败: {e}"))?;

    let mut req = client.post(&target_url);

    // 模拟前端请求头
    req = req
        .header("accept", "*/*")
        .header("accept-language", "en-US")
        .header("connect-protocol-version", "1")
        .header("content-type", "application/json")
        .header("priority", "u=1, i")
        .header("sec-ch-ua", "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\"")
        .header("sec-ch-ua-mobile", "?0")
        .header("sec-ch-ua-platform", "\"Windows\"")
        .header("sec-fetch-dest", "empty")
        .header("sec-fetch-mode", "cors")
        .header("sec-fetch-site", "cross-site")
        .header("x-codeium-csrf-token", csrf.clone());


    // 打印完整的请求信息
    let body_str = String::from_utf8_lossy(&body_bytes);
    // tracing::info!(
    //     target_url = %target_url,
    //     https_port = port,
    //     method = "POST",
    //     csrf_token = %csrf,
    //     api_key = %api_key,
    //     request_body = %body_str,
    //     headers = ?[
    //         ("accept", "*/*"),
    //         ("accept-language", "en-US"),
    //         ("connect-protocol-version", "1"),
    //         ("content-type", "application/json"),
    //         ("priority", "u=1, i"),
    //         ("sec-ch-ua", "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\""),
    //         ("sec-ch-ua-mobile", "?0"),
    //         ("sec-ch-ua-platform", "\"Windows\""),
    //         ("sec-fetch-dest", "empty"),
    //         ("sec-fetch-mode", "cors"),
    //         ("sec-fetch-site", "cross-site"),
    //         ("x-codeium-csrf-token", &csrf)
    //     ],
    //     "language_server_get_user_status request"
    // );

    let resp = req
        .body(body_bytes)
        .send()
        .await
        .map_err(|e| format!("请求失败: {e}"))?;

    let bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("读取响应失败: {e}"))?;

    // 直接解析为 JSON，不定义复杂的数据结构
    let json: serde_json::Value = serde_json::from_slice(&bytes)
        .map_err(|e| format!("解析 JSON 失败: {e}; body={}", String::from_utf8_lossy(&bytes)))?;

    Ok(json)
}


/// 清空所有缓存命令
#[tauri::command]
pub async fn clear_all_cache_command() -> Result<(), String> {
    tracing::info!("收到清空所有缓存请求");
    clear_all().await;
    tracing::info!("所有缓存已清空");
    Ok(())
}

/// 获取缓存统计信息命令
#[tauri::command]
pub fn get_cache_stats_command() -> Result<super::types::CacheStats, String> {
    tracing::info!("收到获取缓存统计信息请求");
    let stats = get_stats();
    tracing::info!("缓存统计: CSRF={}, 端口={}", stats.csrf_cache_size, stats.ports_cache_size);
    Ok(stats)
}

/// 初始化语言服务器缓存（预热）
#[tauri::command]
pub async fn initialize_language_server_cache() -> Result<CacheInitResult, String> {
    tracing::info!("收到语言服务器缓存初始化请求");
    let result = initialize_cache().await;
    tracing::info!("缓存初始化完成: {}", result.message);
    Ok(result)
}
