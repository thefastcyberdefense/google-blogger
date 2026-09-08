import { expect,it } from 'vitest';
import { readFileSync } from 'node:fs';
const xml=readFileSync('dist/theme.xml','utf8');
it('preserves native Blogger data and dispatch in compiler output',()=>{expect(xml).toContain('b:layoutsVersion="3"');expect(xml).toContain('name="super.main"');expect(xml).toContain('data:post.body');expect(xml).toContain('name="super.commentPicker"');expect(xml).toContain('data:olderPageUrl');expect(xml).not.toContain('data:blog.pageType');});
it('does not ship personal upstream analytics or cache hydration',()=>{for(const text of ['G-KCCCSPMFVS','ydgpwp2tn0','ledger_recent_posts','orcid.org','cal.com/redwancse'])expect(xml).not.toContain(text);});
