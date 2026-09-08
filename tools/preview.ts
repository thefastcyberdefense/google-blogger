import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { assets, pug, root } from './generate.ts';
const compiled = await assets();
await mkdir(path.join(root, '.preview'), { recursive: true });
for (const page of ['home', 'article']) {
  const html = pug.renderFile(path.join(root, `fixtures/${page}.pug`), { ...compiled, pretty: true });
  await writeFile(path.join(root, `.preview/${page}.html`), html);
}
if (!process.argv.includes('--build-only')) createServer(async (req, res) => { try { const page = req.url === '/article' ? 'article' : 'home'; res.setHeader('content-type', 'text/html; charset=utf-8'); res.end(await readFile(path.join(root, `.preview/${page}.html`))); } catch { res.writeHead(500); res.end('Preview unavailable'); } }).listen(4173, '127.0.0.1', () => console.log('Simulation preview: http://127.0.0.1:4173. Not Blogger-rendered HTML.'));
