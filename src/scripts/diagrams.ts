import {loadMermaid} from './enhancement-loader.ts';
export function prepareDiagram(raw:string,legacy=false):string{
 if(!raw.trim()||raw.length>20000)throw new Error('Diagram source is empty or exceeds 20,000 characters');
 let source=raw.trim();
 if(legacy){source=source.replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&');source=source.replace(/^sequenceDiagram\s*\n(?=flowchart\b|graph\b)/,'');}
 if(/^---/m.test(source)||/%%\s*\{/.test(source))throw new Error('Post-supplied Mermaid configuration is disabled');
 if(!/^\s*accTitle\s*:\s*\S.+$/m.test(source)||!/^\s*accDescr\s*:\s*\S.+$/m.test(source))throw new Error('Provide accTitle and a single-line accDescr');
 if(!/^\s*(flowchart|graph|sequenceDiagram|timeline|stateDiagram-v2|classDiagram|erDiagram|architecture-beta)\b/.test(source))throw new Error('Unsupported diagram type for this publication');
 return source;
}
export function diagramConfig(theme:string):Record<string,unknown>{return {startOnLoad:false,securityLevel:'strict',theme:theme==='dark'?'dark':'default',htmlLabels:false,maxTextSize:20000,maxEdges:200,flowchart:{htmlLabels:false},secure:['securityLevel','startOnLoad','maxTextSize','maxEdges','htmlLabels','themeCSS','fontFamily','altFontFamily','themeVariables','flowchart']};}
type State={source:string;legacy:boolean;figure:HTMLElement;output:HTMLElement;status:HTMLElement;retry:HTMLButtonElement;controls:HTMLButtonElement[];revision:number;queued:boolean;scale:number;};
const states=new WeakMap<HTMLPreElement,State>();
const active=new Set<State>();let serial=Promise.resolve();let counter=0;let listening=false;
const effectiveTheme=()=>document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
function installSvg(output:HTMLElement,markup:string){
 const doc=new DOMParser().parseFromString(markup,'image/svg+xml');const svg=doc.documentElement;
 if(svg.localName!=='svg'||doc.querySelector('parsererror'))throw new Error('Invalid diagram output');
 if(doc.querySelector('script,foreignObject,iframe,object,embed,image'))throw new Error('Unsupported active diagram content');
 for(const el of Array.from(svg.querySelectorAll('*')).concat([svg]))for(const attr of Array.from(el.attributes)){
  if(/^on/i.test(attr.name))throw new Error('Active event in diagram');
  if(['href','xlink:href'].includes(attr.name)&&!attr.value.startsWith('#'))el.removeAttribute(attr.name);
 }
 if(Array.from(doc.querySelectorAll('style')).some(s=>/@import|@font-face|url\(\s*['"]?(?:https?:|\/\/|data:)/i.test(s.textContent||'')))throw new Error('External diagram styling is disabled');
 output.replaceChildren(document.importNode(svg,true));
}
function schedule(state:State,retry=false){
 if(!state.figure.isConnected){active.delete(state);return;}
 state.revision++;if(state.queued)return;
 state.queued=true;state.figure.dataset.state='rendering';state.figure.setAttribute('aria-busy','true');state.status.textContent='Rendering diagram…';state.retry.disabled=true;state.controls.forEach(b=>b.disabled=true);
 serial=serial.then(async()=>{
  try{
   const source=prepareDiagram(state.source,state.legacy);const api=await loadMermaid(retry);
   let seen=-1;
   do{
    if(!state.figure.isConnected){active.delete(state);return;}
    seen=state.revision;const theme=effectiveTheme();api.initialize(diagramConfig(theme));
    await api.parse(source);const {svg}=await api.render(`fcd-diagram-${++counter}`,source);
    if(seen!==state.revision)continue;
    installSvg(state.output,svg);state.output.hidden=false;state.figure.dataset.state='rendered';state.figure.dataset.renderedTheme=theme;state.scale=1;state.output.style.width='100%';
    state.controls.forEach(b=>b.disabled=false);state.status.textContent='Diagram ready. Original source is available below.';
   }while(seen!==state.revision);
  }catch(error){state.figure.dataset.state='error';state.output.hidden=true;state.controls.forEach(b=>b.disabled=true);state.status.textContent=error instanceof Error?error.message:'Diagram unavailable; original source remains available';}
  finally{state.queued=false;state.figure.setAttribute('aria-busy','false');state.retry.disabled=false;state.retry.textContent='Render again';}
 }).catch(()=>{state.queued=false;state.figure.dataset.state='error';state.figure.setAttribute('aria-busy','false');state.retry.disabled=false;state.status.textContent='Diagram unavailable; use its source.';});
}
export function initDiagrams(root:ParentNode=document){
 for(const state of active)if(!state.figure.isConnected)active.delete(state);
 const blocks=new Set<HTMLPreElement>();
 root.querySelectorAll<HTMLPreElement>('#article-body pre.mermaid').forEach(pre=>blocks.add(pre));
 root.querySelectorAll<HTMLElement>('#article-body pre > code.language-mermaid').forEach(code=>blocks.add(code.parentElement as HTMLPreElement));
 blocks.forEach(pre=>{
  if(states.has(pre))return;
  const source=pre.querySelector('code')?.textContent||pre.textContent||'';
  const title=source.match(/^\s*accTitle\s*:\s*(.+)$/m)?.[1]||'Technical diagram';
  pre.tabIndex=0;pre.setAttribute('role','region');pre.setAttribute('aria-label',`${title}: original diagram source`);
  const figure=document.createElement('figure');figure.className='fcd-diagram';figure.dataset.state='source';
  const caption=document.createElement('figcaption');caption.textContent=title;
  const toolbar=document.createElement('div');toolbar.className='diagram-controls';toolbar.setAttribute('aria-label','Diagram controls');
  const viewport=document.createElement('div');viewport.className='diagram-viewport';viewport.tabIndex=0;viewport.setAttribute('role','region');viewport.setAttribute('aria-label',`${title}: scrollable diagram`);
  const output=document.createElement('div');output.className='diagram-output';output.hidden=true;viewport.append(output);
  const status=document.createElement('p');status.className='diagram-status';status.setAttribute('role','status');
  const details=document.createElement('details');details.className='diagram-source';details.open=true;const summary=document.createElement('summary');summary.textContent='Original diagram source';details.append(summary);
  const retry=document.createElement('button');retry.type='button';retry.textContent='Render diagram';
  const controls=['Zoom out','Reset zoom','Zoom in'].map(name=>{const b=document.createElement('button');b.type='button';b.textContent=name;b.disabled=true;toolbar.append(b);return b;});toolbar.append(retry);
  const state:State={source,legacy:pre.dataset.legacyMermaid==='true',figure,output,status,retry,controls,revision:0,queued:false,scale:1};states.set(pre,state);active.add(state);
  controls.forEach((button,i)=>button.addEventListener('click',()=>{state.scale=i===1?1:Math.min(2.5,Math.max(1,state.scale+(i===0?-.25:.25)));output.style.width=`${state.scale*100}%`;status.textContent=`Diagram zoom ${Math.round(state.scale*100)}%`;}));
  retry.addEventListener('click',()=>schedule(state,true));pre.before(figure);details.append(pre);figure.append(caption,toolbar,viewport,status,details);
  if(active.size<=10)schedule(state);else status.textContent='Automatic diagram limit reached. Use Render diagram to opt in.';
 });
 if(blocks.size&&!listening){listening=true;document.addEventListener('fcd:theme-change',()=>{for(const state of active){if(!state.figure.isConnected){active.delete(state);continue;}if(state.figure.dataset.state==='rendered'||state.queued)schedule(state);}});}
}
