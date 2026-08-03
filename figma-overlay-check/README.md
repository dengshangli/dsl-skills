# figma-overlay-check

English | [中文](./README.zh-CN.md)

## Overview

An Agent Skill for checking how faithfully a locally running page reproduces a Figma design. It keeps all overlay logic in one temporary source file and adds only one marked import to the page entry, making later cleanup precise.

## What it does

1. Exports a page-level Figma Frame as a PNG and accounts for Figma's 4096 px export limit.
2. Aligns the browser viewport and checks the page's total height.
3. Creates one refresh-persistent temporary overlay file rendered at the exact Figma Frame logical width and imported once by the page.
4. Locates mismatches with diff regions, image crops, and DOM measurements, then actively fixes the page.
5. Checks rendered colors against Figma values and supports perceptual ΔE sampling.
6. Produces a pixel mismatch score and ranked mismatch regions.
7. Repeats compare–fix–refresh–measure, then hands off for user confirmation and records v3 cleanup state.

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
- All overlay DOM, styles, controls, and state must stay in one temporary source file.
- The page entry may contain only one marked side-effect import between `FIGMA_OVERLAY_START/END`, with no inline overlay component or styles.
- It must provide hidden, opacity, and difference modes plus opacity control, and remain available after refresh.
- The image width must exactly equal the Figma Frame logical width; body, viewport, parent, exported PNG, `100%`, and `100vw` widths are not substitutes.
- The image's rendered left and top edges must exactly match the target page canvas's left and top edges; do not center it or offset it with margin, padding, or transforms.
- Before comparison, verify the width and both left/top edge deltas with `getBoundingClientRect()`; each error must be within 0.1 CSS px.
- Once the overlay works, the agent must actively fix revealed UI differences and repeat comparison before asking the user to confirm.
- User confirmation begins only after the pass criteria are met or all remaining differences are quantified and explained.
- A low pixel mismatch score does not prove that colors are correct; run the numeric color checks too.
- Dynamic content, animations, web fonts, viewport size, device pixel ratio, and color profiles can create false differences.
- Normal use of this skill includes UI fixes; skip source edits only when the user explicitly requests review-only or report-only output.
- After the agent finishes overlay-guided UI fixes, it must explicitly prompt the user to invoke `$figma-overlay-cleanup` after final visual confirmation.
- The check leaves the temporary file, image, and marked page import until `$figma-overlay-cleanup` runs.
- `.figma-overlay-state.json` records those three items exactly; cleanup removes only them and comparison artifacts.
- Do not add overlay-related temporary files or paths to `.gitignore`, or modify `.gitignore` for this workflow; `$figma-overlay-cleanup` removes them later.
- Comparison-only code is not committed by default; commit it only when the user explicitly requests that.

## Full instructions

See [SKILL.md](./SKILL.md) for the single-temporary-file workflow, pass criteria, scripts, and cleanup contract.

## License

This Skill is licensed under the repository's [MIT License](../LICENSE).
