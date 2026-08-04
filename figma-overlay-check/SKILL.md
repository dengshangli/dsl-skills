---
name: figma-overlay-check
description: Overlay a page-level Figma Frame on a locally running webpage, measure layout, sizing, spacing, typography, and color differences, perform one automatic correction pass, report mismatch before and after the pass, and then wait for user-directed follow-up corrections. Use for design implementation review, pixel-perfect visual QA, "overlay comparison", "design diff", "还原度", or "叠图比对" requests. Keep generated comparison files isolated under .figma-overlay-check and provide an in-page Delete Overlay action that removes the overlay while preserving completed UI fixes. Requires a locally runnable web project, Figma MCP, and browser automation.
---

# Figma Overlay Fidelity Check

Export one Figma page Frame as PNG. Put **every generated file** under `<project-root>/.figma-overlay-check/`, including the one temporary source file, exported image, screenshots, diffs, dependency files, and manifest. Add **one marked side-effect import** to the browser-executed page entry. The overlay must survive refreshes and remain until the user confirms the panel's `Delete Overlay` action, which removes the marked import and the complete `.figma-overlay-check/` directory.

## Required outcome

- Create exactly one temporary overlay source file.
- Put every generated file under `<project-root>/.figma-overlay-check/`; generate nothing under `src/`, `public/`, `/tmp`, or another project path.
- Add the exact rule `.figma-overlay-check/` to the project-root `.gitignore` by default, idempotently and without changing unrelated rules.
- Keep all overlay DOM, styles, controls, state, route checks, and listeners in that file.
- Change one existing page-entry file only by adding a marked import for the temporary file.
- Provide English-labeled `hidden`, `opacity`, and `difference` modes plus opacity control in a draggable, collapsible control panel.
- Use the bundled `assets/overlay-panel.js` preset for the complete control-panel DOM, styles, labels, dragging, collapse handle, metrics, and deletion UI. Inject it with `scripts/inject-overlay-panel.mjs`; do not recreate or restyle the panel per task.
- Default the compact control panel to the viewport's bottom-right corner with a 12 CSS px inset and a width no greater than 300 CSS px.
- Provide a bottom-placed `Delete Overlay` danger action that requires explicit second confirmation and uses the bundled loopback cleanup helper to remove the marked import and `.figma-overlay-check/` safely.
- Render the overlay image at exactly the Figma Frame's logical width.
- Find the target page canvas by traversing page elements from top to bottom and selecting the page-level element whose authored fixed width and rendered width exactly match the Figma Frame width.
- Align the overlay image's rendered left and top edges exactly with the target page canvas's left and top edges.
- After the overlay works, measure the baseline mismatch, inspect the revealed differences, and perform one automatic correction pass before asking the user to review.
- Preserve a real semantic implementation. Never lower mismatch by replacing a page, section, component, text block, navigation area, footer, form, card group, or other UI region with a flattened image, screenshot, Figma Frame export, CSS background image, canvas rendering, or base64/data-URL raster.
- After every correction pass, refresh, capture a clean screenshot, calculate the new full-page mismatch, and report it. Do not require mismatch below 2% and do not automatically start another pass.
- After completing overlay-guided UI fixes, explicitly prompt the user to click `Delete Overlay` after their final visual confirmation.
- Keep the overlay active at handoff. Do not commit comparison-only files unless explicitly requested.

## Workflow

```text
Task Progress:
- [ ] Step 1: Export the page-level Figma Frame
- [ ] Step 2: Create one temporary overlay file and import it once
- [ ] Step 3: Align viewport, page height, and overlay geometry
- [ ] Step 4: Measure baseline mismatch and run one automatic correction pass
- [ ] Step 5: Verify colors numerically
- [ ] Step 6: Measure and record mismatch after the correction pass
- [ ] Step 7: Record v4 cleanup state and leave the overlay active
```

### Step 1: Export the design

Use Figma MCP `get_metadata` or `get_design_context` to read the selected page Frame's logical width and height, then use `download_assets` with PNG output. Treat the Figma Frame width as the single source of truth and record it before implementing the overlay. Copy the PNG to one overlay-specific static path, for example:

```text
<project>/.figma-overlay-check/design.png
```

Load this image from the temporary source file using the framework's supported asset URL mechanism, such as a relative asset import with a URL query. If the framework cannot serve an imported asset from this directory, encode the image into the temporary source file instead. Do not copy it into `public/`, `src/`, or another application directory.

Figma caps exports at 4096 px on the long edge. Confirm the exported PNG size with `file` or `sips`, but never use that exported pixel width to size the overlay. Render at the Frame's logical CSS width exactly.

Do not derive overlay width from the viewport, `body`, a parent container, the PNG's intrinsic dimensions, or a screenshot. Do not use `100%`, `100vw`, a constraining `max-width`, or responsive scaling for the overlay image; explicitly use `max-width: none`.

### Step 2: Create one temporary overlay file and import it once

Before generating overlay files, ensure the project-root `.gitignore` contains exactly one effective `.figma-overlay-check/` rule. If `.gitignore` does not exist, create it with that rule. If an equivalent rule already exists, do not add a duplicate. Preserve all existing comments, ordering, formatting, negation rules, and unrelated entries. Do not remove this rule during overlay cleanup; it should protect future comparison runs too.

Identify the browser-executed entry for the target page. Create exactly one temporary source file under the dedicated directory:

```text
.figma-overlay-check/__figma_overlay__.ts
```

Write only the page-specific overlay image, route guard, canvas discovery, geometry, and cleanup configuration in this file. Then inject the bundled stable control panel:

```bash
node <path-to-this-skill>/scripts/inject-overlay-panel.mjs \
  <project-root>/.figma-overlay-check/__figma_overlay__.ts
```

The injector appends one marked `FIGMA_OVERLAY_PANEL_PRESET` block and replaces that block idempotently on later runs. Never paste a newly invented panel implementation, alter the injected preset in the generated file, or create a second panel. To change panel design or behavior, update the skill's preset itself and rerun the injector.

After the page-specific code creates the overlay image, mount the injected preset exactly once:

```javascript
mountFigmaOverlayPanel({
  frameWidth: figmaFrameWidth,
  frameHeight: figmaFrameHeight,
  overlayImage,
  initialMode: 'opacity',
  initialOpacity: 0.5,
  cleanupEndpoint,
  cleanupToken,
  getGeometry: () => ({
    canvas: canvasLabel,
    widthDelta,
    leftDelta,
    topDelta,
  }),
});
```

Supply live values from the page-specific geometry code. Do not duplicate any panel DOM, CSS, mode handling, dragging, collapse, metric formatting, confirmation, or cleanup-request logic outside the preset.

Prefer a side-effect module using plain DOM APIs so application code needs only an import. The temporary file must:

1. Guard browser APIs with `typeof document !== 'undefined'` if the framework may evaluate modules during server rendering.
2. Initialize idempotently after the document body is ready.
3. Restrict itself to the target route when the project has multiple pages.
4. Create and own the overlay image, page-specific styles, route/geometry listeners, local state, and any animation-free comparison state; the injected preset owns all control-panel DOM, styles, and interactions.
5. Wait for `document.fonts.ready` before visual measurement.
6. Traverse visible application elements in DOM order from top to bottom, excluding `html`, `body`, and overlay-owned nodes. Select the first page-level element that contains the Figma page content, has an authored fixed CSS width exactly equal to the Figma Frame logical width, and renders at that width within 0.1 CSS px. Do not select an element whose matching width is only caused by `auto`, `100%`, `100vw`, flex/grid stretching, or coincidence with the viewport. Append the overlay root directly to `document.body`, and use document-space `position: absolute` coordinates so the design image's rendered left/top edges exactly match the selected element's rendered left/top edges. Use a maximum z-index and `pointer-events: none`; do not center the image or offset it with margin, padding, or transforms.
7. Set the image width to the exact numeric Figma Frame logical width in CSS pixels, for example `image.style.width = String(figmaFrameWidth) + 'px'`; use `height: auto` and `max-width: none`.
8. Keep the control panel interactive and make it draggable and collapsible to a tiny textless viewport-edge handle.
9. Use stable overlay-specific IDs or data attributes and avoid modifying application components or global styles outside this temporary file.

Use English for every user-visible control-panel label:

- `Hide Image`: application only (`hidden` state internally)
- `Opacity Overlay`: adjustable opacity, default `0.5` (`opacity` state internally)
- `Show Image`: opacity `1` with `mix-blend-mode: difference` (`difference` state internally)
- `Opacity`, `Canvas`, `Width Δ`, `Left Δ`, and `Top Δ` for the slider and geometry readouts
- `Delete Overlay`, `Cancel`, `Deleting…`, `Overlay deleted. Reloading…`, and concise English cleanup errors for the destructive action

The injected control-panel preset must behave as follows. Treat these as verification requirements, not an invitation to regenerate its code:

1. Keep it `position: fixed` above the page and overlay image, with `pointer-events: auto` while the overlay image remains non-interactive.
2. On initial load and every refresh, anchor the expanded panel to the bottom-right viewport corner using `right: 12px` and `bottom: 12px`; account for safe-area insets when they are larger. Do not center it or default it near the top.
3. Use `width: min(300px, calc(100vw - 24px))` and `max-height: calc(100vh - 24px)`. Allow only the panel body to scroll vertically when content or delete confirmation exceeds the available height; keep the title bar visible.
4. Keep the compact title bar about 40–44 CSS px tall with 10–12 CSS px horizontal padding, a 15–16 CSS px title, and a 30–32 CSS px close button. Use a panel corner radius around 10–12 CSS px.
5. Use 10–12 CSS px body padding and gaps no larger than 8 CSS px. Render `Hide Image` and `Opacity Overlay` side by side in a two-column grid; render `Show Image` across both columns. Keep mode buttons about 32–36 CSS px tall with 12–13 CSS px text.
6. Keep the opacity label/value on one compact row, the range input on the next row, and geometry readouts in compact key/value rows using 12–13 CSS px text and approximately 1.35 line-height. Avoid large empty separators or oversized vertical padding.
7. Keep the bottom `Delete Overlay` button about 34–36 CSS px tall. The inline confirmation may expand the scrollable body but must not increase the panel beyond its maximum height.
8. Use the title bar as the drag handle. Implement dragging with Pointer Events and pointer capture; do not start dragging from buttons, inputs, or the opacity slider. On first drag, convert the current bottom-right anchored rectangle to explicit `left`/`top` coordinates before moving it.
9. Clamp the panel inside the viewport after dragging and after viewport resize so it cannot become unreachable. Before any drag, viewport resize must preserve the bottom-right anchoring; after a drag, clamp the last dragged position.
10. Add a visible close/collapse button in the title bar with English accessible text such as `Collapse overlay panel`.
11. Treat that button as collapse, not deletion: keep the overlay image, selected mode, opacity, and comparison state unchanged; hide only the full panel.
12. When collapsed, show one small textless fixed handle attached to the nearest left or right browser edge at a clamped vertical position. Render no visible text or icon inside it. Keep about 24 CSS px visible inside the viewport and about 40–48 CSS px tall. For a right-edge handle, account for the browser's vertical scrollbar width and extend the handle inward as needed so at least 16 CSS px of unobstructed clickable area remains to the left of the scrollbar; use `window.innerWidth - document.documentElement.clientWidth` when calculating this inset. Apply the same visible width symmetrically on the left edge. Give the exposed side rounded corners and keep the browser-edge side flush: use a radius such as `12px 0 0 12px` on the right edge and `0 12px 12px 0` on the left edge. Add a subtle shadow. Because it is `position: fixed`, it must not reserve layout space or change page geometry. Keep it above page content and give it an English accessible name such as `aria-label="Expand overlay panel"` and `title="Expand overlay panel"` without displaying those words.
13. Clicking the textless edge handle must restore the complete panel at its last valid position.
14. Use English text for the title, for example `Figma Overlay 1400×4283`. Keep internal state names such as `hidden`, `opacity`, and `difference` out of the visible UI unless they match the specified product labels above.
15. Place a full-width red `Delete Overlay` button at the bottom of the expanded panel, visually separated from comparison controls. Do not put deletion on the title-bar close button or collapsed edge handle.
16. On the first click, show an inline confirmation message: `Delete local overlay files and remove the page import? UI fixes will be kept.` Show `Cancel` and a destructive `Delete Overlay` confirmation button. Do not use a single-click delete.
17. On confirmation, disable the delete controls, show `Deleting…`, and send one authenticated `POST` request to the configured loopback cleanup endpoint with `{ "confirm": "DELETE_FIGMA_OVERLAY" }`.
18. On success, show `Overlay deleted. Reloading…` and reload the page. On failure, keep the panel and overlay visible, restore the controls, and show the helper's concise error. Never pretend cleanup succeeded.
19. If the helper is unavailable, disable destructive confirmation and show `Cleanup unavailable. Ask AI to restart cleanup.`

Add only this block to the page entry, adapted to the real relative path:

```javascript
// FIGMA_OVERLAY_START
import '../.figma-overlay-check/__figma_overlay__';
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

Keep all generated files in `.figma-overlay-check/`, covered by the project-root `.gitignore` rule. The confirmed panel delete action removes the marked import and deletes the directory as one isolated unit, but leaves the `.gitignore` rule intact for future runs.

### Local cleanup helper

The browser cannot edit local source files directly. Use the bundled `scripts/cleanup-server.mjs` as a short-lived local bridge; do not add a cleanup API route or server source file to the application.

After the v4 manifest exists, generate a cryptographically random token of at least 32 characters, start the helper on an OS-assigned port, and capture the single JSON endpoint line it prints:

```bash
node <path-to-this-skill>/scripts/cleanup-server.mjs \
  --project-root=<absolute-project-root> \
  --token=<random-token> \
  --port=0
```

Configure the temporary overlay source with the returned loopback endpoint and token. Keep both values comparison-only and never place them in application source, logs, screenshots, the manifest, or the final response. Start the helper only after validating that the target project and manifest are current.

The helper must:

- Listen only on `127.0.0.1` and accept only localhost page origins.
- Require a one-time bearer token and the exact confirmation payload.
- Revalidate the v4 manifest, canonical project root, real non-symlink overlay directory, marked import block, and every generated path.
- Atomically remove only the marked import before deleting the exact `.figma-overlay-check/` directory.
- If directory deletion fails after the import edit, retain the validated manifest digest in memory and allow the same helper process to retry only that exact directory deletion.
- Preserve `.gitignore`, UI fixes, and every unrelated file.
- Stop after one successful cleanup. If validation or deletion fails, return an error and do not broaden the target.

If the helper process stops before user confirmation, restart it with a new token and update only the temporary overlay source configuration. If the user returns later and sees the unavailable message, they should ask Codex to restart this cleanup channel.

### Step 3: Align viewport and geometry

Set the viewport width to the Frame's logical width. Confirm `document.body.scrollHeight` is within a few pixels of its logical height. Fix structural spacing first when the user authorized UI fixes.

Discover page-canvas candidates before positioning the overlay. `querySelectorAll()` returns elements in document order, so this inspection proceeds from the top of the page downward:

```javascript
() => {
  const figmaFrameWidth = 1400; // Replace with Figma metadata.
  return [...document.body.querySelectorAll('*')]
    .filter((element) => !element.closest('[data-figma-overlay-root]'))
    .map((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return { element, rect, style };
    })
    .filter(({ rect, style }) =>
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      rect.height > 0 &&
      Math.abs(rect.width - figmaFrameWidth) <= 0.1
    )
    .map(({ element, rect, style }) => ({
      tag: element.tagName.toLowerCase(),
      id: element.id,
      className: element.className,
      computedWidth: style.width,
      left: rect.left,
      top: rect.top,
      height: rect.height,
    }));
}
```

Inspect the candidates and their application source styles in that order. Choose the first page-level wrapper with an explicit fixed width equal to `figmaFrameWidth` that contains the relevant full-page content. A computed width match alone is insufficient. Never fall back to `body` or the viewport merely because its current rendered width happens to match. If no qualifying element exists, report the missing fixed-width page canvas and resolve that geometry before placing the overlay.

At the page's initial scroll position, verify the rendered overlay width and origin numerically before comparing anything else. Replace `#selected-page-canvas` with a stable selector for the qualifying element found above:

```javascript
() => {
  const image = document.querySelector('[data-figma-overlay-image]');
  const page = document.querySelector('#selected-page-canvas');
  if (!image || !page) return null;
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
node <path-to-this-skill>/scripts/amplify.mjs <project-root>/.figma-overlay-check/difference-shot.png <project-root>/.figma-overlay-check/amplified.png
```

### Step 4: Locate and fix differences

Once the overlay is working, **do not hand off before completing one automatic correction pass**. First capture a clean screenshot and calculate the baseline mismatch with the Step 6 pixel-diff command. Then treat the largest visible differences as the input to one grouped correction pass.

Use this single automatic pass:

1. Record the baseline mismatch before changing application source.
2. Identify the highest-impact structural, typography, and color differences visible in that comparison.
3. Edit the relevant application source files in one grouped correction pass.
4. Refresh and use `opacity` and `difference` modes to verify the changes.
5. Capture a new clean screenshot and calculate the post-correction mismatch in Step 6.
6. Stop automatic correction after reporting the before/after mismatch. Ask the user to identify any remaining issue they want changed.

Do not automatically repeat the pass because mismatch remains high. A numeric threshold is not a completion gate. If the user requests another correction, perform only that requested correction pass, recalculate mismatch afterward, report the new value, and return control to the user again.

Every correction must preserve implementation integrity:

- Keep visible text as selectable text and keep buttons, links, inputs, navigation, and other controls as real semantic, interactive elements.
- Never use `design.png`, screenshots, diff images, crops, or any other file from `.figma-overlay-check/` as an application asset. Never copy those files into the application asset tree.
- Never replace a multi-element Figma Frame, section, component, or group with one `<img>`, CSS `background-image`, SVG containing flattened UI, canvas, video, or data URL merely to reproduce its pixels.
- Images are allowed only for content that is genuinely an image asset in the design, such as a photo, illustration, logo, icon, badge, or store/payment mark. Export the exact image/vector node, not its enclosing section or any node that contains ordinary UI text or controls.
- After each source edit, inspect the changed application files and rendered DOM for newly introduced image references or flattened regions. If a replacement violates these rules, revert it and implement the region with components, HTML, and CSS before running the next pixel diff.

Run pixel diffing early to identify severe `x/y/w/h` regions, then crop them:

```bash
node <path-to-this-skill>/scripts/crop.mjs <project-root>/.figma-overlay-check/diff.png <x> <y> <w> <h> <project-root>/.figma-overlay-check/out.png
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

Compare these values with Figma node coordinates. After each user-requested correction pass, refresh, use the source-backed controls, and recalculate mismatch.

Only skip UI edits when the user explicitly requests a review-only or report-only result. A normal initial request to use this skill includes one automatic correction pass.

### Step 5: Verify colors numerically

Read exact Figma colors through `get_variable_defs` or `get_design_context`, then compare them with browser computed styles. Check text, backgrounds, borders, and default states.

For gradients, shadows, and images, sample matching coordinates:

```bash
node <path-to-this-skill>/scripts/color-sample.mjs <project-root>/.figma-overlay-check/design.png <project-root>/.figma-overlay-check/page.png 700,120 200,800 --size=8
```

As a guide, ΔE below 1 is effectively identical, 1–2.3 is barely perceptible, and above 2.3 warrants investigation. Sample solid interiors, not anti-aliased edges.

If macOS screenshots show a small uniform color shift, relaunch the browser with `--force-color-profile=srgb` before changing CSS.

### Step 6: Quantify with pixel diff

Switch the overlay to `hidden`, hide its controls, and capture a clean full-page screenshot:

```bash
cd <project-root>/.figma-overlay-check && npm init -y && npm i pixelmatch pngjs
node <path-to-this-skill>/scripts/pixel-diff.mjs design.png page.png diff.png
```

The script resamples differing widths and reports mismatch percentage plus severe regions. Run it before the initial automatic correction pass to establish a baseline and again after that pass. For every later user-requested correction pass, run it again afterward and record the new mismatch. Mismatch is a progress measurement, not a stopping threshold. A mismatch score achieved by screenshot or image replacement is invalid and must not be reported.

After the initial post-correction mismatch is recorded, proceed to handoff regardless of its percentage. Do not start another automatic correction pass. Report the baseline and current values, summarize the corrected areas, and let the user point out the next issue. Each subsequent correction requested by the user must end with another clean screenshot and updated mismatch value.

Restore `opacity` or `difference` mode after quantification.

### Step 7: Record cleanup state and hand off

Enter handoff after completing one automatic correction pass, recording both baseline and post-correction full-page mismatch values, and confirming from the application diff and rendered DOM that no UI region was replaced with a flattened image. The mismatch percentage does not block handoff, but a missing post-correction measurement or failed implementation-integrity check does. Exercise each control, verify the compact panel initially sits 12 CSS px from the bottom-right viewport edges and is no wider than 300 CSS px, drag it, select `Hide Image` and `Show Image`, and test collapse/restore. Also verify the two-column mode-button layout, internal overflow behavior, all visible panel text is English, the collapsed handle contains no visible text or icon, about 24 CSS px enter the viewport, a right-edge scrollbar still leaves at least 16 CSS px of unobstructed clickable area to its left, it reserves no layout space, it has the required rounded shape, and it restores the panel when clicked. Verify all modes work and the pixel/color checks are recorded. Then create `<project-root>/.figma-overlay-check/.figma-overlay-state.json`:

```json
{
  "version": 4,
  "projectRoot": "/absolute/path/to/project",
  "overlayDirectory": "/absolute/path/to/project/.figma-overlay-check",
  "pageUrl": "http://localhost:3000/page",
  "figmaFrameWidth": 1400,
  "figmaFrameHeight": 4283,
  "staticImagePath": "/absolute/path/to/project/.figma-overlay-check/design.png",
  "downloadedImagePath": "/absolute/path/to/project/.figma-overlay-check/design.png",
  "temporarySourcePath": "/absolute/path/to/project/.figma-overlay-check/__figma_overlay__.ts",
  "entryImport": {
    "path": "/absolute/path/to/project/src/main.ts",
    "importedPath": "../.figma-overlay-check/__figma_overlay__",
    "startMarker": "FIGMA_OVERLAY_START",
    "endMarker": "FIGMA_OVERLAY_END"
  },
  "panelCleanupEnabled": true,
  "artifactPaths": [
    "/absolute/path/to/project/.figma-overlay-check/page.png",
    "/absolute/path/to/project/.figma-overlay-check/diff.png"
  ]
}
```

Require `overlayDirectory` to equal the canonical `<project-root>/.figma-overlay-check/`. Require every generated path in the manifest to resolve inside it. Require `temporarySourcePath` to identify the one newly created overlay source file and the `entryImport` marker block to contain only the import matching `importedPath`. Set `panelCleanupEnabled` only when the button, confirmation flow, and loopback helper have been exercised successfully. Read an existing manifest before replacement and confirm its canonical `projectRoot` matches.

At handoff, report baseline mismatch → current mismatch, summarize the UI fixes, list `.figma-overlay-check/` and the page-entry import, and ask the user to point out any remaining issue. Leave the overlay and cleanup helper active. If the user is satisfied, ask them to perform final visual confirmation and click `Delete Overlay`; explain that confirming removes the marked page-entry import and the complete `.figma-overlay-check/` directory while preserving UI fixes.

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
- Inject the bundled control-panel preset into `__figma_overlay__.ts` with `scripts/inject-overlay-panel.mjs`; never handcraft, restyle, or duplicate the panel during a comparison task.
- Use the Figma Frame logical width as the overlay image's exact CSS width; never substitute viewport, body, parent, PNG, or screenshot width.
- Traverse application elements from top to bottom and select only a page-level element whose authored fixed width and rendered width equal the Figma Frame logical width; never infer the canvas from a coincidental `body` or viewport match.
- Align the overlay image's left/top edges exactly with the target page canvas's left/top edges; never center it or introduce margin, padding, or transform offsets.
- Verify the rendered width and left/top deltas with `getBoundingClientRect()` before visual comparison; width error and each edge delta must not exceed 0.1 CSS px.
- Render all visible panel text in English, support title-bar dragging, and make the close button collapse the panel to a tiny textless browser-edge handle that restores it without changing overlay state.
- Default the compact panel to the bottom-right with a 12 CSS px inset, cap its width at 300 CSS px, keep controls compact, and use internal scrolling instead of allowing the panel to dominate the viewport.
- Put a red, full-width `Delete Overlay` action at the bottom of the expanded panel; require inline second confirmation and use only the authenticated loopback helper.
- Label the image-off mode `Hide Image` and the difference-backed image-on mode `Show Image`; keep the collapsed handle fixed, rounded on its exposed side, about 24 CSS px wide inside the viewport, accessible by an English label, and free of visible text or icons. Account for a right-side vertical scrollbar so at least 16 CSS px remains unobstructed and clickable to its left.
- Record the overlay directory, temporary file, image, import block, and artifacts in the v4 manifest inside `.figma-overlay-check/`.
- Generate every overlay-related file under `.figma-overlay-check/`; do not generate files under `src/`, `public/`, `/tmp`, or other project paths.
- Add `.figma-overlay-check/` to the project-root `.gitignore` by default without duplicating an existing equivalent rule or disturbing unrelated entries.
- Cleanup removes the page-entry import and the exact `.figma-overlay-check/` directory but preserves the `.gitignore` rule.
- Complete one automatic correction pass before the first user review, with mismatch measured both before and after the pass.
- Never replace a page or UI region with a flattened image, screenshot, Figma export, background image, SVG screenshot, canvas, video, or data URL to reduce mismatch. Build ordinary UI with real components, semantic HTML, and CSS; use images only for genuine image assets from the design.
- Never reference or copy `.figma-overlay-check/` artifacts into application code or assets. A pixel-diff result produced by rasterizing UI is invalid, regardless of its mismatch percentage.
- Do not use mismatch as a stopping threshold and do not automatically repeat corrections. After each automatic or user-requested correction pass, capture a clean screenshot, report the updated mismatch, and return control to the user.
- After overlay-guided UI fixes are complete, explicitly prompt the user to click `Delete Overlay` after final visual confirmation; mentioning deletion without a direct instruction is insufficient.
- Compare one page-level Frame at a time.
- Do not commit comparison-only files unless explicitly requested.
