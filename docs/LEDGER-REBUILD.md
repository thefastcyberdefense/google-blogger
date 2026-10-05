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
| US-L7 test-blog polish | red first in run 37349111173 (7 of 9 new cases failing as predicted); run 37351665554 after e50bded and f7494c4: 25 of 26 pass, 5 dark-mode rules left, fixed in the next commit, awaiting CI | tests/fcd/polish.test.ts over tests/fcd/blogger-static.ts |
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
