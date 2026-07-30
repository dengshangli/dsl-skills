---
name: crm-email-manual-send
description: Manually send CRM template emails by matching local .html filenames to templates in a logged-in CRM lead page, selecting each exact template, clicking confirm, and verifying the follow-up record. Use when the user asks to send one or all email templates from the current directory through the CRM UI, retry failed manual sends, or report which local templates are unavailable in CRM.
license: MIT
---

# CRM 邮件手动发送

将当前目录中的 HTML 邮件文件名映射到 CRM 模板名称，通过用户已登录的浏览器逐封选择、发送并核验。始终维护去重台账，不因弹窗延迟而重复发送。

## 前置条件

- 目标 CRM 线索页可以是任意以 `https://crm-test.wukongedu.net/track/` 开头的 URL，不绑定具体线索 ID。
- 要求用户提供符合上述前缀的目标 CRM 线索 URL，或存在明确的、URL 符合上述前缀的已打开目标线索页。
- 仅在用户明确要求发送时点击“确定”。浏览、核对和诊断请求不授权发送。
- 使用 `chrome:control-chrome` 技能控制用户已登录的 Chrome 页面；先完整读取该技能的 `SKILL.md` 并遵守其中的浏览器选择、确认和页面核验要求。
- 不读取浏览器 Cookie、Local Storage、密码或其他会话存储。

## 1. 建立模板清单

从当前工作目录列出顶层 `*.html` 文件。模板名称使用文件名去掉末尾 `.html` 后的完整字符串，不修改空格、井号、中文、英文或大小写。

优先使用：

```sh
find . -maxdepth 1 -type f -name '*.html' -print
```

排序后建立台账，每项状态只能是：

- `pending`
- `sent`
- `unavailable`
- `blocked`

若本轮对话中已有某模板的已核验发送记录，将其直接标记为 `sent`。用户没有明确要求重复发送时，禁止再次发送。

## 2. 准备 CRM 页面

1. 连接 Chrome 并为会话命名；目标页 URL 必须以 `https://crm-test.wukongedu.net/track/` 开头，`track/` 后的线索 ID 可以不同。
2. 优先接管已经打开且 URL 符合上述前缀的目标线索页，避免重载导致正在填写的状态丢失。若同时存在多个符合前缀的线索页且用户未明确指定目标，不要自行猜测，先请用户确定。
3. 从最新 DOM 快照确认线索姓名、邮箱区域和邮件图标。
4. 每次打开“邮件”弹窗后，直接定位“邮件模版”（界面也可能写作“邮件模板”）选择框并搜索模板。
5. 不要因为 DOM 快照未展示发件人或收件人字段而中止，也不要为此关闭、重新打开弹窗。收件人可能是弹窗中的只读文本，且不一定稳定出现在无障碍 DOM 快照中。
6. 只要“邮件模版/邮件模板”选择框和“确定”按钮可操作，就继续模板搜索流程。

## 3. 逐封发送

按台账顺序逐项执行：

1. 获取新鲜 DOM 快照，定位目标邮箱单元格内唯一的邮件图标。
2. 点击邮件图标并确认“邮件”弹窗已出现。
3. 保持“模版邮件”选中。
4. 直接点击“邮件模版/邮件模板”组合框，输入完整模板名称搜索；不要先等待或核验其他弹窗字段。
5. 根据结果处理：
   - 出现“暂无数据”：标记 `unavailable`，关闭弹窗，不点击“确定”。
   - 只有一个精确匹配：选择它。
   - 有多个或没有精确匹配：不要猜测，标记 `blocked` 并记录原因。
6. 选择后只核验弹窗中显示的模板名称完全一致；不要因主题或正文未展示、加载较慢或无法从 DOM 读取而阻塞。
7. 点击“确定”。
8. 等待弹窗关闭，并在跟进记录顶部核验新邮件的当前时间、发送人和主题。
9. 核验成功后标记 `sent`。

每处理 3–5 个模板给用户一次简短进度更新。

## 4. 防重复与异常恢复

- 点击“确定”后弹窗短暂保留时，先等待并检查跟进记录，禁止立即再次点击。
- 若跟进记录已有新主题，即使弹窗稍后才关闭，也按 `sent` 处理。
- 若没有新记录且弹窗仍在：
  1. 检查所选模板名称是否仍然完全一致；
  2. 模板名称一致时只允许再点击一次“确定”；
  3. 仍异常则标记 `blocked`，不要继续盲目重试。
- 页面数据突然为空时，允许等待一次并重新获取 DOM；仍为空可新开同 URL 页面验证一次。若仍为空，停止并保留现场。
- 不通过邮件主题猜测发送成功；以新的跟进记录为权威信号。

## 5. 完成与报告

最终报告必须包含：

- 本地模板总数
- `sent` 数量
- `unavailable` 数量及完整模板名称
- `blocked` 数量、完整模板名称和具体原因
- 是否存在未完成项
- 若全部完成，明确说明每个本地模板已成功发送一次

浏览器任务结束前按浏览器技能要求整理标签页。若有未完成项，将目标 CRM 页作为 `handoff` 保留；全部完成时作为 `deliverable` 保留。
