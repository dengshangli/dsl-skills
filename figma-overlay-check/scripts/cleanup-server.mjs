#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const options = new Map(
  process.argv.slice(2).map((arg) => {
    const index = arg.indexOf('=');
    return index === -1 ? [arg, ''] : [arg.slice(0, index), arg.slice(index + 1)];
  }),
);

const projectRootArg = options.get('--project-root');
const token = options.get('--token');
const port = Number(options.get('--port') || '0');

if (!projectRootArg || !token || token.length < 32 || !Number.isInteger(port) || port < 0 || port > 65535) {
  console.error('Usage: node cleanup-server.mjs --project-root=/absolute/project --token=<random-32+-chars> [--port=0]');
  process.exit(1);
}

const canonicalProjectRoot = fs.realpathSync(projectRootArg);
const expectedOverlayDirectory = path.join(canonicalProjectRoot, '.figma-overlay-check');
let used = false;
let pendingDeletionState = null;

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
}

function safeEqual(actual, expected) {
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function validateGeneratedPath(value, overlayDirectory, field) {
  if (typeof value !== 'string' || !path.isAbsolute(value)) {
    throw new Error(`${field} must be an absolute path`);
  }
  const resolved = path.resolve(value);
  if (resolved !== overlayDirectory && !isInside(overlayDirectory, resolved)) {
    throw new Error(`${field} must stay inside .figma-overlay-check`);
  }
}

function resolveImportedPath(entryPath, importedPath, temporarySourcePath) {
  const base = path.resolve(path.dirname(entryPath), importedPath);
  const candidates = [
    base,
    ...['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].map((extension) => `${base}${extension}`),
    ...['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].map((extension) => path.join(base, `index${extension}`)),
  ];
  return candidates.some((candidate) => path.resolve(candidate) === temporarySourcePath);
}

function validateManifest() {
  const overlayStat = fs.lstatSync(expectedOverlayDirectory);
  if (!overlayStat.isDirectory() || overlayStat.isSymbolicLink()) {
    throw new Error('.figma-overlay-check must be a real directory, not a symlink');
  }
  const overlayDirectory = fs.realpathSync(expectedOverlayDirectory);
  if (overlayDirectory !== expectedOverlayDirectory) {
    throw new Error('overlay directory does not resolve to the expected project path');
  }

  const manifestPath = path.join(overlayDirectory, '.figma-overlay-state.json');
  const manifestSource = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestSource);
  if (manifest.version !== 4) throw new Error('unsupported overlay manifest version');
  if (fs.realpathSync(manifest.projectRoot) !== canonicalProjectRoot) throw new Error('manifest projectRoot mismatch');
  if (path.resolve(manifest.overlayDirectory) !== overlayDirectory) throw new Error('manifest overlayDirectory mismatch');

  for (const field of ['staticImagePath', 'downloadedImagePath', 'temporarySourcePath']) {
    validateGeneratedPath(manifest[field], overlayDirectory, field);
  }
  if (!Array.isArray(manifest.artifactPaths)) throw new Error('artifactPaths must be an array');
  manifest.artifactPaths.forEach((value, index) => validateGeneratedPath(value, overlayDirectory, `artifactPaths[${index}]`));

  const entryImport = manifest.entryImport;
  if (!entryImport || typeof entryImport !== 'object') throw new Error('entryImport is required');
  if (entryImport.startMarker !== 'FIGMA_OVERLAY_START' || entryImport.endMarker !== 'FIGMA_OVERLAY_END') {
    throw new Error('invalid import markers');
  }

  const entryPath = path.resolve(entryImport.path);
  if (!isInside(canonicalProjectRoot, entryPath) || entryPath === overlayDirectory || isInside(overlayDirectory, entryPath)) {
    throw new Error('entryImport.path must be project source outside .figma-overlay-check');
  }
  if (!fs.statSync(entryPath).isFile()) throw new Error('entryImport.path is not a file');

  const temporarySourcePath = path.resolve(manifest.temporarySourcePath);
  if (!resolveImportedPath(entryPath, entryImport.importedPath, temporarySourcePath)) {
    throw new Error('entry import does not resolve to temporarySourcePath');
  }

  return {
    entryImport,
    entryPath,
    manifest,
    manifestDigest: crypto.createHash('sha256').update(manifestSource).digest('hex'),
    manifestPath,
    overlayDirectory,
  };
}

function removeMarkedImport(entryPath, entryImport) {
  const source = fs.readFileSync(entryPath, 'utf8');
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const lines = source.split(/\r?\n/);
  const startText = `// ${entryImport.startMarker}`;
  const endText = `// ${entryImport.endMarker}`;
  const starts = lines.flatMap((line, index) => (line.trim() === startText ? [index] : []));
  const ends = lines.flatMap((line, index) => (line.trim() === endText ? [index] : []));
  if (starts.length !== 1 || ends.length !== 1 || starts[0] >= ends[0]) throw new Error('import marker pair is missing or ambiguous');

  const block = lines.slice(starts[0] + 1, ends[0]);
  const imports = block.filter((line) => /^\s*import\s+/.test(line));
  const allowed = block.every((line) => {
    const trimmed = line.trim();
    return trimmed === '' || trimmed.startsWith('//') || /^import\s+['"][^'"]+['"]\s*;?$/.test(trimmed);
  });
  if (!allowed || imports.length !== 1) throw new Error('marked block contains unexpected code');

  const importMatch = imports[0].trim().match(/^import\s+(['"])([^'"]+)\1\s*;?$/);
  if (!importMatch || importMatch[2] !== entryImport.importedPath) throw new Error('marked import does not match the manifest');

  lines.splice(starts[0], ends[0] - starts[0] + 1);
  const nextSource = lines.join(newline);
  const temporaryPath = `${entryPath}.figma-overlay-delete-${process.pid}`;
  fs.writeFileSync(temporaryPath, nextSource, { mode: fs.statSync(entryPath).mode });
  fs.renameSync(temporaryPath, entryPath);
}

function cleanup() {
  const state = pendingDeletionState || validateManifest();
  if (!pendingDeletionState) {
    removeMarkedImport(state.entryPath, state.entryImport);
    pendingDeletionState = state;
  }

  const overlayStat = fs.lstatSync(expectedOverlayDirectory);
  if (!overlayStat.isDirectory() || overlayStat.isSymbolicLink() || fs.realpathSync(expectedOverlayDirectory) !== state.overlayDirectory) {
    throw new Error('overlay directory changed during cleanup');
  }
  const currentManifestDigest = crypto.createHash('sha256').update(fs.readFileSync(state.manifestPath)).digest('hex');
  if (currentManifestDigest !== state.manifestDigest) throw new Error('manifest changed during cleanup');
  fs.rmSync(expectedOverlayDirectory, { recursive: true, force: false });
  pendingDeletionState = null;
  return { entryPath: state.entryPath, overlayDirectory: expectedOverlayDirectory };
}

function isLoopback(address) {
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

function allowOrigin(origin) {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]') && ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function send(response, status, body, origin) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
    'Content-Length': Buffer.byteLength(payload),
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(payload);
}

const server = http.createServer((request, response) => {
  const origin = request.headers.origin;
  if (!isLoopback(request.socket.remoteAddress) || !allowOrigin(origin)) {
    send(response, 403, { ok: false, error: 'request origin rejected' });
    return;
  }
  if (request.method === 'OPTIONS') {
    send(response, 204, {}, origin);
    return;
  }
  if (request.method !== 'POST' || request.url !== '/cleanup') {
    send(response, 404, { ok: false, error: 'not found' }, origin);
    return;
  }
  if (used || !safeEqual(request.headers.authorization || '', `Bearer ${token}`)) {
    send(response, 403, { ok: false, error: 'invalid or already-used cleanup token' }, origin);
    return;
  }

  let body = '';
  request.setEncoding('utf8');
  request.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1024) request.destroy();
  });
  request.on('end', () => {
    try {
      const parsed = JSON.parse(body || '{}');
      if (parsed.confirm !== 'DELETE_FIGMA_OVERLAY') throw new Error('explicit confirmation payload is required');
      used = true;
      const result = cleanup();
      send(response, 200, { ok: true, ...result }, origin);
      setTimeout(() => server.close(), 50);
    } catch (error) {
      used = false;
      send(response, 409, { ok: false, error: error instanceof Error ? error.message : String(error) }, origin);
    }
  });
});

server.listen(port, '127.0.0.1', () => {
  const address = server.address();
  console.log(JSON.stringify({ endpoint: `http://127.0.0.1:${address.port}/cleanup` }));
});
