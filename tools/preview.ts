import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { assets, pug, root } from './generate.ts';
const compiled = await assets();
const views = ['home','article','paged','empty','error'];
await mkdir(path.join(root, '.preview'), { recursive: true });
for (const view of views) {
  const template = view === 'article' ? 'article' : 'home';
  const html = pug.renderFile(path.join(root, `fixtures/${template}.pug`), { ...compiled, fixtureView:view, pretty:true });
  await writeFile(path.join(root, `.preview/${view}.html`), html);
}
if (!process.argv.includes('--build-only')) createServer(async (req,res) => {
  try { const pathname = new URL(req.url || '/', 'http://127.0.0.1:4173').pathname.slice(1); const view = views.includes(pathname) ? pathname : 'home'; res.setHeader('content-type','text/html; charset=utf-8'); res.end(await readFile(path.join(root, `.preview/${view}.html`))); }
  catch { res.writeHead(500); res.end('Preview unavailable'); }
}).listen(4173,'127.0.0.1',()=>console.log('Shared-presentation simulation: http://127.0.0.1:4173. Native wrappers are modeled, not verified Blogger output.'));
