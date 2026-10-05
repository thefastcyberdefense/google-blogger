# Ledger rebuild handoff (feat/fcd-ledger-rebuild, PR #15)

Upstream: redwan-cse/ledger-blogger-theme v1.7.0 at a3da05a8a70243c6ffc239b0e96e88260ed7b536.
Port writer: port/apply.py plus port/ledger.json, applied by the TEMPORARY
ledger-port.yml workflow (bot commits do not trigger CI).

## Story state

| Story | State | Evidence |
| --- | --- | --- |
| US-L1 native engine checks | green | tests/fcd/native-contract.test.ts 5/5 on 9a321ae |
| US-L2 verbatim Ledger import | done | 065a95f blob SHAs match upstream |
| US-L3 FCD identity | red, fixing | run 37330269405: redwan x4, orcid x6, AVvXsEid2pK6sS9Z x2, blog id x1 remain |
| US-L4 FCD palette | red, fixing | dark.scss mapped in 5b2a7d6; light leftovers (#2563eb, rgb 59,130,246, oklch .985) pending |
| US-L5 hardening | red tests added | tests/fcd/hardening.test.ts (cache restore, feed URLs, catalog cap 10, Mermaid strict) |
| US-L6 cleanup and records | pending | remove port/, ledger-port.yml, staging-check.yml, excerpt step |

## Next action

Read the verify annotations for this commit: brand failures now list the
source lines (path:line) of each leftover, and the TEMPORARY excerpt step
publishes the main.ts tail (Module 16). Fix through port/ledger.json edits,
then implement US-L5 in main.ts via port edits until all tests are green.

Action blue for small text is #166fbe (AA on white, card and wash); the
example #2378c8 fails AA on the card (4.25) and wash (4.00).
