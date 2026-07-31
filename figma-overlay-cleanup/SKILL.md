---
name: figma-overlay-cleanup
description: Safely remove a Figma comparison overlay previously preserved by figma-overlay-check, including its runtime DOM/style, recorded static image, downloaded design image, diff artifacts, and state manifest, without reverting UI fidelity fixes. Use only when the user explicitly says "删除叠图", "移除叠图", "清理叠图", "删除比对图片", "remove overlay", or otherwise clearly asks to remove a preserved Figma overlay.
---

# Figma Overlay Cleanup

Remove only the overlay state created by `$figma-overlay-check`. Treat the user's explicit cleanup request as authorization to delete the recorded overlay artifacts, but not as authorization to revert UI implementation changes.

## Workflow

### 1. Resolve the project and manifest

Resolve the canonical project root from the current workspace or the path named by the user. Look only for:

```text
<project-root>/.figma-overlay-state.json
```

Read the manifest before changing anything. Validate that:

- `version` is supported
- canonical `projectRoot` equals the resolved project root
- `overlayElementId` is `__figma_overlay__`
- `overlayStyleId` is `__figma_overlay_style__`
- `staticImagePath`, when present, resolves inside `projectRoot` and names an overlay-specific image
- `downloadedImagePath` and every `artifactPaths` entry, when present, are exact file paths for this overlay; temporary paths should resolve under `/tmp/figma-overlay`
- no recorded entry is a directory or a normal project source file

Stop and ask the user if the manifest is missing, invalid, belongs to another project, or contains an unsafe or ambiguous path. Do not guess paths, search broadly for similar files, or infer permission to delete unrecorded artifacts.

### 2. Remove the runtime overlay

Open or reuse the page recorded in `pageUrl` when available, then remove only the recorded overlay element and style:

```javascript
() => {
  document.getElementById('__figma_overlay__')?.remove();
  document.getElementById('__figma_overlay_style__')?.remove();
}
```

If the page is unavailable, continue with validated file cleanup and report that browser DOM verification could not be performed. A refresh may already have removed the runtime elements; their absence is a successful no-op.

### 3. Delete recorded files

Inspect each recorded path immediately before deletion. Delete only existing regular files or symlinks that passed Step 1 validation, using exact quoted paths and non-recursive operations. Delete:

1. `staticImagePath`
2. `downloadedImagePath`
3. every file in `artifactPaths`
4. `.figma-overlay-state.json` last

Do not delete directories, use wildcards, run recursive deletion, or remove files merely because their names look related. Do not edit, delete, reset, or revert UI source files.

### 4. Verify and report

Verify:

- the overlay element and style are absent when the page is reachable
- every recorded overlay file is absent
- the state manifest is absent
- no UI implementation change was reverted

Report the runtime elements and exact files removed. If a recorded file was already absent, identify it as already absent rather than claiming it was deleted.

## Rules

- Require an explicit cleanup instruction; never run as automatic completion of a fidelity check
- Treat the manifest as the deletion allowlist
- Preserve all UI fidelity fixes
- Prefer a partial, clearly reported cleanup over deleting an unverified path
