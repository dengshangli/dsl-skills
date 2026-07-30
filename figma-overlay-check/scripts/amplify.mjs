#!/usr/bin/env node
// Usage: node amplify.mjs <in.png> <out.png> [--gain=8]
// Multiplies every RGB value by the gain (clamped to 255). Run it on a
// screenshot of the mix-blend-mode:difference overlay: subtle color drift
// that renders as invisible near-black (e.g. #070707) lights up as clearly
// visible gray blocks.
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
const gainArg = process.argv.find((a) => a.startsWith('--gain='));
const gain = gainArg ? parseFloat(gainArg.split('=')[1]) : 8;

const [inPath, outPath] = args;
if (!inPath || !outPath) {
  console.error('Usage: node amplify.mjs <in.png> <out.png> [--gain=8]');
  process.exit(1);
}

const img = PNG.sync.read(fs.readFileSync(inPath));
for (let i = 0; i < img.data.length; i += 4) {
  img.data[i] = Math.min(255, img.data[i] * gain);
  img.data[i + 1] = Math.min(255, img.data[i + 1] * gain);
  img.data[i + 2] = Math.min(255, img.data[i + 2] * gain);
}
fs.writeFileSync(outPath, PNG.sync.write(img));
console.log(`amplified ×${gain} → ${outPath}`);
