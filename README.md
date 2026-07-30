# Codex 工作流 Skills

这个仓库收录了一组面向 Codex 的实用工作流 Skill，覆盖 Figma 设计还原度检查、悟空 HTML 邮件生成、邮件客户端兼容性测试、筋斗云后台模板替换，以及 CRM 模板邮件手动发送。

每个 Skill 都放在独立目录中，完整规则请查看对应目录下的 `SKILL.md`。

## Skill 总览

| Skill | 主要用途 | 典型场景 | 关键依赖 |
|---|---|---|---|
| [`figma-overlay-check`](figma-overlay-check/SKILL.md) | 将实现页面截图与 Figma 设计稿进行叠加和像素差异分析 | 定位布局、尺寸、位置和颜色偏差 | Figma MCP、Playwright MCP、Node.js 图像处理脚本 |
| [`wukong-email-template-generator`](wukong-email-template-generator/SKILL.md) | 使用固定的悟空邮件外壳生成 HTML 邮件 | EDM、活动邮件、通知邮件、CRM 邮件 | Python 3、仓库自带生成脚本 |
| [`email-template-compatibility-test`](email-template-compatibility-test/SKILL.md) | 将本地 HTML 模板批量发送到测试邮箱并记录服务器接受结果 | Gmail、Outlook 等邮箱的送达与渲染测试 | Codex 应用内置浏览器 |
| [`jingdouyun-email-template-replacement`](jingdouyun-email-template-replacement/SKILL.md) | 用本地 HTML 精确替换筋斗云现有模板的“模板内容” | 批量同步或更新后台邮件模板 | 已登录目标系统的 Chrome、Chrome 控制 Skill |
| [`crm-email-manual-send`](crm-email-manual-send/SKILL.md) | 将本地文件名映射到 CRM 模板，逐封发送并核验跟进记录 | CRM 模板邮件发送、失败重试、缺失模板排查 | 已登录 CRM 的 Chrome、Chrome 控制 Skill |

## 各 Skill 介绍

### `figma-overlay-check`

**用途：** 通过半透明叠加、像素差异和颜色采样，对比实现页面截图与 Figma 设计稿，定位视觉偏差。

**适用场景：**

- 验收前端页面与 Figma 设计稿的还原度。
- 排查布局、尺寸、间距、位置和颜色不一致。
- 在修改 UI 后使用相同截图条件复核偏差是否收敛。

**关键要求：** 需要可在本地运行的网页项目、同视口条件下的设计稿与实现页面，以及 Figma MCP、Playwright MCP 和 Node.js。应按 Skill 规定的顺序使用视口对齐、运行时叠图、DOM 测量、裁剪、颜色采样和像素差异脚本，并以测量结果定位问题；叠图代码不得写入项目源码。

**调用示例：**

> 对比这个 Figma Frame 和当前页面，找出主要视觉偏差并给出修正建议。

### `wukong-email-template-generator`

**用途：** 在标准悟空邮件头部、页脚和全局样式不变的前提下，将新设计的邮件正文装入固定模板并生成完整 HTML。

**适用场景：**

- 创建悟空品牌 EDM、活动营销邮件或 Newsletter。
- 创建通知邮件、CRM 邮件等需要统一品牌外壳的 HTML 邮件。

**关键要求：** 必须运行 Skill 自带的 `scripts/generate_email.py`，不能绕过生成器直接拼装最终 HTML；固定模板只允许替换“邮件正文”标记对应的内容。

> [!IMPORTANT]
> 当前 `SKILL.md` 中的示例命令包含作者本机路径 `/Users/dengshangli/.codex/skills/...`。其他用户安装后，需要将该路径替换为自己实际的 Skill 安装目录，例如 `${CODEX_HOME:-$HOME/.codex}/skills/wukong-email-template-generator/scripts/generate_email.py`。

**调用示例：**

> 使用悟空标准邮件模板，生成一封暑期课程报名成功通知邮件。

### `email-template-compatibility-test`

**用途：** 通过网页邮件测试工具，将本地 HTML 模板逐份发送到多个测试邮箱，并维护可审计的成功、失败和待核实清单。

**适用场景：**

- 批量发送 HTML 模板到 Gmail、Outlook 等测试邮箱。
- 区分“邮件服务器已接受”和“邮件已送达且渲染正常”。
- 对比不同邮箱客户端中的布局、字体、图片、链接和深色模式表现。

**关键要求：** 必须使用 Codex 应用内置浏览器；实际发送前需要确认模板数量、收件人和预计投递数。服务器接受不等于最终送达或兼容性通过。

**调用示例：**

> 把当前目录下的所有 HTML 邮件发送到这两个测试邮箱，并汇总各模板的接受结果。

### `jingdouyun-email-template-replacement`

**用途：** 将本地 HTML 文件同步到筋斗云 CRM/CMS 中名称完全匹配的现有邮件模板。

**适用场景：**

- 批量更新筋斗云后台已有邮件模板。
- 将本地设计稿同步到测试环境，同时保留模板名称、主题、分类和状态等其他字段。

**关键要求：** 需要已登录目标系统的 Chrome 会话。只允许修改明确标注为“模板内容”的字段，不创建新模板，也不修改其他字段；提交前必须验证模板名称和唯一匹配关系。

**调用示例：**

> 把当前目录中的 HTML 文件同步到筋斗云同名邮件模板，只替换模板内容。

### `crm-email-manual-send`

**用途：** 根据本地 HTML 文件名，在 CRM 线索页搜索同名模板，逐封手动发送，并通过新的跟进记录核验结果。

**适用场景：**

- 向指定 CRM 线索发送当前目录中的全部模板邮件。
- 重试本轮未成功发送的模板，同时避免重复发送。
- 汇总本地存在但 CRM 中不可用的模板名称。

**关键要求：** 需要已登录目标 CRM 的 Chrome 会话和明确的目标线索页。只有用户明确要求发送时才能点击“确定”；发送成功以新的跟进记录为准，不能仅根据主题或弹窗状态推断。

**调用示例：**

> 在这个 CRM 线索页发送当前目录里的所有邮件模板，并告诉我哪些模板在 CRM 中找不到。

## 安装

默认安装目录为：

```text
${CODEX_HOME:-$HOME/.codex}/skills
```

如果没有设置 `CODEX_HOME`，实际目录通常是 `~/.codex/skills`。

### 方式一：整库安装

克隆仓库，然后把所有包含顶层 `SKILL.md` 的 Skill 目录复制到 Codex：

```bash
git clone https://github.com/dengshangli/skills.git
cd skills

SKILLS_DIR="${CODEX_HOME:-$HOME/.codex}/skills"
mkdir -p "$SKILLS_DIR"

for skill in */SKILL.md; do
  skill_dir="${skill%/SKILL.md}"
  if [ -e "$SKILLS_DIR/$skill_dir" ]; then
    echo "跳过已存在的目录：$SKILLS_DIR/$skill_dir"
  else
    cp -R "$skill_dir" "$SKILLS_DIR/"
  fi
done
```

该命令只安装 Skill 目录，不会复制仓库的 `.git`、`docs` 或 README，也不会覆盖已有的同名目录。

### 方式二：安装单个 Skill

下面以安装 `crm-email-manual-send` 为例，使用 Git sparse-checkout 只获取所需目录：

```bash
git clone --filter=blob:none --no-checkout https://github.com/dengshangli/skills.git skills-single
cd skills-single
git sparse-checkout init --cone
git sparse-checkout set crm-email-manual-send
git checkout master

SKILLS_DIR="${CODEX_HOME:-$HOME/.codex}/skills"
mkdir -p "$SKILLS_DIR"

if [ -e "$SKILLS_DIR/crm-email-manual-send" ]; then
  echo "目标目录已存在，未覆盖：$SKILLS_DIR/crm-email-manual-send"
else
  cp -R crm-email-manual-send "$SKILLS_DIR/"
fi
```

安装其他 Skill 时，把命令中的 `crm-email-manual-send` 替换成下面任一目录名：

- `figma-overlay-check`
- `wukong-email-template-generator`
- `email-template-compatibility-test`
- `jingdouyun-email-template-replacement`
- `crm-email-manual-send`

## 更新

进入之前克隆的仓库目录，获取最新版本：

```bash
git pull
```

查看更新内容后，再把需要更新的 Skill 目录复制到 Codex 安装目录。由于安装命令默认不覆盖同名目录，请先备份本地自定义内容，再替换旧版本。

## 验证安装

运行下面的命令查看已经安装的 Skill：

```bash
find "${CODEX_HOME:-$HOME/.codex}/skills" -maxdepth 2 -name SKILL.md -print
```

安装或更新后，建议重新启动 Codex 或新建会话，让 Codex 重新发现 Skill。

## 卸载

确认目标目录中没有需要保留的自定义修改后，删除对应目录：

```bash
rm -r "${CODEX_HOME:-$HOME/.codex}/skills/<skill-name>"
```

请将 `<skill-name>` 替换为准确的 Skill 目录名，并在执行前再次核对路径。

## 使用说明与安全提示

- 安装完成后，可以在请求中直接写出 Skill 名称，也可以用自然语言描述任务，让 Codex 根据适用场景选择 Skill。
- 需要网页操作的 Skill 依赖对应的浏览器控制能力，并要求浏览器中已经登录目标系统。
- 发送邮件、替换后台模板或提交表单属于会改变外部状态的操作，必须由用户明确授权。
- 不要通过 Cookie、Local Storage、密码或其他会话数据绕过正常登录和页面操作。
- 执行前请阅读对应的 `SKILL.md`，确认目标环境、浏览器类型和安全约束。

## 许可证

仓库目前未提供许可证文件。在添加明确的开源许可证前，公开访问不代表自动授予复制、修改或再分发许可。
