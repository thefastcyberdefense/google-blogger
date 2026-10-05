# Ledger rebuild handoff (feat/fcd-ledger-rebuild, PR #15)

Upstream: redwan-cse/ledger-blogger-theme v1.7.0 at a3da05a8a70243c6ffc239b0e96e88260ed7b536.
Port writer: port/apply.py plus port/ledger.json, applied by the TEMPORARY
ledger-port.yml workflow (bot commits do not trigger CI).

## Story state

| Story | State | Evidence |
| --- | --- | --- |
| US-L1 native engine checks | green | tests/fcd/native-contract.test.ts 5/5 |
| US-L2 verbatim Ledger import | done | 065a95f blob SHAs match upstream |
| US-L3 FCD identity | green in unit run 37339032545 | brand identity tests pass; follow URL moved to params (contract R-V3-2 AC4) in 7aed783 |
| US-L4 FCD palette | green in unit run 37339032545 | no upstream palette literal; all FCD tokens present |
| US-L5 hardening | green in unit run 37339032545 | tests/fcd/hardening.test.ts 7/7 (red first in run 37333013292) |
| Ledger V3 contract | red in run 37339032545 | url-path-operator only; fixed in 7aed783, awaiting CI |
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
