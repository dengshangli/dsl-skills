# jingdouyun-email-template-replacement

English | [中文](./README.zh-CN.md)

## Overview

An Agent Skill for synchronizing local HTML files with existing Jingdouyun CRM/CMS email templates. It replaces only the field explicitly labeled "模板内容" (template content) and preserves every other template field.

## What it does

- Maps each local `.html` filename to an existing template name by removing only the final extension.
- Searches for one exact template-name match.
- Opens the editor associated with the "模板内容" field.
- Replaces that field with the complete local HTML file.
- Verifies the success message, return to the template list, exact name, and refreshed row state.

## Use cases

- Batch-update existing Jingdouyun email templates.
- Synchronize approved local email HTML to a test environment.
- Resume a partially completed batch without blindly repeating successful updates.

## Requirements

- Local UTF-8 HTML files with unambiguous filenames.
- A Chrome session already logged in to the target Jingdouyun environment.
- The `chrome:control-chrome` Skill.
- An edit form that exposes a field explicitly labeled "模板内容".

## Install

```bash
npx skills add dengshangli/dsl-skills --skill jingdouyun-email-template-replacement
```

For a user-level installation:

```bash
npx skills add dengshangli/dsl-skills --skill jingdouyun-email-template-replacement --global
```

## Usage examples

- "Update the matching Jingdouyun templates with the HTML files in this directory."
- "Replace only the template content and preserve every other field."
- "Resume the failed items from the previous template synchronization."

## Important notes

- This Skill never creates templates.
- Only "模板内容" may be changed. Template name, category, identifier, subject, tags, status, text content, and description must remain untouched.
- Zero or multiple exact matches are failures; the agent must not guess.
- If the editor cannot be unambiguously associated with "模板内容", the update must stop.
- Login, CAPTCHA, ambiguous page state, or browser-control interruption requires user handoff.

## Full instructions

See [SKILL.md](./SKILL.md) for manifest rules, exact-match checks, TinyMCE source editing, batch recovery, and final reporting.

## License

This Skill is licensed under the repository-wide [MIT License](../LICENSE).
