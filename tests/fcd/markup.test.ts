// US-L6: tests/fcd/markup.ts replaces the regular expressions the other tests
// used to drop comments, scripts and skins from the built XML (CodeQL read them
// as incomplete HTML sanitizers). These cases pin the behaviour those
// expressions had: first closing text wins, the tag name must end, the
// opening tag runs to its first '>', an unclosed block stays.
import { describe, expect, it } from 'vitest';
import { blocks, scripts, withoutBlocks, withoutComments, withoutScripts } from './markup.ts';

describe('markup scanning helpers', () => {
  it('drops each comment up to the first closing text', () => {
    expect(withoutComments('a<!-- x -->b<!-- y --> -->c')).toBe('ab -->c');
    expect(withoutComments('a<!-- open')).toBe('a<!-- open');
  });

  it('reads script bodies and drops whole script elements', () => {
    const text = '<p>x</p><script type="text/javascript">//<![CDATA[\nif (a > b) go();\n//]]></script><scripts>no</scripts><script>two</script>end';
    expect(scripts(text).map((s) => s.inner)).toEqual(['//<![CDATA[\nif (a > b) go();\n//]]>', 'two']);
    expect(scripts(text).map((s) => s.open)).toEqual(['<script type="text/javascript">', '<script>']);
    expect(withoutScripts(text)).toBe('<p>x</p><scripts>no</scripts>end');
  });

  it('keeps an unclosed script and requires the name to end', () => {
    expect(withoutScripts('<script>never closed')).toBe('<script>never closed');
    expect(withoutBlocks('<b:skin><![CDATA[x]]></b:skin><b:skins/>', '<b:skin', '</b:skin>')).toBe('<b:skins/>');
  });

  it('drops only the blocks whose opening tag passes the filter', () => {
    const text = '<svg class="fcd-mark"><g/></svg><svg class="icon"><g/></svg>';
    const mark = (open: string): boolean => /\bfcd-mark\b/.test(open);
    expect(withoutBlocks(text, '<svg', '</svg>', mark)).toBe('<svg class="icon"><g/></svg>');
    expect(blocks(text, '<svg', '</svg>', mark)).toHaveLength(1);
  });
});
