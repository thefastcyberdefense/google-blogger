# Fast Cyber Defense Blog: Project Plan

Status: initialization in progress. Prepared 2026-09-08. No production deployment authorized.

## 1. Current repository

The target began with only README.md on main at 14eea8a02b66086d826c3bf8bff9a57817b64235. Development is isolated on feat/fcd-blogger-foundation. The owner confirmed ownership of Ledger, waived the inaccessible live FCD blog audit, approved the initial implementation scope and requires all automated builds/tests in GitHub Actions. Future Blogger import validation is not waived.

## 2. Ledger architecture audit

Reference: redwan-cse/ledger-blogger-theme at 692a82463cb8d0869a6f5e7c946ecc757cacb7e2. Inspected package.json, LICENSE, README, theme.pug, defaultmarkups/blog.pug, widgets/blog.pug, blog-post.pug, blog-comments.pug, blog-archive.pug, partials/head-meta.pug, tools/generate.ts, tools/render-harness.ts, tests/render/a11y.spec.ts and CI. Inventoried remaining widgets, default markups, tools and tests; inventory alone is not a completed source audit.

The compiler combines Pug, Sass and esbuild into one XML, with V3 root attributes, default widget version 2, full commit build stamp and 500000-byte budget. Blog1 and default markup delegate through super.main. Native threaded/non-threaded comments have actual dispatch, iframe and template-script plumbing. SEO uses all-head-content plus escaped JSON-LD. The real-site harness rejects a stale deployed build before assessing rendered views.

The public blogs.redwan.work extraction yielded only title/standfirst. No live visual or interaction audit was obtained. Upstream test counts and badges are not FCD test evidence.

## 3. Reuse

Reuse reviewed V3 attributes, widget identities, super.main/native render dispatch, native expression patterns, comments, labels, archives, responsive-image logic, and compilation/verification architecture. Preserve upstream notices. Do not copy generated XML, personal content, screenshots, caches, scratch material or publishing automation. Review remaining modules before porting.

## 4. Redesign and corrections

Redesign masthead, information hierarchy, lead/latest grid, article typography, bylines, sidebar, inline search, TOC, business CTA and footer. theme.pug restores cached strings into innerHTML twice: replace with safe DOM/data caching. Sidebar current-page posts are not globally recent on filtered pages. Existing page-number markup assumes only pages 1/2: retain honest native older/newer navigation. Remove personal avatars, follower IDs, social identities, analytics/Clarity settings and hardcoded author sameAs. Update image sizes to actual FCD layout. Do not fabricate authors, dates, severity, CVEs or categories.

## 5. Visual direction

Production source is thefastcyberdefense/fastcyberdefense at f2b0cfa205ce9009ae0f1abbdd2a6d2e438dd643: README identifies fastcyberdefense.com and matches fetched slogan. globals.css has primary oklch(0.6386 0.1467 251.2451), light text oklch(0.2954 0.0649 265.7059), light surface oklch(0.9743 0.0101 228.8865), dark background oklch(0.1971 0.0414 269.7076), dark surface oklch(0.2441 0.0456 268.3692), dark text oklch(0.9288 0.0126 255.5078). Inter is actively loaded in layout.tsx; other font tokens do not prove loading.

Create an editorial security briefing: compact FCD masthead, blue/navy identity, asymmetric lead-story emphasis, calm metadata and readable technical prose. No fake terminals, neon effects, glass cards or huge marketing hero. Include named background/surface/elevated/border/muted/primary/secondary/text/status/code/focus roles in both themes. Measure contrast; role-specific accessible variants may differ from the corporate accent. Source review does not equal computed live-style verification.

## 6. Architecture

Use src/theme.pug, partials/, defaultmarkups/, widgets/, styles/, scripts/, tools/, tests/, fixtures/, docs/, dist/theme.xml. Pug + SCSS + TypeScript remain the source; no frontend framework or server/database. Node 24.20.0 is the officially verified current Node 24 LTS. Use an authentic dependency lock, bundle imported TS modules with esbuild.build rather than entry-only transform, and retain deterministic build/size checks.

## 7. Blogger compatibility

Preserve Layouts V3, Widget Version 2, Blog1, Header1, b:defaultmarkups, super.main, all-head-content and native section/widget boundaries. Core posts, labels, archive/navigation and search submit work without theme JS. Blogger comments can still depend on native scripts. XML parsing/contract tests cannot prove Blogger import or render compatibility. Staging upload/save and actual rendered page checks are separate release gates.

## 8. Homepage

Compact branding/navigation; short publication identity; one lead plus two secondary stories when available; latest grid; real-label topics; useful sidebar; company footer. Do not duplicate stories or invent content for empty blogs. Logo links home, without redundant Home icon. Inline search filters loaded titles/labels/excerpts/dates; clearly distinguish that scope from native whole-blog search. Slash/Ctrl/Cmd+K must not hijack editable fields.

## 9. Article/sidebar

One H1, native category/author/dates, optional excerpt, reading time, share controls and nonduplicated cover. Prose around 68ch; support tables, code, captions, headings and notes/warnings. Recent Posts uses bounded same-origin feed data with checked URLs and safe DOM; retain a native latest/feed fallback on failure. TOC uses unique IDs, active sections, proper offsets and accessible collapse. Review upstream code/Mermaid modules before reuse, lazy-load pinned optional dependencies, preserve readable fallback. Related content must match shared labels and exclude the current post.

## 10. Responsive

Test 320,360,375,390,430,640,768,1024,1280,1440,1920px, both themes, menu states, long titles/URLs/labels, missing images, tables, code, diagrams, TOC, widgets and footer. Use min-width:0/minmax and local overflow, not global clipping. Sticky content must not obstruct content/footer. Test zoom/text scaling independently.

## 11. SEO

Preserve all-head-content canonical/title/description/OpenGraph and verify no duplicates. Page-specific escaped WebSite/BlogPosting/BreadcrumbList/Organization; truthful author/date/image data. Cover home/post/label/free-text search/archive/static/error/pagination, distinguishing label pages from free-text indexing policy. Validate rendered JSON-LD, including script-closing input cases.

## 12. Accessibility

WCAG 2.2 AA target: skip link, semantic headings/landmarks, visible focus, labels, keyboard navigation, safe focus management, reduced motion, contrast and touch targets. Escape closes drawers and returns focus; focus traps only for modal behavior. Announce result/copy states without interruptions. Axe plus behavior tests is not a substitute for human assistive-technology assessment.

## 13. Testing/security

All automated tests/builds execute in GitHub Actions, not the editing sandbox. Required gates: npm ci, typecheck, build, XML parsing, Blogger contracts, Vitest, responsive Playwright, axe, dependency audit and deployment checks. Use commit-specific run links/logs/artifacts. Report missing/stale/skipped checks as such, not passes. Fixtures simulate layouts, not Blogger expressions. Security cases cover untrusted feed/cache strings, unsafe URLs, DOM injection, storage failure and external scripts. No secrets in generated output. No production credentials needed for source CI.

## 14. Deployment

Export current theme/content and record widget settings. Import to a separate staging Blogger site, save through Blogger, verify build stamp and real page types/comments/feeds/metadata/no-JS content. Only then consider separately approved production replacement. Rollback restores saved theme/widgets. No DNS changes, upstream post migration or automatic publishing. Centralize corporate URLs and verify exact routes; until verified use company root.

## 15. Milestones

M0: this plan, provenance and approved reviewer skills. M1a: installable build and reviewed native renderer. M1b: FCD tokens/header/home/article/Recent Posts/search/SEO/a11y. M1c: actual Actions evidence, build artifacts and deployment docs. M2: complete advanced technical content, related search and actual Blogger import/performance validation.

Logical commits separate plan, build, renderer, design/header, home/sidebar, article, SEO/a11y, tests/CI and fixes. Main remains untouched. Completion requires evidence against the original requested milestone; neither plan nor compilation alone counts.

## Development skills

FCD Superpowers and FCD Accessibility Reviewer were approved and saved as ClickUp skills. They are project-specific workflow/reviewer adaptations, not claims that CLI plugins or an autonomous background agent were installed. All automated project verification remains in Actions. Human screen-reader review and actual Blogger import remain distinct.

## References

https://github.com/redwan-cse/ledger-blogger-theme
https://github.com/obra/superpowers
https://fastcyberdefense.com/
https://nodejs.org/en/blog/release/v24.20.0
https://support.google.com/blogger/answer/46888?hl=en
https://playwright.dev/docs/accessibility-testing
