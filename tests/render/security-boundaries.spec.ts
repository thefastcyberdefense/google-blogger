import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const origin='https://blogs.fastcyberdefense.com';
const title='<img src="/injected-boundary" onerror="alert(1)"> &amp; "quoted"';
const label='<svg onload="alert(2)"> &lt;literal&gt;';
const rejected=[
 'javascript:alert(3)',
 'data:text/html,<script>alert(4)</script>',
 'https://evil.example/post',
 '//evil.example/post',
 'https://user:pass@blogs.fastcyberdefense.com/post',
 '/bad'+String.fromCharCode(10)+'path'
];
const accepted=[origin+'/safe-boundary?text=%22%3Csvg%3E',origin+'/safe-second'];
const entry=(url:string,text=title)=>({title:{$t:text},link:[{rel:'alternate',href:url}],category:[{term:label}]});
// Existing project selection runs this suite in all 22 Chromium viewport/theme projects.
// Firefox/WebKit keep their existing acceptance suite; no new engine coverage is claimed here.
for(const view of ['home','article'])test(`${view}: hostile feed values remain inert and only safe links survive`,async({page},info)=>{
 const html=await readFile(`.preview/${view}.html`,'utf8');
 const feeds:string[]=[];const injectedRequests:string[]=[];const dialogs:string[]=[];
 let onlyRejected=false;
 page.on('dialog',dialog=>{dialogs.push(dialog.message());void dialog.dismiss();});
 await page.route('**/*',async route=>{
  const request=route.request();const url=new URL(request.url());
  if(url.origin!==origin||url.pathname==='/injected-boundary'){
   if(url.origin==='https://evil.example'||url.pathname==='/injected-boundary')injectedRequests.push(request.url());
   return route.abort();
  }
  if(url.pathname.startsWith('/feeds/')){
   feeds.push(request.url());
   const unsafe=rejected.map((url,i)=>entry(url,`Rejected ${i}`));
   const entries=onlyRejected?unsafe:[...unsafe,...accepted.map(url=>entry(url))];
   return route.fulfill({contentType:'application/json',body:JSON.stringify({feed:{entry:entries}})});
  }
  return route.fulfill({contentType:'text/html',body:html});
 });
 await page.goto('/'+view);
 await expect(page.locator('#recent-posts a')).toHaveCount(2);
 const recent=page.locator('#recent-posts');
 expect(await recent.locator('a').allTextContents()).toEqual([title,title]);
 expect(await recent.locator('a').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')))).toEqual(accepted);
 const containers=view==='article'?'#recent-posts,[data-related-list]':'#recent-posts';
 if(view==='article'){
  await expect(page.locator('[data-related-list] a')).toHaveCount(2);
  expect(await page.locator('[data-related-list] a').allTextContents()).toEqual([title,title]);
  expect(await page.locator('[data-related-list] a').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')).sort())).toEqual([...accepted].sort());
  expect(await page.locator('.related-topic').allTextContents()).toEqual([label,label]);
  await expect(page.locator('.related-fallback')).toBeVisible();
 }
 expect(await page.locator(containers).evaluateAll(nodes=>nodes.every(node=>Array.from(node.querySelectorAll('*')).every(el=>
  !['IMG','SVG','SCRIPT','IFRAME','OBJECT','EMBED'].includes(el.tagName)&&Array.from(el.attributes).every(attr=>!/^on/i.test(attr.name))
 )))).toBe(true);
 expect(feeds).toHaveLength(1);
 expect(new URL(feeds[0]).searchParams.get('max-results')).toBe(view==='article'?'50':'8');
 expect(dialogs).toEqual([]);expect(injectedRequests).toEqual([]);
 // Exercise a real link, not just its stored href. The route remains synthetic.
 await recent.locator('a').last().focus();await page.keyboard.press('Enter');await expect(page).toHaveURL(accepted[1]);
 // A fresh document with no acceptable entries must not keep links from the mixed feed.
 onlyRejected=true;const previous=feeds.length;
 await page.goto('/'+view);
 await expect(page.locator('#recent-status')).toContainText('No recent posts available');
 await expect(recent.locator('a')).toHaveCount(0);
 if(view==='article'){
  await expect(page.locator('[data-related-list] a')).toHaveCount(0);
  await expect(page.locator('[data-related-status]')).toContainText('No suggestions available');
  await expect(page.locator('.related-fallback')).toBeVisible();
 }
 expect(feeds.length-previous).toBe(1);
 expect(dialogs).toEqual([]);expect(injectedRequests).toEqual([]);
 await info.attach('feed-boundary-evidence',{body:JSON.stringify({view,project:info.project.name,accepted,rejected,feeds,dialogs,injectedRequests,scope:'intercepted responses with production-compiled script; not native Blogger validation'},null,2),contentType:'application/json'});
});
