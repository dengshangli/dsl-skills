---
name: figma-overlay-cleanup
description: Safely remove a Figma comparison overlay preserved by figma-overlay-check, including a source-backed persistent overlay, its marked integration blocks, static design image, temporary artifacts, state manifest, or a legacy runtime overlay, without reverting UI fidelity fixes. Use only when the user explicitly says "删除叠图", "移除叠图", "清理叠图", "删除比对图片", "remove overlay", or otherwise clearly asks to remove a preserved Figma overlay.
---

# Figma Overlay Cleanup

Remove only comparison artifacts recorded by `$figma-overlay-check`. Treat the user's explicit cleanup request as authorization to remove the overlay implementation, not as authorization to revert UI fidelity fixes.

## Workflow

### 1. Resolve and validate the manifest

Resolve the canonical project root and read only:

```text
<project-root>/.figma-overlay-state.json
```

Require `projectRoot` to equal the canonical project root. Support:

- version 2: source-backed overlay
- version 1: legacy runtime-injected overlay

Stop and ask the user if the manifest is missing, invalid, belongs to another project, uses an unsupported version, or contains an unsafe or ambiguous path. Do not guess paths or infer permission to remove unrecorded files.

For every version, validate that `staticImagePath`, `downloadedImagePath`, and each `artifactPaths` item is an exact file path. Project paths must resolve inside `projectRoot`; temporary paths must resolve under `/tmp/figma-overlay`. Reject directories, broad paths, wildcards, and ordinary application assets.

For version 2, additionally validate:

- every `generatedSourcePaths` item resolves inside `projectRoot`, names an overlay-specific file, and is not an existing application file reused for integration
- every `integrationBlocks` item has an exact project file path plus `FIGMA_OVERLAY_START` and `FIGMA_OVERLAY_END` markers
- each integration file contains exactly one start marker and one end marker in the correct order
- the marked block is limited to overlay imports, mounts, configuration, or comments; stop if it includes ordinary application behavior
- no path appears in both `generatedSourcePaths` and `integrationBlocks`

For version 1, validate the recorded element and style IDs exactly as the legacy manifest specifies.

### 2. Remove source integration for version 2

Inspect each integration file immediately before editing. Use `apply_patch` to remove the complete marker-delimited block, including the marker lines, while preserving all surrounding code. Do not rewrite or reformat unrelated content.

After each edit:

- confirm both markers are absent
- inspect the diff to ensure only the recorded overlay block was removed
- run the narrowest available syntax, type, or build check for the touched file when practical

If the block is missing, duplicated, changed beyond recognition, or entangled with application behavior, stop before deleting any source or image files and ask the user how to proceed.

### 3. Remove dedicated overlay files

Delete only validated paths, using exact quoted paths and non-recursive operations, in this order:

1. version 2 `generatedSourcePaths`
2. `staticImagePath`
3. `downloadedImagePath`
4. every `artifactPaths` entry

Inspect each path immediately before deletion. Delete only regular files or symlinks. Do not delete directories, use wildcards, or remove files merely because their names look related. Leave empty directories in place unless the user explicitly asks to remove them and they are verified overlay-only directories.

### 4. Clear the browser overlay

For version 2, refresh the recorded `pageUrl` when available and verify the code-backed overlay no longer renders.

For version 1, remove only the recorded runtime element and style, then verify they are absent. A refresh may already have removed them; absence is a successful no-op.

If the page is unavailable, continue only with already validated file cleanup and report that browser verification could not be performed.

### 5. Remove the manifest and report

Delete `.figma-overlay-state.json` last, only after all required source edits and file deletions succeed. Then verify:

- no recorded overlay file remains
- all recorded integration markers are absent for version 2
- the overlay is absent from the page when reachable
- the manifest is absent
- UI fidelity fixes remain intact

Report exact files and integration blocks removed. Identify already-absent files as already absent rather than claiming they were deleted.

## Rules

- Require an explicit cleanup instruction.
- Treat the manifest as the deletion and edit allowlist.
- Never revert UI fidelity fixes or unrelated source changes.
- Prefer a partial, clearly reported cleanup over editing an ambiguous block or deleting an unverified path.
