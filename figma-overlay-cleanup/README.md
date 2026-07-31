# figma-overlay-cleanup

English | [中文](./README.zh-CN.md)

## Overview

An Agent Skill for safely removing a Figma comparison overlay preserved by `figma-overlay-check`. It removes only the runtime overlay and the files recorded in the overlay state manifest, while preserving every UI fidelity fix made during comparison.

## What it removes

- The runtime overlay element `#__figma_overlay__`.
- The runtime style `#__figma_overlay_style__`.
- The recorded static overlay image, such as `public/__figma_overlay.png`.
- The recorded downloaded design image and pixel-diff artifacts.
- The temporary `.figma-overlay-state.json` manifest, after all other cleanup succeeds.

It does **not** revert, reset, or delete UI implementation changes.

## How it works with figma-overlay-check

1. `figma-overlay-check` compares and fixes the page, then leaves the overlay visible for manual review.
2. It writes `<project-root>/.figma-overlay-state.json` with the exact overlay element IDs and artifact paths.
3. After reviewing the page, the user explicitly asks to remove the overlay.
4. `figma-overlay-cleanup` validates the manifest, removes the runtime overlay, deletes only the recorded files, and deletes the manifest last.

The manifest is the deletion allowlist. Do not create or edit it manually unless you fully understand the cleanup contract.

## Requirements

- An overlay previously preserved by `figma-overlay-check`.
- A valid `.figma-overlay-state.json` in the target project root.
- Filesystem access to the recorded artifacts.
- Browser automation when the runtime overlay is still open. File cleanup can continue if the page is unavailable, but DOM removal cannot be verified.

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
- Only exact recorded file paths are eligible for deletion.
- Directories, wildcards, recursive deletion, guessed paths, and normal source files are forbidden.
- Missing or unsafe state causes cleanup to stop instead of broadening the deletion scope.
- Already absent files are reported as absent rather than falsely reported as deleted.

## Full instructions

See [SKILL.md](./SKILL.md) for the validation, browser cleanup, file deletion, and verification workflow.

## License

This Skill is licensed under the repository's [MIT License](../LICENSE).
