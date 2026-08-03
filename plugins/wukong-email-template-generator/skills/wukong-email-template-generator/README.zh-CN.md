# wukong-email-template-generator

[English](./README.md) | 中文

## 简介

一个使用固定、可复用邮件外壳创建悟空品牌 HTML 邮件的 Agent Skill。Agent 只设计用户需要的正文片段，再由仓库自带生成器将正文装入标准模板。

## 功能

- 为活动、Newsletter、通知和 CRM 邮件创建兼容邮件客户端的正文。
- 运行 `scripts/generate_email.py`，将正文放入固定悟空邮件外壳。
- 只生成一个新的完整 HTML 邮件作为最终交付物。
- 保持模板头部、页脚、全局样式、链接、属性和元数据不变。

## 适用场景

- 市场活动和营销邮件。
- 课程提醒和报名成功通知。
- 产品或服务通知。
- 必须使用悟空标准布局的 CRM 跟进邮件。

## 环境要求

- Python 3。
- 可写的输出目录。
- 兼容邮件客户端的正文：保守 HTML、内联样式、绝对图片地址且不使用 JavaScript。

技能会相对于自身安装后的 `SKILL.md` 定位 `scripts/generate_email.py`，因此不同用户和不同插件安装目录无需手动修改路径。

## 安装

请从 DSL Skills marketplace 安装插件。Codex marketplace 命令及分享方式见插件级 README。

## 使用示例

- “创建一封悟空品牌的暑期课程报名成功通知邮件。”
- “生成一封介绍新版学习报告的 Newsletter。”
- “使用这段文案和这些模板变量创建一封 CRM 跟进邮件。”

## 重要说明

- 每次请求都必须执行仓库自带生成器。
- 正文片段只是临时文件，不能作为最终交付物。
- 只允许替换正文标记，禁止修改固定模板。
- 生成器必须输出 `GENERATOR_EXECUTED=YES` 和绝对 `OUTPUT` 路径。
- 最终只能保留一个新 HTML 交付文件。

## 完整规则

强制生成契约、命令、验证闸门和模板边界请查看 [SKILL.md](./SKILL.md)。

## 许可证

此 Skill 采用仓库级 [MIT License](../LICENSE)。
