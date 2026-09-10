export type MetadataInput={html:string;view:string;url:string;expectedCanonical?:string};
/** Browser-only pure parsed-output inspection. No network/context loading or source-script execution.
 * Native rendering/visibility checks remain separate. expectedCanonical comes from owner configuration, never returned HTML. */
export function validateMetadata(input:MetadataInput):string[]{
 const errors:string[]=[];const fail=(message:string)=>{errors.push(message);};
 if(!['home','article','label','search','archive','static','error','paged'].includes(input.view))return ['Unsupported view'];
 if(new TextEncoder().encode(input.html).byteLength>2000000)return ['Metadata HTML exceeds budget'];
 let base:URL;try{base=new URL(input.url);if(base.protocol!=='https:'||base.username||base.password)throw new Error();}catch{return ['Invalid page URL'];}
 const doc=new DOMParser().parseFromString(input.html,'text/html');const text=(value:unknown)=>typeof value==='string'?value.replace(/\s+/g,' ').trim():'';
 const safeURL=(value:unknown,sameOrigin=false)=>{if(typeof value!=='string'||!value.trim()||Array.from(value).some(c=>c.charCodeAt(0)<=31||c.charCodeAt(0)===127))return null;try{const url=new URL(value,base);return url.protocol==='https:'&&!url.username&&!url.password&&(!sameOrigin||url.origin===base.origin)?url:null;}catch{return null;}};
 // Compare only documented aliases; preserve path case, unknown parameters and duplicate meaningful values.
 const identity=(url:URL)=>{const copy=new URL(url.href);copy.hash='';const pairs=[...copy.searchParams].filter(([key,value])=>!(/^utm_/i.test(key)||['gclid','fbclid'].includes(key.toLowerCase())||key==='m'&&(value==='0'||value==='1'))).sort(([a,b],[c,d])=>a<c?-1:a>c?1:b<d?-1:b>d?1:0);copy.search='';for(const [key,value]of pairs)copy.searchParams.append(key,value);return copy.href;};
 const expected=safeURL(input.expectedCanonical===undefined?input.url:input.expectedCanonical,true);
 if(!expected||input.expectedCanonical!==undefined&&expected.hash)return ['Invalid expected canonical'];
 const expectedIdentity=identity(expected);
 const titles=doc.querySelectorAll('head title');if(titles.length!==1||!text(titles[0]?.textContent))fail('One nonempty title required');
 const canonicalNodes=doc.querySelectorAll('head link[rel~="canonical"]');
 const canonical=canonicalNodes.length===1?safeURL(canonicalNodes[0].getAttribute('href'),true):null;
 if(input.view!=='error'&&!canonical||canonicalNodes.length>1||canonicalNodes.length===1&&!canonical)fail('Invalid unique same-origin canonical');
 if(canonical?.hash)fail('Canonical must not contain fragment');
 if(canonical&&identity(canonical)!==expectedIdentity)fail('Canonical disagrees with independently expected page');
 const meta=(selector:string,required=false)=>{const nodes=doc.querySelectorAll(selector);if(nodes.length>1||required&&nodes.length!==1)fail('Invalid metadata multiplicity: '+selector);const value=nodes[0]?.getAttribute('content');if(nodes.length&&!text(value))fail('Empty metadata: '+selector);return value;};
 for(const selector of ['meta[name="description"]','meta[property="og:title"]','meta[property="og:description"]','meta[property="og:site_name"]','meta[name="twitter:title"]','meta[name="twitter:description"]'])meta('head '+selector);
 const kind=meta('head meta[property="og:type"]',true);if(kind!==(input.view==='article'?'article':'website'))fail('OpenGraph type disagrees with view');
 const card=meta('head meta[name="twitter:card"]',true);if(card&&!['summary','summary_large_image'].includes(card))fail('Invalid social card type');
 for(const selector of ['head meta[property="og:image"]','head meta[name="twitter:image"]']){const value=meta(selector);if(value&&!safeURL(value))fail('Invalid social image URL');}
 const ogURL=meta('head meta[property="og:url"]');if(ogURL){const value=safeURL(ogURL,true);if(!value||identity(value)!==expectedIdentity||canonical&&identity(value)!==identity(canonical))fail('OpenGraph URL disagrees with expected canonical');}
 const date=(value:unknown)=>{if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value)))return false;try{return new Date(value.slice(0,10)+'T00:00:00Z').toISOString().slice(0,10)===value.slice(0,10);}catch{return false;}};
 const publishedMeta=meta('head meta[property="article:published_time"]');if(publishedMeta&&(input.view!=='article'||!date(publishedMeta)))fail('Invalid article publication metadata');
 const scripts=Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));if(scripts.length>20)return [...errors,'Too many structured-data scripts'];
 // Supported context contract: Schema.org URL or a sole @vocab mapping. No remote resolution, aliases, arrays or term remapping.
 const schemaContext=(value:unknown):boolean=>{
  const schemaURL=(v:unknown)=>typeof v==='string'&&/^https?:\/\/schema\.org\/?$/.test(v);
  if(schemaURL(value))return true;
  return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===1&&schemaURL((value as Record<string,unknown>)['@vocab']);
 };
 const objects:Record<string,unknown>[]=[];let visited=0;let exhausted=false;
 const visit=(value:unknown,depth=0,inherited=false)=>{
  if(exhausted)return;
  if(depth>10||visited>=100){exhausted=true;fail('Structured-data graph exceeds budget');return;}visited++;
  if(Array.isArray(value)){for(const item of value){if(exhausted)break;visit(item,depth+1,inherited);}return;}
  if(!value||typeof value!=='object'){fail('Structured data must be an object or graph');return;}
  const item=value as Record<string,unknown>;
  const supported=Object.prototype.hasOwnProperty.call(item,'@context')?schemaContext(item['@context']):inherited;
  if(!supported){fail('Missing or unsupported Schema.org context');return;}
  // Nested author/image context overrides must not silently reinterpret checked properties.
  for(const property of ['author','image','mainEntityOfPage'])for(const child of [item[property]].flat())if(child&&typeof child==='object'&&Object.prototype.hasOwnProperty.call(child,'@context')&&!schemaContext((child as Record<string,unknown>)['@context']))fail('Unsupported nested Schema.org context');
  objects.push(item);if(item['@graph']!==undefined)visit(item['@graph'],depth+1,supported);
 };
 for(const script of scripts){if(exhausted)break;try{visit(JSON.parse(script.textContent||''));}catch{fail('Malformed JSON-LD');}}
 const articles=objects.filter(o=>[o['@type']].flat().some(t=>['Article','NewsArticle','BlogPosting','https://schema.org/Article','https://schema.org/NewsArticle','https://schema.org/BlogPosting','http://schema.org/Article','http://schema.org/NewsArticle','http://schema.org/BlogPosting'].includes(String(t))));
 if(input.view==='article'&&articles.length!==1)fail('Article view requires one article schema');
 if(input.view!=='article'&&articles.length)fail('Article schema on non-post view');
 for(const article of articles){
  const heading=doc.querySelector('main#content article.article-view h1.post-title')||doc.querySelector('main#content h1');
  if(!text(article.headline)||text(article.headline)!==text(heading?.textContent))fail('Article headline disagrees with content');
  const entity=article.mainEntityOfPage;const entityURL=safeURL(typeof entity==='object'&&entity? (entity as Record<string,unknown>)['@id']:entity,true);
  if(!entityURL||!canonical||identity(entityURL)!==expectedIdentity||identity(entityURL)!==identity(canonical))fail('Article identity disagrees with expected canonical');
  for(const key of ['datePublished','dateModified'])if(article[key]!==undefined&&!date(article[key]))fail('Invalid '+key);
  if(date(article.datePublished)&&date(article.dateModified)&&Date.parse(String(article.dateModified))<Date.parse(String(article.datePublished)))fail('Modification precedes publication');
  if(publishedMeta&&article.datePublished&&Date.parse(publishedMeta)!==Date.parse(String(article.datePublished)))fail('Publication dates disagree');
  if(article.author!==undefined){const authors=Array.isArray(article.author)?article.author:[article.author];if(!authors.length)fail('Empty authors');for(const author of authors){if(!author||typeof author!=='object'){fail('Invalid author');continue;}const a=author as Record<string,unknown>;if(!['Person','Organization'].includes(String(a['@type']))||!text(a.name))fail('Invalid author');if(a.url!==undefined&&!safeURL(a.url))fail('Invalid author URL');}}
  if(article.image!==undefined){const images=Array.isArray(article.image)?article.image:[article.image];if(!images.length)fail('Empty article images');for(const image of images){const value=image&&typeof image==='object'?(image as Record<string,unknown>).url:image;if(!safeURL(value))fail('Invalid article image');}}
 }
 return [...new Set(errors)];
}
