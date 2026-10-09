# Changelog

## Unreleased: Ledger v1.8.0 port (draft PR #16)

- Ported the theme-layer changes of Ledger v1.8.0 (redwan-cse/ledger-blogger-theme 6701496, released 2026-10-08) from source; record in docs/LEDGER-V1.8.md.
- Structured data (US-L12a): the BlogPosting JSON-LD description is the post's short snippet, else the view description, else the title, instead of a b:eval snippet() chain upstream found invalid (f3647ef). Superseded by US-L12f.
- New from upstream (US-L12b): an image preview with zoom, pan and download for post images, a back-to-top button, the audio reader voice order, Mermaid label quoting and the ASCII-box pre-scan. Three-way merged into the FCD sources; one conflict in theme.pug kept FCD's removals.
- FCD palette and safety (US-L12c): the preview and the back-to-top button use the tweakcn palette; the preview opens only http(s) sources (a javascript: link no longer reaches it) and its download fetch aborts after 8 s.
- Structured data where Blogger binds the post (US-L12e): live build 48fa7fd served empty article:published_time and article:author, because the head read the post through data:widgets.Blog.first.posts.first. The BlogPosting JSON-LD now sits in the Blog widget's postMeta (post views only) and the head reads no post data; the three article:* tags are dropped, BreadcrumbList stays.
- No description in the BlogPosting JSON-LD (US-L12f): live build 4b4ccca read the description double-escaped (\u0026amp;), because Blogger serves the post snippet HTML-escaped and .jsonEscaped escapes it again, with no unescape operator. Google's Article structured data does not recommend description, so it is dropped; headline, datePublished, dateModified, image, author and publisher stay.
- One BlogPosting per post (US-L12g): the Rich Results Test on live build 0ab9602 found a second BlogPosting, without author or image, read from the Ledger-base microdata on the post markup. The theme ships no microdata; the JSON-LD is the only BlogPosting, and classes and structure are unchanged.
- Dependencies: package.json overrides katex to 0.18.5 for GHSA-238p-pmpm-9mq7 (low), since mermaid 11.17.2, the latest release, still asks for katex ^0.16.47. npm audit now reports 0 findings. The override changes the development tree only; readers load Mermaid's own bundle from jsDelivr, which carries its own KaTeX until Mermaid updates it.
- Not taken: upstream publishing scripts (Drive publisher, IndexNow and Bing submission, GitHub research sync, companion link resolver), Ledger's tests and golden XML, and its package changes.
- Cleanup (US-L12d): removed the temporary merge tooling (ledger-merge.yml, port/merge.py, port/merge.json, port/merge-report.json) and, after its one run, the temporary lockfile refresh workflow.

The owner's view-source of live build 48fa7fd confirmed its build stamp, and his screenshots show the home page and the post at desktop width in both themes. His view-source of live build 4b4ccca confirmed the post-body JSON-LD with real dates and author (US-L12e) and showed the double-escaped description US-L12f removes. His Rich Results Test on live build 0ab9602 found the post's 2 Article items US-L12g reduces to 1. Human keyboard and screen reader review of the preview and the back-to-top button, and his evidence for the current build (build stamp, Rich Results Test with one Article item and no description, preview, back-to-top, 390 px, Layout), are pending. No merge or deployment is implied.

## Unreleased: Ledger v1.7.0 rebuild (PR #15, merged to main as 2611961)

- Rebuilt FCD Blogger on Ledger v1.7.0 (redwan-cse/ledger-blogger-theme at a3da05a8a70243c6ffc239b0e96e88260ed7b536), the owner's own theme that already runs natively, in place of the L1 shell of draft PR #14 (recorded in the next section, unmerged and superseded). Ledger's Blog1 dispatch, default markups, layout and features are kept; its personal identity, avatars and social links are replaced by Fast Cyber Defense.
- Identity and palette: the company logo (fastcyberdefense.com icon0.svg, inlined, no request) and the fastcyberdefense.com tweakcn palette at the exact site colours (owner decision 2026-10-06; tests/fcd/site-exact.ts lists the only accepted pairs below AA), with Inter and Fira Code.
- Hardening (US-L5): feed URLs only when http(s), same-origin feed requests abort after 8 s, Recent Posts never restores cached HTML, live search and catalog output escaped and validated, the catalog bounded to 10 pages of 50 posts, Mermaid securityLevel strict.
- Native upload fixes (US-L7, US-L8): fixed sections show only the theme's own widget, the FCD mark keeps its size, dark surfaces and rules use the dark tokens, comment actions and the author badge use the primary.
- Diagrams and callouts (US-L10): diagrams redraw from their kept source after a theme switch, Mermaid uses its base theme with the tweakcn colours in both modes, and the five callout types keep their own bars in dark mode with titles at AA or better.
- Comment logo (US-L11): only comments Blogger flags as by the blog author get the company logo; a commenter can no longer take it by putting "FCD" or "Fast Cyber Defense" in a display name.
- Dependencies: source-map-js 1.2.2 and dompurify 3.4.16 inside the existing ranges. katex <0.18.2 (low, via mermaid 11) stayed open below the moderate gate, as its only offered fix was a mermaid downgrade; the v1.8.0 port closes it with a katex override.
- CI: typecheck, a build bound to the exact source commit, the FCD unit checks, Ledger's V3 contract inside the no-egress namespace, npm audit, and a theme XML zip per fully green run; no generated XML is checked in.
- Cleanup (US-L6): removed the temporary port writer (port/apply.py, port/ledger.json, port/lockfile.json and ledger-port.yml), the temporary port review excerpt in ci.yml, and staging-check.yml, whose staging:check script no longer exists. The Ledger-derived files under src/ are ordinary FCD sources. The tests read the built XML through tests/fcd/markup.ts instead of the regular expressions CodeQL flagged as incomplete HTML sanitizers (9 high alerts, test code only).

The owner uploaded builds 26ca599 and then d1fd459 to the production blog on 2026-10-08. PR #15 was merged to main as 2611961 on the owner's approval (post-merge run 37748639356 green); his rendered evidence for the main build is pending.

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
