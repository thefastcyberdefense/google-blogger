// Unconnected test-first boundary; implemented after Actions establishes behavioral red evidence.
export function createFeedClient(_base:string,_limit:8|50,_fetcher:typeof fetch=fetch){return {load:(_retry=false):Promise<unknown[]>=>Promise.reject(new Error('Not implemented')),canRetry:()=>false};}
