# Fast Cyber Defense Blog

An **unreleased development foundation** for Google Blogger Layouts V3 / Widget Version 2, on PR #1 (`feat/fcd-blogger-foundation`). Main and production remain unchanged until separately authorized. Advanced publication features are explicitly deferred to the next milestone.

## Build and preview

Node **24.20.0** (`.nvmrc`), npm 11+, committed npm-generated lockfile.

```sh
npm ci
npm run build
npm run preview
```

Pug + SCSS + bundled TypeScript compile into `dist/theme.xml`, with no frontend framework, server or database. Do not hand-edit XML. The checked-in artifact preserves the build stamp of the Actions revision that generated it; CI compares its content with a fresh build while normalizing only that stamp. Select the latest successful Actions artifact for a new deployment candidate.

Preview: localhost:4173, with `/`, `/article`, `/paged`, `/empty`, `/error`. These use shared production presentation and modeled native wrappers with synthetic data. **They are not Blogger-rendered pages or an expression interpreter.**

## Foundation scope

Native V3/V2 identities and dispatch, initial FCD light/dark tokens/header/cards/article/sidebar/footer, native labels/search/pagination, safe Recent Posts, inline loaded-card search, keyboard navigation, TOC, copy actions, reading time on posts, metadata and CSS-contained technical content. The narrow-screen masthead and search can wrap at enlarged text sizes.

Wide tables scroll locally before JavaScript. Enhancement adds a labeled, focusable scroll wrapper. For authors who need reliable no-JS keyboard access across browsers, use `<table tabindex="0" aria-label="Scrollable evidence matrix">`, a meaningful `<caption>`, and `<th scope="col">` headers. Do not strip native table semantics or rely on global overflow hiding.

## Required verification

All automated project verification runs in **GitHub Actions**, never in the editing sandbox. PRs test their exact head with pinned actions and read-only permissions. No production secrets or deployment jobs are included.

Gates: clean install, strict TypeScript, build, XML/native-render contracts, unit/contract tests with negative controls, shared markup parity, Chromium responsive/interaction/axe tests, dependency audit and generated artifact consistency. A stale XML gate remains a failure even if earlier tests passed.

The browser matrix covers 11 widths and both themes, five simulated page states, JS-disabled core rendering, open navigation/TOC, no-result announcements, clipboard success/denial, storage failure, reduced motion, skip-link focus, local keyboard scrolling and 200% text scaling. Accessibility tests retain table/column-header role assertions. This is not human screen-reader coverage, 400% browser zoom verification or complete WCAG conformance.

[PR #1 and current acceptance evidence](https://github.com/thefastcyberdefense/google-blogger/pull/1). Trust the check on the exact latest head, not an old count. Artifacts contain regenerated XML, screenshots, axe reports, unit JSON and Playwright JSON/HTML reports (14-day retention).

## Native contract boundaries

`tools/validate-xml.py` protects the actual FCD shell/widget/include/data boundaries. Mutation tests remove or corrupt skin, native body/metadata/comment/pagination calls, widget placement/locking, root version and unique identities to prove failures are detected. Passing means static contract preservation, not validated native Blogger semantics. The inherited native comments and widgets still need staging tests.

## Before production

See [deployment guide](docs/DEPLOYMENT.md). Export existing theme/content and widget configuration, import/save to a separate staging Blogger blog, verify the exact stamp and real page types/comments/feeds/widgets. Production replacement needs separate approval. Rollback restores saved XML/widgets. The owner waived the inaccessible old live-blog audit, not future import/render validation.

## Next milestone and remaining gates

Mermaid, syntax highlighting, related-label articles, separate lead/secondary editorial composition, cover handling, card reading time, deeper SEO/widget contracts, performance budgets and final polish remain next-milestone work. Actual Blogger import/render, full page-type/native functionality and human accessibility remain release gates. Foundation completion does not imply those are done.

## Development and provenance

See [project plan](docs/PROJECT-PLAN.md), [design system](docs/DESIGN-SYSTEM.md), [audit](docs/UPSTREAM-AUDIT.md), `AGENTS.md` and LICENSE. Ledger engine reference: 692a82463cb8d0869a6f5e7c946ecc757cacb7e2, with owner-confirmed reuse. FCD's company site is the brand/business source of truth. Personal Ledger identity, analytics and publishing automation were not copied.

FCD Superpowers and FCD Accessibility Reviewer are approved ClickUp skills, not CLI plugins or continuously running agents. Suggested read-only evaluations: “Review FCD foundation against the latest Actions evidence” and “Identify remaining actual-Blogger and human accessibility gates.” Skill baseline evaluations remain unexecuted.
