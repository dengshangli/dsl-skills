---
name: jingdouyun-email-template-replacement
description: Replace only the “模板内容” field of existing 筋斗云 CRM/CMS email templates with matching local HTML files through the logged-in Chrome browser. Use when the user asks to upload, synchronize, batch-update, or replace email template content on cp-admin-test.wukongacademy.com (or the equivalent 筋斗云 template management page) while preserving every other field.
---

# 筋斗云邮件模板替换

Synchronize local `.html` files to the “模板内容” field of existing 筋斗云 email templates. Do not create templates or modify any other field.

## Preconditions

- Use the `chrome:control-chrome` skill and reuse the user's logged-in Chrome session.
- Default list URL: `https://cp-admin-test.wukongacademy.com/home/cms/templateList`.
- Treat the user's request to replace the templates as authorization to submit those specific edits.
- Treat “模板内容” as the only writable field. Do not type into, select, toggle, clear, or otherwise modify any other field, including template name, category, identifier, subject, tags, status, text content, and description.
- Reading other fields for identity verification is allowed; writing to them is not.
- If the edit form does not expose a field explicitly labeled “模板内容”, or the editor cannot be unambiguously associated with that label, stop and record the entry as failed. Never infer the target editor by position.

## Build the update manifest

1. Enumerate `*.html` files in the user-specified directory with `rg --files` or an equivalent bounded listing.
2. Map each normal file to a template name by removing only the final `.html` suffix. Preserve spaces, `#`, Chinese characters, capitalization, and punctuation exactly.
3. Read every HTML file as UTF-8. Do not reformat, minify, repair, or extract only `<body>` unless the user explicitly requests that.
4. Flag abnormal filenames, duplicate stems, empty files, and implausibly large files before browser writes.
5. Resolve an abnormal filename only from strong local evidence, such as an already-open `file://` tab showing the original filename, a unique implementation manifest, or an unambiguous template identifier. Otherwise skip it and report it; never guess a destination.
6. Keep an in-memory manifest containing `file`, `templateName`, byte length, and status.

## Update one template

Perform these steps for exactly one manifest entry:

1. Open the template list page.
2. Fill `请输入模板名称` with the exact template name and click `搜索`.
3. Verify the results contain exactly one row whose template name exactly matches. If zero or multiple rows match, do not edit; record the failure.
4. Click that row's `修改`.
5. Wait until the edit form and TinyMCE editor are fully loaded. Verify the displayed template name still matches without changing it.
6. Locate the field explicitly labeled `模板内容` and verify that its associated editor is the TinyMCE instance being operated. Do not interact with any other editable field.
7. In that `模板内容` editor, open `工具` → `源代码`.
8. Verify the `源代码` dialog contains exactly one textbox belonging to the `模板内容` editor. Replace its entire value with the complete local HTML file.
9. Before submitting, verify that the only changed form field is `模板内容`. If any other field changed, do not submit; restore or cancel the form and record the failure.
10. Click the dialog's `保存`, then click the outer form's `提交`.
11. Verify all authoritative success signals:
   - the browser returned to `/home/cms/templateList`;
   - `提交成功` is visible;
   - the result row still has the exact template name;
   - the last-modified time or equivalent row state refreshed.
12. Record success only after those checks pass.

## Batch execution and recovery

- Process templates in small batches of 3–5 so progress remains observable and interruptions are recoverable.
- After each batch, report concise counts: succeeded, skipped, failed, remaining.
- Before resuming an interrupted run, search the relevant template rows and compare last-modified timestamps or content where necessary. Do not blindly repeat a partially completed batch.
- Continue after an isolated not-found or validation failure, but never continue from the wrong page, ambiguous result, failed login, CAPTCHA, or browser-control interruption.
- If authentication is missing, keep the page open and ask the user to sign in.
- If a CAPTCHA appears, follow the browser skill's CAPTCHA confirmation rule.

## Browser interaction guardrails

- Follow the Chrome skill's snapshot and locator discipline before every action.
- Prefer exact placeholders, roles, visible names, and row-scoped locators supported by the latest DOM snapshot.
- Never use positional shortcuts for ambiguous rows or buttons.
- Scope every editor action to the form control associated with the exact label `模板内容`.
- Recheck page state after navigation, menu opening, dialog opening, dialog save, and form submission.
- Do not use direct HTTP requests, copied cookies, local storage, or hidden session data to bypass the UI.
- Finalize Chrome tabs at the end. Keep the template list as `deliverable` when the user may want to inspect the completed updates; use `handoff` when login or another user action is required.

## Final report

Return:

- number of discovered HTML files;
- exact list or count of successfully updated templates;
- skipped files and why;
- failed template names and the last verified state;
- whether the template-list tab was left open for inspection.
