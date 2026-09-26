# FCD Blogger Theme — Comprehensive Local QA, Browser, Security & Accessibility Report

- **Repository**: `thefastcyberdefense/google-blogger`
- **Evaluated Commit (`HEAD` & `origin/main`)**: `ecb1d438e8b3227911dc76359b9e05f127867b27` (merge of PR #10 commit `83d33edfa23c4750ee488e1b2696be597cc8b114`)
- **Evaluation Date (UTC)**: `2026-09-26`
- **Isolated Evidence Root**: `test-results/local-qa-ecb1d438/`
- **Tracked Repository Mutation Status**: **UNTOUCHED** (`git status --short` and `git diff` on `j:\DevDrive\google-blogger` are completely empty)
- **Production / External Network Contact**: **0 outbound requests** (enforced by 3-layer fail-closed network isolation harness `harness/network-isolation.mjs`)

---

## 1. Executive Summary & Gate Status

| Gate / Verification Domain | First-Run Status | Diagnostic / Supplemental Status | Summary |
| :--- | :--- | :--- | :--- |
| **1. Clean Dependency Install (`npm ci --ignore-scripts`)** | `PASS` | `PASS` | 227 locked packages installed in disposable checkout (`11,062 ms`, `exit=0`). |
| **2. TypeScript Typecheck (`npm run typecheck`)** | `PASS` | `PASS` | `tsc --noEmit` passed with 0 errors (`2,481–3,001 ms`, `exit=0`). |
| **3. Theme Build & XML Consistency (`npm run build`)** | `PASS` | `PASS` | Compiled `dist/theme.xml` (`101,248` bytes LF) matches `HEAD:dist/theme.xml` byte-for-byte after normalizing the single `meta[name="theme-build"]` stamp. |
| **4. Static XML Contract (`npm run contract:check`)** | `PASS` | `PASS` | `tools/validate-xml.py` + `tools/metadata-check.ts` passed (`564–658 ms`, `exit=0`). |
| **5. Vitest Unit & Contract Suite (`npm test`)** | `FAIL` (`210/211`) | `PASS` (`211/211` LF rerun) | First run on default Windows Git checkout (`core.autocrlf=true`) failed 1 test (`tests/unit/related-posts.test.ts:17`) due to `\r\n` vs `\n` string match (**DEFECT-01**, existing test/repo line-ending defect). Restoring Git blob LF line endings passed `211/211`. |
| **6. Playwright Render Matrix (`npm run test:render`)** | `PASS` (`1,434/1,434`) | `PASS` (`+96/96` supplemental) | All `1,434` scheduled browser checks across `30` projects (`22` Chromium viewports `320–1920px` light/dark + `8` Firefox/WebKit acceptance projects) passed on the first run (`0` failures, `0` retries, `0` flaky). Supplemental cross-engine `native-states.spec.ts` run on Firefox & WebKit (`390px`/`1280px`, light/dark) passed `96/96`. |
| **7. Python Artifact Verifier (`unittest discover`)** | `FAIL` (`30/31`) | `PASS` (`31/31` raw `ZipInfo`) | First run on Windows failed 1 subtest (`test_unsafe_names` `name='test-results\\escape'`) because test helper `packed()` in `tests/artifact/test_verify_artifact.py:33` passes a `str` filename to `ZipFile.writestr()`, which normalizes `os.sep` (`\`) to `/` on Windows (**DEFECT-02**, test helper defect). Production `tools/verify-artifact.py:127` properly rejects raw backslash ZIP entries (`31/31` pass when `ZipInfo.filename` is set directly). |
| **8. Dependency Vulnerability Audit (`npm audit`)** | `PASS` | `PASS` | `0` vulnerabilities (`critical: 0, high: 0, moderate: 0, low: 0`) across 228 audited packages. |
| **9. Deep Accessibility & WCAG 2.2 AA Audit** | `PASS` (`0` violations) | `PASS` with `2` Low findings | `0` axe `violations` across all 28 scanned view/viewport/theme/interactive states; full `incomplete` inspection identified `aria-prohibited-attr` on 3 roleless containers carrying `aria-label` (**DEFECT-03**) and `.primary-navigation > a` height at `42.4px` vs `44px` internal target (**DEFECT-06**). |
| **10. Technical Content & Mermaid Resilience** | `PASS` | `PASS` with `1` Low finding | Real pinned Prism `1.30.0` and Mermaid `11.17.2` verified. In >10-diagram articles mixing `pre.mermaid` and `pre > code.language-mermaid`, `initDiagrams()` queries the two selectors sequentially rather than in document order (**DEFECT-04**). |
| **11. Native Blogger Runtime & Human AT Validation** | `NOT RUN` (Pending) | `NOT RUN` (Pending) | Local shared-presentation fixtures do not prove live Blogger XML import/save, native Blogger expression evaluation, real HTTP 404/canonical headers, native comment iframe runtime, Layout editor behavior, or human screen-reader (NVDA/JAWS/VoiceOver) certification. |

---

## 2. Environment & Toolchain Matrix

| Component | Host Default | Isolated QA Execution Environment | Notes |
| :--- | :--- | :--- | :--- |
| **Active Workspace** | `j:\DevDrive\google-blogger` | `j:\DevDrive\google-blogger\test-results\local-qa-ecb1d438\checkout` | Disposable detached clone at `ecb1d438e8b3227911dc76359b9e05f127867b27`. |
| **Git `HEAD` & `origin/main`** | `ecb1d438e8b3227911dc76359b9e05f127867b27` | `ecb1d438e8b3227911dc76359b9e05f127867b27` | Merge commit of PR #10 (`83d33edfa23c4750ee488e1b2696be597cc8b114`, parent `bcb5b82706568c2f6f29cd1795b2589767e42146`). |
| **Operating System** | `Microsoft Windows NT 10.0.26200.0` (`AMD64`) | Same | Windows 11 24H2 x64 workstation. |
| **Node.js** | `v24.19.0` (`C:\Program Files\nodejs\node.exe`) | `v24.20.0` (`toolchain/node-v24.20.0-win-x64/node.exe`) | Host default was below `.nvmrc` (`24.20.0`) and `package.json` `engines.node` (`>=24.20.0 <25`). Official `node-v24.20.0-win-x64.zip` verified against `SHASUMS256.txt` (`6cac9ffbca8f6a47091e4b5c772e0606049c3871cb67d900c0cedde630e545ba`). |
| **npm** | `11.6.2` | `11.19.0` | Bundled with portable Node `v24.20.0`. |
| **Python** | `python` = `3.14.7` (`C:\Python314\python.exe`); `python3` = Windows Store stub (`exit=9009`) | `python3.exe` wrapper -> `C:\Python314\python.exe` (`Python 3.14.7`) | `npm run contract:check` invokes `python3 tools/validate-xml.py`; resolved via portable `python3.exe` shim in `toolchain/`. |
| **Playwright & Browsers** | `@playwright/test` `1.59.1` | Chromium `151.0.7922.34` (build `v1217`), Firefox `153.0` (build `v1513`), WebKit `26.5` (build `v2269`) | Installed via `npx --no-install playwright install chromium firefox webkit`. |
| **Accessibility Engine** | `@axe-core/playwright` `4.11.2` | `axe-core` `4.10.3` | Executed with tags `['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']`. |

---

## 3. Command Execution Log & Timing Summary

All raw logs are preserved under `test-results/local-qa-ecb1d438/evidence/logs/`. First-run failures are preserved separately from diagnostic reruns.

| Stage | Command | Start (UTC) | End (UTC) | Duration | Exit Code | Result Counts | Evidence / Log Path |
| :--- | :--- | :--- | :--- | ---: | :---: | :--- | :--- |
| **01** | `npm ci --ignore-scripts --no-audit --no-fund` | `2026-09-26T13:05:54.955Z` | `2026-09-26T13:06:06.019Z` | `11,062 ms` | `0` | 227 packages added | `evidence/logs/01-npm-ci.log` |
| **02** | `npm run typecheck` | `2026-09-26T13:47:34.210Z` | `2026-09-26T13:47:36.691Z` | `2,481 ms` | `0` | 0 TypeScript errors | `evidence/logs/02-typecheck.log` |
| **03** | `npm run build` | `2026-09-26T13:47:36.695Z` | `2026-09-26T13:47:37.906Z` | `1,211 ms` | `0` | `dist/theme.xml` (`101,248` B) | `evidence/logs/03-build.log`, `evidence/build-size.json` |
| **04** | `npm run contract:check` | `2026-09-26T13:47:37.909Z` | `2026-09-26T13:47:38.473Z` | `564 ms` | `0` | XML & metadata contract pass | `evidence/logs/04-contract-check.log` |
| **05** | `npx --no-install playwright install chromium firefox webkit` | `2026-09-26T13:08:15.590Z` | `2026-09-26T13:09:37.825Z` | `82,232 ms` | `0` | 3 browser engines ready | `evidence/logs/05-playwright-install.log` |
| **06 (First Run)** | `npm test -- --reporter=default --reporter=json --outputFile=unit-report.json` (`core.autocrlf=true`) | `2026-09-26T13:13:00.806Z` | `2026-09-26T13:13:14.610Z` | `13,804 ms` | `1` | **210 passed, 1 failed**, 0 skipped (16 files) | `evidence/unit-report-first-run.json`, `evidence/logs/06-unit-test.log` |
| **06b (Diag Rerun)** | `npm test -- --reporter=default --reporter=json --outputFile=unit-report-lf-rerun.json` (`core.autocrlf=false`) | `2026-09-26T13:23:52.698Z` | `2026-09-26T13:24:04.360Z` | `11,660 ms` | `0` | **211 passed, 0 failed**, 0 skipped (16 files) | `evidence/unit-report-lf-rerun.json`, `evidence/logs/06b-unit-test-lf-rerun.log` |
| **07** | `npm run preview -- --build-only` | `2026-09-26T13:47:38.476Z` | `2026-09-26T13:47:40.831Z` | `2,355 ms` | `0` | 26 `.preview/*.html` fixtures built | `evidence/logs/07-preview-build.log` |
| **08** | `npm run test:render` | `2026-09-26T13:14:56.554Z` | `2026-09-26T13:23:14.746Z` | `498,188 ms` | `0` | **1,434 passed, 0 failed**, 0 skipped, 0 flaky | `evidence/browser.json`, `evidence/playwright-report/index.html`, `evidence/logs/08-playwright-render.log` |
| **09 (First Run)** | `python3 -m unittest discover -s tests/artifact -p "test_*.py" -v` | `2026-09-26T13:48:11.102Z` | `2026-09-26T13:48:11.984Z` | `882 ms` | `1` | **31 run, 1 subtest failed**, 0 errors | `evidence/python-verifier-report.json`, `evidence/logs/09-python-verifier-unittest.log` |
| **09b (Diag Rerun)** | `python3 harness/run-python-verifier-check.py` (raw `ZipInfo.filename`) | `2026-09-26T13:48:47.100Z` | `2026-09-26T13:48:49.850Z` | `2,750 ms` | `0` | **31 run, 0 failed**, 0 errors | `evidence/supplemental/python-verifier-raw-zipinfo.json` |
| **10** | `npm audit --audit-level=moderate` | `2026-09-26T13:13:19.004Z` | `2026-09-26T13:13:20.203Z` | `1,199 ms` | `0` | **0 vulnerabilities** (228 packages) | `evidence/npm-audit.json`, `evidence/logs/10-npm-audit.log` |
| **11 (Supplemental)** | `npx playwright test -c ../harness/playwright.supplemental-native-states.config.ts` | `2026-09-26T13:49:09.355Z` | `2026-09-26T13:50:37.876Z` | `88,577 ms` | `0` | **96 passed, 0 failed** (Firefox & WebKit `native-states`) | `evidence/supplemental/native-states-cross-engine.json`, `evidence/logs/11-supplemental-native-states-cross-engine.log` |
| **12 (Supplemental)** | `node harness/supplemental-deep-qa.mjs` | `2026-09-26T13:53:18.750Z` | `2026-09-26T13:54:00.923Z` | `42,222 ms` | `0` | 28 full axe JSONs, 27 no-JS audits, 12 reflow checks, 24 perf samples | `evidence/supplemental/deep-qa-report.json`, `evidence/axe/*.json`, `evidence/screenshots/*.png` |
| **13 (Supplemental)** | `node harness/verify-preview-and-isolation.mjs` | `2026-09-26T13:56:02.000Z` | `2026-09-26T13:56:09.100Z` | `7,100 ms` | `0` | 9 preview routes + traversal + isolation verified; server stopped cleanly | `evidence/supplemental/preview-server-audit.json`, `evidence/logs/isolation-selftest.jsonl` |

---

## 4. Detailed Findings by QA Category

### 3.1 Build, XML & Native Blogger Contract (`PASS` with Windows CRLF Checkout Note)

1. **`dist/theme.xml` Byte & Checksum Comparison**:
   - **Checked-in Git Blob (`HEAD:dist/theme.xml`, LF)**: `101,248` bytes, SHA256 `b38375a1b3ee548ac22b822e88c7de4dbde01826a84dfb4261c7c852bab36ec4`, `meta[name="theme-build"]` = `0.1.0+bcb5b82706568c2f6f29cd1795b2589767e42146` (`evidence/checked-in-theme-git-blob.xml`).
   - **Checked-in Working-Tree File on Windows (`core.autocrlf=true`, CRLF)**: `101,685` bytes (`+437` `\r` bytes), SHA256 `580b362875c4ad858fa21f92108e5f2a6ae082e7491f24959a49c3a7774a67af` (`evidence/checked-in-theme.xml`).
   - **Locally Compiled Output (`npm run build`, LF)**: `101,248` bytes, SHA256 `d14b867311cd3cfc804c05e9080ce412711b4a23228db54212e29d30882256cb`, `meta[name="theme-build"]` = `0.1.0+ecb1d438e8b3227911dc76359b9e05f127867b27` (`evidence/compiled-theme.xml`).
   - **CI XML Consistency Check (`ci.yml` step reproduction)**: Normalizing `content="0.1.0+[0-9a-f]{7,40}"` to `content="0.1.0+SHA"` between `HEAD:dist/theme.xml` and compiled `dist/theme.xml` produces **0 diff lines** (`evidence/theme-xml.diff` shows only the single line 11 build-stamp change).
2. **Blogger Layouts V3 & Widget Version 2 Contract (`tools/validate-xml.py`, `tools/metadata-check.ts`, `tests/contract/blogger.test.ts`, `tests/contract/native-contract.test.ts`, `tests/contract/seo.test.ts`)**:
   - Root `<html b:css='false' b:defaultwidgetversion='2' b:js='true' b:layoutsVersion='3' expr:dir='data:blog.languageDirection' expr:lang='data:blog.locale'>` verified.
   - Exactly one `<b:skin version='1.3.0'><![CDATA[...]]></b:skin>` containing required `Group` and `Variable` definitions (`keycolor`, `body.background`, `body.text.color`, `body.link.color`, `posts.background.color`, `posts.title.color`, `posts.text.color`, `posts.icons.color`, `labels.background.color`) and inline critical CSS (`<style id='fcd-theme-styles'>`) so no-JS rendering never depends on runtime style injection.
   - Required sections (`header`, `main`, `sidebar-primary`) and canonical widget IDs (`Header1`, `Blog1`) preserved with `<b:include name='super.main'/>` inside `Blog1`'s `main` includable.
   - Native head contract (`all-head-content`, native canonical link, robots meta for search/archive/error vs indexable pages, OpenGraph/Twitter meta tags, single valid JSON-LD `BlogPosting` / `Blog` script block) verified across 17 tests in `tests/contract/seo.test.ts`.
   - Zero occurrences of `b:include name='nextprev'`, `blog-pager-older-link`, `blog-pager-newer-link`, `home-link`, or legacy `redwan.work` / analytics identifiers.

### 3.2 Editorial Hierarchy & Card Discipline (`PASS`)

- Verified by `tests/render/editorial.spec.ts` (`9` unique tests × `22` Chromium projects = `198` runs) and `tests/render/publication-acceptance.spec.ts` (`6` unique tests × `30` Chromium/Firefox/WebKit projects = `180` runs), plus `tests/contract/parity.test.ts` (`6` tests).
- **Initial Home Hierarchy**:
  - `1` post -> `1` `lead` card (`data-editorial-role="lead"`), `0` `secondary`, `0` `stream`.
  - `2` posts -> `1` `lead` card + `1` `secondary` card.
  - `3` posts -> `1` `lead` card + `2` `secondary` cards.
  - `6` posts -> `1` `lead` card + `2` `secondary` cards + `3` `stream` cards.
- **Wrapper & Order Invariance**: Identical card roles, visual hierarchy, and strict chronological DOM order preserved across both direct `.post-outer-container` (`direct`) and date-grouped `.date-outer > .date-posts > .post-outer-container` (`date`) wrappers.
- **Non-Home Views**: Label (`/label`), search (`/search`), archive (`/archive`), and paged (`/paged`) views assign `data-editorial-role="stream"` to all cards (`0` `lead`, `0` `secondary`).
- **Missing Metadata / Thumbnail Resilience**: Missing thumbnails omit `.card-image` without broken `<img>` tags or empty image frames; missing author/labels/excerpt omit empty wrappers or fall back cleanly without raw `undefined`/`null`; long unbroken titles wrap cleanly (`overflow-wrap: anywhere`) without horizontal overflow at `320px`.

### 3.3 Native Blogger State Recovery (`PASS`)

- Verified by `tests/render/native-states.spec.ts` (`12` unique tests × `22` Chromium projects = `264` runs in `npm run test:render` + `96` supplemental Firefox/WebKit runs at `390px`/`1280px` light/dark in `evidence/supplemental/native-states-cross-engine.json`).
- All 6 distinct empty/recovery states (`error`, `label`, `search`, `archive`, `home`, `generic`) verified with **JavaScript enabled (`true`) and disabled (`false`)**:
  - **404 Error (`state-error`)**: Heading `"Page not found"`, distinct status message, search recovery form (`input[name="q"]`), `"Return to latest articles"` action, and topic links.
  - **Empty Topic (`state-label`)**: Heading `"No articles in this topic yet"`, escaped context string, search recovery form, and topic links.
  - **Empty Search (`state-search`)**: Heading `"No matching articles"`, escaped query context, search recovery form, and topic links.
  - **Empty Archive (`state-archive`)**: Heading `"No articles in this archive period"`, escaped archive context, search recovery form, and topic links.
  - **Empty Initial Home (`state-home`)**: Heading `"No articles published yet"`, search recovery form, and topic links.
  - **Empty Generic Listing (`state-generic`)**: Heading `"No articles on this page"`, search recovery form, and topic links.
- **Hostile Context Escaping**: Context string `<img src=x onerror=alert(1)> & "quoted"` is rendered strictly as inert text (`0` injected `<img>` elements inside `.empty-state` across all engines and JS modes).
- **No-JS Visibility**: With `javaScriptEnabled: false`, `.js-control` and `#reading-time` have computed `display: none`, while native search forms, primary navigation, and recovery links remain visible and functional.

### 3.4 Discovery, Search, Topic Filtering & Related Reading (`PASS`)

- Verified by `tests/unit/feed.test.ts` (`16` tests), `tests/unit/feed-client.test.ts` (`16` tests), `tests/unit/search.test.ts` (`1` test), `tests/unit/related-posts.test.ts` (`9` tests), and `tests/render/discovery.spec.ts` (`7` unique tests × `22` projects = `154` runs).
- **Native Search Form**: Submits `GET` to `/search` with `name="q"`, accessible `<label class="sr-only" for="search-query">Search articles</label>`, and submit button `"Search blog"`.
- **Same-Page Progressive Enhancement**: Typing into `#search-query` or clicking a `.topic-pill` filters visible cards, updates `#filter-status` (`role="status"`) and `#fcd-status`, resets lead/secondary styling (`data-filter-active="true"`), hides empty `.date-outer` wrappers, and shows `"Clear filter"` (`button.clear-filter`) which restores initial lead/secondary hierarchy when clicked.
- **Feed Cache & Safety (`src/scripts/feed-client.ts`, `src/scripts/feed.ts`)**:
  - Same-origin validation (`/feeds/posts/summary` with `alt=json` and `max-results=50`, `AbortSignal.timeout(6000)`).
  - SessionStorage key `fcd-feed-summary-v1` stores only normalized `{ id, title, url, date, dateLabel, categories }` records (`<= 40` items, `10 min` TTL), rejecting `javascript:`, `data:`, `vbscript:`, protocol-relative, and cross-origin URLs, and stripping HTML tags to plain text (`<= 240` chars).
- **Related Articles (`src/scripts/related-posts.ts`)**:
  - Candidate ranking prioritizes shared label overlap count first, then publication timestamp descending, excluding the current article URL/path and deduplicating up to 3 items.
  - Permanent static fallback link (`a.related-fallback` -> `/#topics`) remains visible during loading, empty matches, and feed failure.
  - Feed error displays `"Related articles are temporarily unavailable. Browse topics instead."` and enables `"Retry related articles"` (`button.discovery-retry`), which re-fetches with `force=true` and renders matches on recovery.

### 3.5 Article Experience & Technical Content (`PASS` with 1 Low Ordering Finding)

- Verified by `tests/unit/diagrams.test.ts` (`23` tests), `tests/unit/highlighting.test.ts` (`10` tests), `tests/unit/enhancement-loader.test.ts` (`3` tests), `tests/contract/table-reflow.test.ts` (`1` test), `tests/render/interactions.spec.ts` (`154` runs), `tests/render/technical-content.spec.ts` (`110` runs), and `evidence/supplemental/deep-qa-report.json`.
- **Article Reading Aids**:
  - Reading time (`#reading-time`) calculates `Math.max(1, Math.round(words / 200))` min read in JS mode and is hidden in no-JS mode.
  - Table of contents (`nav.article-toc[aria-label="Table of contents"]`) builds from `h2, h3, h4` when `>= 3` headings exist, deduplicating colliding IDs (`section`, `section-2`, `section-3`).
  - Cover image enhancement wraps only an existing leading author `<figure>` or `<p><img></p>` inside `.post-body` with `.fcd-article-cover` without duplicating or synthesizing images.
  - Wide tables are wrapped in `.table-scroll` (`tabIndex=0`, `role="region"`, `aria-label="Scrollable table"`) so tables scroll horizontally inside their container while `document.documentElement.scrollWidth <= window.innerWidth`.
- **Real Prism `1.30.0` Syntax Highlighting (`src/scripts/highlighting.ts`)**:
  - Supported languages (`bash`, `shell`, `sh`, `json`, `yaml`, `yml`, `python`, `py`, `javascript`, `js`, `typescript`, `ts`, `sql`, `hcl`, `xml`, `html`, `markup`, `powershell`, `ps1`, `diff`, `ini`, ` http`, `nginx`, `docker`, `dockerfile`, `c`, `cpp`, `csharp`, `go`, `rust`, `java`) highlight using bundled Prism grammars with zero external network requests.
  - Unsupported languages (`language-brainfuck`, etc.) normalize label and keep readable plain code without throwing.
  - Code blocks `> 50,000` characters skip tokenization (`Code block exceeds highlight limit; showing plain text`) while preserving copy button and keyboard scrollability.
- **Real Pinned Mermaid `11.17.2` Diagrams (`src/scripts/diagrams.ts`)**:
  - Loaded lazily from `https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs` only when diagram blocks exist.
  - Enforces `startOnLoad: false`, `securityLevel: 'strict'`, `htmlLabels: false`, `maxTextSize: 20000`, `maxEdges: 200`, required `accTitle:` and single-line `accDescr:`, allowlisted diagram types (`flowchart`, `graph`, `sequenceDiagram`, `timeline`, `stateDiagram-v2`, `classDiagram`, `erDiagram`, `architecture-beta`), and rejects frontmatter (`---`) or `%%{...}%%` directives.
  - SVG sanitizer (`installSvg`) strips non-fragment `href`/`xlink:href` and rejects `<script>`, `<foreignObject>`, `<iframe>`, `<object>`, `<embed>`, `<image>`, `on*` attributes, and external CSS `@import`/`@font-face`/`url(http...|data:...)`.
  - Original diagram source remains accessible inside `<details class="diagram-source">` before, during, and after rendering or failure.
  - **Low Product Finding (DEFECT-04)**: When an article contains `> 10` diagrams mixing `<pre class="mermaid">` and `<pre><code class="language-mermaid">`, `initDiagrams()` queries `#article-body pre.mermaid` and `#article-body pre > code.language-mermaid` in two separate `querySelectorAll` calls (`src/scripts/diagrams.ts:50-51`), so `<pre><code class="language-mermaid">` near the top of the article (`domIndex: 1` in `twelve-diagrams`) is queued after all `<pre class="mermaid">` blocks (`deferredDomIndices: [1, 11]`). Clicking `"Render diagram"` on the deferred block renders it on demand (`afterOptInRenderedCount: 11`).

### 3.6 Accessibility & Assistive Technology Readiness (`PASS` Automated / `2` Low Findings / Human AT Pending)

- **Automated Axe-Core 4.10.3 WCAG 2.0/2.1/2.2 A & AA Scans**:
  - `tests/render/a11y.spec.ts`: `110/110` project runs passed (`0` violations across `home`, `article`, `paged`, `empty`, `error` at `320–1920px`, `light`/`dark`, plus expanded states).
  - Supplemental full axe JSON capture (`evidence/axe/*.json`, `28` full scan artifacts across `home`, `home-expanded`, `article`, `article-expanded`, `paged`, `state-error`, `state-label`, `state-search`, `state-archive`, `state-home`, `state-generic`, and `technical` at `390px` and `1280px` in `light` and `dark`): **`0` violations across all 28 scans**.
  - **Inspection of `axe.incomplete` (`DEFECT-03`, Low)**: On `article` and `technical` views, `axe-core` `4.10.3` reports `aria-prohibited-attr` (`impact: "serious"`) in `incomplete` on three roleless elements that set `aria-label`:
    1. `<pre tabindex="0" aria-label="Scrollable code block">` (`src/scripts/article.ts:9` — missing `role="region"`, whereas `src/scripts/diagrams.ts:56` sets `role="region"`).
    2. `<div class="share-actions" aria-label="Share article">` (`src/partials/presentation.pug:56` — missing `role="group"`).
    3. `<div class="diagram-controls" aria-label="Diagram controls">` (`src/scripts/diagrams.ts:59` — missing `role="group"`).
- **No-JS Structural & Landmark Audit (`27/27` view × viewport combinations in `deep-qa-report.json`)**:
  - `0` duplicate IDs across all views (`home`, `article`, `paged`, `state-error`, `state-label`, `state-search`, `state-archive`, `state-home`, `state-generic`).
  - Exactly `1` `<h1>` per view and monotonically valid heading hierarchy (`h1 -> h2 -> h3`).
  - Single landmarks verified on every view: `header.site-header` (`banner`), `nav#primary-navigation[aria-label="Primary"]`, `main#content`, `aside.sidebar[aria-label="Publication sidebar"]`, and `footer.site-footer` (`contentinfo`).
  - All form inputs have explicit `<label for="...">` associations.
- **Keyboard Navigation, Focus Visibility & Unobscured Focus (`WCAG 2.4.7`, `2.4.11`)**:
  - Verified across `390px` and `1280px` in `light` and `dark` (`deep-qa-report.json` -> `keyboardAndFocus`): `Skip to content` is the first tab stop, becomes visible on focus, and every subsequent focusable element renders a `3px solid` outline (`rgb(15, 76, 129)` in light, `rgb(124, 196, 255)` in dark) with `unobscured: true` at its viewport center point.
  - `/` shortcut focuses `#search-query` when body is focused, and is properly ignored when typing `/` inside `#empty-state-query-search` (`recoveryValAfterSlash: "/"`, `stillFocusedRecovery: true`).
- **Color Contrast Ratios (`WCAG 1.4.3`, `1.4.11`)**:
  - Computed directly from active CSS custom properties in Chromium (`deep-qa-report.json` -> `contrastChecks`):
    - **Light Theme**: `--text` on `--background` = **`13.08:1`**, `--text` on `--surface` = **`13.59:1`**, `--muted-text` on `--background` = **`5.95:1`**, `--muted-text` on `--surface` = **`6.17:1`**, `--primary` on `--background` = **`6.38:1`**, `--primary` on `--surface` = **`6.63:1`**, `--primary` on `--muted-surface` = **`5.93:1`**, `--focus` on `--surface` = **`7.09:1`**, `--success` on `--code` = **`6.37:1`**.
    - **Dark Theme**: `--text` on `--background` = **`15.37:1`**, `--text` on `--surface` = **`13.52:1`**, `--muted-text` on `--background` = **`9.97:1`**, `--muted-text` on `--surface` = **`8.77:1`**, `--primary` on `--background` = **`10.24:1`**, `--primary` on `--surface` = **`9.01:1`**, `--primary` on `--muted-surface` = **`8.09:1`**, `--focus` on `--surface` = **`10.58:1`**, `--success` on `--code` = **`10.90:1`**.
    - All token pairs exceed both WCAG AA (`4.5:1` normal text, `3:1` non-text) and AAA (`7:1` body text).
- **Target Size (`WCAG 2.5.8 AA` vs Internal `44x44px` Touch Goal)**:
  - **100% of interactive targets** across `home` and `article` (`390px` and `1280px`) exceed the WCAG 2.2 AA `24x24px` minimum (`below24 = 0`).
  - Buttons (`45.5–46px` height), inputs (`46px` height), `.topic-pill` (`44px` height), `.footer-grid nav a` (`44px` height), and `<summary>` (`44px` height) meet the `44px` touch target height.
  - `.primary-navigation > a` renders at `42.4px` height (`43.0x42.4px` on `"Latest"`, **DEFECT-06**, Informational/Low) and `.post-labels a` renders at `32.7px` height (`58.3–95.5x32.7px`, `min-height: 32px` in `src/styles/cards.scss:1`).

### 3.7 Responsive Layout, Zoom & Print (`PASS`)

- Verified across all **11 viewport widths** (`320, 360, 375, 390, 430, 640, 768, 1024, 1280, 1440, 1920` at `900px` height) in `light` and `dark` (`tests/render/responsive.spec.ts` `220/220` runs, `tests/render/publication-acceptance.spec.ts` `180/180` runs).
- **200% Font Enlargement + WCAG 1.4.12 Text Spacing Override**: Tested at `320px` and `1280px` with `javaScriptEnabled: true` and `false` across `home`, `article`, and `state-search` (`12/12` checks in `deep-qa-report.json` -> `reflowAndZoom` with `scrollWidth === innerWidth`).
- **Print Stylesheet (`@media print`)**: Verified in `tests/render/responsive.spec.ts` and `src/styles/base.scss:4-8`: hides `.site-header`, `.site-footer`, `.sidebar`, `#topics`, `.skip-link`, `.share-actions`, `.article-cta`, `.code-toolbar`, `.diagram-controls`, `.diagram-status`, `.comments`, `#fcd-status`, `.related-articles`, `.discovery-retry`, and `.clear-filter`, while keeping article body, code blocks (`white-space: pre-wrap`), tables, and diagrams visible on a white surface.

### 3.8 Security, Privacy & Supply-Chain Boundaries (`PASS` Product / `1` Test Harness Gap Noted)

- Verified by `tests/unit/safe-dom.test.ts` (`44` tests), `tests/contract/security.test.ts` (`1` test), `tests/render/security-boundaries.spec.ts` (`44` runs), `npm audit` (`0` vulnerabilities), and `harness/network-isolation.mjs`.
- **Safe URL & DOM Construction (`src/scripts/safe-dom.ts`)**:
  - Rejects `javascript:`, `data:`, `vbscript:`, `file:`, `blob:`, protocol-relative (`//evil.example`), and control-character/whitespace-prefixed schemes.
  - `safeSameOriginUrl()` strictly enforces `parsed.origin === currentOrigin`.
  - No `eval`, `new Function`, `innerHTML`, `outerHTML`, or `insertAdjacentHTML` in runtime scripts (`src/scripts/*.ts`), except controlled `DOMParser().parseFromString(markup, 'image/svg+xml')` followed by `installSvg` element/attribute allowlisting and `document.importNode(svg, true)` in `src/scripts/diagrams.ts`.
- **Zero Analytics / Trackers / Secrets**: Confirmed no GA/GTM/AdSense/beacon scripts, no third-party fonts (`fonts.googleapis.com` / `fonts.gstatic.com`), no `redwan.work` references, and no credentials or tokens in `dist/theme.xml`.
- **Network Isolation Harness Findings (`DEFECT-05`, Low)**:
  - Only `tests/render/native-states.spec.ts` and `tests/render/security-boundaries.spec.ts` register a catch-all `page.route('**/*', ...)` abort handler in repo code; the other 7 Playwright suites only intercept `https://blogs.fastcyberdefense.com/**` (and `cdn.jsdelivr.net` in `technical-content.spec.ts`).
  - Our preload harness (`harness/network-isolation.mjs`) enforced a 3-layer fail-closed block (Node socket guard, local loopback proxy trap `HTTP 451`, and base `context.route('**/*', ...)` + `context.routeWebSocket('**/*', ...)`) across every run, confirming **zero external requests** were attempted by the theme outside the mocked test origin and pinned local Mermaid module route.

### 3.9 Performance & Resource Discipline (`PASS` Local Synthetic Lab)

- **Compiled Asset Sizes (`evidence/build-size.json`)**:
  | Asset | Raw Bytes | Gzip Bytes | Budget / Notes |
  | :--- | ---: | ---: | :--- |
  | **`dist/theme.xml`** | `101,248` B (`98.88 KB`) | `31,332` B (`30.60 KB`) | Single-file Blogger theme XML containing skin, templates, inline CSS, and bundled JS. |
  | **Compiled CSS (`main.scss`)** | `15,716` B (`15.35 KB`) | `4,112` B (`4.02 KB`) | Inline in `<b:skin>` and `<style id="fcd-theme-styles">`; zero external render-blocking stylesheets. |
  | **Bundled Theme JS (`main.ts` + Prism)** | `56,780` B (`55.45 KB`) | `21,920` B (`21.41 KB`) | Includes core enhancements + bundled Prism 1.30.0 grammars; Mermaid 11.17.2 is lazy-loaded only on articles with diagrams. |

- **Synthetic Local Navigation & Layout Stability Samples (`evidence/supplemental/deep-qa-report.json` -> `performanceSamples`)**:
  - *Measurement Conditions*: Chromium `151.0.7922.34` headless on Windows 11 (`AMD64`), local route-intercepted shared-presentation fixtures, no CPU/network throttling (`3` cold-context navigations + `3` warm reloads per view/viewport). **Important**: These are local synthetic lab measurements on intercepted fixtures, not production field p75 Core Web Vitals (`CLS <= 0.1`, `INP <= 200ms`).
  | View | Viewport | Cold DCL (ms, min–max) | Cold Load (ms, min–max) | Warm DCL (ms, min–max) | Warm Load (ms, min–max) | Requests | Long Tasks (`>50ms`) | Synthetic Lab CLS |
  | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
  | **`home`** | `390x900` | `22.9–24.6` | `31.0–32.4` | `18.6–18.9` | `19.7–19.9` | `1` (document only; feed fetched lazily on interaction) | `0` (`0 ms`) | `0.0000` |
  | **`article`** | `390x900` | `30.0–30.9` | `36.0–36.8` | `20.7–21.4` | `21.9–22.8` | `1` (document) + `1` lazy `/feeds/posts/summary` fetch | `0` (`0 ms`) | `0.0000` |
  | **`home`** | `1280x900` | `23.9–24.2` | `32.1–32.4` | `20.4–30.3` | `21.5–31.4` | `1` (document only) | `0` (`0 ms`) | `0.0077` |
  | **`article`** | `1280x900` | `29.8–30.8` | `36.0–37.1` | `21.5–35.3` | `22.7–36.6` | `1` (document) + `1` lazy `/feeds/posts/summary` fetch | `0` (`0 ms`) | `0.0130` |

### 3.10 Release, Staging & Artifact Verifier Tooling (`PASS` with Windows Test Helper Defect Noted)

- **Deploy & Staging Check Unit Suites (`tests/unit/deploy-check.test.ts` `10/10`, `tests/unit/staging-check.test.ts` `28/28`)**:
  - Offline unit tests verify build-stamp matching (`meta[name="theme-build"]`), `Header1`/`Blog1` presence, editorial hierarchy checks (`1` lead + up to `2` secondary on initial home; stream-only on label/search/archive/paged), native state recovery markers (`404`, empty label, empty search, empty archive), no-JS visibility rules, and safe URL validation without touching any live remote host.
- **Python Artifact Verifier (`tools/verify-artifact.py` & `tests/artifact/test_verify_artifact.py`)**:
  - First run (`evidence/python-verifier-report.json`): `30/31` passed; `1` subtest failed (`test_unsafe_names` `name='test-results\\escape'`) due to Windows `zipfile.ZipInfo` path separator normalization inside the test helper `packed()` (**DEFECT-02**).
  - Supplemental verification (`evidence/supplemental/python-verifier-raw-zipinfo.json`): When `packed()` sets `info.filename = name` directly on `ZipInfo` so the raw ZIP entry preserves `'test-results\\escape'`, `tools/verify-artifact.py:127` raises `VerificationError('unsafe archive path')` and all **`31/31`** tests pass on Windows.

---

## 5. What Remains Pending Outside Local QA (`NOT RUN` Locally)

Per `AGENTS.md` and `docs/PROJECT-PLAN.md`, local QA does **not** replace or certify:
1. **Exact-Commit GitHub Actions CI (`ci.yml`)**: Must remain green on Linux runners for the release commit.
2. **Native Blogger Theme Import/Save & Staging Acceptance (`tools/staging-check.ts`)**: Compiling `dist/theme.xml` and passing local shared-presentation fixtures does **not** prove Google Blogger's server-side XML parser/saver or runtime expression evaluator (`data:view.*`, `data:post.*`, `super.main` delegation, real HTTP 404 status headers, native canonical URL generation, native comment iframe rendering, or Blogger Layout editor drag-and-drop).
3. **Human Assistive Technology & Screen-Reader Validation**: Automated axe-core and DOM/keyboard checks do **not** replace human testing with NVDA, JAWS, VoiceOver, or TalkBack.
4. **Production Field Core Web Vitals Telemetry**: Synthetic local navigation timings do **not** replace real-user field p75 `CLS <= 0.1` and `INP <= 200ms` validation.
