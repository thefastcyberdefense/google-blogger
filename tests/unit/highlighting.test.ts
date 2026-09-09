import {expect,it} from 'vitest';
import {languageName} from '../../src/scripts/highlighting.ts';
it.each([['sh','bash'],['ps1','powershell'],['py','python'],['js','javascript'],['ts','typescript'],['yml','yaml'],['dockerfile','docker'],['xml','markup']])('maps %s safely', (a,b)=>expect(languageName(a)).toBe(b));
it('unknown language stays plain instead of loading arbitrary code',()=>expect(languageName('https://evil.example/a.js')).toBeNull());
