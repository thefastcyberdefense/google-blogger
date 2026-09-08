# Fast Cyber Defense Blog: Project Plan

Updated 2026-09-08. Scope decision: the owner approved completing **foundation hardening**, keeping advanced publication features for the next milestone. Main, merging and production deployment remain outside this work. Accept the foundation only against successful checks on the exact final PR head.

## 1. Current repository and authority

The target began with README.md only on main at 14eea8a02b66086d826c3bf8bff9a57817b64235. Development is isolated on feat/fcd-blogger-foundation in PR #1. The owner confirmed ownership of Ledger, waived the inaccessible live-blog audit, and requires all automated project verification in GitHub Actions. The waiver does not waive future Blogger import/render validation. Use the project-requested workspace GitHub connection.

## 2. Ledger architecture audit

Reference: redwan-cse/ledger-blogger-theme at 692a82463cb8d0869a6f5e7c946ecc757cacb7e2. Read package/license/docs, theme shell, Blog default markup, Blog1/post/comments/pagination, metadata, compiler, real-render harness, accessibility test and CI; inventoried remaining modules. Inventory and upstream badges are not proof of a full port. The live personal-blog extraction yielded only title/standfirst, not a visual audit.

## 3. Reuse

Preserve reviewed V3/V2 root/widget conventions, Blog1/Header1 identities, super.main data preparation and dispatch, native expression patterns, labels/cursors, compilation/build stamp and static/runtime verification distinction. Preserve applicable license notices. Do not import upstream personal identities, avatars, tracking IDs, publishing automation, post content, screenshots or scratch data.

## 4. FCD-specific work

FCD owns the visual identity, responsive masthead, card/article design, safe Recent Posts, loaded-card filtering/native search fallback, theme toggle, TOC, copy controls and company footer. The former raw-HTML-cache pattern was not ported. Initial URL-validator, deployment-check and fixture-drift defects were fixed with red/green Actions evidence; see UPSTREAM-AUDIT.md.

## 5. Visual direction

Corporate brand source: thefastcyberdefense/fastcyberdefense at f2b0cfa205ce9009ae0f1abbdd2a6d2e438dd643, identified as fastcyberdefense.com production by its README. Inspected globals.css/layout.tsx: primary oklch(0.6386 0.1467 251.2451), light text oklch(0.2954 0.0649 265.7059), light surface oklch(0.9743 0.0101 228.8865), dark background oklch(0.1971 0.0414 269.7076), dark surface oklch(0.2441 0.0456 268.3692). Inter is the corporate font; this theme uses local Inter/system and Fira Code/system fallbacks without remote font downloads. Blue/navy editorial presentation, not neon, fake terminals, large gradients or glass effects. Functional contrast colors are role-specific, not blindly copied brand accents.

## 6. Repository architecture

Node 24.20.0 LTS, genuine committed npm lockfile. Modular src/theme.pug, partials/, defaultmarkups/, widgets/, styles/, scripts/, tools/, tests/, fixtures/, docs/ and dist/theme.xml. Pug + Sass + bundled TypeScript, no React/Vue/server/database. Shared presentation mixins connect production and simulation; native expressions and widget declarations remain explicit boundaries. No invented Blogger interpreter.

## 7. Native Blogger contracts

Static gate enforces V3 root, V2 widgets, no legacy root, one skin/head/body/build stamp, unique section/widget/includable identities, locked Blog1 under main#content, Header1, skip link, single-item body flag, required includables, actual post-body expression, post/comment dispatch, pagination cursors, empty state and one all-head-content owner. Mutation tests prove broken versions are rejected while comments describing banned syntax remain allowed. These checks protect this project's contract, not every Blogger include or runtime semantic rule. super.commentPicker and inherited widgets still require actual staging validation.

## 8. Homepage foundation

Implemented compact brand/navigation, real-label topics, loaded-card filtering, lead-card styling, card title/excerpt/author/date, sidebar and footer. Native whole-blog search submission remains available. A dedicated lead-plus-secondary editorial composition, complete card reading time and final editorial polish belong to the next milestone, per the latest scope approval.

## 9. Article foundation

Native body and H1, truthful native metadata, responsive prose/callouts/code, copy controls, TOC, safe sidebar feed and company CTA. Tables now scroll locally via CSS without waiting for JS. Enhanced tables use a labeled keyboard-operable wrapper. Post authors should include caption, header scopes and tabindex=0 for wide tables when cross-browser no-JS keyboard access is required. Advanced syntax highlighting, Mermaid rendering, related-label articles and cover-duplication handling remain next-milestone work.

## 10. Responsive and accessibility behavior

Actions matrix covers 320,360,375,390,430,640,768,1024,1280,1440,1920px in light/dark themes. Five simulated views: home, article, paginated, empty and error; all have no-theme-JS coverage. Shared/native-wrapper fixtures include real image attributes and a twelve-column evidence table. Additional checks cover 200% text scaling, skip-link focus, horizontal keyboard scrolling, search/escape, clipboard success/denial, storage failure and reduced motion. Header/search flex layouts may wrap rather than force page overflow. Do not hide problems with global overflow clipping.

## 11. SEO

Native all-head-content remains canonical/base metadata owner; page-specific escaped WebSite/BlogPosting/BreadcrumbList/Organization markup exists. Full rendered page-type uniqueness and JSON-LD edge cases, labels-versus-free-text indexing, image metadata and performance are still release/next-milestone gates. Source checks are not a search-engine or Blogger-rendered validation result.

## 12. Accessibility acceptance

Automated axe A/AA checks cover initial/expanded navigation, open article TOC and no-result states across five fixture views. Preserve visible focus, labels, landmarks, announcements, semantic table/column-header roles, reduced motion and native fallbacks. 200% text scaling is not a claim of 400% browser zoom. Human screen-reader/inclusive testing and actual imported-page accessibility remain pending. No blanket axe exceptions or skipped failures are accepted.

## 13. Actions verification and hardening evidence

All automated builds/tests run in Actions; local editing/source review only. Required checks: npm ci, typecheck, build, static XML, unit/contract mutation tests, shared-presentation parity, Chromium browser/axe checks, dependency audit and checked-in/generated XML consistency (normalizing only the historical stamp value).

Hardening red baseline: https://github.com/thefastcyberdefense/google-blogger/actions/runs/34255006028/job/102158765768 recorded 67 passed and 15 failing regressions. Follow-up run 34255435310 passed all 82 unit/contract tests, but browser checks exposed 320px text scaling and an incorrect End-key assumption. Those were corrected without relaxing horizontal-scroll or overflow assertions. Do not use that failed run as final acceptance; the exact final PR head must pass its complete pipeline.

The XML consistency gate remains mandatory. It runs after behavioral tests to expose actionable failures before artifact refresh, not to waive stale output. Any temporary branch-limited artifact writer is removed before acceptance; normal CI is read-only and never deploys.

## 14. Staging, deployment and rollback

Before production: export current theme/content, record widgets, seed a separate staging Blogger site, import/save the exact XML, verify source stamp and actual home/post/label/search/archive/static/error/paginated views plus native comments/feeds/widgets. Run automated checks from Actions. Native upload/save and human checks require separate evidence. Restore saved XML/widget settings on rollback. No main-site or DNS change, upstream content import or publication is part of this work. Use only verified company links.

## 15. Milestone boundary and completion

**Foundation acceptance:** code/build infrastructure, FCD initial templates and progressive enhancements, three reviewed blocker fixes, hardened static contracts/no-JS tables/accessibility tests, reproducible XML and up-to-date operating docs; accepted only after final-head Actions pass. This is an unreleased development baseline, not the entire original publication definition of done.

**Next milestone:** advanced technical content, editorial composition/cover/card metadata, related content, deeper native widget/SEO/performance coverage and final polish.

**Production gates:** actual Blogger import/render and native behavior, broader page-type tests, performance evidence and human accessibility. None is silently marked passed by fixture CI.

FCD Superpowers and FCD Accessibility Reviewer are saved ClickUp skills, not background agents or installed CLI plugins. Source review here is sequential self-review, not independent external approval. User authorization is still required to merge or deploy.

References: https://github.com/redwan-cse/ledger-blogger-theme ; https://github.com/obra/superpowers ; https://fastcyberdefense.com/ ; https://nodejs.org/en/blog/release/v24.20.0 ; https://support.google.com/blogger/answer/46888?hl=en ; https://playwright.dev/docs/accessibility-testing ; https://developer.mozilla.org/en-US/docs/Web/CSS/overflow
