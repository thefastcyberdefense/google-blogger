# Fast Cyber Defense Blog

Unreleased Blogger Layouts V3 / Widget Version 2 theme. Foundation, technical content, editorial presentation and content discovery are merged without deployment. PR C is the isolated metadata/cross-browser acceptance phase.

## Build and size policy

Node 24.20.0, npm 11+, genuine locked dependencies. Pug/SCSS/bundled TypeScript compile one dist/theme.xml. No React, backend or database. All automated project execution is in GitHub Actions; npm ci, npm run build and npm run preview are pipeline/fixture entry points. Never hand-edit generated XML.

**Owner policy, 10 September 2026: only total raw generated XML is capped at 500,000 bytes (500 KB). There are no fixed raw bundled JavaScript, compiled CSS or per-phase growth limits.** Raw/gzip component sizes remain informational for performance review. This supersedes historical PR A/B growth budgets without changing their historical evidence. Security, accessibility, input limits and dependency audits still apply.

Normal CI is read-only with pinned actions and no deployment credentials. Tests, native XML contracts, metadata validation, audit and generated-output consistency remain mandatory. A historical source stamp is the sole normalized difference between checked-in XML and fresh output.

## Retained features

Native-order homepage lead/secondary/standard cards, responsive lead-image priority, author-controlled existing in-body cover convention, loaded-card filtering and clear/reset. Enter searches the full publication through native Blogger, not a partial feed index.

Prism 1.30.0 explicit technical grammars; optional Mermaid 11.17.2 exact-pinned jsDelivr ESM with strict config, source fallback and bounded controls. Third-party Mermaid bytes are outside XML. UI timeout cannot interrupt synchronous parsing or abort ESM. No SVG export.

Bounded shared feed request: up to50 recent candidates for posts/up to8 elsewhere, max500000 accepted decoded bytes and8 seconds per attempt. One automatic attempt plus one shared explicit retry, no persistent cache/pagination/JSONP/proxy. Up to3 related articles, up to5 Recent Posts; current article excluded. Native links remain available on private/disabled/redirected/truncated feed failures. These request caps are safety limits, not CSS/JS size caps.

## PR C acceptance

Conditional author/publication-date metadata omits absent native values rather than inventing them. all-head-content remains the canonical/base metadata owner. A bounded parsed-output validator checks title/canonical/social metadata and article JSON-LD consistency for eight configured view types. Tests use synthetic rendered-output expectations, not a Blogger expression interpreter. Optional author/date/image fields are not invented or falsely described as mandatory Google properties.

All22 existing Chromium viewport/theme projects are retained. Representative Firefox and WebKit tests cover390/1280 pixels, light/dark, normal/fallback/keyboard/print/no-JS and actual-library behavior. Engine tests are not proof of every Safari/iOS device or human screen-reader conformance. Per-test screenshots, traces, axe results/incomplete checks, request logs and synthetic timing observations are attached to Actions. Timing observations are not real-user LCP/INP/CLS.

Read docs/PHASE-2B-PR-C.md and the current draft PR for exact-head outcomes; planned checks, partial green stages and artifact transfers are not final acceptance.

## Staging and release

Actual Blogger import/save is still required. Configure the read-only staging workflow only after owner-confirmed import with real eight-view URLs and exact build stamp. Scripts/resources are blocked during parsed HTML inspections; native interactions and human checks are separate. No automated upload, deployment, article publication, DNS change, branch deletion or indexing-policy change is authorized by PR C.

Source merge readiness, native platform acceptance and production release remain distinct. No credentials in theme or chat. The three workflow adaptations FCD Superpowers, Ralph and GSD remain in use, with specialist review as relevant.
