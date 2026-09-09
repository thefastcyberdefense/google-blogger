// Unconnected test-first boundary; not imported by production initialization yet.
export type Candidate={title:string;url:string;identity:string;id?:string;labels:{key:string;text:string}[];published?:number};
export function rankRelated(_posts:Candidate[],_current:{identity:string;id?:string;labels:string[]}):{kind:'related'|'latest';posts:Candidate[]}{return {kind:'latest',posts:[]};}
