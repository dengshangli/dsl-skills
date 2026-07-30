# email-template-compatibility-test

English | [中文](./README.zh-CN.md)

## Overview

An Agent Skill for batch-sending local HTML email templates to one or more test inboxes through a web-based mail testing form. It maintains an auditable result list and separates server acceptance from delivery and rendering compatibility.

## What it does

- Discovers local `.html` and `.htm` templates in a bounded directory.
- Uses each complete filename as the default email subject.
- Uploads each template once and sends it to all confirmed test recipients.
- Records accepted, failed, and unresolved templates without blind retries.
- Can support later visual checks across email providers.

## Use cases

- Send a batch of templates to Gmail, Outlook, and other test inboxes.
- Check that no local template was skipped or sent twice.
- Compare layout, fonts, images, links, dark mode, and mobile rendering after delivery.

## Requirements

- Local HTML email files that satisfy the testing page's type and size limits.
- Explicitly provided test recipients.
- The Codex in-app browser. The current Skill requires `browser:control-in-app-browser` and does not automatically fall back to Chrome.
- Access to the default testing page or another user-approved equivalent page.

## Install

```bash
npx skills add dengshangli/skills --skill email-template-compatibility-test
```

For a user-level installation:

```bash
npx skills add dengshangli/skills --skill email-template-compatibility-test --global
```

## Usage examples

- "Send every HTML template in this directory to these two test inboxes."
- "Use each filename as the subject and report which templates the server accepted."
- "After delivery, compare how the messages render in Gmail and Outlook."

## Important notes

- Sending requires a batch-level confirmation that lists the template count, recipients, and expected delivery count.
- "Server accepted" does not mean the message reached the inbox or rendered correctly.
- A timeout is not proof of failure. Check the page state before retrying to avoid duplicate email.
- CAPTCHA, login, or browser-control interruptions require user handoff.
- Use test inboxes and authorized recipients only.

## Full instructions

See [SKILL.md](./SKILL.md) for the browser selection rule, upload sequence, result criteria, recovery process, and final report format.

## License

This Skill is licensed under the repository-wide [MIT License](../LICENSE).
