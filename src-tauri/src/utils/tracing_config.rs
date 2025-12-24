//! Tracing configuration module
//! Provides unified structured logging configuration and initialization

/// Log system startup information
pub fn log_system_info() {
    tracing::info!(
        target: "app::startup",
        version = env!("CARGO_PKG_VERSION"),
        "🚀 Starting Antigravity Agent"
    );
    tracing::info!(
        target: "app::startup",
        os = std::env::consts::OS,
        arch = std::env::consts::ARCH,
        "🖥️ System information"
    );
    tracing::info!(
        target: "app::startup",
        "📁 Config directory initialized"
    );
    tracing::info!(
        target: "app::startup",
        "📁 Tracing log system enabled"
    );
}

/// Log database operation
#[allow(dead_code)]
pub fn log_database_operation(operation: &str, table: Option<&str>, success: bool) {
    match (table, success) {
        (Some(table), true) => {
            tracing::info!(
                target: "database::operation",
                operation = operation,
                table = table,
                success = true,
                "🗄️ Database operation successful"
            );
        }
        (Some(table), false) => {
            tracing::error!(
                target: "database::operation",
                operation = operation,
                table = table,
                success = false,
                "❌ Database operation failed"
            );
        }
        (None, true) => {
            tracing::info!(
                target: "database::operation",
                operation = operation,
                success = true,
                "🗄️ Database operation successful"
            );
        }
        (None, false) => {
            tracing::error!(
                target: "database::operation",
                operation = operation,
                success = false,
                "❌ Database operation failed"
            );
        }
    }
}
