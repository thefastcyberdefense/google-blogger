# Ledger rebuild handoff (feat/fcd-ledger-rebuild, PR #15)

Upstream: redwan-cse/ledger-blogger-theme v1.7.0 at a3da05a8a70243c6ffc239b0e96e88260ed7b536.
Port writer: port/apply.py plus port/ledger.json, applied by the TEMPORARY
ledger-port.yml workflow (bot commits do not trigger CI).

## Story state

| Story | State | Evidence |
| --- | --- | --- |
| US-L1 native engine checks | green | tests/fcd/native-contract.test.ts 5/5 |
| US-L2 verbatim Ledger import | done | 065a95f blob SHAs match upstream |
| US-L3 FCD identity | green in run 37340398543 | brand identity tests pass; follow URL uses params (contract R-V3-2 AC4) |
| US-L4 FCD palette | green in run 37340398543 | no upstream palette literal; all FCD tokens present |
| US-L5 hardening | green in run 37340398543 | tests/fcd/hardening.test.ts 7/7 (red first in run 37333013292) |
| Ledger V3 contract | green in run 37340398543 | PASS: 39 V3 contract rules verified |
| First test-blog upload | done 2026-10-05 | build 1118f66, owner screenshots light and dark, home and post |
| US-L7 test-blog polish | green in run 37405702093 at 0afa13c (red first in run 37349111173) | tests/fcd/polish.test.ts over tests/fcd/blogger-static.ts; unit 26/26, contract 39/39, audit below the moderate gate |
| Second test-blog upload | done 2026-10-06 | build 0afa13c, owner screenshots light and dark, home and post show the US-L7 fixes |
| US-L8 company logo, AA comment actions | green in run 37413332586 at 528f22d (red first in run 37411818592 at a899434) | tests/fcd/logo.test.ts with tests/fcd/icon0.svg; unit 33/33, contract 39/39 |
| Third test-blog upload | done 2026-10-06 | build 528f22d; the owner then asked for the fastcyberdefense.com tweakcn palette |
| US-L9 tweakcn palette | red first in run 37419852682 at 6eece6f; fix 1183c0b, 1d5f9e0, port bot 7aa068c; 51/53 in run 37424526223 at 9f45a73 (4 Ledger greys left) | tests/fcd/palette.test.ts (every colour per source file), tests/fcd/contrast.test.ts (text and hover, both themes) |
| US-L9b exact site colours (owner, 2026-10-06) | green in run 37485927204 at accb4d9 (red first in run 37484501694 at 1efd37c) | tests/fcd/site-exact.ts records the decision; brand, palette, contrast, logo and polish tests follow it |
| Fourth test-blog upload | done 2026-10-07 | build accb4d9; home light and dark all tweakcn; post: diagrams broke after a theme switch, light diagrams in Mermaid stock colours, dark callout bars all blue |
| US-L10 diagrams and callouts | green in run 37659118930 at 26ca599 (red first in run 37656025228 at 272e026, 3 failing); fix 7cf48ae and 8744bdf; unit 58/58, contract 39/39, audit lows only | tests/fcd/diagrams.test.ts runs the built theme script over the static post view with a Mermaid stand-in; Blogger evidence pending |
| Fifth upload, production | done 2026-10-08 by the owner, to blogs.fastcyberdefense.com (the production blog, docs/DEPLOYMENT.md) | build 26ca599, artifact fcd-theme-26ca5994c7eea4785971f4d9b3e7b096aed7f720 (sha256 026a885a2593dd82d8de1147664ab7fafcd4eafa77416c09bc8f07d9b93ae359); owner evidence pending (rendered theme-build stamp, post with diagrams and callouts in both themes, 390 and 1280 px, Layout); rollback triggers as in docs/DEPLOYMENT.md; main does not yet contain this build (PR #15 is a draft) |
| US-L6 cleanup and records | pending | remove port/, ledger-port.yml, staging-check.yml, excerpt step; CHANGELOG, AGENTS.md, PR body |

## US-L5 changes (main.ts, via port edits)

- safeFeedUrl: feed URLs are used only when they resolve to http(s).
- fetchFeed: same-origin JSON feed requests abort after 8 s.
- Recent Posts: never reads cached HTML; renders DOM nodes from text.
- Live search and catalog: links, thumbnails and dates escaped and validated.
- Catalog: at most 10 pages of 50 posts, started once per page.
- Mermaid: securityLevel 'strict'.

The rebuild first set small blue text in #166fbe (AA on white, card and
wash). Superseded on 2026-10-06 by the owner's choice of the exact site
colours (US-L9b).

## US-L7 changes (test-blog upload, 2026-10-05)

The upload kept the earlier theme's Blog Search, Blog Archive, Report Abuse
and Profile gadgets; Blogger moved them into the Header section, where
Ledger's display: contents wrappers made each one a masthead item. Fixes live
in src/styles/fcd.scss (FCD-owned, loaded last by a port edit to main.scss)
and src/styles/tokens.scss:

- Fixed sections (header, navlinks, intro, topics, page_body, cta) show only
  the theme's own widget on the live blog; Layout still lists relocated
  gadgets so the owner can delete them.
- The FCD mark keeps its square size in flex rows.
- Light call-to-action secondary is an outline with a primary label.
- Dark mode: sidebar and author RSS buttons sit on the dark surface; rules
  that kept the light border colour use the dark rule #2d3748.
- Text uses Inter throughout: $font-serif carries the Inter stack, as
  fastcyberdefense.com sets its articles in Inter.

Owner action after each upload: in Layout, delete gadgets that are not part
of the theme (here Blog Search, Blog Archive, Report Abuse, Profile). The
Profile gadget lists personal author profiles and must not stay.

## US-L8 changes (second upload, 2026-10-06)

The owner asked for the company logo, https://fastcyberdefense.com/icon0.svg,
in place of the shield drawn for the rebuild. tests/fcd/icon0.svg is that file
byte for byte (thefastcyberdefense/fastcyberdefense src/app/icon0.svg, blob
7c54b9e).

- src/partials/fcd-logo.pug (FCD-owned) inlines the logo as the fcdLogo
  mixin with one gradient id per use: masthead, hero, sidebar profile and
  drawer. The blog makes no logo request.
- The marks drop Ledger's portrait ring and white fill, so the cut-out
  letters show the surface below, as on the main site; the hero keeps its
  ring with the logo set 16px inside.
- An author without a photo shows the logo (data URI in fcd.scss) instead
  of initials; the script fallback avatar (blog-author comments) is the logo
  through the port manifest.
- Comment actions and the author badge are filled with $accent; since
  US-L9b that is the primary #3d8fe1 with white labels, as on the main site.

## US-L9 changes (tweakcn palette, 2026-10-06)

The owner's tweakcn theme (tweakcn.com/themes/cmj93i381000k04jt333e4ko2) is
the palette of fastcyberdefense.com and is now the whole palette of the blog.
Most core tokens were already in tokens.scss; what remained were Ledger's own
colours in its component styles and script.

- tokens.scss names every tweakcn token. The dark highlight is the primary
  #3d8fe1. The elevation tokens read the tweakcn shadows (primary tint, 0.10
  light, 0.20 dark) from custom properties that fcd.scss sets per theme.
- port/ledger.json maps the rest: dark surfaces, borders and greys to
  background, card, border, accent and chart-5; Ledger's greens (status pill,
  badges, copy states) and the pagination blue to the primary; reds to
  destructive; black shadows to the primary tint; Mermaid's lines to the
  primary and the muted foreground; commenter initials avatars to five
  tweakcn colours.
- fcd.scss: the hero status pill is the tweakcn secondary badge; hovers use
  the accent surface with the foreground (dark 7.41:1, light labels 10.6:1);
  the meta separator, dark links, the dark call-to-action tag and the dark
  footer copy use the tweakcn muted and primary tokens.
- Kept on purpose: Prism syntax colours and the alert callouts (content
  semantics with no palette equivalent).
- Not applied, as they are not colour: radius 0.5rem and Playfair Display.

## US-L9b: exact site colours (owner decision, 2026-10-06)

Asked whether to keep the AA text values of the rebuild or use the site's
exact colours, the owner chose exact. $accent is the primary #3d8fe1 and
$ink-muted the muted foreground #6e7b9d; #166fbe and #606d8e are gone from
the theme. The only colour outside the tweakcn export is the hover of the
primary, oklch(50% 0.1467 251.2451), as tweakcn has no hover token.

Accepted below WCAG AA, exactly as on fastcyberdefense.com: small text in
#3d8fe1 (3.38:1 on white, 3.14:1 on the card, 2.95:1 on the accent wash),
muted text in #6e7b9d (4.21:1 on white, 3.92:1 on the card), and white
labels on #3d8fe1 (3.38:1). tests/fcd/site-exact.ts accepts only those
pairs, down to 2.9:1; every other text, the dark theme included, keeps AA.

## US-L10: diagrams and callouts (fourth upload, 2026-10-07)

- Redraw: on a theme switch Ledger took the longer of the stored source and
  the node text; once drawn, the node holds Mermaid's svg, whose style text
  is longer, so every diagram became a CSS source card. A drawn wrap now
  redraws from the source kept on the wrap; a standalone pre.mermaid keeps
  its source in data-fcd-source and drops data-processed.
- Colours: Mermaid's 'default' and 'dark' themes ignore most theme
  variables, so both modes now use 'base' with the tweakcn colours (light:
  accent nodes, primary borders, muted lines; dark: secondary nodes on the
  dark page, primary borders and lines) and Inter.
- Callouts: dark.scss gives every blockquote a primary bar. The new
  FCD-owned src/styles/fcd-callouts.scss restores the five bars in dark mode
  on 10% tints, with titles at 6.5:1 or more; light titles are deepened to
  AA on their tints, and the note title stays the primary (site-exact).

## Dependency audit (2026-10-06)

npm audit (moderate gate) failed on GHSA-68fv-2mgg-jv7q, source-map-js <1.2.2
(high, transitive build tooling). source-map-js 1.2.2 and dompurify 3.4.16
(two low DOMPurify advisories, via mermaid) were applied inside the existing
ranges through port/lockfile.json. Still open, below the gate: katex <0.18.2
(low, GHSA-238p-pmpm-9mq7) via mermaid 11; the only offered fix is a mermaid
downgrade to 10.8.0, which is not taken.
