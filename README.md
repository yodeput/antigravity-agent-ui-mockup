# Antigravity Agent

> 开箱即用的 Antigravity 账户管理程序。

![dashborad.png](screenshots/dashboard.png)

Windows/MacOS ✅️

## 下载安装

前往 [Releases](../../releases) 页面下载最新版本：

## 📋 操作指南

### 第一次使用
1. 启动 Antigravity Agent
2. 自动识别并记录当前登录用户

### 切换账户
- 从账户列表中选择要切换的账户
- 点击"切换"按钮自动切换

### 登录新账户
- 点击"登录新账户"按钮
- 确认操作后将清除当前用户数据
- 自动启动 Antigravity，登录新账户后自动记录在 Antigravity Agent

### 导入导出
- **导出**: 选择保存位置，设置密码，导出所有账户配置
- **导入**: 选择配置文件，输入密码，恢复账户数据

## 🐛 Bug 反馈

遇到问题时，请按照以下步骤提供日志以便快速定位和解决问题：

1. **查找日志文件**：
   - 日志文件存储位置：
     - Windows: `%APPDATA%\.antigravity-agent\logs\`
     - macOS: `~/.config/.antigravity-agent/logs/`
     - Linux: `~/.config/.antigravity-agent/logs/`
   - 查找当前日期的日志文件（格式：`antigravity-agent.YYYY-MM-DD.log`，例如：`antigravity-agent.2025-11-24.log`）
   - 或者查找最新的日志文件进行复制

2. **⚠️ 重要：检查敏感信息**
   - **打开日志文件**，仔细检查是否包含个人敏感信息
   - **特别注意以下内容**：
     - 完整的邮箱地址（系统已自动脱敏，但仍需确认）
     - API 密钥、令牌或密码
     - 用户路径中的真实用户名
     - 其他任何您认为敏感的信息
   - **如果发现敏感信息**：
     - 使用文本编辑器手动替换或删除敏感内容
     - 例如：`user@domain.com` → `u***r@domain.com`
     - 例如：`/home/john/` → `~/`

## 📝 TODO 列表

- [ ] 外部端口
- [ ] 国际化支持
- [ ] 主题支持
- [ ] 检查更新
- [ ] Linux 支持
- [ ] 扩展支持
- [ ] 规范开发流程
- [ ] CHANGELOG
