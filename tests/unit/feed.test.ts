import { expect,it } from 'vitest';
import { parseFeed } from '../../src/scripts/feed.ts';
it('deduplicates, bounds and rejects unsafe feed entries',()=>{
 const entry=(href:string)=>({title:{$t:'<img onerror=alert(1)>'},link:[{rel:'alternate',href}]});
 const posts=parseFeed({feed:{entry:[entry('javascript:alert(1)'),entry('/post'),entry('/post'),...Array.from({length:10},(_,i)=>entry(`/p${i}`))]}},'https://blogs.fastcyberdefense.com/');
 expect(posts).toHaveLength(5);expect(posts[0].url).toBe('https://blogs.fastcyberdefense.com/post');expect(posts[0].title).toBe('<img onerror=alert(1)>');
});
it('handles empty and malformed feed data',()=>{expect(parseFeed(null,'https://blogs.fastcyberdefense.com/')).toEqual([]);expect(parseFeed({feed:{entry:'bad'}},'https://blogs.fastcyberdefense.com/')).toEqual([]);});
