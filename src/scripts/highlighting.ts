export interface PrismAPI {languages:Record<string,unknown>;highlight(source:string,grammar:unknown,language:string):string;}
const aliases:Record<string,string>={bash:'bash',sh:'bash',shell:'bash',powershell:'powershell',ps1:'powershell',python:'python',py:'python',javascript:'javascript',js:'javascript',typescript:'typescript',ts:'typescript',sql:'sql',json:'json',yaml:'yaml',yml:'yaml',docker:'docker',dockerfile:'docker',http:'http',xml:'markup',html:'markup',markup:'markup'};
export function languageName(value:string):string|null{return Object.hasOwn(aliases,value.toLowerCase())?aliases[value.toLowerCase()]:null;}
const done=new WeakSet<Element>();
export function initHighlighting(root:ParentNode=document){
 const prism=(globalThis as typeof globalThis & {Prism?:PrismAPI}).Prism;
 if(!prism)return;
 root.querySelectorAll<HTMLElement>('#article-body pre code').forEach(code=>{
  if(done.has(code)||code.closest('pre.mermaid')||code.classList.contains('language-mermaid'))return;
  const declared=Array.from(code.classList).concat(Array.from(code.parentElement?.classList||[])).find(x=>/^(language|lang)-/.test(x))?.replace(/^(language|lang)-/,'')||'';
  const language=languageName(declared);const source=code.textContent||'';
  if(!language||source.length>50000||!prism.languages[language])return;
  try {
   // Only output of our bundled exact Prism grammar, never feed HTML or author markup.
   const parsed=new DOMParser().parseFromString(prism.highlight(source,prism.languages[language],language),'text/html');
   const safe=Array.from(parsed.body.querySelectorAll('*')).every(el=>el.tagName==='SPAN'&&Array.from(el.attributes).every(a=>a.name==='class'));
   if(!safe||parsed.body.textContent!==source)return;
   code.replaceChildren(...Array.from(parsed.body.childNodes));done.add(code);code.dataset.highlighted='true';
  }catch{/* Plain code and copy remain usable. */}
 });
}
