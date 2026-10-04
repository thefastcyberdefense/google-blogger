# Changelog

## Unreleased: L1 native shell and design v1 Layout gadgets

- Added observed saved-gadget and empty-sidebar regression fixtures (`native-observed`, `native-empty-archive`), the `native-shell` browser suite (T0 to T4 on all 22 Chromium projects), static contracts C1 to C10 with mutation controls, header parity P1, and shipped-CSS layout checks for the gadget homes, navigation, intro, call to action, footer, design tokens and components. Browser cases grew from 1,674 to 1,784 (N2A 928 to 1,038; N1 240 and N0-only 506 unchanged) and unit/contract cases from 450 to 500.
- Masthead: Theme and Menu sit in a brand row inside Header1's own markup; other gadgets Blogger places in the header section render in a compact muted tray below it. Platform `svg-icon-24` icons are sized to 24 px and masthead gadget images are bounded to 32 px.
- Navigation (L1-nav): a locked Navigation Link List gadget (LinkList1, Layout > Navigation) inside the theme-owned `#primary-navigation`. Saved links render in the owner's order; a fresh install shows Latest, Topics, Guides and Company website. Brand, links and search share one row when they fit and become a stacked drawer below 640 px. FCD's own `#site-search` stays the single search.
- Intro (L2-intro): the first home page opens with a full-bleed ink band holding the theme-owned headline, the owner's Intro HTML gadget copy (HTML1, Layout > Intro) and the Topics chips. Every view keeps exactly one h1.
- Call to action (L3-CTA): one sitewide band between the content and the footer with the owner's Call to Action HTML gadget (HTML2), defaulting to "Need help securing your organization?" and an Explore FCD services button. The article no longer repeats a call to action.
- Footer (L4-footer): the brand and the owner's Footer HTML gadget copy (HTML3) beside theme-owned Company website, Publication feed and Back to top links, then a base row with the copyright and the compact Attribution and Report Abuse gadgets.
- Design tokens and components (US-015): a 3 px brand signal line along the masthead's top edge whose light sweep runs only without a reduced-motion request and moves as one compositor layer (transform only), so it never repaints the line; a navy FCD mark tile; cards with a soft border, 14 px corners, 22 px padding and a hover shadow, with the 3 px lift and image zoom only without a reduced-motion request; labels above card and article titles as a mono uppercase advisory strip with decorative, unannounced separators; and one mono uppercase heading voice for every sidebar card. CSS only; no markup, section or widget change.
- Gadget homes (US-004b): Profile1 in the sidebar, Attribution1 then ReportAbuse1 in the footer's `footer-gadgets` section, and an archive card only when Blogger supplies archive data. The theme gives a saved Blog Search gadget no search presentation.
- First native upload fixes (US-016): Attribution1 and Profile1 now render the theme's own markup, because on the owner's first upload Blogger resolved `super.main` to its built-in widget markup (Blogger logo, bulleted author list, oversized photo, black default icon, no heading) instead of the theme's default markup. The credit is text only, adapted from Ledger v1.7.0 (`messages.poweredByBlogger`, `rel="nofollow"`, no logo). The Authors card has a heading from the gadget title ("Authors" when untitled) on team blogs and one row per author with a small avatar beside the name: the author's photo as decoration, or a theme-drawn default avatar that reads in both themes. ReportAbuse1 and BlogArchive1 keep `super.main`.
- Sidebar: the native `sidebar` section no longer draws its own frame; Blogger's empty `no-items` section is hidden on public pages and stays visible in the Layout editor. Theme sidebar cards are unchanged.
- CI: every fully green run uploads `fcd-theme-<sha>`, a zip holding only the compiled XML; annotations are reserved for actionable problems; jobs are pinned to `ubuntu-24.04`. With owner approval (2026-10-04) the browser stage is bounded at 1,500 s (was 1,100 s) and the verify job at 30 minutes (was 25); tests, populations, workers and retries are unchanged.
- LICENSE records FCD Blogger as the Fast Cyber Defense identity and branding edition of the owner's Ledger concept and names Ledger v1.7.0 as the source concept; both Required Notices are unchanged.

The owner's first native upload (2026-10-04) rendered the new sections and gadgets. The US-016 credit and Authors card, saved-gadget reconciliation, the Layout editor and the rendered build stamp stay unverified until his next upload. No merge or deployment is implied.

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
