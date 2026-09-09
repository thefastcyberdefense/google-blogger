export const MERMAID_URL='';
export function createSingleFlight<T>(factory:()=>Promise<T>){return (_retry=false)=>factory();}
