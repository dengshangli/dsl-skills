# figma-overlay-cleanup

English | [中文](./README.zh-CN.md)

## Overview

An Agent Skill for safely removing a Figma comparison overlay preserved by `figma-overlay-check`. The current v3 flow removes only one marked page import, one temporary overlay file, one design image, and recorded artifacts while preserving every UI fidelity fix.

## What it removes

- The single temporary overlay source file recorded by a v3 manifest.
- The one page import enclosed by `FIGMA_OVERLAY_START` / `FIGMA_OVERLAY_END`.
- The recorded static overlay image, such as `public/__figma_overlay__.png`.
- The recorded downloaded design image and pixel-diff artifacts.
- Runtime overlay elements and styles recorded by a legacy v1 manifest.
- The temporary `.figma-overlay-state.json` manifest, after all other cleanup succeeds.

It does **not** revert, reset, or delete UI implementation changes.

## How it works with figma-overlay-check

1. `figma-overlay-check` compares and fixes the page, then leaves the overlay visible for manual review.
2. It writes `<project-root>/.figma-overlay-state.json` with the exact temporary file, image, page import, and artifacts.
3. After reviewing the page, the user explicitly asks to remove the overlay.
4. `figma-overlay-cleanup` removes the page import first, then the temporary file, image, artifacts, and finally the manifest.

The manifest is the deletion allowlist. Do not create or edit it manually unless you fully understand the cleanup contract.

## Requirements

- An overlay previously preserved by `figma-overlay-check`.
- A valid `.figma-overlay-state.json` in the target project root.
- Filesystem access to the recorded artifacts.
- Browser automation to refresh and verify that the temporary-file or legacy overlay is gone; unavailable pages are reported as unverified.

## Install

The current `skills` CLI requires Node.js `>=22.20.0`.

```bash
# Install to the user-level shared root ~/.agents/skills/
npx skills add dengshangli/dsl-skills --global --agent universal --skill figma-overlay-cleanup
```

Install `figma-overlay-check` as well if you want the complete comparison and cleanup lifecycle.

## Usage examples

- "删除叠图。"
- "移除刚才保留的 Figma overlay。"
- "清理叠图和下载的比对图片，但保留 UI 修改。"
- "Remove the preserved overlay from this project."

For a different or newly opened task, include the target project path so the correct manifest can be resolved.

## Safety guarantees

- Cleanup runs only after an explicit user instruction.
- The canonical project root must match the manifest.
- Only the exact recorded temporary file, image, artifacts, and page import are eligible for deletion or editing.
- Directories, wildcards, recursive deletion, guessed paths, and edits outside marked blocks are forbidden.
- Missing or unsafe state causes cleanup to stop instead of broadening the deletion scope.
- Already absent files are reported as absent rather than falsely reported as deleted.

## Full instructions

See [SKILL.md](./SKILL.md) for manifest validation, page-import removal, temporary-file deletion, browser verification, and final checks.

## License

This Skill is licensed under the repository's [MIT License](../LICENSE).
