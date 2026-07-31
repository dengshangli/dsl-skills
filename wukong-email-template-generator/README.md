# wukong-email-template-generator

English | [中文](./README.zh-CN.md)

## Overview

An Agent Skill for creating WuKong-branded HTML emails with a fixed, reusable email shell. The agent designs only the requested body fragment, and the bundled generator inserts it into the standard template.

## What it does

- Creates email-compatible body markup for campaigns, newsletters, notifications, and CRM emails.
- Runs `scripts/generate_email.py` to place the body inside the fixed WuKong shell.
- Produces one new, complete HTML email as the only deliverable.
- Preserves the template header, footer, global styles, links, attributes, and metadata.

## Use cases

- Marketing and campaign emails.
- Course reminders and registration confirmations.
- Product or service notifications.
- CRM follow-up emails that must use the standard WuKong layout.

## Requirements

- Python 3.
- A writable output directory.
- Email-compatible body markup: conservative HTML, inline styles, absolute image URLs, and no JavaScript.

The current [SKILL.md](./SKILL.md) contains the author's absolute installed path:

```text
/Users/dengshangli/.codex/skills/wukong-email-template-generator/scripts/generate_email.py
```

Other users must replace that path with the generator's actual installed location. This documentation update does not change the Skill implementation.

## Install

```bash
npx skills add dengshangli/dsl-skills --global --agent universal --skill wukong-email-template-generator
```

## Usage examples

- "Create a WuKong-branded summer course registration confirmation email."
- "Generate a newsletter announcing the new learning report."
- "Build a CRM follow-up email with this copy and these template variables."

## Important notes

- The bundled generator must be executed for every request.
- The body fragment is temporary and is not a deliverable.
- Only the body marker may be replaced; the fixed template must not be modified.
- The generator must report `GENERATOR_EXECUTED=YES` and an absolute `OUTPUT` path.
- Exactly one new HTML deliverable may remain.

## Full instructions

See [SKILL.md](./SKILL.md) for the mandatory generation contract, command, validation gates, and template boundary.

## License

This Skill is licensed under the repository-wide [MIT License](../LICENSE).
