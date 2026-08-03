---
name: wukong-email-template-generator
description: Use when creating or designing a WuKong/悟空 HTML email, EDM, campaign email, newsletter, notification email, or CRM email that must use the standard WuKong email shell.
license: MIT
---

# 悟空邮件模板生成器

## Mandatory execution contract

For every email request, MUST execute `scripts/generate_email.py`. Writing or copying a complete HTML file directly is not a valid use of this Skill. Do not report completion or hand off an HTML file unless the command succeeds and prints both:

```text
GENERATOR_EXECUTED=YES
OUTPUT=<absolute-path>
```

The generated file at `OUTPUT` is the only deliverable. Exactly one new `.html` file may remain after the task. A body-fragment file is temporary work, never a second HTML deliverable.

## Required procedure

1. Design only the requested email body as an HTML fragment. Use email-compatible markup, tables where layout requires them, inline CSS, absolute image URLs, and the user's required template variables.
2. Create the intermediate body fragment inside a dedicated system temporary directory, outside the user's open directory, and give it a `.txt` suffix such as `body-fragment.txt`. Never save the body fragment with an `.html` suffix. Do not include `<html>`, `<head>`, or `<body>` wrappers.
3. Resolve the directory containing this `SKILL.md`, then change to the user's current open directory. Run the bundled generator from that resolved skill directory:

   ```bash
   python3 <skill-directory>/scripts/generate_email.py \
     --body-file <system-temp-dir>/body-fragment.txt
   ```

   Never assume the author's home directory or a fixed installation path. The resolved generator path must belong to this installed plugin's bundled skill.

   This defaults to a new timestamped HTML file in the current directory. If the user explicitly requests a filename or directory, add `--output <new-path.html>`.
4. Require exit code `0`, `GENERATOR_EXECUTED=YES`, and an `OUTPUT=` path.
5. Verify that the `OUTPUT` file exists and that it is the only new HTML file created by the task. Remove the dedicated system temporary directory, then return the exact `OUTPUT` path.

## Template boundary

Treat `assets/template.html` as immutable. The generator replaces only its single `邮件正文` placeholder. Never change the header, footer, shell, global styles, links, attributes, whitespace, or any other template byte.

## Email body markup

Do not add width to `<td>` elements by default. This applies to both the `width` attribute and inline `style="width:…"`. Allow a `<td>` width only when the layout genuinely requires fixed columns, image placeholders, or email-client compatibility. Prefer natural table sizing when none of those conditions applies.

## Non-negotiable rules

- Never substitute another script, direct file write, copy command, heredoc, formatter, or DOM serializer for `generate_email.py`.
- Never return the body fragment as though it were the completed email.
- Never create a body-fragment `.html` file in the user's directory.
- Never edit or overwrite `assets/template.html`.
- Never modify any template content outside the exact `邮件正文` placeholder.
- Never overwrite an existing output file; choose a new filename.
- Keep the generated body suitable for email clients: inline styles, conservative HTML, explicit dimensions where useful, and no JavaScript.
- If the request requires changing the fixed header, footer, shell, or global metadata, stop and explain that this skill permits body-only changes.

## Red flags

Stop before delivery if any is true:

- `generate_email.py` was not executed.
- The command output lacks `GENERATOR_EXECUTED=YES`.
- The proposed deliverable is the body fragment.
- More than one new `.html` file was created.
- The final HTML lacks the fixed WuKong header or footer.

Fix the workflow and rerun the generator; do not waive the gate.
