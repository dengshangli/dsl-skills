# figma-overlay-check

English | [中文](./README.zh-CN.md)

An [agent skill](https://agentskills.io) for verifying how faithfully a web page reproduces its Figma design — overlay comparison, DOM-vs-Figma coordinate measurement, and quantified pixel diffing, all without touching your project's source code.

[![skills.sh](https://skills.sh/b/dengshangli/figma-overlay-check)](https://skills.sh/dengshangli/figma-overlay-check)

## What it does

1. Exports the target Frame from Figma as PNG (handling the 4096px export cap)
2. Aligns the browser viewport and sanity-checks the page height
3. Injects the design image as a runtime overlay via Playwright — `opacity: 0.5` for coarse misalignment, `mix-blend-mode: difference` for fine inspection ("the blacker, the closer")
4. Pinpoints root causes with machine-located diff regions, region cropping (`scripts/crop.mjs`), and DOM coordinate measurement
5. Quantifies the result with pixelmatch (`scripts/pixel-diff.mjs`) — auto-aligns image sizes (Figma export downscale, retina screenshots) and reports the top mismatch regions with coordinates; pass = mismatch < 2% with no large diff blocks
6. Cleans up after itself; the overlay is runtime-only and never enters your source code

It also ships a table of the most frequent real-world causes of visual diffs (Figma vs CSS line-height defaults, `object-cover` cropping, border box-sizing, etc.) so the agent checks likely culprits first.

## Requirements

- A web project that runs locally
- [Figma MCP](https://developers.figma.com/docs/figma-mcp-server/) (for exporting designs and reading node geometry)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) (for driving the browser and injecting overlays)
- Node.js (scripts use `pixelmatch` + `pngjs`, installed on first use)

## Install

```bash
npx skills add dengshangli/figma-overlay-check
```

Or install globally (user-level):

```bash
npx skills add dengshangli/figma-overlay-check -g
```

## Usage

Ask your agent things like:

- "Check how well this page matches the Figma design"
- "Do a pixel-perfect walkthrough against this Figma frame"
- "Overlay the mockup on the page and fix the differences"

The agent will follow the 6-step workflow in [SKILL.md](./SKILL.md).

## License

[MIT](./LICENSE)
