# Changelog

## Unreleased: L1 native masthead, gadget and sidebar recovery

- Added observed saved-gadget and empty-sidebar regression fixtures (`native-observed`, `native-empty-archive`), the `native-shell` browser suite (T0 to T4 on all 22 Chromium projects), static contracts C1 and C2 with mutation controls, and header parity P1. Browser cases grew from 1,674 to 1,784 (N2A 928 to 1,038; N1 240 and N0-only 506 unchanged) and unit/contract cases from 450 to 456.
- Masthead: Theme and Menu now sit in a brand row inside Header1's own markup; other gadgets Blogger places in the header section render in a compact muted tray below it. Platform `svg-icon-24` icons are sized to 24 px and masthead gadget images are bounded to 32 px.
- Added an FCD text-only Attribution default markup adapted from Ledger v1.7.0 (`messages.poweredByBlogger`, `rel="nofollow"`, no logo).
- Sidebar: the native `sidebar` section no longer draws its own frame; Blogger's empty `no-items` section is hidden on public pages and stays visible in the Layout editor. Theme sidebar cards are unchanged.
- LICENSE records FCD Blogger as the Fast Cyber Defense identity and branding edition of the owner's Ledger concept and names Ledger v1.7.0 as the source concept; both Required Notices are unchanged.
- Explicit footer and sidebar destinations for saved Attribution, Report Abuse and Profile gadgets (US-004) wait on the live widget inventory.

No merge or deployment is implied.

## Unreleased: PR C acceptance hardening

- Owner correction: only total generated XML <=500000 bytes; removed raw JS/CSS growth caps while retaining informational raw/gzip reports.
- Added conditional native publication-date and author metadata; omitted unavailable values.
- Added bounded parsed metadata validation, positive/adversarial controls and staging integration without native import claims.
- Added representative Firefox/WebKit viewport/theme acceptance alongside all inherited Chromium projects.
- Added cross-engine filter/navigation/copy/TOC/print/no-JS and actual pinned Mermaid checks; reports retain exact source and limitations.

Final source verification and any required XML transfer must complete on the current PR head. No merge or deployment is implied.

## PR B (merged without deployment)

Bounded shared feed/ranking, related/latest native fallbacks, safe identities, shared retry, clear-filter behavior and enlarged-text sidebar fix.168 unit/contract and946 browser checks passed before and after merge. Earlier component growth budgets are historical, superseded by the10 September2026 owner policy.

## PR A (merged without deployment)

Native-order editorial roles, lead image hints, author-controlled covers, reading measure and print.129 unit/contract and792 browser checks before merge; post-merge CI passed.

## Technical content and foundation

Prism1.30.0, Mermaid11.17.2 strict optional loading/source fallback, Vitest4.1.11 audit fix, native V3/V2 renderer, hardened XML/shared-presentation and keyboard/no-JS regression coverage. Actual Blogger and human release acceptance remain separate.
