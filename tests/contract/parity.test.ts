import { expect, it } from 'vitest';
import { createRequire } from 'node:module';
const pug = createRequire(import.meta.url)('pug') as {renderFile(file:string, options:Record<string,unknown>):string};
const render = (page:string) => pug.renderFile(`fixtures/${page}.pug`, {css:'',script:'',pretty:true});
it('article fixture carries the production single-item body state', () => {
  const html = render('article');
  expect(html).toMatch(/<body[^>]*class="[^"]*is-single/);
  expect(html).not.toMatch(/<body[^>]*class="[^"]*is-home-lead/);
});
it('home fixture models Header1 and Blog1 wrapper boundaries and real images', () => {
  const html=render('home');
  expect(html).toContain('id="Header1"');
  expect(html).toContain('id="Blog1"');
  expect(html).toContain('post-outer-container');
  expect(html).toContain('class="card-image"');
  expect(html).toContain('srcset=');
});
