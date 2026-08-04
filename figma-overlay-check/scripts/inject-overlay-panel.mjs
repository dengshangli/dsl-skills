#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const targetArg = process.argv[2];
if (!targetArg) {
  console.error('Usage: node inject-overlay-panel.mjs <project-root>/.figma-overlay-check/__figma_overlay__.ts');
  process.exit(1);
}

const target = path.resolve(targetArg);
const expectedDirectory = path.join(path.dirname(path.dirname(target)), '.figma-overlay-check');
if (path.basename(target) !== '__figma_overlay__.ts' || path.dirname(target) !== expectedDirectory) {
  console.error('Target must be <project-root>/.figma-overlay-check/__figma_overlay__.ts');
  process.exit(1);
}
if (!fs.existsSync(target) || !fs.statSync(target).isFile() || fs.lstatSync(target).isSymbolicLink()) {
  console.error('Target must be an existing regular file, not a symlink');
  process.exit(1);
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const presetPath = path.resolve(scriptDirectory, '../assets/overlay-panel.js');
const preset = fs.readFileSync(presetPath, 'utf8').trimEnd();
const source = fs.readFileSync(target, 'utf8');
const startMarker = '// FIGMA_OVERLAY_PANEL_PRESET_START';
const endMarker = '// FIGMA_OVERLAY_PANEL_PRESET_END';
const blockPattern = new RegExp(`${escapeRegExp(startMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}\\s*`, 'g');
const matches = source.match(blockPattern) || [];
if (matches.length > 1) {
  console.error('Target contains multiple panel preset blocks');
  process.exit(1);
}

const cleanSource = source.replace(blockPattern, '').trimEnd();
if (/\bfunction\s+mountFigmaOverlayPanel\b|\b(?:const|let|var)\s+mountFigmaOverlayPanel\b/.test(cleanSource)) {
  console.error('Target contains a handcrafted mountFigmaOverlayPanel implementation; remove it before injecting the preset');
  process.exit(1);
}
const newline = source.includes('\r\n') ? '\r\n' : '\n';
const block = [startMarker, preset, endMarker].join(newline);
const output = `${cleanSource}${cleanSource ? `${newline}${newline}` : ''}${block}${newline}`;
fs.writeFileSync(target, output);
console.log(`${matches.length ? 'Replaced' : 'Injected'} stable overlay panel preset in ${target}`);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
