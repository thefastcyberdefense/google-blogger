import {expect,it} from 'vitest';import{readFileSync}from'node:fs';
it('feed enhancements build text nodes rather than parsing cached HTML',()=>{const source=readFileSync('src/scripts/feed.ts','utf8');expect(source).toContain('textContent');expect(source).not.toMatch(/\.innerHTML\s*=/);expect(source).toContain('AbortSignal.timeout');expect(source).toContain('500000');});
