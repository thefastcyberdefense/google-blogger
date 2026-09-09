# Fast Cyber Defense Blog

Unreleased Google Blogger Layouts V3 / Widget Version 2 theme. PR #1 foundation and PR #2 technical content are merged; neither was deployed. PR A (Phase 2B editorial experience) is a separate unmerged draft.

## Build and architecture

Node 24.20.0 (`.nvmrc`), npm 11+, genuine locked dependencies. Pug, SCSS and bundled TypeScript generate one `dist/theme.xml`; no React, server or database. Do not edit generated XML manually. All automated project builds/tests run in GitHub Actions.

```sh
npm ci
npm run build
npm run preview
```

The commands above describe the pipeline/preview entry points; project acceptance execution remains Actions-based. Normal CI is read-only, with pinned actions, dependency audit, XML contracts, shared-presentation parity, unit and browser coverage. The checked-in XML retains its actual generating stamp; CI compares it with a fresh build while normalizing only that stamp. Final acceptance requires the exact latest head, not earlier passing stages.

## Editorial experience (PR A)

Initial homepage native order: one lead, up to two secondary cards, then standard cards. The lead spans the available stream before secondary cards; date groups retain their native hierarchy. Other catalogs use standard presentation. Local filtering switches to a compact grid, preserves original order, hides empty date groups and restores composition when cleared. Enter still uses native Blogger search, and counts explicitly cover only loaded articles.

Only an actual lead image is eager/high-priority. Missing images do not promote later posts. Responsive sources reserve dimensions. The first-slice cover policy is author-controlled: add class `fcd-article-cover` to an existing in-body figure with meaningful alt/caption. The theme does not add an extra hero, scrape the body or move/remove images. See docs/PHASE-2B-PR-A.md.

Long-form styling uses a bounded reading measure, normal-flow TOC and quieter CTA. Print omits controls, navigation and promotion while retaining readable article content and technical source. Automated print/reflow tests are not claims of human visual or assistive-technology approval.

## Technical content retained

Prism 1.30.0 bundles Bash, PowerShell, Python, JavaScript, TypeScript, SQL, JSON, YAML, Docker, HTTP and XML aliases. Original copy text is preserved; unknown/oversized blocks stay plain.

Mermaid 11.17.2 loads as exact-pinned optional jsDelivr ESM only for diagrams. Strict configuration, immutable source, serialized theme-aware rendering and accessible zoom/reset remain. Optional external library bytes are not part of XML bytes. Timeout cannot abort import() or impose a CPU deadline. No SVG export. See docs/TECHNICAL-CONTENT.md.

Vitest 4.1.11 is pinned after the earlier audit fix; PR A adds no dependencies.

## Verification and release boundaries

Merged baseline ec08c4b9d1ba2cd35d9ec8a9bcbe557f2d01ca3d passed post-merge Actions: https://github.com/thefastcyberdefense/google-blogger/actions/runs/34315679550 . Retain its 127 unit/contract and 594 browser regressions; additional editorial coverage must pass before PR A acceptance.

PR A measures base and current assets in Actions: XML <=500000 bytes, incremental raw CSS <=12288 bytes and JS <=2048 bytes. Gzip sizes are reported separately. No new runtime dependency/request is introduced by editorial presentation. The final PR description supplies current exact-head outcomes and artifacts; an intermediate failed run is not green.

`npm run preview` produces explicitly labeled synthetic shared-presentation specimens, not Blogger expression evaluation. `npm run staging:check` and the manual read-only workflow require owner-confirmed Blogger import/save and real eight-view configuration in FCD_STAGING_MANIFEST_JSON. They do not upload XML, seed posts or deploy.

Actual Blogger rendering, native comments/widgets/Layout, broader SEO/performance, non-Chromium and human accessibility remain separate release gates. Merge and production replacement require explicit approval. No credentials belong in theme or chat.

Related articles/feed refactoring and expanded discovery remain PR B; metadata/cross-browser/release acceptance remains PR C. SVG export, audio, analytics, publishing automation and infrastructure are excluded.
