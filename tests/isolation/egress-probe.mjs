// Explicitly invoked by the Actions wrapper, never auto-discovered as a unit test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import dgram from 'node:dgram';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const self = fileURLToPath(import.meta.url);
const wrapper = path.resolve('tools/run-isolated-tests.sh');
const evidence = process.env.FCD_ISOLATION_EVIDENCE;
const source = process.env.FCD_SOURCE;
const namespace = () => fs.readlinkSync('/proc/self/ns/net');
const records = [];
function record(name, detail = {}) {
  records.push({ name, ...detail });
  console.log(`PASS isolation: ${name}`);
}
function write(name, value) {
  assert.match(name, /^[a-z][a-z0-9-]{0,40}$/);
  assert.match(source, /^[a-f0-9]{40}$/);
  assert.ok(evidence && fs.statSync(evidence).isDirectory());
  fs.writeFileSync(path.join(evidence, `${name}.json`), JSON.stringify({ source, ...value }, null, 2) + '\n', { flag: 'wx' });
}
function guard(payload = false) {
  assert.equal(process.env.GITHUB_ACTIONS, 'true');
  assert.notEqual(process.getuid(), 0, 'payload must not run as root');
  assert.notEqual(namespace(), process.env.FCD_PARENT_NS, 'fresh network namespace required');
  const links = JSON.parse(execFileSync('ip', ['-j', 'link', 'show'], { encoding: 'utf8' }));
  assert.deepEqual(links.map(l => l.ifname), ['lo'], 'only loopback is allowed');
  assert.ok(links[0].flags.includes('UP'), 'loopback must be enabled');
  for (const family of ['-4', '-6']) {
    const routes = JSON.parse(execFileSync('ip', [family, '-j', 'route', 'show', 'table', 'all'], { encoding: 'utf8' }));
    assert.ok(routes.every(r => r.dev === 'lo'), 'non-loopback route rejected');
  }
  if (payload) {
    const status = fs.readFileSync('/proc/self/status', 'utf8');
    assert.match(status, /^NoNewPrivs:\s+1$/m);
    for (const cap of ['CapInh', 'CapPrm', 'CapEff', 'CapBnd', 'CapAmb']) assert.match(status, new RegExp(`^${cap}:\\s+0+$`, 'm'));
  }
}
async function execute(command, args, options = {}) {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.once('error', reject);
    child.once('close', (code, signal) => resolve(signal ? 128 + (signal === 'SIGKILL' ? 9 : 15) : code));
  });
}
async function server(host) {
  const instance = http.createServer((_req, res) => { res.end('fcd-controlled-canary'); });
  await new Promise((resolve, reject) => { instance.once('error', reject); instance.listen(0, host, resolve); });
  return { instance, host, port: instance.address().port };
}
async function close(s) {
  s.instance.closeAllConnections();
  await new Promise(resolve => s.instance.close(resolve));
}
async function reachable(host, port) {
  return await new Promise((resolve, reject) => {
    const socket = net.connect({ host, port });
    socket.setTimeout(2000);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('timeout', () => { socket.destroy(); reject(new Error('controlled socket probe timed out')); });
    socket.once('error', error => {
      socket.destroy();
      if (['ECONNREFUSED', 'ENETUNREACH', 'EHOSTUNREACH', 'EACCES'].includes(error.code)) resolve(false);
      else reject(error);
    });
  });
}
async function udpDenied(host, type) {
  const socket = dgram.createSocket(type);
  try {
    const code = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('UDP probe timed out')), 2000);
      socket.send(Buffer.from('fcd-probe'), 9, host, error => { clearTimeout(timer); resolve(error?.code); });
    });
    assert.ok(['ENETUNREACH', 'EHOSTUNREACH', 'EACCES'].includes(code), 'UDP must fail without a route');
  } finally { socket.close(); }
}
async function boundaryChild(canaries) {
  // Probe the controlled parent first: the red checkpoint fails here, not on
  // missing infrastructure, and never has access to the host network.
  for (const c of canaries) assert.equal(await reachable(c.host, c.port), false, 'EGRESS_POLICY: controlled parent canary reachable');
  guard(true);
  record('parent IPv4 and IPv6 canaries inaccessible');
  const local = await server('127.0.0.1');
  try {
    assert.equal(await (await fetch(`http://127.0.0.1:${local.port}`)).text(), 'fcd-controlled-canary');
    const childNs = execFileSync(process.execPath, ['-e', "process.stdout.write(require('node:fs').readlinkSync('/proc/self/ns/net'))"], { encoding: 'utf8' });
    assert.equal(childNs, namespace(), 'Node descendants inherit the boundary');
    const { chromium, firefox, webkit } = await import('playwright-core');
    for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
      const browser = await engine.launch({ headless: true });
      try {
        const page = await browser.newPage();
        await page.goto(`http://127.0.0.1:${local.port}`, { timeout: 5000 });
        assert.equal(await page.textContent('body'), 'fcd-controlled-canary');
        for (const c of canaries) {
          const host = c.host.includes(':') ? `[${c.host}]` : c.host;
          await assert.rejects(page.goto(`http://${host}:${c.port}`, { timeout: 3000 }));
        }
        record(`${name} local fixture and parent denial`);
      } finally { await browser.close(); }
    }
    const proxy = canaries[0];
    const browser = await chromium.launch({ headless: true, proxy: { server: `http://${proxy.host}:${proxy.port}` } });
    try {
      const page = await browser.newPage();
      await assert.rejects(page.goto('http://fcd-proxy-probe.invalid/', { timeout: 3000 }));
    } finally { await browser.close(); }
    record('explicit browser proxy cannot reach parent');
    // Documentation-only addresses, attempted only after no-route guard passes.
    assert.equal(await reachable('192.0.2.1', 9), false);
    assert.equal(await reachable('2001:db8::1', 9), false);
    await udpDenied('192.0.2.1', 'udp4');
    await udpDenied('2001:db8::1', 'udp6');
    record('IPv4 IPv6 TCP and UDP no-route denial');
  } finally { await close(local); }
}
async function suite() {
  guard();
  const canaries = [await server('127.0.0.1')];
  try {
    canaries.push(await server('::1'));
    for (const c of canaries) assert.equal(await reachable(c.host, c.port), true, 'parent canary positive control');
    record('protected parent positive controls');
    const args = JSON.stringify(canaries.map(({ host, port }) => ({ host, port })));
    const env = { ...process.env, FCD_HARNESS_NS: namespace() };
    // Direct execution models the former workflow. It must detect the local
    // leak even after implementation, keeping the negative control meaningful.
    const negative = await execute(process.execPath, [self, 'child', args], { env });
    assert.equal(negative, 1, 'unisolated negative control must fail');
    record('unisolated negative control detected');
    const run = async (label, seconds, command) => execute('/bin/bash', [wrapper, 'run', label, String(seconds), ...command], { env });
    assert.equal(await run('check-boundary', 60, [process.execPath, self, 'child', args]), 0, 'isolated policy regression failed');
    record('fresh process boundary');
    assert.equal(await run('check-zero', 5, [process.execPath, '-e', 'process.exit(0)']), 0);
    assert.equal(await run('check-exit', 5, [process.execPath, '-e', 'process.exit(37)']), 37, 'child exit status must be preserved');
    record('zero and nonzero child statuses preserved');
    assert.equal(await run('check-timeout', 1, [process.execPath, '-e', 'setInterval(()=>{},1000)']), 124, 'timeout must stay nonzero and bounded');
    record('bounded timeout');
    const marker = path.join(evidence, 'must-not-run');
    const blocked = await execute('/usr/bin/setpriv', ['--no-new-privs', '/bin/bash', wrapper, 'run', 'check-setup', '5', process.execPath, '-e', `require('node:fs').writeFileSync(${JSON.stringify(marker)},'unsafe')`], { env });
    assert.notEqual(blocked, 0, 'failed namespace setup must be nonzero');
    assert.equal(fs.existsSync(marker), false, 'payload ran after failed setup');
    record('failed privileged setup stops payload');
    const orphan = path.join(evidence, 'orphan-must-not-survive');
    const code = `const {spawn}=require('node:child_process');const c=spawn(process.execPath,['-e',${JSON.stringify(`setTimeout(()=>require('node:fs').writeFileSync(${JSON.stringify(orphan)},'unsafe'),2500)`)}],{detached:true,stdio:'ignore'});c.unref()`;
    assert.equal(await run('check-cleanup', 5, [process.execPath, '-e', code]), 0);
    await new Promise(resolve => setTimeout(resolve, 3500)); // Deliberate child-lifetime assertion.
    assert.equal(fs.existsSync(orphan), false, 'orphan survived namespace shutdown');
    record('descendant cleanup after parent exit');
  } finally {
    for (const c of canaries) await close(c);
    write('bootstrap-checks', { records });
  }
}
async function main() {
  const [mode, ...args] = process.argv.slice(2);
  if (mode === 'suite') return await suite();
  if (mode === 'child') return await boundaryChild(JSON.parse(args[0]));
  if (mode === 'exec') {
    guard(true);
    write(`${process.env.FCD_LABEL}-guard`, { namespace: namespace(), uid: process.getuid(), noNewPrivileges: true, records: ['loopback-only', 'no-external-routes', 'capabilities-dropped'] });
    process.exitCode = await execute(args[0], args.slice(1));
    return;
  }
  if (mode === 'receipt') {
    const [label, code] = args;
    assert.match(code, /^(0|[1-9][0-9]{0,2})$/);
    write(label, { exitCode: Number(code) });
    return;
  }
  if (mode === 'finalize') {
    assert.ok(evidence && fs.statSync(evidence).isDirectory(), 'missing isolation evidence');
    const destination = path.resolve('test-results/isolation');
    fs.mkdirSync(destination, { recursive: true });
    for (const filename of fs.readdirSync(evidence)) {
      assert.match(filename, /^[a-z][a-z0-9-]{0,40}\.json$/);
      const value = JSON.parse(fs.readFileSync(path.join(evidence, filename), 'utf8'));
      assert.equal(value.source, source, 'stale isolation evidence');
      fs.copyFileSync(path.join(evidence, filename), path.join(destination, filename), fs.constants.COPYFILE_EXCL);
    }
    for (const label of ['bootstrap', 'unit', 'render']) {
      const result = JSON.parse(fs.readFileSync(path.join(evidence, `${label}.json`), 'utf8'));
      assert.equal(result.exitCode, 0, `${label} did not succeed`);
    }
    for (const label of ['unit', 'render']) assert.ok(fs.existsSync(path.join(evidence, `${label}-guard.json`)), 'missing application guard evidence');
    console.log('PASS isolation: exact-source evidence finalized; browser-layer attribution remains separate');
    return;
  }
  throw new Error('unknown isolation probe mode');
}
try { await main(); } catch (error) { console.error(`ISOLATION FAILURE: ${error.message}`); process.exitCode = 1; }
