---
name: figma-overlay-check
description: Use when verifying UI fidelity against a Figma design — pixel-perfect walkthroughs, checking whether a page matches the mockup, or when the user mentions "overlay comparison", "design diff", "visual QA", "还原度", "叠图比对". For web projects that can run locally (requires Figma MCP and Playwright MCP).
---

# Figma Overlay Fidelity Check

Core idea: export the Figma design as a PNG, then use Playwright's `browser_evaluate` to inject it **at runtime** as a top-level overlay on the page, combined with pixel diffing for quantified results. Because the injection happens at runtime, **you must not (and need not) modify project source code** — a page refresh clears everything.

## Workflow

```
Task Progress:
- [ ] Step 1: Export the design (mind the 4096px limit)
- [ ] Step 2: Align viewport + height sanity check
- [ ] Step 3: Inject overlay (opacity for coarse pass → difference for fine pass)
- [ ] Step 4: Region cropping + DOM measurement to locate and fix diffs
- [ ] Step 5: Color check (computed styles vs Figma values, ΔE sampling)
- [ ] Step 6: Quantify with pixel diff
- [ ] Step 7: Cleanup
```

### Step 1: Export the design

Use Figma MCP `download_assets` (defaultFormat: png) to export the target Frame, save it to `/tmp/figma-overlay/design.png`, and record the Frame's **logical width/height** (e.g. 1400×4283).

**Key gotcha: Figma caps exports at 4096px on the long edge.** Long pages get proportionally downscaled on export (e.g. 1400 wide becomes 1339). Use `file` or `sips` to confirm the actual pixel size. The overlay is unaffected (CSS stretches it back to logical width), and the Step 5 diff script auto-resamples widths, so no manual scaling is needed.

### Step 2: Align viewport + height sanity check

Use `browser_resize` to set the viewport width to the design's logical width (viewport mismatch is the most common source of false positives).

One-line sanity check: `document.body.scrollHeight` should be within a few px of the design's logical height. A large gap means module-level spacing/height bugs — fix the structure first before pixel-level comparison.

### Step 3: Inject the overlay

Ways to make the image accessible to the page, in order of preference:

1. **Dev server static directory** (recommended): copy design.png to something like `public/__figma_overlay.png`, inject `src="/__figma_overlay.png"`, delete the file when done
2. **base64 data URL**: fallback when there's no static directory; note very large images may exceed the evaluate argument size limit

Inject with `browser_evaluate` (waiting for web fonts and disabling animations along the way — fonts still on fallback produce large false text diffs):

```javascript
async () => {
  await document.fonts.ready;
  document.getElementById('__figma_overlay__')?.remove();
  const style = document.createElement('style');
  style.textContent = '* { animation: none !important; transition: none !important; }';
  document.head.appendChild(style);
  const img = document.createElement('img');
  img.id = '__figma_overlay__';
  img.src = '/__figma_overlay.png';
  img.style.cssText =
    'position:absolute;top:0;left:0;width:1400px;' + // ← design's logical width
    'z-index:2147483647;pointer-events:none;opacity:0.5;';
  document.body.appendChild(img);
}
```

Two modes:
- `opacity:0.5`: coarse pass for overall misalignment
- `opacity:1; mix-blend-mode:difference`: fine pass. **The blacker, the closer the match**; bright outlines = position/size offsets; bright solid blocks = color mismatch; "ghosted" text = line-height/font-size mismatch

**Difference mode is blind to subtle color drift**: `#333333` vs `#3A3A3A` subtracts to `#070707` — visually black, so it reads as a match. Don't trust an "all black" difference screenshot for colors; run the Step 5 color check regardless, and/or brighten the screenshot with `scripts/amplify.mjs` (multiplies pixel values, default ×8) to make near-black residue visible:

```bash
node <path-to-this-skill>/scripts/amplify.mjs difference-shot.png amplified.png
```

If the page has dynamic content (carousels, videos, live dates, random data), freeze it in the same evaluate call (pause videos, pin the carousel to the frame shown in the design, stub dates) — otherwise it shows up as constant noise in every pass.

### Step 4: Locate and fix diffs

Full-page screenshots are too large to inspect details, so don't eyeball them — combine these techniques:

**Machine-located regions** (preferred): run the Step 6 pixel diff early — it prints the top mismatch regions as `x/y/w/h` bounding boxes sorted by severity. Crop those exact coordinates instead of scanning the image by eye; this also catches small-but-severe diffs that a <2% total score would hide.

**Region cropping**: use this skill's `scripts/crop.mjs` to crop suspicious regions out of the difference screenshot for a zoomed-in look:

```bash
node <path-to-this-skill>/scripts/crop.mjs diff.png <x> <y> <w> <h> out.png
```

**DOM measurement**: use `browser_evaluate` + `getBoundingClientRect` to measure absolute coordinates of key elements and compare the numbers directly against node coordinates from Figma metadata — much faster at pinpointing root causes than eyeballing the overlay:

```javascript
() => [...document.querySelectorAll('h2,h3')].map((e) => {
  const r = e.getBoundingClientRect();
  return { text: e.textContent.slice(0, 20), top: r.top + scrollY, left: r.left + scrollX, w: r.width, h: r.height };
})
```

After each fix, refresh the page, re-inject the overlay, and re-check. Loop until the difference screenshot is essentially all black.

Note: Playwright MCP's `browser_take_screenshot` with a filename writes to the **user home directory**, not the project directory.

### Step 5: Color check

Pixel diffing alone misses color drift (see Step 3), so verify colors by **comparing numbers, not pixels**:

**Computed styles vs Figma values** (primary): pull the exact colors from Figma via `get_variable_defs` / `get_design_context`, then read what the page actually renders:

```javascript
() => [...document.querySelectorAll('button, .card, h1, h2, p, a')].map((e) => {
  const s = getComputedStyle(e);
  return { sel: e.tagName + '.' + e.className, color: s.color, bg: s.backgroundColor, border: s.borderColor };
})
```

Compare the rgb values against the Figma hex values directly — a 1-unit delta is caught, and the report doubles as the fix (it tells you exactly which hex to change to). Cover text color, background, border, and don't forget states rendered by default (e.g. a primary button).

**ΔE pixel sampling** (for gradients, shadows, images — anywhere computed styles can't tell the story): sample the same coordinates in both PNGs with `scripts/color-sample.mjs`; it averages a small patch, prints both hex values plus the perceptual difference ΔE:

```bash
node <path-to-this-skill>/scripts/color-sample.mjs design.png page.png 700,120 200,800 --size=8
```

Coordinates are in the design image's pixel space (the page screenshot is auto-scaled). Rule of thumb: ΔE < 1 identical, 1–2.3 barely perceptible (usually acceptable), > 2.3 a real mismatch to fix. Sample the center of solid-color areas, not edges (anti-aliasing pollutes the patch).

**Color-profile gotcha**: on macOS a headed Chromium may screenshot in Display P3 while Figma exports sRGB, producing a small *global* color shift that looks like every color is slightly off. If ΔE reports uniform small drift everywhere, relaunch the browser with `--force-color-profile=srgb` before blaming the CSS.

### Step 6: Quantify with pixel diff

Refresh to remove the overlay, take a full-page screenshot, then compare:

```bash
cd /tmp/figma-overlay && npm init -y && npm i pixelmatch pngjs   # first time only
node <path-to-this-skill>/scripts/pixel-diff.mjs design.png page.png diff.png
```

The script auto-resamples the wider image to the narrower width, so Figma's export downscale and retina screenshots (2x device pixel ratio on macOS makes screenshots twice the viewport size) are both handled — no manual `sips` step. It reports the overall mismatch percentage plus the top mismatch regions with `x/y/w/h` coordinates for direct cropping.

Pass criteria: mismatch < 2%, every reported region is explainable as text anti-aliasing or photo-edge noise (low density, no large solid blocks), **and the Step 5 color check passed** — the pixel score alone can be green while colors are uniformly off.

### Step 7: Cleanup

1. Delete the temporary overlay image from `public/`, refresh and confirm the overlay is gone
2. Confirm no overlay-related code exists in source (this skill never writes source code — if any exists, that's a violation)
3. Clean up `/tmp/figma-overlay/` and screenshot files in the home directory

## Frequent Real-World Diff Causes (check these first)

| Symptom | Root cause | Fix |
|---|---|---|
| Ghosted text drifting down line by line | Figma `normal` line-height ≈ 1.2, Tailwind/browser default is 1.5 | Explicit `leading-[Npx]`, N = the Figma text node's height |
| Photo content misaligned, bright blocks | Code uses `object-cover` center-crop while Figma has the image at exact left/top/width/height inside its container | Absolutely position per the image geometry from `get_design_context` + `max-w-none` |
| Buttons/cards a few px too tall | CSS `border` takes up box size, Figma strokes don't | Reduce padding accordingly when adding borders |
| A whole section shifted by tens of px | Extra/missing padding or gap, or a 0-width decorative node in Figma (inset overflow) mistaken for a spacer | Use DOM measurement to check numbers against Figma coordinates one by one |
| Image assets themselves don't match | Local asset is an old export or cropped from a different source | Re-export from Figma; if instance children can't be exported by id, export the parent instance at 2x and crop programmatically |
| Everything "passes" but colors feel off | Difference blend and pixelmatch both tolerate small color deltas (near-black residue, sub-threshold) | Run the Step 5 numeric color check; amplify.mjs on the difference screenshot to see residue |
| Every color off by a tiny uniform amount | Screenshot taken in Display P3 while Figma exports sRGB | Relaunch browser with `--force-color-profile=srgb` |

## Rules

- **Never write overlay code into project source** (components, layouts, global styles — none of it); always inject at runtime
- Only compare a single page-level Frame, never the whole canvas
- For long pages, anchor the overlay with `position:absolute` to the top of the document so it scrolls with the page
