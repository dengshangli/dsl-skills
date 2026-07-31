# crm-email-manual-send

English | [中文](./README.zh-CN.md)

## Overview

An Agent Skill for manually sending CRM template emails by matching local HTML filenames to exact template names on a CRM lead page. It sends each authorized template once and verifies success through a new follow-up record.

## What it does

- Builds a stable ledger from top-level local `.html` filenames.
- Preserves spaces, punctuation, Chinese characters, capitalization, and other filename details.
- Searches the CRM template selector for one exact match.
- Sends only explicitly authorized templates.
- Verifies the latest follow-up record instead of guessing from a subject line or dialog state.
- Reports sent, unavailable, blocked, and unfinished items.

## Use cases

- Send every local email template to a specified CRM lead.
- Retry only failed or unresolved items without duplicating verified sends.
- Identify templates that exist locally but are unavailable in the CRM.

## Requirements

- Local HTML files whose filenames exactly match CRM template names after removing `.html`.
- A Chrome session already logged in to the target CRM.
- The `chrome:control-chrome` Skill.
- One unambiguous CRM lead page under the allowed CRM URL prefix.
- Explicit user authorization to send.

## Install

```bash
npx skills add dengshangli/dsl-skills --global --agent universal --skill crm-email-manual-send
```

## Usage examples

- "Send every HTML template in this directory to this CRM lead and report unavailable templates."
- "Retry only the blocked items from the previous run."
- "Check which local templates are available in the CRM, but do not send anything."

## Important notes

- Browsing and diagnosis do not authorize sending. The confirm button may be clicked only when the user explicitly asks to send.
- A verified send is recorded in the ledger and must not be repeated unless the user explicitly requests a duplicate.
- "No data" means the template is unavailable; the agent must close the dialog without sending.
- Multiple or non-exact matches are blocked; the agent must not guess.
- A new follow-up record is the authoritative success signal.
- The Skill never reads browser cookies, local storage, passwords, or other session storage.

## Full instructions

See [SKILL.md](./SKILL.md) for ledger states, browser workflow, exact-match rules, duplicate prevention, recovery, and final reporting.

## License

This Skill is licensed under the repository-wide [MIT License](../LICENSE).
