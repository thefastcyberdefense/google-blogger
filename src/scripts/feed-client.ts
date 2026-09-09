import {parseDiscovery,FEED_BYTE_LIMIT,feedRequestSignal,type DiscoveryPost} from './feed.ts';
export function createFeedClient(base:string,limit:8|50,fetcher:typeof fetch=fetch){
 const origin=new URL(base);if(origin.protocol!=='https:'||origin.username||origin.password)throw new Error('Invalid publication origin');
 const endpoint=new URL('/feeds/posts/default',origin.origin);endpoint.searchParams.set('alt','json');endpoint.searchParams.set('max-results',String(limit));
 let pending:Promise<DiscoveryPost[]>|undefined;let failed=false;let attempts=0;let busy=false;
 async function request(){
  const controller=new AbortController();let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;let timer:ReturnType<typeof setTimeout>|undefined;
  const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();void reader?.cancel().catch(()=>{});reject(new Error('Feed timed out'));},8000);});
  const work=async()=>{
   const response=await fetcher(endpoint.href,{credentials:'omit',redirect:'error',signal:feedRequestSignal(controller)});
   if(response.status!==200||response.redirected||response.type==='opaque'||response.url&&response.url!==endpoint.href)throw new Error('Unexpected feed response');
   if(!/^application\/(?:json|[\w.+-]+\+json)(?:\s*;|$)/i.test(response.headers.get('content-type')||''))throw new Error('Feed must be JSON');
   if(Number(response.headers.get('content-length'))>FEED_BYTE_LIMIT)throw new Error('Feed too large');
   reader=response.body?.getReader();if(!reader)throw new Error('Missing feed body');
   const chunks:Uint8Array[]=[];let bytes=0;
   while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>FEED_BYTE_LIMIT)throw new Error('Feed too large');chunks.push(value);}
   if(controller.signal.aborted)throw new Error('Feed timed out');
   const data=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength;}
   return parseDiscovery(JSON.parse(new TextDecoder().decode(data)),origin.origin,limit);
  };
  try{return await Promise.race([work(),timeout]);}finally{clearTimeout(timer);controller.abort();void reader?.cancel().catch(()=>{});}
 }
 return {canRetry:()=>failed&&!busy&&attempts===1,load(retry=false):Promise<DiscoveryPost[]>{if(!pending||retry&&failed&&!busy&&attempts===1){attempts++;busy=true;failed=false;pending=request().catch(error=>{failed=true;throw error;}).finally(()=>{busy=false;});}return pending;}};
}
