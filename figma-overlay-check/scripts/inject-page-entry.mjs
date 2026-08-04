#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const options = new Map(
  process.argv.slice(2).map((arg) => {
    const index = arg.indexOf('=');
    return index === -1 ? [arg, ''] : [arg.slice(0, index), arg.slice(index + 1)];
  }),
);

const projectRootArg = options.get('--project-root');
const entryArg = options.get('--entry');
const importedPath = options.get('--imported-path');
if (!projectRootArg || !entryArg || !importedPath) {
  console.error('Usage: node inject-page-entry.mjs --project-root=/absolute/project --entry=/absolute/page.tsx --imported-path=../../../.figma-overlay-check/__figma_overlay__');
  process.exit(1);
}
if (!/^\.\.?\//.test(importedPath) || /[\r\n'"`]/.test(importedPath)) {
  console.error('--imported-path must be a safe relative module path');
  process.exit(1);
}

const projectRoot = fs.realpathSync(projectRootArg);
const requestedEntryPath = path.resolve(entryArg);
if (!fs.existsSync(requestedEntryPath) || !fs.statSync(requestedEntryPath).isFile() || fs.lstatSync(requestedEntryPath).isSymbolicLink()) {
  console.error('--entry must be an existing regular file, not a symlink');
  process.exit(1);
}
const entryPath = fs.realpathSync(requestedEntryPath);
const relativeEntry = path.relative(projectRoot, entryPath);
if (!relativeEntry || relativeEntry.startsWith(`..${path.sep}`) || relativeEntry === '..' || path.isAbsolute(relativeEntry)) {
  console.error('--entry must be a file inside --project-root');
  process.exit(1);
}
const packagePath = path.join(projectRoot, 'package.json');
const packageJson = fs.existsSync(packagePath) ? JSON.parse(fs.readFileSync(packagePath, 'utf8')) : {};
const hasNextDependency = ['dependencies', 'devDependencies', 'peerDependencies'].some((field) => packageJson[field]?.next);
const pathParts = relativeEntry.split(path.sep);
const isAppRouterPath = pathParts[0] === 'app' || (pathParts[0] === 'src' && pathParts[1] === 'app');
const isNextAppRouter = Boolean(hasNextDependency && isAppRouterPath && /\.[cm]?[jt]sx?$/.test(entryPath));

const importStartMarker = 'FIGMA_OVERLAY_START';
const importEndMarker = 'FIGMA_OVERLAY_END';
const clientStartMarker = 'FIGMA_OVERLAY_USE_CLIENT_START';
const clientEndMarker = 'FIGMA_OVERLAY_USE_CLIENT_END';
let source = fs.readFileSync(entryPath, 'utf8');
const newline = source.includes('\r\n') ? '\r\n' : '\n';

const existingImport = findMarkedBlock(source, importStartMarker, importEndMarker);
const existingClient = findMarkedBlock(source, clientStartMarker, clientEndMarker);
if (existingImport) {
  const importMatch = existingImport.body.trim().match(/^import\s+(['"])([^'"]+)\1\s*;?$/);
  if (!importMatch || importMatch[2] !== importedPath) {
    console.error('Existing overlay import block does not match --imported-path');
    process.exit(1);
  }
  if (existingClient && !/^(['"])use client\1\s*;?$/.test(existingClient.body.trim())) {
    console.error('Existing overlay use-client block contains unexpected code');
    process.exit(1);
  }
  printResult(Boolean(existingClient));
  process.exit(0);
}
if (existingClient) {
  console.error('Overlay use-client block exists without an overlay import block');
  process.exit(1);
}

const directives = readDirectivePrologue(source);
const importBlock = [
  `// ${importStartMarker}`,
  `import ${JSON.stringify(importedPath)};`,
  `// ${importEndMarker}`,
].join(newline);
let useClientAdded = false;

if (isNextAppRouter && !directives.values.includes('use client')) {
  const clientBlock = [
    `// ${clientStartMarker}`,
    '"use client";',
    `// ${clientEndMarker}`,
  ].join(newline);
  source = `${clientBlock}${newline}${newline}${source}`;
  source = insertAt(source, readDirectivePrologue(source).end, importBlock, newline);
  useClientAdded = true;
} else {
  source = insertAt(source, directives.end, importBlock, newline);
}

const temporaryPath = `${entryPath}.figma-overlay-inject-${process.pid}`;
fs.writeFileSync(temporaryPath, source, { mode: fs.statSync(entryPath).mode });
fs.renameSync(temporaryPath, entryPath);
printResult(useClientAdded);

function printResult(useClientAdded) {
  console.log(JSON.stringify({
    entryImport: {
      path: entryPath,
      importedPath,
      startMarker: importStartMarker,
      endMarker: importEndMarker,
    },
    isNextAppRouter,
    useClientDirective: useClientAdded ? {
      path: entryPath,
      startMarker: clientStartMarker,
      endMarker: clientEndMarker,
    } : null,
  }));
}

function findMarkedBlock(value, startMarker, endMarker) {
  const pattern = new RegExp(`^[\\t ]*//[\\t ]*${escapeRegExp(startMarker)}[\\t ]*$([\\s\\S]*?)^[\\t ]*//[\\t ]*${escapeRegExp(endMarker)}[\\t ]*$`, 'gm');
  const matches = [...value.matchAll(pattern)];
  if (matches.length > 1) {
    console.error(`Multiple ${startMarker}/${endMarker} blocks found`);
    process.exit(1);
  }
  return matches[0] ? { body: matches[0][1], index: matches[0].index, source: matches[0][0] } : null;
}

function readDirectivePrologue(value) {
  let cursor = value.charCodeAt(0) === 0xfeff ? 1 : 0;
  const values = [];
  let end = cursor;
  while (true) {
    const start = skipTrivia(value, cursor);
    const quote = value[start];
    if (quote !== '"' && quote !== "'") break;
    let index = start + 1;
    let content = '';
    let valid = false;
    while (index < value.length) {
      const char = value[index];
      if (char === '\\') {
        content += value.slice(index, index + 2);
        index += 2;
        continue;
      }
      if (char === quote) {
        valid = true;
        index += 1;
        break;
      }
      if (char === '\n' || char === '\r') break;
      content += char;
      index += 1;
    }
    if (!valid) break;
    while (value[index] === ' ' || value[index] === '\t') index += 1;
    if (value[index] === ';') index += 1;
    if (index < value.length && value[index] !== '\n' && value[index] !== '\r') break;
    values.push(content);
    cursor = index;
    end = index;
  }
  return { end: skipTrivia(value, end), values };
}

function skipTrivia(value, start) {
  let index = start;
  while (index < value.length) {
    if (/\s/.test(value[index])) {
      index += 1;
      continue;
    }
    if (value.startsWith('//', index)) {
      const nextLine = value.indexOf('\n', index + 2);
      index = nextLine === -1 ? value.length : nextLine + 1;
      continue;
    }
    if (value.startsWith('/*', index)) {
      const close = value.indexOf('*/', index + 2);
      index = close === -1 ? value.length : close + 2;
      continue;
    }
    break;
  }
  return index;
}

function insertAt(value, offset, block, lineEnding) {
  const left = value.slice(0, offset);
  const right = value.slice(offset);
  const before = left && !left.endsWith('\n') && !left.endsWith('\r') ? lineEnding : '';
  const after = right && !right.startsWith('\n') && !right.startsWith('\r') ? `${lineEnding}${lineEnding}` : lineEnding;
  return `${left}${before}${block}${after}${right}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
