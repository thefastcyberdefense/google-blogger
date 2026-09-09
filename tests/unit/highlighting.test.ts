import {expect,it} from 'vitest';
import {languageName} from '../../src/scripts/highlighting.ts';
import {build} from 'esbuild';
import {chromium} from 'playwright-core';
import path from 'node:path';
it.each([['sh','bash'],['ps1','powershell'],['py','python'],['js','javascript'],['ts','typescript'],['yml','yaml'],['dockerfile','docker'],['xml','markup']])('maps %s safely',(a,b)=>expect(languageName(a)).toBe(b));
it('unknown language stays plain instead of loading arbitrary code',()=>expect(languageName('https://evil.example/a.js')).toBeNull());
it('repeated initialization does not duplicate code or diagram controls',async()=>{
 // Standalone test bundle imports the same implementation functions once; no test globals enter the production bundle.
 const result=await build({stdin:{contents:"import {initTechnicalContent} from './src/scripts/technical-content.ts'; import {initDiagrams} from './src/scripts/diagrams.ts'; initTechnicalContent(); initTechnicalContent(); initDiagrams(); initDiagrams();",resolveDir:path.resolve('.')},bundle:true,write:false,format:'iife',platform:'browser'});
 const browser=await chromium.launch();try{
  const page=await browser.newPage();await page.route('**/*',r=>r.abort());
  await page.setContent('<main><div id="article-body"><pre><code class="language-bash">echo &quot;hello&quot;</code></pre><pre class="mermaid">flowchart TD\naccTitle: Test diagram\naccDescr: Test source remains available\nA-->B</pre></div></main>');
  await page.addScriptTag({content:result.outputFiles[0].text});
  expect(await page.locator('.code-toolbar').count()).toBe(1);expect(await page.locator('.fcd-diagram').count()).toBe(1);expect(await page.locator('.diagram-controls').count()).toBe(1);
  expect(await page.locator('.diagram-source pre').textContent()).toContain('A-->B');
 }finally{await browser.close();}
},25000);
