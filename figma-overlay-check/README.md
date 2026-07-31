# figma-overlay-check

English | [中文](./README.zh-CN.md)

## Overview

An Agent Skill for checking how faithfully a locally running web page reproduces a Figma design. It combines runtime overlay comparison, DOM-to-Figma coordinate measurement, numeric color checks, and quantified pixel diffing without adding overlay code to the project.

## What it does

1. Exports a page-level Figma Frame as a PNG and accounts for Figma's 4096 px export limit.
2. Aligns the browser viewport and checks the page's total height.
3. Injects the design as a temporary runtime overlay for coarse and fine comparison.
4. Locates mismatches with diff regions, image crops, and DOM measurements.
5. Checks rendered colors against Figma values and supports perceptual ΔE sampling.
6. Produces a pixel mismatch score and ranked mismatch regions.
7. Removes temporary images and confirms no overlay code entered the source tree.

## Use cases

- Review a page before design acceptance.
- Find layout, size, spacing, position, typography, or color differences.
- Re-check visual fidelity after UI fixes.
- Replace subjective visual inspection with measurable evidence.

## Requirements

- A web project that runs locally.
- [Figma MCP](https://developers.figma.com/docs/figma-mcp-server/) for design exports and node geometry.
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) for browser control and runtime overlay injection.
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
- Overlay code must be injected at runtime and must never be committed to the project.
- A low pixel mismatch score does not prove that colors are correct; run the numeric color checks too.
- Dynamic content, animations, web fonts, viewport size, device pixel ratio, and color profiles can create false differences.
- The target project may be changed only when the user asks for fixes. A review-only request authorizes inspection, not source edits.

## Full instructions

See [SKILL.md](./SKILL.md) for the complete seven-step workflow, pass criteria, scripts, troubleshooting guidance, and cleanup rules.

## License

This Skill is licensed under the [MIT License](./LICENSE).
