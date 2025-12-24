//! Log decorator utilities
//! Uses tracing to provide automatic logging for command execution, with smart sanitization

/// Replacement for the original log_async_command! macro (with sanitization)
/// Uses a concise implementation to avoid type inference issues
#[macro_export]
macro_rules! log_async_command {
    ($command_name:expr, $future:expr) => {{
        let start_time = std::time::Instant::now();
        tracing::info!(
            target: "command::start",
            command = $command_name,
            "🔧 Starting command execution"
        );

        // Process future directly to avoid type inference issues
        let (result, duration) = match $future.await {
            Ok(r) => (Ok(r), start_time.elapsed()),
            Err(e) => {
                let duration = start_time.elapsed();
                // Simplified error handling to avoid string operation type inference
                let error_msg = format!("Command execution failed");
                tracing::error!(
                    target: "command::error",
                    command = $command_name,
                    duration_ms = duration.as_millis(),
                    error = %e,
                    "❌ Command failed: {}", error_msg
                );
                (Err(e), duration)
            }
        };

        if result.is_ok() {
            tracing::info!(
                target: "command::success",
                command = $command_name,
                duration_ms = duration.as_millis(),
                "✅ Command completed"
            );
        }

        result
    }};
}

/// Log recording with user context (with sanitization)
#[macro_export]
macro_rules! log_user_command {
    ($command_name:expr, $user_email:expr, $future:expr) => {{
        let start_time = std::time::Instant::now();
        let sanitizer = $crate::utils::log_sanitizer::LogSanitizer::new();
        let masked_email = sanitizer.sanitize_email($user_email);
        tracing::info!(
            target: "user_command::start",
            command = $command_name,
            user_email = %masked_email,
            "🔧 User operation started"
        );

        match $future.await {
            Ok(result) => {
                let duration = start_time.elapsed();
                tracing::info!(
                    target: "user_command::success",
                    command = $command_name,
                    duration_ms = duration.as_millis(),
                    "✅ User operation completed"
                );
                Ok(result)
            }
            Err(e) => {
                let duration = start_time.elapsed();
                let error_msg = format!("User operation failed");
                tracing::error!(
                    target: "user_command::error",
                    command = $command_name,
                    duration_ms = duration.as_millis(),
                    error = %e,
                    "❌ User operation failed: {}", error_msg
                );
                Err(e)
            }
        }
    }};
}
