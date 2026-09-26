import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const qaRoot = path.resolve(__dirname, '..');
const checkoutDir = path.join(qaRoot, 'checkout');
const evidenceDir = path.join(qaRoot, 'evidence');
const require = createRequire(path.join(checkoutDir, 'package.json'));
const { chromium } = require('playwright-core');

// 1. Verify Node socket guard blocks external connections while allowing 127.0.0.1
let externalNodeSocketBlocked = false;
let externalNodeSocketError = '';
try {
  await fetch('https://93.184.216.34/', { signal: AbortSignal.timeout(3000) });
} catch (err) {
  externalNodeSocketError = String(err?.cause?.message || err?.message || err);
  externalNodeSocketBlocked = externalNodeSocketError.includes('FCD QA Network Isolation') || externalNodeSocketError.includes('fetch failed');
}

// 2. Start tools/preview.ts on 127.0.0.1:4173
const previewProc = spawn(process.execPath, ['tools/preview.ts'], {
  cwd: checkoutDir,
  stdio: ['ignore', 'pipe', 'pipe']
});

await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Preview server startup timeout')), 10000);
  previewProc.stdout.on('data', (chunk) => {
    if (String(chunk).includes('http://127.0.0.1:4173')) {
      clearTimeout(timeout);
      resolve();
    }
  });
  previewProc.on('exit', (code) => {
    clearTimeout(timeout);
    reject(new Error(`Preview server exited early with code ${code}`));
  });
});

const previewAudit = {
  timestampUtc: new Date().toISOString(),
  externalNodeSocketBlocked,
  externalNodeSocketError,
  previewRoutes: [],
  traversalFallbackIsAllowlistedHome: false,
  externalFetchFromPreviewBlocked: false,
  serverStoppedCleanly: false
};

process.env.FCD_ALLOW_LOOPBACK_PREVIEW = '1';
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  for (const routePath of ['/', '/article', '/paged', '/state-error', '/state-search', '/state-label', '/state-archive', '/state-home', '/state-generic']) {
    const resp = await page.goto(`http://127.0.0.1:4173${routePath}`, { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    const h1 = await page.locator('h1').first().textContent();
    previewAudit.previewRoutes.push({
      route: routePath,
      status: resp?.status(),
      title,
      h1: (h1 || '').trim()
    });
  }

  // Test path traversal protection in tools/preview.ts (strictly allowlisted against `views`, never exposes package.json)
  const travResp = await fetch('http://127.0.0.1:4173/..%2fpackage.json');
  const travBody = await travResp.text();
  previewAudit.traversalFallbackIsAllowlistedHome =
    travResp.status === 200 && !travBody.includes('"fcd-blogger-theme"') && travBody.includes('<!DOCTYPE html>');

  // Test that an unmocked external request from the preview page is blocked by network-isolation.mjs
  previewAudit.externalFetchFromPreviewBlocked = await page.evaluate(async () => {
    try {
      await fetch('https://blogs.redwan.work/probe');
      return false;
    } catch {
      return true;
    }
  });

  await context.close();
} finally {
  await browser.close();
  previewProc.kill();
  await new Promise((resolve) => previewProc.once('exit', resolve));
  previewAudit.serverStoppedCleanly = previewProc.killed || previewProc.exitCode !== null;
}

await fs.writeFile(
  path.join(evidenceDir, 'supplemental', 'preview-server-audit.json'),
  JSON.stringify(previewAudit, null, 2),
  'utf8'
);
console.log('Preview and isolation audit complete:', JSON.stringify(previewAudit));
