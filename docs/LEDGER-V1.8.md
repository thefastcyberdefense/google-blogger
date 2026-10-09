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
| US-L12e BlogPosting JSON-LD in the Blog widget | green in run 37808450659 at 0d84f91 (red first in run 37807273063 at b686170); verified on live build 4b4ccca by the owner's view-source | the owner's view-source of live build 48fa7fd showed article:published_time and article:author empty; unit 70/70, contract 39/39, XML 361,692 bytes |
| US-L12f no description in the BlogPosting JSON-LD | green in run 37888432786 at 93578d4 (red first in run 37887919544 at 6eee04b: 67 passed, the 3 description cases found a description) | the owner's view-source of live build 4b4ccca showed the description double-escaped (\u0026amp;); unit 70/70, contract 39/39, XML 361,163 bytes |
| US-L12g no microdata: one BlogPosting per post | green in run 37977383148 at fd031d5 (red first in run 37976794753 at d26fb5c: 9 microdata attributes, all from blog-post.pug) | the Rich Results Test on live build 0ab9602 found 2 Article items, the second from the microdata without author or image; unit 71/71, contract 39/39, XML 360,944 bytes |
| Dependency: katex 0.18.5 override (GHSA-238p-pmpm-9mq7, low) | lockfile refreshed by bot 88d0c6c (temporary workflow, removed in 33b8084); npm audit 0 findings | katex 0.16.47 to 0.18.5 and its nested commander 8.3.0 to 15.0.0, nothing else |

## US-L12a

Upstream f3647ef found the BlogPosting description invalid: a b:eval that
chains snippet() over data:post.snippets.long with ?: fallbacks. FCD's
head-meta.pug (FCD-owned) carried the same line onto the live blog. The
description is now the post's short snippet, else the view description,
else the title. A static check cannot prove what Blogger serves; the owner's
view of a rendered post (or Google's Rich Results Test) is the native
evidence. Superseded by US-L12f: the BlogPosting carries no description.

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

## US-L12e

The owner's view-source of live build 48fa7fd (2026-10-08) confirmed the
build stamp and showed `article:published_time` and `article:author` empty:
the head bound the post through data:widgets.Blog.first.posts.first, and
Blogger leaves that empty in the head. The BlogPosting JSON-LD now lives in
the Blog widget's postMeta includable (src/widgets/blog-post.pug), on post
views only, where Blogger binds data:post (the byline reads the same date and
author). The head reads no data:post values: the three article:* tags are
dropped and the BreadcrumbList JSON-LD stays. The first red also flagged the
data:post reads inside b:defaultmarkups, which sits in the head but only holds
body includables; the check skips that block since the fix commit.

The same view-source showed the blog's search description still reads
"Security engineering notes, research & field observations by Md Redwan
Ahmed...". That is a Blogger setting (Settings > Meta tags), not the theme.

## US-L12f

The owner's view-source of live build 4b4ccca (2026-10-09) confirmed the
build stamp, a head without article:* tags and only the BreadcrumbList
JSON-LD, and the BlogPosting JSON-LD in the post body with a real
datePublished, dateModified, image and author (US-L12e verified on Blogger).
Its description read "Overview \u0026amp; Defensive Context ...": Blogger
serves data:post.snippets.short HTML-escaped, so .jsonEscaped escapes the
entity a second time, and Blogger has no operator that unescapes it. Google's
Article structured data lists no required properties and does not recommend
description (checked 2026-10-09), so the BlogPosting drops it: headline,
datePublished, dateModified, image, author and publisher stay, and the check
fails if any of the first five goes missing. The og:description and
twitter:description meta tags are unchanged; they read Blogger's view
description (the blog's search description unless a post sets its own).

## US-L12g

The owner's Rich Results Test on the live post (build 0ab9602, 2026-10-10)
found 2 valid Article items for the one post: the BlogPosting JSON-LD, with
no warnings, and a second BlogPosting read from the microdata the Ledger base
put on the post markup (itemscope and itemtype on article.post, itemprop on
the titles, the title link, the date, the body and the excerpt), with name
and articleBody and flagged for missing author and image. Google recommends
JSON-LD and does not document merging an item across formats, so the theme
ships no microdata (itemprop, itemscope, itemtype, itemid, itemref) and the
JSON-LD is the post's only BlogPosting. The red run counted exactly the 9
attributes in blog-post.pug: the compiled script, the styles and the other
widgets carry none, and no test or contract rule required them. The
home page carries no Article markup and the test finds no items there, as
designed.

## Dependency: katex

npm audit reported katex <0.18.2 (GHSA-238p-pmpm-9mq7, low) through mermaid
11.17.2, the latest Mermaid release, which still depends on katex ^0.16.47;
its only offered fix was a Mermaid downgrade to 10.8.0. package.json now
overrides katex to 0.18.5. This changes the development tree only: the tests
use a Mermaid stand-in, and readers load Mermaid's own prebuilt bundle from
jsDelivr, which carries its own KaTeX until Mermaid updates it. Exposure on
the blog stays negligible: diagrams are written by the blog's authors, Mermaid
runs with securityLevel strict, and the issue needs an existing
prototype-pollution bug plus attacker-written math.

## Open

- Human keyboard and screen reader review of the image preview and the
  back-to-top button, and contrast of the preview controls over real
  images: no test measures them; owner review.
- Owner upload of the PR #16 head build and his rendered evidence: the
  BlogPosting JSON-LD in the post body with a real datePublished and author,
  the Rich Results Test on a post, a post with the image preview open,
  back-to-top after scrolling, the post at 390 px in both themes, and Layout.
  Received for 48fa7fd: build stamp; home and post at desktop width in both
  themes. Received for 4b4ccca: build stamp, head and post-body JSON-LD.
  Received for 0ab9602: the Rich Results Test on the post (2 valid Article
  items, which US-L12g reduces to 1). Pending for the US-L12g build: the
  build stamp, and the Rich Results Test showing one Article item whose
  fields carry no description.
- Ready for review and merge only on the owner's explicit approval.
