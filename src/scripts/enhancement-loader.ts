export const MERMAID_URL='https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs';
export interface MermaidAPI { initialize(config:Record<string,unknown>):void; parse(source:string):Promise<unknown>; render(id:string,source:string,container?:Element):Promise<{svg:string}>; }
export function createSingleFlight<T>(factory:()=>Promise<T>){
 let pending:Promise<T>|undefined;let failed=false;
 return (retry=false):Promise<T>=>{
  if(!pending || retry&&failed){failed=false;pending=Promise.resolve().then(factory).catch(error=>{failed=true;throw error;});}
  return pending;
 };
}
// import() cannot be aborted. Keep the underlying import single-flight even after a UI timeout.
let imported:Promise<{default:MermaidAPI}>|undefined;
export const loadMermaid=createSingleFlight(async()=>{
 imported ??= import(/* @vite-ignore */ MERMAID_URL) as Promise<{default:MermaidAPI}>;
 try {
  let timer:ReturnType<typeof setTimeout>|undefined;
  const module=await Promise.race([imported,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Diagram library timed out; source remains available')),12000);})]).finally(()=>clearTimeout(timer));
  if(typeof module.default?.render!=='function'||typeof module.default?.initialize!=='function')throw new Error('Invalid diagram library');
  return module.default;
 }catch(error){throw error;}
});
