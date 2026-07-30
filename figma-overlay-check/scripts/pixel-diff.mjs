#!/usr/bin/env node
// Usage: node pixel-diff.mjs <design.png> <page.png> [diff.png] [--threshold=0.1]
// Compares two PNGs and reports mismatch percentage plus the top mismatch
// regions (bounding boxes) so you can crop/inspect them directly.
// If widths differ (e.g. Figma export downscale, retina screenshots), the wider
// image is automatically resampled to the narrower width before comparing.
// Deps: npm i pixelmatch pngjs (in the directory you run this from)

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

// Resolve deps from the caller's cwd so users can `npm i pixelmatch pngjs` anywhere.
const require = createRequire(path.join(process.cwd(), 'noop.js'));
let pixelmatch, PNG;
try {
  pixelmatch = require('pixelmatch');
  pixelmatch = pixelmatch.default ?? pixelmatch;
  ({ PNG } = require('pngjs'));
} catch {
  console.error('Missing dependencies. Install them in the current directory first: npm i pixelmatch pngjs');
  process.exit(1);
}

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const thresholdArg = process.argv.find((a) => a.startsWith('--threshold='));
const threshold = thresholdArg ? parseFloat(thresholdArg.split('=')[1]) : 0.1;

const [designPath, pagePath, diffPath = 'diff.png'] = args;
if (!designPath || !pagePath) {
  console.error('Usage: node pixel-diff.mjs <design.png> <page.png> [diff.png] [--threshold=0.1]');
  process.exit(1);
}

// Box-filter resample to a target width, preserving aspect ratio.
function resizeToWidth(src, targetWidth) {
  if (src.width === targetWidth) return src;
  const scale = src.width / targetWidth;
  const targetHeight = Math.max(1, Math.round(src.height / scale));
  const out = new PNG({ width: targetWidth, height: targetHeight });
  for (let y = 0; y < targetHeight; y++) {
    const sy0 = Math.min(src.height - 1, Math.floor(y * scale));
    const sy1 = Math.max(sy0 + 1, Math.min(src.height, Math.ceil((y + 1) * scale)));
    for (let x = 0; x < targetWidth; x++) {
      const sx0 = Math.min(src.width - 1, Math.floor(x * scale));
      const sx1 = Math.max(sx0 + 1, Math.min(src.width, Math.ceil((x + 1) * scale)));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const i = (sy * src.width + sx) * 4;
          r += src.data[i]; g += src.data[i + 1]; b += src.data[i + 2]; a += src.data[i + 3];
          n++;
        }
      }
      const o = (y * targetWidth + x) * 4;
      out.data[o] = r / n; out.data[o + 1] = g / n; out.data[o + 2] = b / n; out.data[o + 3] = a / n;
    }
  }
  return out;
}

function cropTo(src, width, height) {
  if (src.width === width && src.height === height) return src;
  const out = new PNG({ width, height });
  PNG.bitblt(src, out, 0, 0, width, height, 0, 0);
  return out;
}

const rawA = PNG.sync.read(fs.readFileSync(designPath));
const rawB = PNG.sync.read(fs.readFileSync(pagePath));

const width = Math.min(rawA.width, rawB.width);
if (rawA.width !== rawB.width) {
  console.log(`Note: widths differ (${rawA.width} vs ${rawB.width}); resampled the wider image to ${width}px`);
}
const scaledA = resizeToWidth(rawA, width);
const scaledB = resizeToWidth(rawB, width);

const height = Math.min(scaledA.height, scaledB.height);
if (scaledA.height !== scaledB.height) {
  console.log(`Note: heights differ after width alignment (${scaledA.height} vs ${scaledB.height}); compared the top ${height}px — check page height if the gap is large`);
}
const imgA = cropTo(scaledA, width, height);
const imgB = cropTo(scaledB, width, height);
const diff = new PNG({ width, height });

const mismatched = pixelmatch(imgA.data, imgB.data, diff.data, width, height, {
  threshold,
  includeAA: false,
});

fs.writeFileSync(diffPath, PNG.sync.write(diff));

const total = width * height;
const pct = ((mismatched / total) * 100).toFixed(2);
console.log(`mismatch: ${pct}% (${mismatched} / ${total} px)`);
console.log(`diff highlight image written to: ${diffPath}`);

// --- Cluster mismatched pixels into regions (grid-based connected components) ---
// pixelmatch paints mismatched pixels pure red (255,0,0) in the diff output.
const CELL = 40;
const MIN_CELL_PX = 12; // ignore cells with only scattered AA-like noise
const gw = Math.ceil(width / CELL);
const gh = Math.ceil(height / CELL);
const cellCounts = new Uint32Array(gw * gh);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    if (diff.data[i] === 255 && diff.data[i + 1] === 0 && diff.data[i + 2] === 0) {
      cellCounts[Math.floor(y / CELL) * gw + Math.floor(x / CELL)]++;
    }
  }
}

const labels = new Int32Array(gw * gh).fill(-1);
const regions = [];
for (let cy = 0; cy < gh; cy++) {
  for (let cx = 0; cx < gw; cx++) {
    const idx = cy * gw + cx;
    if (cellCounts[idx] < MIN_CELL_PX || labels[idx] !== -1) continue;
    // BFS over adjacent hot cells
    const region = { minX: cx, maxX: cx, minY: cy, maxY: cy, px: 0 };
    const queue = [idx];
    labels[idx] = regions.length;
    while (queue.length) {
      const cur = queue.pop();
      const x = cur % gw, y = Math.floor(cur / gw);
      region.px += cellCounts[cur];
      region.minX = Math.min(region.minX, x); region.maxX = Math.max(region.maxX, x);
      region.minY = Math.min(region.minY, y); region.maxY = Math.max(region.maxY, y);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
        const ni = ny * gw + nx;
        if (cellCounts[ni] >= MIN_CELL_PX && labels[ni] === -1) {
          labels[ni] = regions.length;
          queue.push(ni);
        }
      }
    }
    regions.push(region);
  }
}

regions.sort((a, b) => b.px - a.px);
if (regions.length === 0) {
  console.log('diff regions: none above noise level');
} else {
  console.log(`diff regions (top ${Math.min(regions.length, 10)} of ${regions.length}, by mismatched px):`);
  for (const r of regions.slice(0, 10)) {
    const x = r.minX * CELL;
    const y = r.minY * CELL;
    const w = Math.min(width, (r.maxX + 1) * CELL) - x;
    const h = Math.min(height, (r.maxY + 1) * CELL) - y;
    const density = ((r.px / (w * h)) * 100).toFixed(1);
    console.log(`  x=${x} y=${y} w=${w} h=${h}  (${r.px} px, ${density}% of region)`);
  }
  console.log('crop a region with: node crop.mjs diff.png <x> <y> <w> <h> out.png');
}

process.exit(mismatched / total > 0.02 ? 2 : 0);
