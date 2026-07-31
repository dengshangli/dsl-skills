# email-template-compatibility-test

[English](./README.md) | 中文

## 简介

一个通过网页邮件测试表单，将本地 HTML 邮件模板批量发送到一个或多个测试邮箱的 Agent Skill。它维护可审计的结果清单，并区分服务器接受、实际送达和渲染兼容性。

## 功能

- 在限定目录内发现本地 `.html` 和 `.htm` 模板。
- 默认使用完整文件名作为邮件标题。
- 每个模板只上传一次，并同时发送到所有已确认的测试收件人。
- 记录服务器已接受、失败和待核实模板，避免盲目重试。
- 可在送达后继续检查不同邮箱提供商的渲染表现。

## 适用场景

- 将一批模板发送到 Gmail、Outlook 等测试邮箱。
- 检查本地模板是否有遗漏或重复发送。
- 对比邮件送达后的布局、字体、图片、链接、深色模式和移动端表现。

## 环境要求

- 符合测试页面类型和大小限制的本地 HTML 邮件文件。
- 用户明确提供的测试收件人。
- Codex 应用内置浏览器。当前 Skill 强制使用 `browser:control-in-app-browser`，不会自动切换到 Chrome。
- 可以访问默认测试页面或用户认可的同类页面。

## 安装

```bash
npx skills add dengshangli/dsl-skills --skill email-template-compatibility-test
```

安装到用户级目录：

```bash
npx skills add dengshangli/dsl-skills --skill email-template-compatibility-test --global
```

## 使用示例

- “把这个目录中的全部 HTML 模板发送到这两个测试邮箱。”
- “使用完整文件名作为标题，并报告服务器接受了哪些模板。”
- “邮件送达后，对比 Gmail 和 Outlook 中的渲染效果。”

## 重要说明

- 发送前必须进行批次级确认，列出模板数、收件人和预计投递数。
- “服务器已接受”不代表邮件已经到达收件箱或渲染正确。
- 超时不等于失败；重试前必须检查页面状态，避免重复邮件。
- CAPTCHA、登录或浏览器控制中断需要交给用户处理。
- 只应使用测试邮箱和已获授权的收件人。

## 完整规则

浏览器选择、上传顺序、结果判定、异常恢复和最终报告格式请查看 [SKILL.md](./SKILL.md)。

## 许可证

此 Skill 采用仓库级 [MIT License](../LICENSE)。
