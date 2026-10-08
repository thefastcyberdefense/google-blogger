# Ledger v1.8.0 port (feat/fcd-ledger-v1.8.0, PR #16)

Owner decision 2026-10-08: port the theme-layer changes of Ledger v1.8.0
(redwan-cse/ledger-blogger-theme 6701496, released 2026-10-08) onto FCD
Blogger, the JSON-LD fix first. Ported from source; Ledger's compiled XML
carries its own identity and is never uploaded.

## Story state

| Story | State | Evidence |
| --- | --- | --- |
| US-L12a BlogPosting JSON-LD description | green in run 37752110205 at 6f48c7a (red first in run 37751460937 at e84b60a: the three description cases read the b:eval chain) | tests/fcd/seo.test.ts; unit 67/67, contract 39/39, XML 329,748 bytes |
| US-L12b theme-layer merge | merged by bot 645aaa2; build and typecheck green in run 37753170666, XML 361,456 bytes; every test outside the palette passed | port/merge.py three-way merge of the 9 src/ files upstream changed, into the FCD files at 6f48c7a; 8 clean, 1 conflict in theme.pug resolved |
| US-L12c FCD palette and safe sources for the image preview and the back-to-top button | fix ee43718 (bot e036ee3), CI pending; red first in run 37753170666 (palette, 5 cases) and run 37753995519 (preview: a javascript: link reached it) | tests/fcd/palette.test.ts and brand.test.ts on the new CSS; tests/fcd/lightbox.test.ts |
| US-L12d records, owner upload | pending | |

## US-L12a

Upstream f3647ef found the BlogPosting description invalid: a b:eval that
chains snippet() over data:post.snippets.long with ?: fallbacks. FCD's
head-meta.pug (FCD-owned) carried the same line onto the live blog. The
description is now the post's short snippet, else the view description,
else the title. A static check cannot prove what Blogger serves; the owner's
view of a rendered post (or Google's Rich Results Test) is the native
evidence.

## US-L12b merge

TEMPORARY tooling, removed before acceptance: port/merge.py with
port/merge.json, run by .github/workflows/ledger-merge.yml on this branch
only. For each src/ file upstream changed between v1.7.0 (a3da05a8) and
v1.8.0 (6701496) it merges ours (FCD file at 6f48c7a), base (v1.7.0) and
theirs (v1.8.0) with git merge-file, then applies merge.json resolutions
and literal FCD edits.

Clean: head-meta.pug, main.ts, article.scss, base.scss, dark.scss,
layout.scss, states.scss, tokens.scss. One conflict, in theme.pug: FCD had
removed the cached Recent Posts restore and the upstream personal Connect
links; v1.8.0 added the back-to-top button after them. Resolution keeps the
removals and takes the button.

Not taken (outside src/): the Drive publisher, IndexNow and Bing
submission, the GitHub research sync and the companion link resolver
(upstream publishing scripts), Ledger's own tests and golden XML, and its
package changes (sass 1.105.1, vitest 5, @types/node 26; FCD runs Node 24
LTS).

## US-L12c

The v1.8.0 additions came in Ledger's own colours. Through merge.json edits:

- Image preview: the scrim, header, footer and image shadow use the tweakcn
  dark background (navy) at the upstream opacities; titles, captions and
  control icons are white or the dark foreground, the hint the dark muted
  foreground; the close control is the tweakcn destructive.
- Back-to-top button: light shadows are primary-tinted; in dark mode the
  button is the dark card with the dark border and foreground, and on hover
  the dark secondary with a primary border and outline.
- Safety: the preview opens only http(s) sources, so a post link such as
  javascript:...png reaches neither the image, nor the download, nor its
  fallback link; the download fetch aborts after 8 s.

The keyboard contract of the preview (focus to Close on open, Escape closes,
focus returns to the image) passed as ported. Human keyboard and screen
reader review stays with the owner.
