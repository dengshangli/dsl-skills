# figma-overlay-check

English | [中文](./README.zh-CN.md)

## Overview

Overlay a Figma design on a locally running webpage, measure visual differences, and perform one automatic correction pass. The AI reports mismatch before and after that pass, then waits for the user to point out any remaining issue. After confirmation, click `Delete Overlay` in the bottom-right panel to remove the overlay files and page-entry import.

## What it does

1. Exports a page-level Figma Frame as a PNG and accounts for Figma's 4096 px export limit.
2. Aligns the browser viewport and checks the page's total height.
3. Creates one temporary overlay file that the page loads on refresh, rendered at the exact Figma Frame logical width and imported once by the page.
4. Locates mismatches with diff regions, image crops, and DOM measurements, then performs one automatic correction pass.
5. Checks rendered colors against Figma values and supports perceptual ΔE sampling.
6. Produces a pixel mismatch score and ranked mismatch regions.
7. Saves every file needed for comparison under `.figma-overlay-check/`; use `Delete Overlay` afterward to delete this directory.
8. Injects the same bundled control-panel preset every time, including the red `Delete Overlay` button and its confirmed cleanup flow.

## Delete Overlay workflow

After the final visual confirmation:

1. Click the red `Delete Overlay` button at the bottom of the expanded panel.
2. Confirm `Delete local overlay files and remove the page import? UI fixes will be kept.`
3. The loopback-only helper validates the cleanup manifest and one-time token.
4. It removes only the `FIGMA_OVERLAY_START/END` import block.
5. If the skill added a marked `"use client"` for a Next.js App Router entry, it removes that block too; an existing directive is never removed.
6. It deletes the exact `.figma-overlay-check/` directory and stops automatically.
7. The page reloads without the overlay.

The project-root `.gitignore` rule remains for future comparisons, and all UI fidelity fixes remain untouched. If the helper is unavailable, ask the AI to restart the cleanup channel and try the panel action again.

## Generated layout

```text
<project-root>/
├── .gitignore                              # contains .figma-overlay-check/
├── .figma-overlay-check/
│   ├── .figma-overlay-state.json           # cleanup manifest
│   ├── __figma_overlay__.ts                # single overlay source file
│   ├── design.png                          # exported Figma Frame
│   └── ...                                 # screenshots, diffs, crops, dependencies
└── <browser page entry>                    # contains one marked side-effect import
```

## Use cases

- Review a page before design acceptance.
- Find layout, size, spacing, position, typography, or color differences.
- Re-check visual fidelity after UI fixes.
- Replace subjective visual inspection with measurable evidence.

## Requirements

- A web project that runs locally.
- [Figma MCP](https://developers.figma.com/docs/figma-mcp-server/) for design exports and node geometry.
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) or equivalent browser automation for page control, screenshots, and DOM measurement.
- Node.js. The included image scripts use `pixelmatch` and `pngjs`, installed when needed.
- Design and page screenshots captured under equivalent viewport conditions.

## Install

The current `skills` CLI requires Node.js `>=22.20.0`.

```bash
# Install to the user-level shared root ~/.agents/skills/
npx skills add dengshangli/dsl-skills --global --agent universal --skill figma-overlay-check
```

## Usage examples

- "Check how well this page matches the Figma design."
- "Run a pixel-perfect walkthrough against this Figma Frame."
- "Overlay the mockup on the page and identify the largest visual differences."
- "Measure whether the spacing and colors match the design."

## Important notes

- Compare one page-level Frame at a time, not an entire Figma canvas.
- Every generated file—including source, image, screenshots, diffs, dependencies, and manifest—must stay under `<project-root>/.figma-overlay-check/`.
- The exact `.figma-overlay-check/` rule is added to the project-root `.gitignore` by default; existing equivalent rules are not duplicated.
- All overlay DOM, styles, controls, and state must stay in one temporary source file.
- The page entry may contain only one marked side-effect import between `FIGMA_OVERLAY_START/END`, with no inline overlay component or styles.
- Only when the project declares a `next` dependency and the entry is under its `app/` or `src/app/` directory does the skill treat it as Next.js App Router. Such an entry receives a separately marked `"use client"` only when none existed, and cleanup removes only that marked directive. Non-Next projects and Next.js Pages Router entries never receive it; an existing directive is neither duplicated nor removed.
- It must provide hidden, opacity, and difference modes plus opacity control, and remain available after refresh.
- The expanded panel defaults to the bottom-right with a 12 CSS px inset and a width capped at 300 CSS px. It uses compact typography, 32–36 CSS px controls, and internal scrolling when needed.
- The panel DOM, styling, labels, dragging, collapsed handle, metrics, and deletion UI come from one bundled preset injected into `__figma_overlay__.ts`; the AI must not redesign them for each comparison.
- `Hide Image` and `Opacity Overlay` share the first two-column row; `Show Image` spans the full second row. The panel remains draggable and viewport-clamped.
- The expanded panel includes a full-width red `Delete Overlay` button at the bottom. It requires inline second confirmation; the title-bar close button continues to mean collapse only.
- Browser code never edits the filesystem directly. A bundled short-lived helper listens only on `127.0.0.1`, requires a one-time token, validates the cleanup manifest, removes the marked import, and then deletes the exact `.figma-overlay-check/` directory.
- If the helper is unavailable or validation fails, the panel reports an error and preserves the overlay. Ask the AI to restart the cleanup channel before trying again.
- All visible panel text must be English. The title bar must support dragging, and the close button must collapse the panel to a tiny textless browser-edge handle that restores it when clicked without hiding the overlay image.
- Use `Hide Image`, `Opacity Overlay`, and `Show Image` for the three mode buttons. Keep about 24 CSS px of the fixed collapsed handle visible, with rounded exposed corners and an English accessible label but no visible text or icon. On the right edge, account for the vertical scrollbar and keep at least 16 CSS px unobstructed and clickable to its left.
- The image width must exactly equal the Figma Frame logical width; body, viewport, parent, exported PNG, `100%`, and `100vw` widths are not substitutes.
- Find the page canvas by traversing visible application elements from top to bottom and choosing the page-level element whose authored fixed width and rendered width exactly equal the Figma Frame width; a coincidental body or viewport match is invalid.
- The image's rendered left and top edges must exactly match the target page canvas's left and top edges; do not center it or offset it with margin, padding, or transforms.
- Before comparison, verify the width and both left/top edge deltas with `getBoundingClientRect()`; each error must be within 0.1 CSS px.
- Once the overlay works, the AI measures baseline mismatch, performs one automatic correction pass, and measures mismatch again before asking the user to review.
- The AI must implement UI with real components, HTML, and CSS. It must never reduce mismatch by replacing a page or section with a screenshot, Figma export, background image, canvas, or another flattened image; images are allowed only for genuine image assets in the design.
- Mismatch is reported after every correction pass but is not a stopping threshold. The AI does not automatically repeat corrections; remaining changes are driven by user feedback.
- A low pixel mismatch score does not prove that colors are correct; run the numeric color checks too.
- Dynamic content, animations, web fonts, viewport size, device pixel ratio, and color profiles can create false differences.
- Normal use of this skill includes UI fixes; skip source edits only when the user explicitly requests review-only or report-only output.
- After the agent finishes overlay-guided UI fixes, it must explicitly prompt the user to click the panel's `Delete Overlay` button after final visual confirmation and confirm the destructive action.
- The panel deletion removes the marked page import and then deletes `.figma-overlay-check/` with every generated file inside it.
- `.figma-overlay-check/.figma-overlay-state.json` records the import and generated artifacts for safe panel deletion.
- The panel deletion leaves the `.gitignore` rule in place for future comparisons.
- Comparison-only code is not committed by default; commit it only when the user explicitly requests that.

## Full instructions

See [SKILL.md](./SKILL.md) for the single-temporary-file workflow, pass criteria, scripts, and in-panel deletion contract.

## License

This Skill is licensed under the repository's [MIT License](../LICENSE).
