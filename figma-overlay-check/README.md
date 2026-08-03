# figma-overlay-check

English | [中文](./README.zh-CN.md)

## Overview

An Agent Skill for checking how faithfully a locally running web page reproduces a Figma design. It adds a persistently mounted overlay component to the project code and combines it with DOM-to-Figma coordinate measurement, numeric color checks, and quantified pixel diffing.

## What it does

1. Exports a page-level Figma Frame as a PNG and accounts for Figma's 4096 px export limit.
2. Aligns the browser viewport and checks the page's total height.
3. Adds a refresh-persistent code overlay with hidden, opacity, and difference modes.
4. Locates mismatches with diff regions, image crops, and DOM measurements.
5. Checks rendered colors against Figma values and supports perceptual ΔE sampling.
6. Produces a pixel mismatch score and ranked mismatch regions.
7. Preserves the overlay code and design image for continued manual review until cleanup runs.

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
- The overlay must be implemented as an isolated project module or component and stay mounted on the target route until cleanup.
- It must provide hidden, opacity, and difference modes plus opacity control, and remain available after refresh.
- A low pixel mismatch score does not prove that colors are correct; run the numeric color checks too.
- Dynamic content, animations, web fonts, viewport size, device pixel ratio, and color profiles can create false differences.
- The target project may be changed only when the user asks for fixes. A review-only request authorizes inspection, not source edits.
- The completed check intentionally leaves the overlay source mounted with its design image until `$figma-overlay-cleanup` runs.
- The skill writes `.figma-overlay-state.json` with exact overlay files and marked integration blocks; invoke `$figma-overlay-cleanup` after review to remove them safely.
- Comparison-only code is not committed by default; commit it only when the user explicitly requests that.

## Full instructions

See [SKILL.md](./SKILL.md) for the complete seven-step workflow, source-backed overlay requirements, pass criteria, scripts, and troubleshooting guidance.

## License

This Skill is licensed under the repository's [MIT License](../LICENSE).
