# Antigravity Agent

> !!重要: 1.4.0 版本, 本项目彻底进行了重构, 虽然本程序已经处理了迁移, 但开源项目精力有限无法处理所有可能的情况, 若您之前使用的是旧版本, 请先在老版本导出账户数据后, 然后使用新版本重新导入!!

> !!重要: 若无法获取配额可能是因为使用了 Antigravity 的旧版本数据, 需要将 Antigravity 更新至 1.11.14(该版本发布于 2025/12/04) 版本以上然后重新登录无法获取配额信息的账户!!

> 开箱即用的 Antigravity 账户管理程序。

<img src="screenshots/dashboard.png" alt="dashboard" width="700" />

Windows ✅️
MacOS ✅️
Linux ✅️

## 下载安装

前往 [Releases](../../releases) 页面下载最新版本：

## 📋 操作指南

### 首次启动
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
   - 日志文件存储位置（所有平台统一）：
     - Windows: `%USERPROFILE%\.antigravity-agent\logs\`
     - macOS: `~/.antigravity-agent/logs/`
     - Linux: `~/.antigravity-agent/logs/`
   - 查找当前日期的日志文件（格式：`antigravity-agent.YYYY-MM-DD.log`，例如：`antigravity-agent.2025-12-11.log`）
   - 或者查找最新的日志文件进行复制
   - 注意：日志文件会自动脱敏处理敏感信息

2. **⚠️ 重要：检查敏感信息**
   - **打开日志文件**，仔细检查是否包含个人敏感信息
   - **特别注意以下内容**：
     - 完整的邮箱地址
     - API 密钥、令牌或密码
     - 用户路径中的真实用户名
     - 其他任何您认为敏感的信息

## 📝 TODO 列表

- [ ] 国际化支持
- [ ] 主题支持
- [ ] 检查更新
- [ ] 扩展支持
- [ ] 规范开发流程
- [ ] CHANGELOG
