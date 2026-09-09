import {initTheme} from './theme.ts';
import {initNavigation} from './navigation.ts';
import {initSearch} from './search.ts';
import {postIdentity,postId,renderRecentPosts} from './feed.ts';
import {createFeedClient} from './feed-client.ts';
import {renderRelated,withoutCurrent,type CurrentPost} from './related-posts.ts';
import {initArticle} from './article.ts';
import {initTechnicalContent} from './technical-content.ts';
import {initHighlighting} from './highlighting.ts';
import {initDiagrams} from './diagrams.ts';
let discoveryStarted=false;
export function initDiscovery(){
 if(discoveryStarted)return;discoveryStarted=true;
 const list=document.querySelector<HTMLOListElement>('#recent-posts');const recentStatus=document.getElementById('recent-status');
 const shell=document.querySelector<HTMLElement>('[data-related-post]');const identity=postIdentity(shell?.dataset.postUrl,location.href);
 const current:CurrentPost|undefined=shell&&identity?{identity,id:postId(shell.dataset.postId),labels:Array.from(shell.querySelectorAll<HTMLElement>('[data-current-label]'),el=>el.dataset.currentLabel||'').slice(0,20)}:undefined;
 const relatedStatus=current?shell?.querySelector<HTMLElement>('[data-related-status]'):null;
 const consumers:{root:HTMLElement;status:HTMLElement;render:(posts:import('./feed.ts').DiscoveryPost[])=>void;button?:HTMLButtonElement}[]=[];
 if(list&&recentStatus)consumers.push({root:list.parentElement||list,status:recentStatus,render:posts=>renderRecentPosts(list,recentStatus,current?withoutCurrent(posts,current):posts)});
 if(shell&&current&&relatedStatus)consumers.push({root:shell,status:relatedStatus,render:posts=>renderRelated(shell,posts,current)});
 if(!consumers.length)return;
 // The source markup declares native post scope, including when identity is unavailable.
 const client=createFeedClient(location.origin,shell?50:8);let active=false;
 function state(busy:boolean){for(const c of consumers){c.root.setAttribute('aria-busy',String(busy));if(c.button)c.button.disabled=busy||!client.canRetry();}}
 async function load(retry=false){
  if(active)return;active=true;state(true);for(const c of consumers)c.status.textContent='Loading publications…';
  try{const posts=await client.load(retry);for(const c of consumers){try{c.render(posts);}catch{c.status.textContent='Suggestions unavailable. Use the publication links.';}}}
  catch{for(const c of consumers)c.status.textContent='Publications could not be loaded. Use the publication links below.';}
  finally{active=false;state(false);for(const c of consumers){if(client.canRetry()&&!c.button){const button=document.createElement('button');button.type='button';button.className='discovery-retry';button.textContent='Retry publications';button.addEventListener('click',()=>void load(true));c.status.after(button);c.button=button;}if(c.button){c.button.disabled=!client.canRetry();if(!client.canRetry())c.button.textContent='Retry used';}}}
 }
 void load();
}
initTheme();initNavigation();initSearch();initArticle();initTechnicalContent();initHighlighting();initDiagrams();initDiscovery();
