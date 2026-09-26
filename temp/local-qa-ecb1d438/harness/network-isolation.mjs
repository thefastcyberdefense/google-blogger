import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import Module from 'node:module';

const logFile = process.env.FCD_NETWORK_ISOLATION_LOG || '';

function recordEvent(event) {
  if (!logFile) return;
  try {
    fs.appendFileSync(
      logFile,
      JSON.stringify({ timestamp: new Date().toISOString(), pid: process.pid, ...event }) + '\n',
      'utf8'
    );
  } catch {
    // Ignore logging errors in worker teardown
  }
}

function isLoopbackHost(host) {
  if (!host) return true;
  const h = String(host).toLowerCase().replace(/^\[|\]$/g, '');
  return h === '127.0.0.1' || h === 'localhost' || h === '::1' || h === '::ffff:127.0.0.1';
}

// 1. Start a local fail-closed proxy trap on 127.0.0.1:0 so browsers cannot reach external hosts even if a request bypasses Playwright route handlers.
const proxyServer = http.createServer((req, res) => {
  recordEvent({
    layer: 'browser-proxy-trap',
    action: 'blocked',
    method: req.method,
    url: req.url,
    headers: { host: req.headers.host }
  });
  res.writeHead(451, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Blocked by FCD QA fail-closed network isolation proxy');
});

proxyServer.on('connect', (req, clientSocket) => {
  recordEvent({
    layer: 'browser-proxy-trap-connect',
    action: 'blocked',
    target: req.url
  });
  clientSocket.write('HTTP/1.1 451 Blocked by FCD QA Network Isolation\r\n\r\n');
  clientSocket.destroy();
});

proxyServer.unref();
await new Promise((resolve) => proxyServer.listen(0, '127.0.0.1', resolve));
const proxyAddress = proxyServer.address();
const proxyPort = typeof proxyAddress === 'object' && proxyAddress ? proxyAddress.port : 1;
const proxyUrl = `http://127.0.0.1:${proxyPort}`;

// 2. Guard Node-level net.Socket.prototype.connect against non-loopback connections
const origConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  let options = args[0];
  let host = '127.0.0.1';
  if (typeof options === 'object' && options !== null && !Array.isArray(options)) {
    if (options.path) return origConnect.apply(this, args);
    host = options.host || options.hostname || '127.0.0.1';
  } else if (typeof args[1] === 'string') {
    host = args[1];
  }
  if (!isLoopbackHost(host)) {
    recordEvent({
      layer: 'node-socket-guard',
      action: 'blocked',
      host,
      port: typeof options === 'object' && options ? options.port : args[0]
    });
    const err = new Error(`FCD QA Network Isolation: outbound socket to ${host} is blocked`);
    err.code = 'ENETUNREACH';
    process.nextTick(() => this.destroy(err));
    return this;
  }
  return origConnect.apply(this, args);
};

// 3. Hook playwright-core BrowserType.launch and Browser.newContext / newPage
const patchedBrowsers = new WeakSet();
const patchedContexts = new WeakSet();
const patchedBrowserTypes = new WeakSet();

async function instrumentContext(context, browserName) {
  if (!context || patchedContexts.has(context)) return context;
  patchedContexts.add(context);

  context.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith('data:') && !url.startsWith('blob:') && !url.startsWith('about:')) {
      recordEvent({
        layer: 'browser-request-observed',
        browserName,
        method: req.method(),
        resourceType: req.resourceType(),
        url
      });
    }
  });

  // Base fail-closed route registered BEFORE any test's page.route() or context.route().
  await context.route('**/*', async (route) => {
    const req = route.request();
    const url = req.url();
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('about:')) {
      return route.continue();
    }
    if (process.env.FCD_ALLOW_LOOPBACK_PREVIEW === '1') {
      try {
        const parsed = new URL(url);
        if (isLoopbackHost(parsed.hostname) && parsed.port === '4173') {
          return route.continue();
        }
      } catch {}
    }
    recordEvent({
      layer: 'playwright-fallback-route',
      action: 'blocked-unmatched',
      browserName,
      method: req.method(),
      resourceType: req.resourceType(),
      url
    });
    await route.abort('blockedbyclient');
  });

  if (typeof context.routeWebSocket === 'function') {
    try {
      await context.routeWebSocket('**/*', (ws) => {
        recordEvent({
          layer: 'playwright-websocket-guard',
          action: 'blocked',
          browserName,
          url: ws.url()
        });
        ws.close({ code: 1008, reason: 'Blocked by FCD QA network isolation' });
      });
    } catch {}
  }

  return context;
}

function instrumentBrowser(browser, browserName) {
  if (!browser || patchedBrowsers.has(browser)) return browser;
  patchedBrowsers.add(browser);

  const origNewContext = browser.newContext.bind(browser);
  browser.newContext = async function (options = {}) {
    const ctx = await origNewContext({
      ...options
    });
    return instrumentContext(ctx, browserName);
  };

  if (typeof browser._newContextForReuse === 'function') {
    const origNewContextForReuse = browser._newContextForReuse.bind(browser);
    browser._newContextForReuse = async function (...args) {
      const res = await origNewContextForReuse(...args);
      if (res && res.context) {
        await instrumentContext(res.context, browserName);
      } else if (res) {
        await instrumentContext(res, browserName);
      }
      return res;
    };
  }

  const origNewPage = browser.newPage.bind(browser);
  browser.newPage = async function (options = {}) {
    const ctx = await browser.newContext(options);
    const page = await ctx.newPage();
    const origClose = page.close.bind(page);
    page.close = async function (...closeArgs) {
      await origClose(...closeArgs);
      await ctx.close();
    };
    return page;
  };

  return browser;
}

function patchPlaywrightExports(pw) {
  if (!pw || typeof pw !== 'object') return pw;
  const targets = [pw, pw.default, pw?.inprocess?.playwright].filter(Boolean);
  for (const target of targets) {
    for (const name of ['chromium', 'firefox', 'webkit']) {
      const bt = target[name];
      if (bt && typeof bt.launch === 'function' && !patchedBrowserTypes.has(bt)) {
        patchedBrowserTypes.add(bt);
        const origLaunch = bt.launch.bind(bt);
        bt.launch = async function (options = {}) {
          const launchOptions = {
            ...options,
            proxy: options.proxy || {
              server: proxyUrl,
              bypass: '127.0.0.1,localhost,::1'
            }
          };
          const browser = await origLaunch(launchOptions);
          return instrumentBrowser(browser, name);
        };
      }
    }
  }
  return pw;
}

const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  const loaded = origLoad.apply(this, [request, parent, isMain]);
  if (
    request === 'playwright-core' ||
    request === '@playwright/test' ||
    request === 'playwright' ||
    (typeof request === 'string' &&
      (request.includes('playwright-core') ||
        request.includes('coreBundle') ||
        request.includes('inProcessFactory')))
  ) {
    patchPlaywrightExports(loaded);
  }
  return loaded;
};
