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
| US-L8 company logo, AA comment actions | red first in run 37411818592 at a899434 (6 new cases failing as predicted); fix afe37d4 plus port bot 9933df2; awaiting CI on this commit | tests/fcd/logo.test.ts with tests/fcd/icon0.svg |
| US-L6 cleanup and records | pending | remove port/, ledger-port.yml, staging-check.yml, excerpt step; CHANGELOG, AGENTS.md, PR body |

## US-L5 changes (main.ts, via port edits)

- safeFeedUrl: feed URLs are used only when they resolve to http(s).
- fetchFeed: same-origin JSON feed requests abort after 8 s.
- Recent Posts: never reads cached HTML; renders DOM nodes from text.
- Live search and catalog: links, thumbnails and dates escaped and validated.
- Catalog: at most 10 pages of 50 posts, started once per page.
- Mermaid: securityLevel 'strict'.

Action blue for small text is #166fbe (AA on white, card and wash); the
example #2378c8 fails AA on the card (4.25) and wash (4.00).

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
- Light call-to-action secondary is an outline (#166fbe label, 4.82:1).
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
- Dark comment actions and the author badge use the AA action blue #166fbe:
  white labels were 3.4:1 on #3d8fe1 and the hover was 4.4:1.

## Dependency audit (2026-10-06)

npm audit (moderate gate) failed on GHSA-68fv-2mgg-jv7q, source-map-js <1.2.2
(high, transitive build tooling). source-map-js 1.2.2 and dompurify 3.4.16
(two low DOMPurify advisories, via mermaid) were applied inside the existing
ranges through port/lockfile.json. Still open, below the gate: katex <0.18.2
(low, GHSA-238p-pmpm-9mq7) via mermaid 11; the only offered fix is a mermaid
downgrade to 10.8.0, which is not taken.
