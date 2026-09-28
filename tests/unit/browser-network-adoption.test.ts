import { expect, test } from 'vitest';
import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { assets, pug, root } from '../../tools/generate.ts';
import { CASES, PROJECTS, POLICY, SCHEMA, UNIT_CONSUMER, engineFor, testKey, loadManifest, stageRoot, validateSnapshot, type Manifest, type Start, type End, type TestEntry, type ResultEntry } from '../../tools/finalize-browser-network.ts';

// N2A-01 characterization only. This does not register routes or adopt suites.
// Runs under the existing Actions unit stage and its mandatory N0 boundary.
const limits = { html: 500000, module: 2097152, distinct: 8388608, fulfilled: 16777216, rules: 64 } as const;
const sha256 = (body: Buffer | string) => createHash('sha256').update(body).digest('hex');
type Measurement = { name: string; bytes: number; sha256: string };
function report(kind: string, value: unknown): void {
  const text = JSON.stringify(value);
  if (Buffer.byteLength(text) > 12000) throw new Error('N2A_PREFLIGHT_DIAGNOSTIC_BOUND');
  console.log(`::warning title=N2A preflight ${kind}::${text.replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A')}`);
}

let fixtureMeasurements: Promise<Measurement[]> | undefined;
function measureFixtures(): Promise<Measurement[]> {
  return fixtureMeasurements ??= (async () => {
    const compiled = await assets();
    const values: { name: string; html: string }[] = [];
    for (const view of ['home','article','paged','empty','error']) {
      values.push({name: view, html: pug.renderFile(path.join(root, `fixtures/${view === 'article' ? 'article' : 'home'}.pug`), {...compiled, fixtureView: view, pretty: true})});
    }
    for (const state of ['error','label','search','archive','home','generic']) {
      values.push({name: `state-${state}`, html: pug.renderFile(path.join(root, 'fixtures/home.pug'), {...compiled, fixtureView: state === 'generic' ? 'paged' : state, fixturePosts: [], fixtureEmptyState: state, fixtureEmptyContext: '<img src=x onerror=alert(1)> & "quoted"', pretty: true})});
    }
    const home = values.find(v => v.name === 'home')!;
    const article = values.find(v => v.name === 'article')!;
    values.push({name: 'profile', html: home.html.replace(/data:image\/svg\+xml,[^"\s]+/g, 'https://fcd-fixture.invalid/profile-image.svg')});
    values.push({name: 'article-enlarged', html: article.html.replace('</head>', '<style>html{font-size:200%}p{letter-spacing:.12em;word-spacing:.16em}</style></head>')});
    const data = JSON.parse(await readFile(path.join(root, 'fixtures/technical-content.json'), 'utf8'));
    expect(Array.isArray(data.diagrams)).toBe(true);
    expect(data.diagrams.length).toBeGreaterThan(0);
    data.diagrams = data.diagrams.slice(0, 1);
    values.push({name: 'technical', html: pug.renderFile(path.join(root, 'fixtures/technical-libraries.pug'), {...compiled, data})});
    return values.map(({name, html}) => ({name, bytes: Buffer.byteLength(html), sha256: sha256(html)}));
  })();
}

test('N2A preflight measures every adopted HTML variant without changing producers', async () => {
  const rows = await measureFixtures();
  report('HTML', rows);
  expect(rows).toHaveLength(14);
  expect(new Set(rows.map(row => row.name)).size).toBe(rows.length);
  for (const row of rows) {
    expect(row.bytes, row.name).toBeGreaterThan(0);
    expect(row.bytes, `N2A_HTML_LIMIT ${row.name}: ${row.bytes}`).toBeLessThanOrEqual(limits.html);
  }
}, 20000);

/** Read a locked installed module, never a request-derived path. No execution. */
async function readModule(base: string, relative: string): Promise<Buffer> {
  if (!/^[A-Za-z0-9_./-]+\.mjs$/.test(relative) || relative.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('N2A_MODULE_PATH');
  let current = base;
  const parts = relative.split('/');
  for (let i = 0; i < parts.length; i++) {
    current = path.join(current, parts[i]);
    const stat = await lstat(current);
    if (stat.isSymbolicLink() || (i < parts.length - 1 ? !stat.isDirectory() : !stat.isFile())) throw new Error('N2A_MODULE_TYPE');
  }
  const resolved = await realpath(current);
  if (!resolved.startsWith(base + path.sep)) throw new Error('N2A_MODULE_ESCAPE');
  const handle = await open(current, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.size > limits.module) throw new Error(`N2A_MODULE_LIMIT ${relative}: ${before.size}`);
    const body = await handle.readFile();
    const after = await handle.stat();
    if (body.length !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ino !== before.ino || after.dev !== before.dev) throw new Error('N2A_MODULE_CHANGED');
    return body;
  } finally { await handle.close(); }
}
function moduleImports(name: string, body: Buffer): { staticImports: string[]; dynamicImports: string[] } {
  const text = new TextDecoder('utf-8', {fatal: true}).decode(body);
  const source = ts.createSourceFile(name, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const staticImports: string[] = [], dynamicImports: string[] = [];
  const visit = (node: ts.Node): void => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      if (!ts.isStringLiteral(node.moduleSpecifier)) throw new Error('N2A_MODULE_NONLITERAL_STATIC');
      staticImports.push(node.moduleSpecifier.text);
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const argument = node.arguments[0];
      if (node.arguments.length !== 1 || !argument || !ts.isStringLiteral(argument)) throw new Error(`N2A_MODULE_NONLITERAL_DYNAMIC ${name}`);
      dynamicImports.push(argument.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return {staticImports, dynamicImports};
}
function relativeImport(parent: string, specifier: string): string {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) throw new Error(`N2A_MODULE_EXTERNAL_IMPORT ${parent}`);
  if (!/^[A-Za-z0-9_./-]+\.mjs$/.test(specifier)) throw new Error('N2A_MODULE_IMPORT_PATH');
  const target = path.posix.normalize(path.posix.join(path.posix.dirname(parent), specifier));
  if (target.startsWith('../') || target.startsWith('/') || target === '..') throw new Error('N2A_MODULE_IMPORT_ESCAPE');
  return target;
}

test('N2A preflight measures the locked entry and flowchart closure against approved limits', async () => {
  const packageRoot = path.join(root, 'node_modules/mermaid');
  const pkg = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'));
  expect(pkg.version).toBe('11.17.2');
  const base = await realpath(path.join(packageRoot, 'dist'));
  expect((await lstat(path.join(packageRoot, 'dist'))).isSymbolicLink()).toBe(false);
  const catalog = new Map<string, Measurement>();
  const dynamics = new Set<string>();
  const queue = ['mermaid.esm.min.mjs'];
  async function drain(): Promise<void> {
    while (queue.length) {
      const name = queue.shift()!;
      if (catalog.has(name)) continue;
      if (catalog.size >= limits.rules) throw new Error('N2A_MODULE_RULE_LIMIT');
      const body = await readModule(base, name);
      catalog.set(name, {name, bytes: body.length, sha256: sha256(body)});
      const imports = moduleImports(name, body);
      for (const specifier of imports.staticImports) queue.push(relativeImport(name, specifier));
      for (const specifier of imports.dynamicImports) dynamics.add(relativeImport(name, specifier));
    }
  }
  await drain();
  const entryStaticModules = catalog.size;
  const flow = [...dynamics].filter(name => /(?:^|\/)flowDiagram-[A-Za-z0-9_-]+\.mjs$/.test(name));
  report('dynamic inventory', {entryStaticModules, candidates: [...dynamics].sort(), selectedFlow: flow});
  expect(flow, 'exactly one flowchart dynamic entry is required; no guessed family expansion').toHaveLength(1);
  queue.push(flow[0]);
  await drain();
  const rows = [...catalog.values()].sort((a,b) => a.name.localeCompare(b.name));
  for (let i = 0; i < rows.length; i += 16) report(`module page ${i / 16}`, rows.slice(i, i + 16));
  const fixtures = await measureFixtures();
  const technical = fixtures.find(row => row.name === 'technical')!;
  const moduleBytes = rows.reduce((sum, row) => sum + row.bytes, 0);
  const rules = rows.length + 2;
  const distinctBytes = moduleBytes + technical.bytes;
  const estimatedFulfilledBytes = moduleBytes + technical.bytes * 2;
  const capacity = {version: pkg.version, entryStaticModules, modules: rows.length, moduleBytes, maxModuleBytes: Math.max(...rows.map(row => row.bytes)), rules, distinctBytes, estimatedFulfilledBytes, limits, caveat: 'Static preflight only; actual browser imports, repeats, response phases, contexts and evidence remain unverified.'};
  report('capacity', capacity);
  expect(rules, 'N2A_RULE_LIMIT').toBeLessThanOrEqual(limits.rules);
  expect(distinctBytes, 'N2A_DISTINCT_LIMIT').toBeLessThanOrEqual(limits.distinct);
  expect(estimatedFulfilledBytes, 'N2A_FULFILLED_LIMIT').toBeLessThanOrEqual(limits.fulfilled);
  // The independent CI reporting stage publishes these complete measurements.
  // This sibling is outside N0/N1's strict record roots and survives cleanup.
  const evidence = {...loadManifest(), kind: 'n2a-preflight', html: fixtures, modules: rows, dynamic: {entryStaticModules, candidates: [...dynamics].sort(), selectedFlow: flow}, capacity};
  await writeFile(`${stageRoot()}-preflight.json`, JSON.stringify(evidence), {flag:'wx', mode:0o600});
}, 20000);

// AC-02: independent normal-report identity must agree with lifecycle/reporter
// ownership. Use complete runnable N1 data, then change only one dimension.
function ownershipFixture() {
  const manifest:Manifest={schema:SCHEMA,policy:POLICY,kind:'manifest',source:'a'.repeat(40),run:'17',attempt:'1'};
  const records:(Start|End)[]=[], entries:TestEntry[]=[], results:ResultEntry[]=[];
  type Spec={file:string;title:string;tests:{projectName:string;expectedStatus:string;status:string;annotations:{type:string;description:string}[];results:{status:string;retry:number;workerIndex:number}[]}[]};
  type Suite={file?:string;title?:string;specs:Spec[];suites?:Suite[]};
  const specs:Spec[]=[];
  for(const project of PROJECTS)for(const title of CASES){
    const id=randomUUID(),key=testKey(project,title),engine=engineFor(project);
    const start:Start={...manifest,kind:'start',id,identity:{stage:'render',project,engine,title,test:key,worker:1,retry:0,pid:10},expectedErrors:[]};
    records.push(start,{...start,kind:'end',setup:true,closed:true,outcome:'passed',errors:[],rules:[],requests:[],documents:[]});
    entries.push({key,project,engine,title});results.push({key,project,engine,title,status:'passed',expectedStatus:'passed',retry:0,worker:1,contexts:[id]});
    specs.push({file:'tests/render/network-isolation.spec.ts',title,tests:[{projectName:project,expectedStatus:'passed',status:'expected',annotations:[{type:'n1-context',description:id}],results:[{status:'passed',retry:0,workerIndex:1}]}]});
  }
  const start:Start={...manifest,kind:'start',id:randomUUID(),identity:{stage:'unit',project:'vitest-chromium',engine:'chromium',title:UNIT_CONSUMER,test:testKey('vitest-chromium',UNIT_CONSUMER),worker:0,retry:0,pid:11},expectedErrors:[]};
  records.push(start,{...start,kind:'end',setup:true,closed:true,outcome:'passed',errors:[],rules:[{id:'home',action:'fulfill',count:1,hits:1}],requests:[{seq:1,kind:'http',rule:'home',action:'fulfill',observed:true,handled:true}],documents:[]});
  const suites:Suite[]=[{specs}];
  return {manifest,records,discovery:{...manifest,kind:'discovery',tests:entries},results:{...manifest,kind:'results',status:'passed',errors:0,tests:results},browser:{stats:{unexpected:0,skipped:0,flaky:0},errors:[],suites},unit:{numFailedTests:0,numPendingTests:0,numPassedTests:299,testResults:[{name:'/fixture/tests/unit/browser-network.test.ts',assertionResults:[{fullName:UNIT_CONSUMER,status:'passed'}]}]}};
}
test('N2A ownership regression positive fixture is complete',()=>expect(validateSnapshot(ownershipFixture())).toEqual([]));
test('N2A normal report rejects a same-leaf file outside the approved owner',()=>{
  const s=ownershipFixture();s.browser.suites[0].specs[0].file='tests/render/foreign/network-isolation.spec.ts';
  expect(validateSnapshot(s),'N2A_FOREIGN_FILE_FALSE_GREEN').toContain('N1_BROWSER');
});
test('N2A normal report rejects a different describe ancestry for the same leaf',()=>{
  const s=ownershipFixture(),spec=s.browser.suites[0].specs.shift()!;
  s.browser.suites[0].suites=[{file:spec.file,title:'different owner',specs:[spec]}];
  expect(validateSnapshot(s),'N2A_ANCESTRY_FALSE_GREEN').toContain('N1_BROWSER');
});
test('N2A normal report rejects an independent worker mismatch',()=>{
  const s=ownershipFixture();s.browser.suites[0].specs[0].tests[0].results[0].workerIndex=7;
  expect(validateSnapshot(s),'N2A_WORKER_FALSE_GREEN').toContain('N1_BROWSER');
});
test('N2A normal report rejects a swapped context annotation',()=>{
  const s=ownershipFixture();s.browser.suites[0].specs[0].tests[0].annotations=s.browser.suites[0].specs[1].tests[0].annotations;
  expect(validateSnapshot(s),'N2A_CONTEXT_FALSE_GREEN').toContain('N1_BROWSER');
});
test('N2A unit evidence rejects a project and engine disagreement',()=>{
  const s=ownershipFixture();for(const record of s.records)if(record.identity.stage==='unit')record.identity.engine='firefox';
  expect(validateSnapshot(s),'N2A_UNIT_ENGINE_FALSE_GREEN').toContain('N1_RECORD_SCHEMA');
});
