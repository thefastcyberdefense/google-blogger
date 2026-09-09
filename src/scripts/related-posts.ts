import {labelKey,type DiscoveryPost} from './feed.ts';
export type Candidate=DiscoveryPost;
export type CurrentPost={identity:string;id?:string;labels:string[]};
export function withoutCurrent(posts:Candidate[],current:CurrentPost):Candidate[]{
 const seen=new Set<string>();const ids=new Set<string>();return posts.filter(p=>{
  if(p.identity===current.identity||current.id&&p.id===current.id||seen.has(p.identity)||p.id&&ids.has(p.id))return false;
  seen.add(p.identity);if(p.id)ids.add(p.id);return true;
 });
}
export function rankRelated(posts:Candidate[],current:CurrentPost):{kind:'related'|'latest';posts:Candidate[]}{
 const keys=new Set(current.labels.map(labelKey));const candidates=withoutCurrent(posts,current);
 const score=(p:Candidate)=>new Set(p.labels.map(x=>labelKey(x.key)).filter(x=>keys.has(x))).size;
 const matches=candidates.filter(p=>score(p)>0);const kind=matches.length?'related':'latest';
 const selected=matches.length?matches:candidates;
 selected.sort((a,b)=>(kind==='related'?score(b)-score(a):0)||((b.published??-Infinity)-(a.published??-Infinity)||0)||(a.identity<b.identity?-1:a.identity>b.identity?1:0));
 return {kind,posts:selected.slice(0,3)};
}
export function renderRelated(shell:HTMLElement,posts:Candidate[],current:CurrentPost){
 const heading=shell.querySelector<HTMLElement>('[data-related-heading]');const list=shell.querySelector<HTMLOListElement>('[data-related-list]');const status=shell.querySelector<HTMLElement>('[data-related-status]');if(!heading||!list||!status)throw new Error('Incomplete related shell');
 const result=rankRelated(posts,current);heading.textContent=result.kind==='related'?'Related articles':'Latest articles';
 const fragment=document.createDocumentFragment();for(const post of result.posts){
  const li=document.createElement('li');const a=document.createElement('a');a.href=post.url;a.textContent=post.title;li.append(a);
  const label=post.labels.find(x=>current.labels.map(labelKey).includes(x.key))||post.labels[0];if(label){const topic=document.createElement('span');topic.className='related-topic';topic.textContent=label.text;li.append(topic);}
  if(post.published!==undefined){const time=document.createElement('time');time.dateTime=new Date(post.published).toISOString();time.textContent=time.dateTime.slice(0,10);li.append(time);}fragment.append(li);
 }
 list.replaceChildren(fragment);status.textContent=result.posts.length?'Selected from recent publications.':'No suggestions available. Browse the publication or its topics.';
}
