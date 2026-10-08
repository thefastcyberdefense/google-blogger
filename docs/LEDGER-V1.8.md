# Ledger v1.8.0 port (feat/fcd-ledger-v1.8.0, PR #16)

Owner decision 2026-10-08: port the theme-layer changes of Ledger v1.8.0
(redwan-cse/ledger-blogger-theme 6701496, released 2026-10-08) onto FCD
Blogger, the JSON-LD fix first. Ported from source; Ledger's compiled XML
carries its own identity and is never uploaded.

## Story state

| Story | State | Evidence |
| --- | --- | --- |
| US-L12a BlogPosting JSON-LD description | green in run 37752110205 at 6f48c7a (red first in run 37751460937 at e84b60a: the three description cases read the b:eval chain) | tests/fcd/seo.test.ts; unit 67/67, contract 39/39, XML 329,748 bytes |
| US-L12b theme-layer merge | merged by bot 645aaa2; build and typecheck green in run 37753170666, XML 361,456 bytes; every test outside the palette passed | three-way merge of the 9 src/ files upstream changed, into the FCD files at 6f48c7a; 8 clean, 1 conflict in theme.pug resolved |
| US-L12c FCD palette and safe sources for the image preview and the back-to-top button | green in run 37754862719 at 336beb3 (fix ee43718, bot e036ee3); red first in run 37753170666 (palette, 5 cases) and run 37753995519 (preview: a javascript: link reached it) | unit 68/68, contract 39/39, audit lows only, CodeQL no new alerts, XML 361,800 bytes; artifact fcd-theme-336beb3762fee77d56b1a8b1bad69547d46204d3, sha256 21e4695a4cc3a4a278ef33c939a6042d518b0342202b1d70d037abcdf7567380 |
| US-L12d cleanup and records | temporary merge tooling removed (d6998c2 workflow first, then port/merge.py, port/merge.json, port/merge-report.json); CI on the records commit | the theme XML differs from 336beb3 only in the build stamp |

## US-L12a

Upstream f3647ef found the BlogPosting description invalid: a b:eval that
chains snippet() over data:post.snippets.long with ?: fallbacks. FCD's
head-meta.pug (FCD-owned) carried the same line onto the live blog. The
description is now the post's short snippet, else the view description,
else the title. A static check cannot prove what Blogger serves; the owner's
view of a rendered post (or Google's Rich Results Test) is the native
evidence.

## US-L12b merge

Temporary tooling, now removed: port/merge.py with port/merge.json, run by
.github/workflows/ledger-merge.yml on this branch only. For each src/ file
upstream changed between v1.7.0 (a3da05a8) and v1.8.0 (6701496) it merged
ours (FCD file at 6f48c7a), base (v1.7.0) and theirs (v1.8.0) with git
merge-file, then applied merge.json resolutions and literal FCD edits. The
merged files under src/ are ordinary FCD sources.

Clean: head-meta.pug, main.ts, article.scss, base.scss, dark.scss,
layout.scss, states.scss, tokens.scss. One conflict, in theme.pug: FCD had
removed the cached Recent Posts restore and the upstream personal Connect
links; v1.8.0 added the back-to-top button after them. Resolution keeps the
removals and takes the button.

Taken as upstream wrote them: the image preview, the back-to-top button,
the audio reader voice order, the Mermaid label quoting and the ASCII-box
pre-scan in initMermaidDiagrams. The US-L10 diagram tests pass on the merged
script.

Not taken (outside src/): the Drive publisher, IndexNow and Bing
submission, the GitHub research sync and the companion link resolver
(upstream publishing scripts), Ledger's own tests and golden XML, and its
package changes (sass 1.105.1, vitest 5, @types/node 26; FCD runs Node 24
LTS).

## US-L12c

The v1.8.0 additions came in Ledger's own colours. FCD edits:

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
focus returns to the image) passed as ported.

## Open

- Human keyboard and screen reader review of the image preview and the
  back-to-top button, and contrast of the preview controls over real
  images: no test measures them; owner review.
- Owner upload of a PR #16 build and his rendered evidence: theme-build
  stamp, a post with the image preview open, back-to-top, diagrams in both
  themes at 390 and 1280 px, Layout, and the Rich Results Test on a post.
- Ready for review and merge only on the owner's explicit approval.
