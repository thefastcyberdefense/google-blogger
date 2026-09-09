import {safePostUrl} from './safe-dom.ts';
export type FeedPost={title:string;url:string};
export type DiscoveryPost=FeedPost&{identity:string;id?:string;labels:{key:string;text:string}[];published?:number};
export const labelKey=(value:string)=>value.normalize('NFKC').trim().replace(/\s+/gu,' ').toLowerCase();
export function postIdentity(value:unknown,base:string):string|null{
 if(typeof value!=='string'||!value.trim()||value.trim().startsWith('#'))return null;
 const safe=safePostUrl(value,base);if(!safe)return null;const url=new URL(safe);if(url.pathname==='/')return null;
 url.hash='';for(const key of [...url.searchParams.keys()])if(/^utm_/i.test(key)||['gclid','fbclid'].includes(key.toLowerCase())||key==='m'&&['0','1'].includes(url.searchParams.get(key)||''))url.searchParams.delete(key);
 const pairs=[...url.searchParams].sort(([a,b],[c,d])=>a<c?-1:a>c?1:b<d?-1:b>d?1:0);url.search='';for(const [key,value]of pairs)url.searchParams.append(key,value);return url.href;
}
export function postId(value:unknown):string|undefined{
 if(typeof value!=='string'||value.length>256)return;const raw=value.trim();return /^\d+$/.test(raw)?raw:raw.match(/^tag:blogger\.com,1999:blog-\d+\.post-(\d+)$/)?.[1];
}
export function parseDiscovery(data:unknown,base:string,limit=50):DiscoveryPost[]{
 if(!data||typeof data!=='object'||!('feed'in data)||!data.feed||typeof data.feed!=='object')throw new Error('Invalid feed structure');
 const entries=(data.feed as {entry?:unknown}).entry;if(entries===undefined)return [];if(!Array.isArray(entries))throw new Error('Invalid feed entries');
 const result:DiscoveryPost[]=[];const seen=new Set<string>();const ids=new Set<string>();
 for(const value of entries.slice(0,Math.min(50,Math.max(0,limit)))){
  if(!value||typeof value!=='object')continue;
  const e=value as {title?:{$t?:unknown};id?:{$t?:unknown};link?:{rel?:unknown;href?:unknown}[];category?:{term?:unknown}[];published?:{$t?:unknown}};
  const title=e.title?.$t;const link=Array.isArray(e.link)?e.link.find(x=>x?.rel==='alternate')?.href:undefined;
  const identity=postIdentity(link,base);const url=safePostUrl(link,base);const id=postId(e.id?.$t);
  if(typeof title!=='string'||!title.trim()||!identity||!url||seen.has(identity)||id&&ids.has(id))continue;
  const labels:DiscoveryPost['labels']=[];const keys=new Set<string>();
  for(const item of (Array.isArray(e.category)?e.category:[]).slice(0,20))if(typeof item?.term==='string'){
   const text=item.term.trim().replace(/\s+/gu,' ').slice(0,100);const key=labelKey(text);if(key&&!keys.has(key)){keys.add(key);labels.push({key,text});}
  }
  const date=e.published?.$t;let published:number|undefined;
  if(typeof date==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(date)){
   const n=Date.parse(date);const day=date.slice(0,10);if(Number.isFinite(n)&&new Date(day+'T00:00:00Z').toISOString().slice(0,10)===day)published=n;
  }
  seen.add(identity);if(id)ids.add(id);result.push({title:title.trim().slice(0,300),url,identity,id,labels,published});
 }
 return result;
}
// Preserve the established five-item public parser contract for existing consumers/tests.
export function parseFeed(data:unknown,base:string):FeedPost[]{try{return parseDiscovery(data,base,20).slice(0,5).map(({title,url})=>({title,url}));}catch{return [];}}
export function renderRecentPosts(list:HTMLOListElement,status:HTMLElement,posts:DiscoveryPost[]){
 const fragment=document.createDocumentFragment();for(const post of posts.slice(0,5)){const li=document.createElement('li');const a=document.createElement('a');a.href=post.url;a.textContent=post.title;li.append(a);fragment.append(li);}list.replaceChildren(fragment);status.textContent=posts.length?'Newest publications':'No recent posts available. Browse the publication below.';
}
