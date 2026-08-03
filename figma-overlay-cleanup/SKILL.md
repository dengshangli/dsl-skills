---
name: figma-overlay-cleanup
description: Safely remove a Figma comparison overlay preserved by figma-overlay-check by deleting its one temporary overlay source file, static design image, recorded artifacts and manifest, and removing only its marked import from the page entry, without reverting UI fidelity fixes. Also supports legacy v2 source overlays and v1 runtime overlays. Use only when the user explicitly says "删除叠图", "移除叠图", "清理叠图", "删除比对图片", "remove overlay", or otherwise clearly asks to remove a preserved Figma overlay.
---

# Figma Overlay Cleanup

Remove only comparison artifacts recorded by `$figma-overlay-check`. For a current v3 overlay, clean up exactly three project changes: the marked page-entry import, the one temporary source file, and the one static design image. Preserve every UI fidelity fix.

## Workflow

### 1. Resolve and validate the manifest

Resolve the canonical project root and read only:

```text
<project-root>/.figma-overlay-state.json
```

Require `projectRoot` to equal the canonical project root. Support:

- version 3: single temporary source file plus one marked page-entry import
- version 2: legacy source-backed overlay with generated files and integration blocks
- version 1: legacy runtime-injected overlay

Stop if the manifest is missing, invalid, belongs to another project, uses an unsupported version, or contains an unsafe path. Do not guess paths or remove unrecorded files.

For all versions, validate `staticImagePath`, `downloadedImagePath`, and every `artifactPaths` item as exact file paths. Project paths must resolve inside `projectRoot`; temporary paths must resolve under `/tmp/figma-overlay`. Reject directories, broad paths, wildcards, and ordinary application assets.

For version 3, require:

- `temporarySourcePath` resolves inside `projectRoot`, names one overlay-specific regular file, and is not the page-entry file
- `entryImport.path` resolves inside `projectRoot` and names an existing application source file
- `entryImport.startMarker` and `entryImport.endMarker` are exactly `FIGMA_OVERLAY_START` and `FIGMA_OVERLAY_END`
- the entry file contains exactly one marker pair in the correct order
- the marked block contains only comments and one side-effect import matching `entryImport.importedPath`
- the import resolves to `temporarySourcePath`

If the marked block contains JSX, component mounting, styles, configuration, route logic, or application behavior, stop and ask the user instead of deleting it.

For version 2, require every `generatedSourcePaths` item to be an overlay-specific file inside `projectRoot`, and every `integrationBlocks` item to name an existing project file with exactly one ordered marker pair. Reject blocks containing ordinary application behavior and reject paths appearing in both fields. For version 1, validate the recorded runtime element/style IDs exactly.

### 2. Remove the page-entry import

For version 3, inspect `entryImport.path` immediately before editing. Use `apply_patch` to remove the complete marker block, including both marker lines and the one import. Preserve all surrounding code and formatting.

Confirm:

- the import and both markers are absent
- the temporary source file is no longer referenced by project source
- the diff changes only the recorded import block

Run the narrowest available syntax, type, or build check for the entry file when practical. If the block is missing, duplicated, changed, or ambiguous, stop before deleting any files.

For version 2, remove only each validated marker-delimited integration block according to the legacy manifest. Version 1 has no source import to edit.

### 3. Delete the temporary file, image, and artifacts

After the entry import is safely removed, delete only validated regular files or symlinks using exact paths and non-recursive operations:

1. version 3 `temporarySourcePath` (or version 2 recorded generated overlay files)
2. `staticImagePath`
3. `downloadedImagePath`
4. every `artifactPaths` entry

Do not delete directories, use wildcards, or remove similarly named unrecorded files. Leave empty directories in place unless the user explicitly requests their removal and they are verified overlay-only directories.

### 4. Verify the page

For version 3 or 2, refresh `pageUrl` when available and verify the overlay no longer renders and the application still loads.

For version 1, remove only the recorded runtime element and style, then verify they are absent. Their prior absence is a successful no-op.

If the page is unavailable, report that browser verification could not be completed.

### 5. Delete the manifest and report

Delete `.figma-overlay-state.json` last, only after the required source edit and file deletions succeed. Verify:

- the marked import is absent
- the temporary source file and static image are absent
- all recorded artifacts and the manifest are absent
- the page has no overlay when reachable
- UI fidelity fixes remain intact

Report the exact import block and files removed. Identify already-absent files honestly.

## Rules

- Require an explicit cleanup instruction.
- Treat the manifest as the edit and deletion allowlist.
- For v3, remove only one marked import, one temporary source file, one image, recorded artifacts, and the manifest.
- Never revert UI fixes or unrelated source changes.
- Stop on ambiguity rather than broadening cleanup scope.
