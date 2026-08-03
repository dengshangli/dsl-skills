---
name: figma-overlay-check
description: Verify and improve web UI fidelity against a Figma design by exporting a page-level Frame, implementing a persistent comparison overlay in the project's source code, locating visual differences, editing the UI when authorized, and quantifying the result. Use for pixel-perfect walkthroughs or when the user mentions "overlay comparison", "design diff", "visual QA", "还原度", "叠图比对", or asks to keep an overlay in code for repeated comparison. Requires a locally runnable web project, Figma MCP, and browser automation.
---

# Figma Overlay Fidelity Check

Export the Figma design as a PNG and implement the overlay **in the target project's source code**. The overlay must survive refreshes and remain available for the user to compare manually. Browser evaluation may inspect and control the page, but must not be the primary overlay implementation.

## Required outcome

- Add a small, isolated overlay module or component using the project's native framework.
- Mount it on the compared route and serve the exported design image from the project's static assets.
- Provide `hidden`, `opacity`, and `difference` modes plus an opacity control.
- Keep the overlay code and image in the project at handoff unless the user explicitly asks to remove them.
- Keep it mounted and available until the user runs `$figma-overlay-cleanup`. Do not commit it unless the user explicitly asks.

## Workflow

```text
Task Progress:
- [ ] Step 1: Export the page-level design Frame
- [ ] Step 2: Inspect the project and implement the source-backed overlay
- [ ] Step 3: Align viewport, page height, and overlay geometry
- [ ] Step 4: Locate and fix differences
- [ ] Step 5: Verify colors numerically
- [ ] Step 6: Quantify with pixel diff
- [ ] Step 7: Leave the code overlay ready for manual review
```

### Step 1: Export the design

Use Figma MCP `download_assets` with PNG output to export one page-level Frame. Record its logical width and height. Copy the exported image into an overlay-specific static path such as:

```text
<project>/public/__figma_overlay__/design.png
```

Adapt the static directory to the framework. Do not overwrite an application asset.

Figma caps exports at 4096 px on the long edge, so long pages may be proportionally downscaled. Confirm the actual PNG size with `file` or `sips`; render it at the Frame's logical CSS width rather than its exported pixel width.

### Step 2: Implement the overlay in project code

Inspect the framework, route structure, server conventions, and existing styling approach before editing. Prefer a dedicated source location such as:

```text
src/figma-overlay/
```

Implement the overlay with the project's native component model. Keep the integration small and clearly marked. The implementation must:

1. Render whenever the target route is opened and remain mounted until cleanup.
2. Render only on the target route when the project has multiple pages.
3. Use a document-level absolute overlay anchored at `top: 0; left: 0`, with the Frame's logical width and a maximum z-index.
4. Set the design image to `pointer-events: none`, while keeping the control panel interactive.
5. Support these modes:
   - `hidden`: application only
   - `opacity`: design at adjustable opacity, default `0.5`
   - `difference`: design at opacity `1` with `mix-blend-mode: difference`
6. Include a compact fixed control panel or equivalent keyboard controls so the user can switch modes without editing code. Persist mode and opacity in `localStorage` when practical.
7. Scope every overlay style to the overlay component. Do not change global application styling merely to host the overlay.
8. Wait for fonts before visual measurement. Disable animations only while comparison is active, using a reversible class or data attribute owned by the overlay module.

Use obvious markers around the minimal mount/import edit so the temporary integration is easy to find later:

```text
FIGMA_OVERLAY_START
FIGMA_OVERLAY_END
```

For React-like projects, the rendered structure should be equivalent to:

```jsx
<div data-figma-overlay-root data-mode={mode}>
  <img
    src="/__figma_overlay__/design.png"
    alt=""
    style={{
      position: 'absolute',
      inset: '0 auto auto 0',
      width: 1400,
      maxWidth: 'none',
      zIndex: 2147483646,
      pointerEvents: 'none',
      opacity: mode === 'opacity' ? opacity : mode === 'difference' ? 1 : 0,
      mixBlendMode: mode === 'difference' ? 'difference' : 'normal',
    }}
  />
  <OverlayControls />
</div>
```

This is a behavior contract, not a file to copy blindly. Match the target project's language and conventions. Do not use `browser_evaluate` to create the overlay DOM as a substitute for source changes.

### Step 3: Align viewport and geometry

Set the browser viewport width to the Frame's logical width. Confirm `document.body.scrollHeight` is within a few pixels of the design's logical height. A large gap indicates structural spacing or height errors; fix those before pixel-level work when the user authorized UI fixes.

Use the code-backed controls to compare:

- `opacity`: coarse alignment and section drift
- `difference`: fine alignment; blacker areas are closer, bright outlines indicate geometry offsets, and ghosted text often indicates typography mismatch
- `hidden`: clean screenshots and normal interaction

If dynamic content creates noise, pause videos and pin carousels or dates through deterministic comparison fixtures when safe. Keep such comparison-only behavior isolated and recorded for cleanup.

Difference mode can hide subtle color drift. Use `scripts/amplify.mjs` to brighten near-black residue when useful:

```bash
node <path-to-this-skill>/scripts/amplify.mjs difference-shot.png amplified.png
```

### Step 4: Locate and fix differences

Run the pixel diff early to identify the highest-severity `x/y/w/h` regions. Crop suspicious regions instead of scanning a full-page screenshot:

```bash
node <path-to-this-skill>/scripts/crop.mjs diff.png <x> <y> <w> <h> out.png
```

Use browser evaluation for measurement, not overlay injection:

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

Compare these values with Figma node coordinates. After each authorized fix, refresh and use the persistent overlay controls again; no reinjection should be necessary.

If the user requested review only, add the requested comparison overlay but do not modify application UI implementation to fix discrepancies. Report the measured differences instead.

### Step 5: Verify colors numerically

Read exact Figma colors through `get_variable_defs` or `get_design_context`, then compare them with browser computed styles for text, backgrounds, borders, and default states. Do not rely on difference blending alone.

For gradients, shadows, and images, sample matching coordinates with:

```bash
node <path-to-this-skill>/scripts/color-sample.mjs design.png page.png 700,120 200,800 --size=8
```

The script reports both colors and perceptual ΔE. As a guide: ΔE below 1 is effectively identical, 1–2.3 is barely perceptible, and above 2.3 usually warrants investigation. Sample solid interiors rather than anti-aliased edges.

On macOS, a headed browser may capture Display P3 while Figma exports sRGB. If colors show a small uniform shift, relaunch with `--force-color-profile=srgb` before changing CSS.

### Step 6: Quantify with pixel diff

Switch the source-backed overlay to `hidden`, hide its control panel if necessary, and capture a clean full-page screenshot. Then compare:

```bash
cd /tmp/figma-overlay && npm init -y && npm i pixelmatch pngjs
node <path-to-this-skill>/scripts/pixel-diff.mjs design.png page.png diff.png
```

The script resamples differing widths and reports overall mismatch plus the highest-severity regions. A practical pass requires mismatch below 2%, no unexplained solid mismatch regions, and a successful numeric color check.

After quantification, restore the overlay to the user's preferred review mode. Do not remove its source code or static image.

### Step 7: Leave the code overlay ready for manual review

Before finishing:

1. Refresh the page and verify the overlay still works without browser-side reinjection.
2. Verify all three modes and the opacity control.
3. List the exact source, integration, and image files added or modified.
4. Leave the page in `opacity` or `difference` mode for immediate manual review.
5. Tell the user the overlay is intentionally implemented in project code and remains available after refresh.
6. Tell the user it stays mounted until `$figma-overlay-cleanup` removes it and has not been committed unless they requested a commit.

Create `<project-root>/.figma-overlay-state.json` as a cleanup allowlist:

```json
{
  "version": 2,
  "projectRoot": "/absolute/path/to/project",
  "pageUrl": "http://localhost:3000/page",
  "staticImagePath": "/absolute/path/to/project/public/__figma_overlay__/design.png",
  "downloadedImagePath": "/tmp/figma-overlay/design.png",
  "generatedSourcePaths": [
    "/absolute/path/to/project/src/figma-overlay/FigmaOverlay.tsx"
  ],
  "integrationBlocks": [
    {
      "path": "/absolute/path/to/project/src/App.tsx",
      "startMarker": "FIGMA_OVERLAY_START",
      "endMarker": "FIGMA_OVERLAY_END"
    }
  ],
  "artifactPaths": [
    "/tmp/figma-overlay/page.png",
    "/tmp/figma-overlay/diff.png"
  ]
}
```

Record only exact overlay-specific regular files in `generatedSourcePaths`. Record existing application files only in `integrationBlocks`; never classify them as generated files. Each integration file must contain exactly one unambiguous marker pair. Use `null` or an empty array for fields that do not apply. Read an existing manifest before replacement and confirm its canonical `projectRoot` matches.

Do not automatically remove the overlay at task completion. Tell the user they can invoke `$figma-overlay-cleanup` or reply “删除叠图” after review. Cleanup must delete only the dedicated overlay files, image, manifest, and marked integration blocks while preserving all UI fidelity fixes.

## Frequent diff causes

| Symptom | Likely cause | Typical fix |
|---|---|---|
| Text ghosts drift line by line | Browser line-height differs from Figma | Set the measured line-height explicitly |
| Photos produce bright blocks | `object-cover` crop differs from Figma geometry | Match image position and dimensions |
| Buttons or cards are a few pixels too tall | CSS border changes box size | Adjust padding or box sizing |
| A whole section is shifted | Missing or extra padding, gap, or spacer | Compare DOM and Figma coordinates |
| Colors look matched in difference mode but feel wrong | Small RGB deltas render near-black | Compare computed colors and ΔE |
| Every color is slightly off | Display P3 screenshot versus sRGB export | Force the browser color profile to sRGB |

## Rules

- Write the comparison overlay into project source; runtime-only DOM injection does not satisfy this skill.
- Keep overlay code isolated, refresh-persistent, and easy to remove through `$figma-overlay-cleanup`.
- Record every comparison-only source edit and file in the v2 cleanup manifest.
- Compare one page-level Frame at a time, never the whole Figma canvas.
- Anchor long-page overlays absolutely to the top of the document so they scroll with the page.
- Do not commit comparison-only code or assets unless the user explicitly requests it.
