# jingdouyun-email-template-replacement

[English](./README.md) | 中文

## 简介

一个将本地 HTML 文件同步到筋斗云 CRM/CMS 现有邮件模板的 Agent Skill。它只替换明确标注为“模板内容”的字段，并保留模板的其他全部字段。

## 功能

- 从本地 `.html` 文件名中只移除最后的扩展名，得到现有模板名称。
- 搜索唯一且完全匹配的模板。
- 打开与“模板内容”字段明确关联的编辑器。
- 使用完整本地 HTML 替换该字段。
- 核验提交成功提示、返回模板列表、模板名称和更新后的列表状态。

## 适用场景

- 批量更新筋斗云已有邮件模板。
- 将审核通过的本地邮件 HTML 同步到测试环境。
- 从中断位置继续处理，而不盲目重复已成功更新的模板。

## 环境要求

- 文件名无歧义的本地 UTF-8 HTML 文件。
- 已登录目标筋斗云环境的 Chrome 会话。
- `chrome:control-chrome` Skill。
- 编辑表单中存在明确标注为“模板内容”的字段。

## 安装

```bash
npx skills add dengshangli/skills --skill jingdouyun-email-template-replacement
```

安装到用户级目录：

```bash
npx skills add dengshangli/skills --skill jingdouyun-email-template-replacement --global
```

## 使用示例

- “使用这个目录中的 HTML 文件更新筋斗云同名模板。”
- “只替换模板内容，保留其他全部字段。”
- “继续处理上次模板同步中失败的项目。”

## 重要说明

- 此 Skill 不会创建模板。
- 只允许修改“模板内容”。模板名称、分类、标识、主题、标签、状态、文本内容和描述都必须保持不变。
- 没有精确匹配或出现多个匹配都属于失败，禁止猜测。
- 如果无法确认编辑器与“模板内容”的关联，必须停止更新。
- 登录、CAPTCHA、页面状态歧义或浏览器控制中断需要交给用户处理。

## 完整规则

清单建立、精确匹配、TinyMCE 源代码编辑、批次恢复和最终报告规则请查看 [SKILL.md](./SKILL.md)。

## 许可证

此 Skill 采用仓库级 [MIT License](../LICENSE)。
