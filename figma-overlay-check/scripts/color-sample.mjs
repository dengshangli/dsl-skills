#!/usr/bin/env node
// Usage: node color-sample.mjs <design.png> <page.png> <x,y> [x,y ...] [--size=8]
// Samples the same spot in both images (averaged over a size×size patch),
// prints both colors as hex plus the perceptual difference (CIE76 ΔE).
// Coordinates are in the FIRST image's pixel space; the second image's
// coordinates are scaled automatically when widths differ (Figma export
// downscale, retina screenshots).
// Deps: npm i pngjs (in the directory you run this from)

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.join(process.cwd(), 'noop.js'));
let PNG;
try {
  ({ PNG } = require('pngjs'));
} catch {
  console.error('Missing dependency. Install it in the current directory first: npm i pngjs');
  process.exit(1);
}

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const sizeArg = process.argv.find((a) => a.startsWith('--size='));
const size = sizeArg ? parseInt(sizeArg.split('=')[1], 10) : 8;

const [designPath, pagePath, ...points] = args;
if (!designPath || !pagePath || points.length === 0) {
  console.error('Usage: node color-sample.mjs <design.png> <page.png> <x,y> [x,y ...] [--size=8]');
  process.exit(1);
}

const imgA = PNG.sync.read(fs.readFileSync(designPath));
const imgB = PNG.sync.read(fs.readFileSync(pagePath));
const scaleB = imgB.width / imgA.width;

function samplePatch(img, cx, cy, half) {
  const x0 = Math.max(0, Math.round(cx - half));
  const y0 = Math.max(0, Math.round(cy - half));
  const x1 = Math.min(img.width, Math.round(cx + half) + 1);
  const y1 = Math.min(img.height, Math.round(cy + half) + 1);
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * img.width + x) * 4;
      if (img.data[i + 3] === 0) continue; // skip fully transparent
      r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2];
      n++;
    }
  }
  if (n === 0) return null;
  return [r / n, g / n, b / n];
}

// sRGB → CIELAB (D65)
function rgbToLab([r, g, b]) {
  const lin = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [lr, lg, lb] = [lin(r), lin(g), lin(b)];
  let X = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047;
  let Y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722;
  let Z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(X), f(Y), f(Z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const deltaE = (a, b) => {
  const la = rgbToLab(a), lb = rgbToLab(b);
  return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
};

const hex = ([r, g, b]) =>
  '#' + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');

if (scaleB !== 1) {
  console.log(`Note: widths differ (${imgA.width} vs ${imgB.width}); page coordinates scaled by ${scaleB.toFixed(4)}`);
}

let worst = 0;
for (const p of points) {
  const [x, y] = p.split(',').map(Number);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    console.error(`Bad point "${p}" — expected x,y`);
    continue;
  }
  const a = samplePatch(imgA, x, y, size / 2);
  const b = samplePatch(imgB, x * scaleB, y * scaleB, size / 2);
  if (!a || !b) {
    console.log(`(${x},${y})  out of bounds or fully transparent`);
    continue;
  }
  const dE = deltaE(a, b);
  worst = Math.max(worst, dE);
  const verdict = dE < 1 ? 'match' : dE < 2.3 ? 'barely perceptible' : dE < 10 ? 'MISMATCH' : 'MISMATCH (large)';
  console.log(`(${x},${y})  design ${hex(a)}  page ${hex(b)}  ΔE=${dE.toFixed(2)}  ${verdict}`);
}

// exit 2 when any sampled point is a real mismatch
process.exit(worst >= 2.3 ? 2 : 0);
