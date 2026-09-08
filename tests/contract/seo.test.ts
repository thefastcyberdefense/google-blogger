import{expect,it}from'vitest';import{readFileSync}from'node:fs';
it('keeps one native head owner and escaped structured data templates',()=>{const xml=readFileSync('dist/theme.xml','utf8');expect(xml.match(/name="all-head-content"/g)).toHaveLength(1);expect(xml).toContain('BlogPosting');expect(xml).toContain('BreadcrumbList');expect(xml).toContain('data:post.title.jsonEscaped');});
