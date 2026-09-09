import { announce } from './safe-dom.ts';
const enhanced=new WeakSet<Element>();
export function initTechnicalContent() {
 const body=document.getElementById('article-body');if(!body)return;
 body.querySelectorAll<HTMLPreElement>('pre').forEach(pre=>{
  if(enhanced.has(pre)||pre.classList.contains('mermaid')||pre.querySelector('code.language-mermaid'))return;
  enhanced.add(pre);pre.tabIndex=0;pre.setAttribute('aria-label','Scrollable code block');
  const code=pre.querySelector('code')||pre;const text=code.textContent||'';
  const language=Array.from(code.classList).find(c=>c.startsWith('language-'))?.slice(9)||'Code';
  const bar=document.createElement('div');bar.className='code-toolbar';const label=document.createElement('span');label.textContent=language;
  const copy=document.createElement('button');copy.type='button';copy.textContent='Copy';copy.setAttribute('aria-label',`Copy ${language} code`);
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(text);announce('Code copied');}catch{announce('Copy unavailable. Select the code and copy it manually.');}});
  bar.append(label,copy);pre.before(bar);
 });
 body.querySelectorAll('table').forEach((table,i)=>{if(table.parentElement?.classList.contains('table-scroll'))return;const wrap=document.createElement('div');wrap.className='table-scroll';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',table.caption?.textContent||`Scrollable table ${i+1}`);table.before(wrap);wrap.append(table);});
}
