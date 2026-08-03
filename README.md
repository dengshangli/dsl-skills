# Agent Workflow Skills

English | [中文](./README.zh-CN.md)

A collection of reusable Agent Skills for visual QA and email workflows. The repository follows the `SKILL.md`-based Agent Skills structure and can be used by compatible coding agents and automation tools.

Each skill has its own documentation, requirements, examples, and safety notes.

## Skills

| Skill | Purpose | Main requirements |
|---|---|---|
| [`figma-overlay-check`](./figma-overlay-check/README.md) | Compare a web page with a Figma design using runtime overlays, measurements, color checks, and pixel diffs | Figma MCP, Playwright MCP, Node.js |
| [`figma-overlay-cleanup`](./figma-overlay-cleanup/README.md) | Safely remove a preserved Figma overlay and its recorded artifacts without reverting UI fixes | Valid overlay state manifest, browser automation when available |
| [`wukong-email-template-generator`](./wukong-email-template-generator/README.md) | Generate HTML emails inside the fixed WuKong email shell | Python 3, bundled generator |
| [`email-template-compatibility-test`](./email-template-compatibility-test/README.md) | Batch-send local HTML templates to test inboxes and record accepted sends | Codex in-app browser |
| [`jingdouyun-email-template-replacement`](./jingdouyun-email-template-replacement/README.md) | Replace only the content field of matching Jingdouyun email templates | Logged-in Chrome, `chrome:control-chrome` |
| [`crm-email-manual-send`](./crm-email-manual-send/README.md) | Match local filenames to CRM templates, send each once, and verify follow-up records | Logged-in CRM Chrome, `chrome:control-chrome` |

## Install

The current `skills` CLI requires Node.js `>=22.20.0`. All commands below install only to the user-level shared root `~/.agents/skills/`; compatible AI tools can use the same canonical copy.

```bash
# Select skills interactively
npx skills add dengshangli/dsl-skills --global --agent universal

# Install one skill
npx skills add dengshangli/dsl-skills --global --agent universal --skill <skill-name>

# Install every skill to the shared root
npx skills add dengshangli/dsl-skills --global --agent universal --skill '*' --yes
```

For project-specific requirements and examples, open the skill name in the table above.

## Install the Wukong plugin

The WuKong generator is also available as a portable skills-only plugin:

```bash
codex plugin marketplace add dengshangli/dsl-skills --ref master
codex plugin add wukong-email-template-generator@dsl-skills
```

See the [plugin README](./plugins/wukong-email-template-generator/README.md) for details.

## Compatibility

The repository format is portable, but runtime compatibility depends on whether the host agent provides the browser controls, MCP servers, local commands, and authenticated sessions required by a particular skill. Review each skill's requirements before installing or running it.

## License

This repository is licensed under the [MIT License](./LICENSE).
