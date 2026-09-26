# FCD Blogger Theme — Local QA Defects & Findings Log (`ecb1d438e8b3227911dc76359b9e05f127867b27`)

No source, test, workflow, lockfile, or documentation files in `j:\DevDrive\google-blogger` were modified during this diagnostic assignment. Every finding below is classified as either a **Product defect**, an **Existing test/fixture defect**, or a **Host/tooling limitation**, with exact reproduction steps, expected vs actual behavior, affected file/line references, preserved evidence paths, and the smallest proposed fix.

---

## Summary Table

| ID | Severity | Classification | Component / File | Summary | First-Run Impact |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **DEFECT-01** | **Medium** | Existing test/fixture defect + Repo hygiene | `tests/unit/related-posts.test.ts:17`, missing `.gitattributes` | Literal `\n` substring assertion against `src/partials/presentation.pug` fails on default Windows Git checkouts (`core.autocrlf=true`), and working-tree `dist/theme.xml` is inflated by `+437` `\r` bytes. | `npm test` exited `1` (`210/211` passed, `1` failed); passed `211/211` on LF diagnostic rerun. |
| **DEFECT-02** | **Low** | Existing test/fixture defect | `tests/artifact/test_verify_artifact.py:30-35, 93-96` | Test helper `packed()` passes `str` filename to `ZipFile.writestr()`, which normalizes `\` to `/` on Windows (`os.sep == '\\'`), causing `test_unsafe_names` (`name='test-results\\escape'`) to fail on Windows even though `tools/verify-artifact.py:127` is correct. | `python3 -m unittest` exited `1` (`30/31` passed, `1` subtest failed); passed `31/31` with raw `ZipInfo.filename`. |
| **DEFECT-03** | **Low** | Product defect (Accessibility / ARIA) | `src/scripts/article.ts:9`, `src/partials/presentation.pug:56`, `src/scripts/diagrams.ts:59` | `aria-label` is set on roleless `<pre>` and `<div>` containers (`.post-body pre`, `.share-actions`, `.diagram-controls`), triggering `axe-core` `4.10.3` `aria-prohibited-attr` (`incomplete`, `impact: "serious"`). | `0` axe `violations` (`a11y.spec.ts` passes), but `axe.incomplete` flags `aria-prohibited-attr` on all `article` and `technical` scans. |
| **DEFECT-04** | **Low** | Product defect (Technical content) | `src/scripts/diagrams.ts:50-51` | `initDiagrams()` queries `#article-body pre.mermaid` and `#article-body pre > code.language-mermaid` in two separate passes rather than document order, so `<pre><code class="language-mermaid">` near the top of a `>10`-diagram article is deferred behind later `<pre class="mermaid">` blocks. | In a 12-diagram mixed fixture, diagram #2 (`domIndex: 1`) was deferred while diagrams #3–#11 (`domIndex: 2..10`) auto-rendered. |
| **DEFECT-05** | **Low** | Existing test/fixture defect | `tests/render/*.spec.ts` (7 of 9 specs), `playwright.config.ts:9` | Seven of nine Playwright suites lack a catch-all `page.route('**/*', ...)` external-request abort handler, and `playwright.config.ts` only runs `publication-acceptance.spec.ts` on Firefox/WebKit. | Mitigated during QA via `harness/network-isolation.mjs` and `playwright.supplemental-native-states.config.ts` (`96/96` passed). |
| **DEFECT-06** | **Informational** | Product polish (Touch target height) | `src/styles/layout.scss:1`, `src/styles/cards.scss:1` | `.primary-navigation > a` renders at `42.4px` height (`43.0x42.4px` on `"Latest"`), meeting WCAG 2.2 AA `24x24px` (`SC 2.5.8`) but `1.6px` shy of the internal `44x44px` touch target goal in `docs/PROJECT-PLAN.md` §7.2. | All automated tests pass; noted for CSS token consistency with `.topic-pill` and `.footer-grid nav a` (`min-height: 44px`). |
| **DEFECT-07** | **Informational** | Host/tooling limitation | Workstation `PATH` (`node` `v24.19.0`, Windows Store `python3` alias) | Host default Node (`v24.19.0`) is 1 minor point below `.nvmrc` (`24.20.0`), and default `python3` alias exits `9009` while `C:\Python314\python.exe` (`3.14.7`) is installed. | Resolved in disposable QA environment via checksum-verified portable Node `v24.20.0` and `python3.exe` wrapper. |

---

## Detailed Defect Records

### DEFECT-01 — `tests/unit/related-posts.test.ts:17` fails on default Windows Git checkouts (`core.autocrlf=true`) and `dist/theme.xml` working-tree byte count is inflated by CRLF

- **Severity**: Medium
- **Classification**: Existing test/fixture defect + cross-platform repository hygiene
- **Affected Files & Lines**:
  - `tests/unit/related-posts.test.ts:15-18`
  - `src/partials/presentation.pug:56-57`
  - Repository root (missing `.gitattributes`)
- **Reproduction Steps**:
  1. On Windows with default `git config core.autocrlf=true`, clone the repository at `ecb1d438e8b3227911dc76359b9e05f127867b27`.
  2. Run `npm test -- --reporter=default --reporter=json --outputFile=unit-report.json`.
- **Expected Result**:
  - All `211` unit and contract tests pass (`exit=0`), and checked-out files preserve deterministic LF line endings across OS platforms.
- **Actual Result**:
  - First run (`evidence/unit-report-first-run.json`, `evidence/logs/06-unit-test.log`) exited with code `1` (`210 passed, 1 failed`):
    ```text
    FAIL tests/unit/related-posts.test.ts > requires native post guard and permanent fallback in shared presentation
    AssertionError: expected false to be true
     ❯ tests/unit/related-posts.test.ts:17:64
       15|  const s=readFileSync('src/partials/presentation.pug','utf8');
       16|  expect(s.indexOf("b:if(cond='data:view.isPost')")).toBeGreaterThan(-1);
       17|  expect(s.includes("b:if(cond='data:view.isPost')\n        +fcdRelated({}, false)")).toBe(true);
    ```
  - Additionally, the checked-out working-tree `dist/theme.xml` on Windows (`evidence/checked-in-theme.xml`) is `101,685` bytes (`sha256: 580b362875c4ad858fa21f92108e5f2a6ae082e7491f24959a49c3a7774a67af`) vs the Git blob `HEAD:dist/theme.xml` (`evidence/checked-in-theme-git-blob.xml`, `101,248` bytes, `sha256: b38375a1b3ee548ac22b822e88c7de4dbde01826a84dfb4261c7c852bab36ec4`).
  - Restoring LF line endings (`git config core.autocrlf false && git checkout -f HEAD`) and rerunning (`evidence/unit-report-lf-rerun.json`, `evidence/logs/06b-unit-test-lf-rerun.log`) passed all `211/211` tests (`exit=0`).
- **Smallest Proposed Fix**:
  1. Add `.gitattributes` at the repository root:
     ```gitattributes
     * text=auto eol=lf
     ```
  2. Normalize line endings in `tests/unit/related-posts.test.ts:15`:
     ```ts
     const s = readFileSync('src/partials/presentation.pug', 'utf8').replace(/\r\n/g, '\n');
     ```

---

### DEFECT-02 — `tests/artifact/test_verify_artifact.py` `test_unsafe_names` (`name='test-results\\escape'`) fails on Windows due to `zipfile.ZipInfo` path separator normalization in test helper `packed()`

- **Severity**: Low
- **Classification**: Existing test/fixture defect (production `tools/verify-artifact.py` is **not** defective)
- **Affected Files & Lines**:
  - `tests/artifact/test_verify_artifact.py:30-35, 93-96`
- **Reproduction Steps**:
  1. On Windows (`Python 3.14.7`), run:
     ```powershell
     python3 -m unittest discover -s tests/artifact -p "test_*.py" -v
     ```
- **Expected Result**:
  - All `31` unit test methods (including all subtests in `test_unsafe_names`) pass (`exit=0`).
- **Actual Result**:
  - First run (`evidence/python-verifier-report.json`, `evidence/logs/09-python-verifier-unittest.log`) ran `31` tests and exited with code `1` due to `1` subtest failure:
    ```text
    FAIL: test_unsafe_names (test_verify_artifact.ArchiveTests.test_unsafe_names) (name='test-results\\escape')
    Traceback (most recent call last):
      File "...\tests\artifact\test_verify_artifact.py", line 95, in test_unsafe_names
        with self.assertRaises(v.VerificationError):
             ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^
    AssertionError: VerificationError not raised
    ```
  - **Root Cause**: In `tests/artifact/test_verify_artifact.py:33`, `packed(files)` calls `z.writestr(name, data)` where `name` is a `str`. In Python's standard library `zipfile.ZipInfo.__init__`, when `os.sep == '\\'` (Windows), Python executes `filename = filename.replace(os.sep, "/")`, silently converting `'test-results\\escape'` into `'test-results/escape'` (a valid forward-slash path under `test-results/`) before `v.inspect_archive` inspects the ZIP.
  - **Verification of Production Verifier**: When `packed()` constructs a `ZipInfo` instance and assigns `info.filename = name` after initialization (`evidence/supplemental/python-verifier-raw-zipinfo.json`), `tools/verify-artifact.py:127` (`'\\' not in name`) raises `VerificationError('unsafe archive path')` and all `31/31` tests pass (`0` failures).
- **Smallest Proposed Fix**:
  - In `tests/artifact/test_verify_artifact.py:30-35`, update `packed(files)` so `ZipInfo.__init__` does not normalize `\` on Windows:
    ```python
    def packed(files: dict[str, bytes]) -> bytes:
      buf = io.BytesIO()
      with zipfile.ZipFile(buf, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for name, data in files.items():
          info = zipfile.ZipInfo('entry')
          info.filename = name
          info.compress_type = zipfile.ZIP_DEFLATED
          z.writestr(info, data)
      return buf.getvalue()
    ```

---

### DEFECT-03 — Roleless `<pre>` and `<div>` elements with `aria-label` trigger `axe-core` `aria-prohibited-attr` (`incomplete`, serious impact) on `article` and `technical` views

- **Severity**: Low
- **Classification**: Product defect (Accessibility / WAI-ARIA naming on generic elements)
- **Affected Files & Lines**:
  - `src/scripts/article.ts:9` (`if(!pre.hasAttribute('aria-label'))pre.setAttribute('aria-label','Scrollable code block');` on `<pre>` without `role="region"`)
  - `src/partials/presentation.pug:56` (`.share-actions(aria-label='Share article')` renders `<div class="share-actions" aria-label="Share article">` without `role="group"`)
  - `src/scripts/diagrams.ts:59` (`const toolbar=document.createElement('div');toolbar.className='diagram-controls';toolbar.setAttribute('aria-label','Diagram controls');` on `<div>` without `role="group"` or `role="toolbar"`)
- **Reproduction Steps**:
  1. Run `axe-core` `4.10.3` with tags `['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']` on `/article` and `/technical`.
  2. Inspect `results.incomplete` in `evidence/axe/axe-article-1280-light.json` and `evidence/axe/axe-technical-1280-light.json`.
- **Expected Result**:
  - Every element given an `aria-label` has an explicit or implicit ARIA role that supports accessible naming (consistent with `src/scripts/diagrams.ts:56,60` and `src/scripts/article.ts:15`, which explicitly set `role="region"` alongside `aria-label`), resulting in `0` `aria-prohibited-attr` items in both `violations` and `incomplete`.
- **Actual Result**:
  - `results.violations` is empty (`[]`), so `tests/render/a11y.spec.ts` passes, but `results.incomplete` reports `aria-prohibited-attr` (`impact: "serious"`):
    - `<pre tabindex="0" aria-label="Scrollable code block">` -> *"aria-label attribute is not well supported on a pre with no valid role attribute."*
    - `<div class="share-actions" aria-label="Share article">` -> *"aria-label attribute is not well supported on a div with no valid role attribute."*
    - `<div class="diagram-controls" aria-label="Diagram controls">` -> *"aria-label attribute is not well supported on a div with no valid role attribute."*
- **Smallest Proposed Fix**:
  - In `src/scripts/article.ts:9`, add `if(!pre.hasAttribute('role'))pre.setAttribute('role','region');` before setting `aria-label`.
  - In `src/partials/presentation.pug:56`, change `.share-actions(aria-label='Share article')` to `.share-actions(role='group' aria-label='Share article')`.
  - In `src/scripts/diagrams.ts:59`, add `toolbar.setAttribute('role','group');`.

---

### DEFECT-04 — `initDiagrams()` in `src/scripts/diagrams.ts` queries `pre.mermaid` and `pre > code.language-mermaid` in two separate passes instead of document order

- **Severity**: Low
- **Classification**: Product defect (Technical content / Mermaid `>10` diagram cap ordering)
- **Affected Files & Lines**:
  - `src/scripts/diagrams.ts:49-52`
- **Reproduction Steps**:
  1. Render an article containing 12 Mermaid diagrams where diagram #2 (`domIndex: 1`) is authored as `<pre><code class="language-mermaid">` and diagrams #1 and #3–#12 are authored as `<pre class="mermaid">` (matching the pattern in `fixtures/technical-libraries.pug:16-21`).
  2. Inspect which 10 diagrams are auto-rendered (`data-state="rendered"`) and which 2 are deferred (`data-state="source"`, `"Automatic diagram limit reached. Use Render diagram to opt in."`).
- **Expected Result**:
  - The first 10 diagrams in document order (`domIndex: 0..9`) auto-render and the 11th and 12th diagrams in document order (`domIndex: 10, 11`) are deferred.
- **Actual Result**:
  - As recorded in `evidence/supplemental/deep-qa-report.json` (`resilienceChecks.twelveDiagramsCap`), `deferredDomIndices` is `[1, 11]`: diagram #2 (`domIndex: 1`) near the top of the article is deferred while diagram #11 (`domIndex: 10`) auto-renders, because lines 50–51 run two separate queries:
    ```ts
    root.querySelectorAll<HTMLPreElement>('#article-body pre.mermaid').forEach(pre=>blocks.add(pre));
    root.querySelectorAll<HTMLElement>('#article-body pre > code.language-mermaid').forEach(code=>blocks.add(code.parentElement as HTMLPreElement));
    ```
- **Smallest Proposed Fix**:
  - Combine the selector into a single document-order query in `src/scripts/diagrams.ts:50-51`:
    ```ts
    root.querySelectorAll<HTMLElement>('#article-body pre.mermaid, #article-body pre > code.language-mermaid').forEach(el =>
      blocks.add((el.tagName === 'CODE' ? el.parentElement : el) as HTMLPreElement)
    );
    ```

---

### DEFECT-05 — Seven of nine Playwright browser suites do not register a catch-all external network abort handler in repo code

- **Severity**: Low
- **Classification**: Existing test/fixture defect
- **Affected Files & Lines**:
  - `tests/render/a11y.spec.ts:15`
  - `tests/render/discovery.spec.ts:14`
  - `tests/render/editorial.spec.ts:14`
  - `tests/render/interactions.spec.ts:14`
  - `tests/render/publication-acceptance.spec.ts:14`
  - `tests/render/responsive.spec.ts:15`
  - `tests/render/technical-content.spec.ts:15`
  - `playwright.config.ts:9`
- **Description & Evidence**:
  - `tests/render/native-states.spec.ts:15` and `tests/render/security-boundaries.spec.ts:15` register `await page.route('**/*', r => r.request().url().startsWith(origin) ? r.continue() : r.abort())` before mocking `origin`, ensuring any unexpected off-origin request is aborted by the test itself. The other 7 suites only register `await page.route('https://blogs.fastcyberdefense.com/**', ...)`.
  - Additionally, `playwright.config.ts:9` restricts the 8 Firefox and WebKit projects to `testMatch: '**/publication-acceptance.spec.ts'`.
  - During this QA assignment, our preload harness (`harness/network-isolation.mjs`) enforced a global fail-closed block across all 30 projects and our supplemental run (`evidence/supplemental/native-states-cross-engine.json`) verified `native-states.spec.ts` across Firefox and WebKit (`96/96` passed).
- **Smallest Proposed Fix**:
  - Add a shared helper in `tests/render/` that registers a base `page.route('**/*', route => route.abort())` before suite-specific routes across all 9 browser specs.

---

### DEFECT-06 — `.primary-navigation > a` computed height is `42.4px` (`1.6px` below the internal `44x44px` coarse-pointer goal in `docs/PROJECT-PLAN.md` §7.2)

- **Severity**: Informational / Low
- **Classification**: Product polish (CSS token alignment with internal design doc)
- **Affected Files & Lines**:
  - `src/styles/layout.scss:1` (`.primary-navigation>a{padding:.5rem 0;text-decoration:none;font-weight:600}`)
  - `src/styles/cards.scss:1` (`.post-labels a{padding:.3rem 0;min-height:32px}`)
- **Expected vs Actual Result**:
  - All interactive elements exceed WCAG 2.2 AA SC 2.5.8 (`24x24px`). However, `docs/PROJECT-PLAN.md` §7.2 states *"minimum `44x44px` touch targets on coarse pointers"*. While `button`, `input`, `.topic-pill`, `.footer-grid nav a`, and `<summary>` enforce `min-height: 44px`, `.primary-navigation > a` has no `min-height: 44px` and computes to `42.4px` height (`43.0x42.4px` on `"Latest"` in `evidence/supplemental/deep-qa-report.json` -> `tapTargets`).
- **Smallest Proposed Fix**:
  - Add `min-height:44px;display:inline-flex;align-items:center` to `.primary-navigation>a` in `src/styles/layout.scss:1`.

---

### DEFECT-07 — Workstation Default Node (`v24.19.0`) and Windows Store `python3` Alias Difference

- **Severity**: Informational
- **Classification**: Host/tooling limitation (not a repository defect)
- **Description & Resolution**:
  - Host default `C:\Program Files\nodejs\node.exe` was `v24.19.0` vs `.nvmrc` `24.20.0`, and default `python3` in Windows `PATH` pointed to the disabled Microsoft Store App Execution Alias (`C:\Users\redwan\AppData\Local\Microsoft\WindowsApps\python3.exe`, exit `9009`) while `C:\Python314\python.exe` (`Python 3.14.7`) was installed.
  - Resolved cleanly within `test-results/local-qa-ecb1d438/toolchain/` using official checksum-verified `node-v24.20.0-win-x64` (`sha256: 6cac9ffbca8f6a47091e4b5c772e0606049c3871cb67d900c0cedde630e545ba`) and a local `python3.exe` wrapper targeting `C:\Python314\python.exe`.
