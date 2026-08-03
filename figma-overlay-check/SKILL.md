---
name: figma-overlay-check
description: Verify and improve web UI fidelity against a Figma design by exporting a page-level Frame, placing all persistent overlay logic in one temporary source file, importing it once from the page entry, actively fixing overlay-revealed UI differences through repeated comparison, and handing off only after the fixes are verified for user confirmation. Use for pixel-perfect walkthroughs or when the user mentions "overlay comparison", "design diff", "visual QA", "还原度", "叠图比对", or asks for a low-intrusion overlay that can be removed cleanly. Requires a locally runnable web project, Figma MCP, and browser automation.
---

# Figma Overlay Fidelity Check

Export one Figma page Frame as PNG. Put the entire comparison overlay implementation in **one temporary source file**, then add **one marked side-effect import** to the browser-executed page entry. The overlay must survive refreshes and remain until `$figma-overlay-cleanup` removes the temporary file, image, and import.

## Required outcome

- Create exactly one temporary overlay source file.
- Keep all overlay DOM, styles, controls, state, route checks, and listeners in that file.
- Change one existing page-entry file only by adding a marked import for the temporary file.
- Provide `hidden`, `opacity`, and `difference` modes plus opacity control.
- Render the overlay image at exactly the Figma Frame's logical width.
- Align the overlay image's rendered left and top edges exactly with the target page canvas's left and top edges.
- After the overlay works, inspect the revealed differences and actively fix the application UI before asking the user to confirm.
- Repeat compare → fix → refresh → measure until the pass criteria are met or remaining differences are explicitly explained.
- Do not add overlay-related files or paths to `.gitignore`; leave them visible for `$figma-overlay-cleanup` to remove.
- After completing overlay-guided UI fixes, explicitly prompt the user to invoke `$figma-overlay-cleanup` after their final visual confirmation.
- Keep the overlay active at handoff. Do not commit comparison-only files unless explicitly requested.

## Workflow

```text
Task Progress:
- [ ] Step 1: Export the page-level Figma Frame
- [ ] Step 2: Create one temporary overlay file and import it once
- [ ] Step 3: Align viewport, page height, and overlay geometry
- [ ] Step 4: Run the AI correction loop on overlay-revealed differences
- [ ] Step 5: Verify colors numerically
- [ ] Step 6: Quantify with pixel diff
- [ ] Step 7: Record v3 cleanup state and leave the overlay active
```

### Step 1: Export the design

Use Figma MCP `get_metadata` or `get_design_context` to read the selected page Frame's logical width and height, then use `download_assets` with PNG output. Treat the Figma Frame width as the single source of truth and record it before implementing the overlay. Copy the PNG to one overlay-specific static path, for example:

```text
<project>/public/__figma_overlay__.png
```

Adapt the static directory to the framework and do not overwrite an application asset.

Figma caps exports at 4096 px on the long edge. Confirm the exported PNG size with `file` or `sips`, but never use that exported pixel width to size the overlay. Render at the Frame's logical CSS width exactly.

Do not derive overlay width from the viewport, `body`, a parent container, the PNG's intrinsic dimensions, or a screenshot. Do not use `100%`, `100vw`, a constraining `max-width`, or responsive scaling for the overlay image; explicitly use `max-width: none`.

### Step 2: Create one temporary overlay file and import it once

Identify the browser-executed entry for the target page. Create exactly one temporary source file next to or near that entry, for example:

```text
src/__figma_overlay__.ts
```

Prefer a side-effect module using plain DOM APIs so application code needs only an import. The temporary file must:

1. Guard browser APIs with `typeof document !== 'undefined'` if the framework may evaluate modules during server rendering.
2. Initialize idempotently after the document body is ready.
3. Restrict itself to the target route when the project has multiple pages.
4. Create and own the overlay image, scoped styles, controls, event listeners, local state, and any animation-free comparison state.
5. Wait for `document.fonts.ready` before visual measurement.
6. Identify the page canvas element that corresponds to the Figma Frame, append the overlay root directly to `document.body`, and use document-space `position: absolute` coordinates so the design image's rendered left/top edges exactly match that page canvas's rendered left/top edges. Use a maximum z-index and `pointer-events: none`; do not center the image or offset it with margin, padding, or transforms.
7. Set the image width to the exact numeric Figma Frame logical width in CSS pixels, for example `image.style.width = String(figmaFrameWidth) + 'px'`; use `height: auto` and `max-width: none`.
8. Keep the control panel interactive and persist mode/opacity in `localStorage` when practical.
9. Use stable overlay-specific IDs or data attributes and avoid modifying application components or global styles outside this temporary file.

Support:

- `hidden`: application only
- `opacity`: adjustable opacity, default `0.5`
- `difference`: opacity `1` with `mix-blend-mode: difference`

Add only this block to the page entry, adapted to the real relative path:

```javascript
// FIGMA_OVERLAY_START
import './__figma_overlay__';
// FIGMA_OVERLAY_END
```

The marker block must contain only that import and comments. Do not put overlay JSX, components, styles, configuration, route logic, mount calls, or listeners in the page entry. Do not create additional overlay source files.

If imports must appear before other statements, put the marked block in the import section. If the named main page is server-only, use its nearest browser-executed client entry; still make the import block the only change required to host the overlay.

The temporary file should behave like this:

```javascript
if (typeof document !== 'undefined' && !document.querySelector('[data-figma-overlay-root]')) {
  // Wait for body/fonts, then create the image, scoped styles, and controls.
  // Keep every comparison-only implementation detail in this file.
}
```

Browser evaluation may measure or operate the page, but must not inject the overlay as a substitute for this temporary file.

Do not create or modify `.gitignore` entries for the temporary source file, static image, manifest, screenshots, diffs, or any other overlay-related artifact. These files are intentionally temporary and must remain discoverable so `$figma-overlay-cleanup` can remove them later.

### Step 3: Align viewport and geometry

Set the viewport width to the Frame's logical width. Confirm `document.body.scrollHeight` is within a few pixels of its logical height. Fix structural spacing first when the user authorized UI fixes.

At the page's initial scroll position, verify the rendered overlay width and origin numerically before comparing anything else. Replace `#page-canvas` with the actual element representing the Figma page Frame; use `document.body` only when the body itself is that page canvas:

```javascript
() => {
  const image = document.querySelector('[data-figma-overlay-image]');
  const page = document.querySelector('#page-canvas') ?? document.body;
  if (!image) return null;
  const imageRect = image.getBoundingClientRect();
  const pageRect = page.getBoundingClientRect();
  return {
    width: imageRect.width,
    leftDelta: imageRect.left - pageRect.left,
    topDelta: imageRect.top - pageRect.top,
  };
}
```

The width must equal the recorded Figma Frame logical width within 0.1 CSS px, and both `leftDelta` and `topDelta` must be within 0.1 CSS px of zero. If any value differs, fix the overlay sizing, document-space coordinates, or containing-block placement before inspecting UI differences. A `body` or viewport width mismatch is not permission to stretch, center, or offset the design image.

Use the source-backed controls:

- `opacity` for coarse alignment
- `difference` for fine alignment; bright outlines indicate geometry offsets and ghosted text often indicates typography mismatch
- `hidden` for clean screenshots and normal interaction

Keep any deterministic carousel/date/video comparison behavior inside the same temporary source file.

Difference mode can hide subtle color drift. Brighten near-black residue when useful:

```bash
node <path-to-this-skill>/scripts/amplify.mjs difference-shot.png amplified.png
```

### Step 4: Locate and fix differences

Once the overlay is working, **do not hand off for user review yet**. Treat the visible differences as the input to an active correction pass. Inspect, edit the application UI, refresh, and compare again before asking the user to confirm.

Use this loop:

1. Identify the largest structural differences first: page height, section position, width, spacing, and image geometry.
2. Edit the relevant application source files to correct those differences.
3. Refresh; use `opacity` and `difference` modes to verify the change.
4. Measure DOM geometry and run pixel diffing to locate the next highest-impact region.
5. Fix typography and colors after structural geometry is stable.
6. Repeat until the pass criteria in Step 6 are met or every remaining difference is quantified and explained.

Do not ask the user to inspect an obviously mismatched page that the agent can still improve. User confirmation comes after this correction loop.

Run pixel diffing early to identify severe `x/y/w/h` regions, then crop them:

```bash
node <path-to-this-skill>/scripts/crop.mjs diff.png <x> <y> <w> <h> out.png
```

Use browser evaluation for measurements, not overlay injection:

```javascript
() => [...document.querySelectorAll('h2,h3')].map((element) => {
  const rect = element.getBoundingClientRect();
  return {
    text: element.textContent.slice(0, 20),
    top: rect.top + scrollY,
    left: rect.left + scrollX,
    width: rect.width,
    height: rect.height,
  };
})
```

Compare these values with Figma node coordinates. After each fix, refresh and use the persistent controls again.

Only skip UI edits when the user explicitly requests a review-only or report-only result. A normal request to use this skill includes the correction loop.

### Step 5: Verify colors numerically

Read exact Figma colors through `get_variable_defs` or `get_design_context`, then compare them with browser computed styles. Check text, backgrounds, borders, and default states.

For gradients, shadows, and images, sample matching coordinates:

```bash
node <path-to-this-skill>/scripts/color-sample.mjs design.png page.png 700,120 200,800 --size=8
```

As a guide, ΔE below 1 is effectively identical, 1–2.3 is barely perceptible, and above 2.3 warrants investigation. Sample solid interiors, not anti-aliased edges.

If macOS screenshots show a small uniform color shift, relaunch the browser with `--force-color-profile=srgb` before changing CSS.

### Step 6: Quantify with pixel diff

Switch the overlay to `hidden`, hide its controls, and capture a clean full-page screenshot:

```bash
cd /tmp/figma-overlay && npm init -y && npm i pixelmatch pngjs
node <path-to-this-skill>/scripts/pixel-diff.mjs design.png page.png diff.png
```

The script resamples differing widths and reports mismatch percentage plus severe regions. A practical pass requires mismatch below 2%, no unexplained solid mismatch regions, and a successful numeric color check.

If the result does not pass, return to Step 4 and continue fixing. Quantification is a loop gate, not the end of the task.

Restore `opacity` or `difference` mode after quantification.

### Step 7: Record cleanup state and hand off

Enter handoff only after completing the AI correction loop. Verify a refresh preserves the overlay, all modes work, the final pixel/color checks are recorded, and remaining differences are explained. Then create `<project-root>/.figma-overlay-state.json`:

```json
{
  "version": 3,
  "projectRoot": "/absolute/path/to/project",
  "pageUrl": "http://localhost:3000/page",
  "figmaFrameWidth": 1400,
  "figmaFrameHeight": 4283,
  "staticImagePath": "/absolute/path/to/project/public/__figma_overlay__.png",
  "downloadedImagePath": "/tmp/figma-overlay/design.png",
  "temporarySourcePath": "/absolute/path/to/project/src/__figma_overlay__.ts",
  "entryImport": {
    "path": "/absolute/path/to/project/src/main.ts",
    "importedPath": "./__figma_overlay__",
    "startMarker": "FIGMA_OVERLAY_START",
    "endMarker": "FIGMA_OVERLAY_END"
  },
  "artifactPaths": [
    "/tmp/figma-overlay/page.png",
    "/tmp/figma-overlay/diff.png"
  ]
}
```

Require `temporarySourcePath` to identify the one newly created overlay source file. Require the `entryImport` marker block to contain only the import matching `importedPath`. Read an existing manifest before replacement and confirm its canonical `projectRoot` matches.

At handoff, summarize the UI fixes and final comparison result, list the temporary file, image, and page-entry import, then ask the user to perform the final visual confirmation. Leave the overlay active. If the AI correction loop changed the application UI, explicitly instruct the user: "The overlay issues have been adjusted and verified. After confirming the page, invoke `$figma-overlay-cleanup` to remove the overlay." Do not merely describe cleanup as optional or available. Explain that the cleanup skill removes the temporary source file, static image, marked import, recorded artifacts, and manifest while preserving UI fixes.

## Frequent diff causes

| Symptom | Likely cause | Typical fix |
|---|---|---|
| Text ghosts drift line by line | Browser line-height differs from Figma | Set measured line-height explicitly |
| Photos produce bright blocks | Crop differs from Figma geometry | Match image position and dimensions |
| Buttons/cards are a few pixels too tall | CSS border changes box size | Adjust padding or box sizing |
| A whole section is shifted | Missing/extra padding, gap, or spacer | Compare DOM and Figma coordinates |
| Colors look matched but feel wrong | Small RGB deltas render near-black | Compare computed colors and ΔE |
| Every color is slightly off | Display P3 screenshot versus sRGB export | Force sRGB browser screenshots |

## Rules

- Create exactly one temporary overlay source file and one static design image.
- Modify an existing page-entry file only with one marked side-effect import.
- Keep all comparison-only implementation details inside the temporary file.
- Use the Figma Frame logical width as the overlay image's exact CSS width; never substitute viewport, body, parent, PNG, or screenshot width.
- Align the overlay image's left/top edges exactly with the target page canvas's left/top edges; never center it or introduce margin, padding, or transform offsets.
- Verify the rendered width and left/top deltas with `getBoundingClientRect()` before visual comparison; width error and each edge delta must not exceed 0.1 CSS px.
- Record the temporary file, image, import block, and artifacts in the v3 manifest.
- Do not add overlay-related files or paths to `.gitignore`, and do not modify `.gitignore` for this workflow; rely on `$figma-overlay-cleanup` to delete them.
- Complete the AI correction loop before asking the user for final confirmation.
- After overlay-guided UI fixes are complete, explicitly prompt the user to invoke `$figma-overlay-cleanup` after final visual confirmation; mentioning cleanup without a direct instruction is insufficient.
- Compare one page-level Frame at a time.
- Do not commit comparison-only files unless explicitly requested.
