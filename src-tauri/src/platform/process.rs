/// Kill Antigravity processes - using sysinfo library for cross-platform unified handling
pub fn kill_antigravity_processes() -> Result<String, String> {
    tracing::info!("🔍 Starting to search and close Antigravity processes");

    // Use sysinfo library to get all processes
    let mut system = sysinfo::System::new_all();
    system.refresh_all();

    let mut killed_processes = Vec::new();

    // Define process patterns to be closed (sorted by priority)
    let process_patterns = get_antigravity_process_patterns();

    for (pid, process) in system.processes() {
        let process_name = process.name();
        let process_cmd = process.cmd().join(" ");

        // Check if process name or command line matches any pattern
        if matches_antigravity_process(process_name, &process_cmd, &process_patterns) {
            tracing::info!("🎯 Found target process: {} (PID: {})", process_name, pid);
            tracing::info!("📝 Command line: {}", process_cmd);

            // Try to terminate process
            if process.kill() {
                killed_processes.push(format!("{} (PID: {})", process_name, pid));
                tracing::info!("✅ Successfully terminated process: {} (PID: {})", process_name, pid);
            } else {
                tracing::warn!("⚠️ Failed to terminate process: {} (PID: {})", process_name, pid);

                // Try multiple times to terminate (if first attempt fails)
                if process.kill() {
                    killed_processes.push(format!("{} (PID: {} - forced)", process_name, pid));
                    tracing::info!("✅ Force terminated process: {} (PID: {})", process_name, pid);
                } else {
                    tracing::error!("❌ Force termination also failed: {} (PID: {})", process_name, pid);
                }
            }
        }
    }

    if killed_processes.is_empty() {
        tracing::info!("ℹ️ No matching Antigravity processes found");
        tracing::info!("🔍 Searched process patterns: {:?}", process_patterns);
        Err("Antigravity process not found".to_string())
    } else {
        let success_msg = format!("Successfully closed Antigravity processes: {}", killed_processes.join(", "));
        tracing::info!("🎉 {}", success_msg);
        Ok(success_msg)
    }
}

/// Check if Antigravity process is running (using sysinfo)
pub fn is_antigravity_running() -> bool {
    tracing::debug!("🔍 Checking if Antigravity process is running");

    let mut system = sysinfo::System::new_all();
    system.refresh_all();

    let process_patterns = get_antigravity_process_patterns();

    for (pid, process) in system.processes() {
        let process_name = process.name();
        let process_cmd = process.cmd().join(" ");

        if matches_antigravity_process(process_name, &process_cmd, &process_patterns) {
            tracing::debug!(
                "✅ Found running Antigravity process: {} (PID: {})",
                process_name,
                pid
            );
            return true;
        }
    }

    tracing::debug!("ℹ️ No running Antigravity process found");
    false
}

/// Get Antigravity process matching patterns
fn get_antigravity_process_patterns() -> Vec<ProcessPattern> {
    match std::env::consts::OS {
        "macos" => {
            vec![
                // Main process: Electron (Antigravity's wrapper process), must be verified by path
                ProcessPattern::CmdContains(
                    "/Applications/Antigravity.app/Contents/MacOS/Electron",
                ),
                // Helper processes: Antigravity Helper series (GPU, Renderer, Plugin, etc.)
                ProcessPattern::CmdContains(
                    "Antigravity.app/Contents/Frameworks/Antigravity Helper",
                ),
            ]
        }
        "windows" => {
            vec![
                ProcessPattern::ExactName("Antigravity.exe"),
                // Fallback, currently unused
                ProcessPattern::ExactName("Antigravity"),
            ]
        }
        "linux" => {
            vec![
                ProcessPattern::ExactName("antigravity"),
                ProcessPattern::CmdContains("Antigravity.AppImage"),
            ]
        }
        _ => {
            vec![ProcessPattern::ExactName("Antigravity")]
        }
    }
}

/// Check if process matches Antigravity pattern
fn matches_antigravity_process(
    process_name: &str,
    process_cmd: &str,
    patterns: &[ProcessPattern],
) -> bool {
    let mut matched = false;
    for pattern in patterns {
        match pattern {
            ProcessPattern::ExactName(name) => {
                if process_name == *name {
                    tracing::debug!("✅ Exact match process name: {}", name);
                    tracing::info!("🎯 Match pattern: ProcessPattern::ExactName(\"{}\")", name);
                    matched = true;
                }
            }
            ProcessPattern::CmdContains(text) => {
                if process_cmd.contains(text) {
                    tracing::debug!("✅ Command line contains match: {}", text);
                    tracing::info!("🎯 Match pattern: ProcessPattern::CmdContains(\"{}\")", text);
                    matched = true;
                }
            }
        }
    }
    matched
}

/// Process matching pattern
#[derive(Debug, Clone)]
pub enum ProcessPattern {
    ExactName(&'static str),   // Exact match process name
    CmdContains(&'static str), // Command line contains specified text
}
