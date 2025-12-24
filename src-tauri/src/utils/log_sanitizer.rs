//! Log sanitization module
//! Smart masking of sensitive information to protect user privacy while preserving debugging value

use regex::Regex;

/// Log sanitizer
pub struct LogSanitizer {
    /// Email regex
    email_regex: Regex,
    /// API key regex
    api_key_regex: Regex,
    /// User home directory regex
    user_home_regex: Regex,
    /// Windows user directory regex
    windows_user_regex: Regex,
}

impl Default for LogSanitizer {
    fn default() -> Self {
        Self {
            email_regex: Regex::new(r"(?i)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}").unwrap(),
            api_key_regex: Regex::new(r"(?i)(?P<prefix>key|token|secret|api[-_]?key|access[-_]?token)[\s=:]+(?P<key>[a-zA-Z0-9+/=_-]{20,})").unwrap(),
            user_home_regex: Regex::new(r"(?P<prefix>/home/[^/]+)").unwrap(),
            windows_user_regex: Regex::new(r"C:\\\\Users\\\\[^\\\\]+").unwrap(),
        }
    }
}

impl LogSanitizer {
    /// Create a new sanitizer instance
    pub fn new() -> Self {
        Self::default()
    }

    /// Sanitize a string
    pub fn sanitize(&self, input: &str) -> String {
        let mut result = input.to_string();

        // 1. Sanitize email addresses
        result = self.sanitize_email(&result);

        // 2. Use basic path sanitization
        result = self.sanitize_paths(&result);

        // 3. Sanitize API keys
        result = self.sanitize_api_keys(&result);

        result
    }

    /// Smart email sanitization - keep first and last characters, replace middle with *
    ///
    /// Strategy:
    /// - 1 character: keep as is
    /// - 2 characters: show first character + *
    /// - 3 or more: show first character + middle * + last character
    ///
    /// # Examples
    /// ```
    /// "a@domain.com" → "a@domain.com"
    /// "ab@domain.com" → "a*@domain.com"
    /// "user@domain.com" → "u***r@domain.com"
    /// "very.long.email@domain.com" → "v***l@domain.com"
    /// ```
    pub fn sanitize_email(&self, input: &str) -> String {
        self.email_regex
            .replace_all(input, |caps: &regex::Captures| {
                let email = &caps[0];

                let at_pos = email.find('@').unwrap_or(0);
                let (local_part, domain) = email.split_at(at_pos);

                match local_part.len() {
                    0 | 1 => email.to_string(),
                    2 => {
                        let first_char = local_part.chars().next().unwrap_or('_');
                        format!("{}*{}", first_char, domain)
                    }
                    _ => {
                        let first_char = local_part.chars().next().unwrap_or('_');
                        let last_char = local_part.chars().last().unwrap_or('_');
                        let middle_stars =
                            "*".repeat(local_part.len().saturating_sub(2).saturating_sub(2));
                        format!("{}{}{}@{}", first_char, middle_stars, last_char, domain)
                    }
                }
            })
            .to_string()
    }

    /// Path sanitization - hide user home directory part
    ///
    /// # Examples
    /// ```
    /// "/home/user/.antigravity-agent" → "~/.antigravity-agent"
    /// "/home/user/Documents/file.txt" → "~/Documents/file.txt"
    /// "C:\\Users\\Kiki\\AppData" → "~\\AppData"
    /// "C:\\Users\\Kiki\\AppData\\Roaming\\Antigravity" → "~\\AppData\\Roaming\\Antigravity"
    /// ```
    pub fn sanitize_paths(&self, input: &str) -> String {
        let mut result = input.to_string();

        // Handle Linux/Unix paths
        result = self
            .user_home_regex
            .replace_all(&result, |_caps: &regex::Captures| "~")
            .to_string();

        // Handle Windows paths - fix regex to match username
        result = self
            .windows_user_regex
            .replace_all(&result, |_caps: &regex::Captures| "~")
            .to_string();

        // Additional handling for some potentially missed path formats
        if result.contains("C:\\Users\\") {
                // Use simpler replacement method
            result = regex::Regex::new(r"C:\\\\Users\\\\[^\\\\]+")
                .unwrap()
                .replace_all(&result, "~")
                .to_string();
        }

        result
    }

    /// API key sanitization - only show first few characters, replace rest with *
    ///
    /// # Examples
    /// ```
    /// "api_key: sk-1234567890abcdef" → "api_key: sk-12****************"
    /// "token: abcdef1234567890" → "token: ab****************"
    /// ```
    pub fn sanitize_api_keys(&self, input: &str) -> String {
        self.api_key_regex
            .replace_all(input, |caps: &regex::Captures| {
                let prefix = &caps["prefix"];
                let key = &caps["key"];
                let visible_len = std::cmp::min(4, key.len());
                let masked_len = key.len().saturating_sub(visible_len);

                if key.len() <= 4 {
                    format!("{}{}", prefix, key)
                } else {
                    let visible_part = &key[..visible_len];
                    let masked_part = "*".repeat(masked_len);
                    format!("{}{}{}", prefix, visible_part, masked_part)
                }
            })
            .to_string()
    }
}

/// Convenience function for sanitizing log messages
pub fn sanitize_log_message(message: &str) -> String {
    let sanitizer = LogSanitizer::new();
    sanitizer.sanitize(message)
}
