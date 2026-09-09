import {it,expect} from 'vitest';
import {rankRelated,type Candidate} from '../../src/scripts/related-posts.ts';
const p=(identity:string,labels:string[],published?:number):Candidate=>({title:identity,url:'https://example.com/'+identity,identity,id:identity,labels:labels.map(key=>({key,text:key})),published});
const current={identity:'self',id:'self',labels:['cloud','identity']};
it('ranks distinct shared labels then dates, excluding self',()=>{const result=rankRelated([p('self',['cloud']),p('one',['cloud'],20),p('two',['cloud','identity'],1),p('none',[],99)],current);expect(result.kind).toBe('related');expect(result.posts.map(x=>x.identity)).toEqual(['two','one']);});
it('does not fill genuine matches with unrelated latest posts',()=>{expect(rankRelated([p('match',['cloud']),p('other',[],100)],current).posts.map(x=>x.identity)).toEqual(['match']);});
it('uses deterministic identity ties and latest fallback',()=>{const posts=[p('z',[],10),p('a',[],10),p('b',[])];expect(rankRelated(posts,current)).toMatchObject({kind:'latest'});expect(rankRelated(posts,current).posts.map(x=>x.identity)).toEqual(['a','z','b']);expect(rankRelated([...posts].reverse(),current).posts.map(x=>x.identity)).toEqual(['a','z','b']);});
it('deduplicates and caps at three',()=>{const posts=[p('a',['cloud']),p('a',['cloud']),p('b',['cloud']),p('c',['cloud']),p('d',['cloud'])];expect(rankRelated(posts,current).posts.map(x=>x.identity)).toEqual(['a','b','c']);});
