#!/usr/bin/env node

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const injectScript = path.join(scriptDirectory, 'inject-page-entry.mjs');
const cleanupScript = path.join(scriptDirectory, 'cleanup-server.mjs');

await runScenario(false);
await runScenario(true);
await runNonAppRouterScenario({
  name: 'non-next-app-path',
  packageJson: { dependencies: { react: '19.0.0' } },
  entryRelativePath: 'src/app/page.tsx',
});
await runNonAppRouterScenario({
  name: 'next-pages-router',
  packageJson: { dependencies: { next: '15.0.0' } },
  entryRelativePath: 'src/pages/index.tsx',
});
console.log('Next.js App Router entry injection and cleanup tests passed, including non-Next and Pages Router exclusions');

async function runScenario(hasExistingUseClient) {
  const projectRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'figma-overlay-next-test-')));
  try {
    const entryDirectory = path.join(projectRoot, 'src/app');
    const overlayDirectory = path.join(projectRoot, '.figma-overlay-check');
    const entryPath = path.join(entryDirectory, 'page.tsx');
    const overlaySourcePath = path.join(overlayDirectory, '__figma_overlay__.ts');
    const designPath = path.join(overlayDirectory, 'design.png');
    const manifestPath = path.join(overlayDirectory, '.figma-overlay-state.json');
    const importedPath = '../../.figma-overlay-check/__figma_overlay__';
    fs.mkdirSync(entryDirectory, { recursive: true });
    fs.mkdirSync(overlayDirectory, { recursive: true });
    fs.writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify({ dependencies: { next: '15.0.0' } }));
    fs.writeFileSync(path.join(projectRoot, '.gitignore'), '.figma-overlay-check/\n');
    const originalSource = `${hasExistingUseClient ? '"use client";\n\n' : ''}export default function Page() { return <main>User content</main>; }\n`;
    fs.writeFileSync(entryPath, originalSource);
    fs.writeFileSync(overlaySourcePath, 'export {};\n');
    fs.writeFileSync(designPath, 'test-image');

    const injection = spawnSync(
      process.execPath,
      [
        injectScript,
        `--project-root=${projectRoot}`,
        `--entry=${entryPath}`,
        `--imported-path=${importedPath}`,
      ],
      { encoding: 'utf8' },
    );
    assert.equal(injection.status, 0, injection.stderr);
    const injectionResult = JSON.parse(injection.stdout);
    assert.equal(injectionResult.isNextAppRouter, true);
    assert.equal(Boolean(injectionResult.useClientDirective), !hasExistingUseClient);

    const injectedSource = fs.readFileSync(entryPath, 'utf8');
    assert.equal(count(injectedSource, /["']use client["']/g), 1);
    assert.equal(count(injectedSource, /FIGMA_OVERLAY_START/g), 1);
    assert.equal(count(injectedSource, /FIGMA_OVERLAY_END/g), 1);
    assert.equal(count(injectedSource, /FIGMA_OVERLAY_USE_CLIENT_START/g), hasExistingUseClient ? 0 : 1);
    assert.equal(count(injectedSource, /FIGMA_OVERLAY_USE_CLIENT_END/g), hasExistingUseClient ? 0 : 1);

    const repeatedInjection = spawnSync(
      process.execPath,
      [
        injectScript,
        `--project-root=${projectRoot}`,
        `--entry=${entryPath}`,
        `--imported-path=${importedPath}`,
      ],
      { encoding: 'utf8' },
    );
    assert.equal(repeatedInjection.status, 0, repeatedInjection.stderr);
    assert.deepEqual(JSON.parse(repeatedInjection.stdout), injectionResult);
    assert.equal(fs.readFileSync(entryPath, 'utf8'), injectedSource);

    fs.writeFileSync(manifestPath, JSON.stringify({
      version: 4,
      projectRoot,
      overlayDirectory,
      pageUrl: 'http://localhost:3000/',
      figmaFrameWidth: 1400,
      figmaFrameHeight: 4283,
      staticImagePath: designPath,
      downloadedImagePath: designPath,
      temporarySourcePath: overlaySourcePath,
      entryImport: injectionResult.entryImport,
      useClientDirective: injectionResult.useClientDirective,
      panelCleanupEnabled: true,
      artifactPaths: [],
    }, null, 2));

    const token = crypto.randomBytes(32).toString('hex');
    const helper = spawn(
      process.execPath,
      [cleanupScript, `--project-root=${projectRoot}`, `--token=${token}`, '--port=0'],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const endpoint = await readEndpoint(helper);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirm: 'DELETE_FIGMA_OVERLAY' }),
    });
    const result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    assert.equal(result.ok, true);
    await waitForExit(helper);

    assert.equal(fs.existsSync(overlayDirectory), false);
    assert.equal(fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8'), '.figma-overlay-check/\n');
    const cleanedSource = fs.readFileSync(entryPath, 'utf8');
    assert.equal(cleanedSource, originalSource);
    assert.doesNotMatch(cleanedSource, /FIGMA_OVERLAY_(?:START|END|USE_CLIENT)/);
    assert.equal(count(cleanedSource, /["']use client["']/g), hasExistingUseClient ? 1 : 0);
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
}

async function runNonAppRouterScenario({ name, packageJson, entryRelativePath }) {
  const projectRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `figma-overlay-${name}-test-`)));
  try {
    const entryPath = path.join(projectRoot, entryRelativePath);
    const importedPath = path.relative(path.dirname(entryPath), path.join(projectRoot, '.figma-overlay-check/__figma_overlay__'));
    const originalSource = 'export default function Page() { return <main>User content</main>; }\n';
    fs.mkdirSync(path.dirname(entryPath), { recursive: true });
    fs.writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify(packageJson));
    fs.writeFileSync(entryPath, originalSource);

    const injection = spawnSync(
      process.execPath,
      [
        injectScript,
        `--project-root=${projectRoot}`,
        `--entry=${entryPath}`,
        `--imported-path=${importedPath}`,
      ],
      { encoding: 'utf8' },
    );
    assert.equal(injection.status, 0, injection.stderr);
    const injectionResult = JSON.parse(injection.stdout);
    assert.equal(injectionResult.isNextAppRouter, false);
    assert.equal(injectionResult.useClientDirective, null);

    const injectedSource = fs.readFileSync(entryPath, 'utf8');
    assert.equal(count(injectedSource, /["']use client["']/g), 0);
    assert.equal(count(injectedSource, /FIGMA_OVERLAY_USE_CLIENT_(?:START|END)/g), 0);
    assert.equal(count(injectedSource, /FIGMA_OVERLAY_START/g), 1);
    assert.equal(count(injectedSource, /FIGMA_OVERLAY_END/g), 1);
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
}

function count(value, pattern) {
  return value.match(pattern)?.length || 0;
}

function readEndpoint(child) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      const newline = stdout.indexOf('\n');
      if (newline === -1) return;
      try {
        resolve(JSON.parse(stdout.slice(0, newline)).endpoint);
      } catch (error) {
        reject(error);
      }
    });
    child.once('exit', (code) => {
      if (code !== 0) reject(new Error(`cleanup helper exited ${code}: ${stderr}`));
    });
  });
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    if (child.exitCode !== null) {
      child.exitCode === 0 ? resolve() : reject(new Error(`cleanup helper exited ${child.exitCode}`));
      return;
    }
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`cleanup helper exited ${code}`)));
  });
}
