# Fast Cyber Defense Blog

Unreleased Blogger Layouts V3 / Widget Version 2 theme. Foundation, technical content and PR A editorial presentation are merged without deployment. PR B content discovery is an unmerged feature branch.

## Architecture and build

Node 24.20.0, npm 11+, genuine locked dependencies. Pug/SCSS/bundled TypeScript compile one dist/theme.xml; no React, backend or database. Automated project execution stays in GitHub Actions. Entry points: npm ci, npm run build, npm run preview. Never edit generated XML manually.

Normal CI uses pinned actions and contents:read; no deployment secrets. Typechecks, XML/native contracts, dependency audit, regression suites and generated XML parity are mandatory. Historic build metadata is the only normalized difference between checked-in and freshly built XML. Use exact-head run evidence, not older green stages.

## Editorial and technical features

Initial home renders one lead, up to two secondary and standard native-order cards. Lead images are eager/high priority; missing images do not reorder posts. Shared presentation retains native wrappers. An existing author figure may use fcd-article-cover; no automatic extra cover or body rewriting. Reading measure, normal-flow TOC and print styling retain readable technical content.

Prism 1.30.0 bundles explicit technical grammars, original copy payload and plain fallback. Mermaid 11.17.2 is an optional exact-pinned jsDelivr ESM dependency, loaded only for diagrams with strict config, retained source and bounded zoom. External Mermaid bytes are separate from XML. Timeout does not cancel ESM or impose a CPU deadline. No SVG export.

## Content discovery (PR B)

Post views share one bounded feed response between Recent Posts and related articles. At most three related titles rank by distinct shared labels, then date and stable identity; no matching content yields honestly labeled latest articles. Current article and duplicates are excluded. Static/catalog views retain only their existing Recent Posts request.

Transport limits: post request 50 candidates, non-post request 8; 500000 accepted decoded bytes, 8 seconds including body reading; one automatic attempt plus one shared explicit retry. No automatic pagination, persistent cache, recommendation images, backend, JSONP or new dependency. Feed HTML is never inserted or cached. Native topic/latest links survive failure or disabled JS.

Typing filters loaded catalog cards only. Clear filter restores order and focus; Enter uses native Blogger search for the full publication. No whole-archive client index is claimed.

## Verification and budgets

PR A baseline 18b127d014e5d02a860603b18f10dd6c7ab81169 passed post-merge Actions run 34338858565 with inherited 129 unit/contract and 792 browser coverage. PR B adds tests without removing those safeguards.

PR B approved growth limits against an Actions-built PR A baseline: raw JS +8192 bytes, CSS +2048; XML <=500000. Raw/gzip evidence reported separately. Earlier PR A limits and measured sizes remain in docs/PHASE-2B-PR-A.md. See PR #4 for the actual latest outcome; pending artifact transfer is not completion.

## Staging and release

Fixtures model shared presentation, not Blogger expression execution. Configure FCD_STAGING_MANIFEST_JSON only after owner-confirmed import/save with real eight-view URLs and exact stamp. The manual read-only workflow does not import, seed, deploy or merge.

Feeds require a public compatible blog and may be disabled/truncated/redirected; the theme does not change settings. Actual Blogger rendering, native comments/Layout, human accessibility and broader browser/field performance remain release gates. No credentials in XML or chat. Merge/deployment/deletion require separate approval. See docs/DEPLOYMENT.md and docs/PHASE-2B-PR-B.md.
