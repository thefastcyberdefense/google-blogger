// Plain scanning helpers for reading the CI-built theme XML in tests. The XML
// is this repository's own build output, never untrusted input, and nothing
// here sanitizes markup for display. They replace the regular expressions
// (comment, script and skin removal) that CodeQL reads as incomplete HTML
// sanitizers; on the theme XML they return what those expressions returned:
// each block runs from its opening text to the first closing text after it,
// and an unclosed block is left in place.

export interface Block {
  start: number; // index of the opening text
  end: number; // index just past the closing text
  open: string; // the opening tag (for tags) or the opening text
  inner: string; // text between the opening and the closing text
}

const WORD = /[A-Za-z0-9_]/;

// Blocks opened by `open` and closed by the first `close` after them. For a
// tag name (open starting with '<' and close with '</'), the name must end
// there (as /<name\b/ requires) and the opening tag runs to its first '>'.
export function blocks(text: string, open: string, close: string, keep: (openTag: string) => boolean = () => true): Block[] {
  const tag = open.startsWith('<') && close.startsWith('</');
  const out: Block[] = [];
  let at = 0;
  while (at < text.length) {
    const start = text.indexOf(open, at);
    if (start < 0) break;
    let bodyStart = start + open.length;
    if (tag) {
      if (WORD.test(text.charAt(bodyStart))) {
        at = start + 1;
        continue;
      }
      const gt = text.indexOf('>', bodyStart);
      if (gt < 0) break;
      bodyStart = gt + 1;
    }
    const openText = text.slice(start, bodyStart);
    const stop = text.indexOf(close, bodyStart);
    if (stop < 0 || !keep(openText)) {
      at = start + 1;
      continue;
    }
    out.push({ start, end: stop + close.length, open: openText, inner: text.slice(bodyStart, stop) });
    at = stop + close.length;
  }
  return out;
}

export function withoutBlocks(text: string, open: string, close: string, keep?: (openTag: string) => boolean): string {
  let out = '';
  let at = 0;
  for (const b of blocks(text, open, close, keep)) {
    out += text.slice(at, b.start);
    at = b.end;
  }
  return out + text.slice(at);
}

export const withoutComments = (text: string): string => withoutBlocks(text, '<!--', '-->');
export const scripts = (text: string): Block[] => blocks(text, '<script', '</script>');
export const withoutScripts = (text: string): string => withoutBlocks(text, '<script', '</script>');
