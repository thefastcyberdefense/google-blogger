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
const data=JSON.parse(await readFile(path.join(root,'fixtures/editorial-content.json'),'utf8')) as {counts:number[];titles:string[];wrappers:string[];views:string[]};
const specimenImage='data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22800%22%20height=%22450%22%3E%3Crect%20width=%22800%22%20height=%22450%22%20fill=%22%23175f9e%22/%3E%3C/svg%3E';
for(const wrapper of data.wrappers)for(const count of data.counts){
 const name=`editorial-${wrapper}-${count}`;views.push(name);
 const fixturePosts=data.titles.slice(0,count).map((title,i)=>({title,url:`/2026/09/editorial-${i}.html`,author:i%2?'':'Fixture author',date:'2026-09-09',dateLabel:'September 9, 2026',labels:[{name:'Research',url:'/search/label/Research'}],excerpt:'Synthetic publication specimen.',image:i%2?null:specimenImage}));
 await writeFile(path.join(root,`.preview/${name}.html`),pug.renderFile(path.join(root,'fixtures/home.pug'),{...compiled,fixtureView:'home',fixtureWrapper:wrapper,fixturePosts,pretty:true}));
}
for(const view of ['label','search','archive']){views.push(view);await writeFile(path.join(root,`.preview/${view}.html`),pug.renderFile(path.join(root,'fixtures/home.pug'),{...compiled,fixtureView:view,pretty:true}));}
if (!process.argv.includes('--build-only')) createServer(async (req,res) => {
  try { const pathname = new URL(req.url || '/', 'http://127.0.0.1:4173').pathname.slice(1); const view = views.includes(pathname) ? pathname : 'home'; res.setHeader('content-type','text/html; charset=utf-8'); res.end(await readFile(path.join(root, `.preview/${view}.html`))); }
  catch { res.writeHead(500); res.end('Preview unavailable'); }
}).listen(4173,'127.0.0.1',()=>console.log('Shared-presentation simulation: http://127.0.0.1:4173. Native wrappers are modeled, not verified Blogger output.'));
