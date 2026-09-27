# FCD development plan

## Current baseline and approved U0+N1 (2026-09-27 Asia/Dhaka)

This section supersedes the preserved historical bootstrap and PR #10 snapshots below. Main is the verified PR #11 merge `312954b6f9bf0e39b0f276ea6881f9f82146b4ff`. [Post-merge source run 36288775447](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36288775447/job/108534626444) passed all 21 stages with 211 unit/contract and 1434 browser passes, no reported pending/skipped/unexpected/flaky results, audit and XML consistency. [Post-merge CodeQL](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36288775048) succeeded in three languages; this is not a repository-wide zero-alert claim. The 31 artifact-verifier contracts passed on the identical pre-merge source tree in run 36285583516, not claimed as a post-merge execution. Bootstrap branch remains at `7c30c3cccad22a337cea88c99d1f9ab87238aeb9`; leave it untouched.

B0+N0 source acceptance and accepted Errata v2 reporting R1-R6 are closed. DEFECT-05 is not closed: browser attribution/adoption remains N1 then N2A/N2B/N2C. The other canonical product/native/human defects below remain open as stated. The checked-in XML is still 101248 bytes and this slice does not modify it, its historical generating stamp, the product source or dependencies.

### Current approval and implementation boundary

Branch `feat/fcd-browser-network-guards`, [draft PR #12](https://github.com/thefastcyberdefense/google-blogger/pull/12), starts from the verified main above. Owner approved FCD-U0-N1-APPROVAL-v1 (SHA256 `8ff763b1df9a933d1e5e8f08a1131c49b4c4bbbfc3c7a1b18f1751138b01e921`) and subsequently the two-file public document-start WebSocket observation experiment; the owner then requested continued N1 implementation without merging. The exact ten-file boundary remains:

1. docs/UPSTREAM-AUDIT.md
2. docs/PROJECT-PLAN.md
3. .github/workflows/ci.yml
4. playwright.config.ts
5. tests/helpers/browser-network.ts
6. tests/helpers/isolated-test.ts
7. tests/helpers/browser-network-reporter.ts
8. tests/render/network-isolation.spec.ts
9. tests/unit/browser-network.test.ts
10. tools/finalize-browser-network.ts

No N0 wrapper/probe change, dependency/lockfile change, product/fixture migration, generated XML change, candidate pin, job topology/permission/stage/timeout change, repository setting, branch deletion, production request, ready-for-review transition or merge is authorized. Use the project-selected workspace connection and FCD Superpowers + Ralph + GSD. Builds/tests run only in Actions. Review is sequential AI source/specification/security/QA review, not independent human approval.

### U0 disposition

[UPSTREAM-AUDIT.md](UPSTREAM-AUDIT.md) records the full nine-commit Ledger comparison from `2e5eb328...` through `91cc043...`, including the intermediate publisher, dependency, Mermaid and actual article/dark CSS changes. FCD's bounded strict Mermaid/source-retention and literal code paths differ materially from Ledger's repair-oriented compiler. Reuse no publisher, broad repair, loose configuration, personal identity, generated output or dependency tree. Useful product regression and UI concepts are separately deferred, not smuggled into N1. No material U0 dependency blocks this foundation.

### N1 behavior and evidence contract

The new guard uses pinned public Playwright APIs before pages, service workers blocked, no caller proxy/credential/HAR/state override, and exact synthetic origin/path/method/query/resource rules. Known responses are local. Denial counts are exact and bounded. Unexpected requests fail their owning test at teardown even when caught by application code. Denied navigations receive an inert local 451 document; resource denials are aborted. A local 451 is not retirement proof: the earlier opaque-document-only explanation is withdrawn in light of the independently verified delivery loss below. No normal guard path continues/fetches a remote request or connects a WebSocket to a server. Redirect statuses and headers are rejected in fixture policy.

HTTP request observation is independent of context routing and detects later page overrides. Public document-start WebSocket observation supplements native events, which miss fully mocked sockets; constructor/binding integrity, acknowledgment and lifecycle flushing are checked. N0 remains the connectivity boundary, not browser interception. Dedicated workers are not accepted guard consumers: their locally supplied resource path is exercised and worker creation is attributed as a failure. These tests are not universal worker/browser-internal/Node-network coverage or a hostile-code sandbox. Existing raw browser suites remain N0-only until their approved N2 migration.

A Window-level immutable controller now owns separate per-Document identities and counters. Repeated bootstrap must reuse the same observer for the same Document; successor Documents in a surviving Window receive new identities before their first socket. Top-level readiness has two actual public transports, binding and console, reconciled by UUID, Page/main Frame, security origin and initial-document status. Console cannot identify arbitrary subframes, which continue to require their binding. Duplicate same-transport or contradictory registrations fail; no registration is fabricated from a socket or retirement. A failed ready acknowledgment is accepted only with that document's independently received console readiness. Missing both transports remains a failure.

Retirement keeps bounded synchronous browser-local receipts under per-context/per-document keys. Recovery reads only already-known keys through live same-origin frames, never arbitrary storage or remote requests. Security origin is captured from globalThis.origin, not location.origin on inherited blank frames. Missing, malformed, contradictory or inaccessible old-origin evidence fails closed. Initial zero-attempt blank-document handling remains a narrow exception, not proof of every browser lifecycle.

The latest bounded correction handles the verified Chromium initial-popup binding refresh during a second trusted init-script invocation. An independent bootstrap capability stays in the installed script's closure, not in the controller's public properties or self-owned records. Exactly one refresh is permitted only for the same live initial top-level Document before any socket attempt or failure; the WebSocket wrapper and controller must be unchanged. It never repairs constructor replacement, resets counters, creates a duplicate ready record, or permits a page-triggered reset. Loaded-document binding changes still fail integrity. Fresh Actions results must validate this correction; it is not predeclared accepted here.

The reusable fixture wraps the runner-owned context before its page fixture, preserving runner options/artifacts; manual factory contexts share bounded lifecycle/evidence rules. Success, negative controls, setup/handler/assertion/close/write failure behavior, no-JS, frames, popup first navigation, reload, override detection and parallel/zero-request records must be verified. Eight scoped cases are declared for all 30 existing projects (22 Chromium plus eight Firefox/WebKit); totals and success are derived from actual discovery/results, not this planned matrix.

Schema 1 / policy n1-v1 stages at `${FCD_ISOLATION_EVIDENCE}-browser-network`, outside both N0's strict root and Playwright output cleanup. A fresh source/run/attempt manifest is initialized in the existing unit stage. UUID-based exclusive start/end writes bind stage, engine, project, title, worker, retry, process, exact expected control codes, safe rule/disposition data and lifecycle outcomes. No raw request URL/query, cookies, credentials, headers or bodies enter these records. Bounds fail explicitly rather than truncate required evidence.

The independent reporter inventories the scoped tests and records outcomes/context annotations. The data-only finalizer reconciles inventory, normal browser JSON, the required real Vitest factory consumer and all lifecycle pairs. Missing/stale/duplicate/truncated/wrong-schema/unfinished/unexplained/zero-discovery evidence fails CI. Exact negative controls still throw and must have passed owning tests; they are not a global ignore-errors mode. Always-run reporting attempts both finalizers and publishes valid partial diagnostics under `test-results/browser-network/` without changing the original test result. The existing artifact verifier remains unchanged and does not semantically attest to N1 JSON.

### Test-first history and current verification gate

[937f64b checkpoint](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36290894923) retained 211 existing passes and exposed missing unexpected-request attribution after a local positive control. [b736bdb detailed red](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36291059239/job/108541107714) recorded 211 passes and four new failures: the attribution promise resolved, and each engine had pageRoutes=1, contextRoutes=0, HTTP=1 but native observedWebSockets=0 during a successful local exchange. No external endpoint was tested.

[1a0e379 experiment](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36291269398/job/108541694200) passed all three independent document-observation controls plus the 211 existing cases; the original HTTP-attribution red remained. This proved only the bounded experiment, not complete N1. [cedacf1 policy/evidence checkpoint](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36291937014/job/108543565017) passed 215 and failed 14 new requirements against runnable placeholders, zero pending; explicit assertions included wildcard/redirect/denial policy acceptance and missing attribution. Setup, typecheck and N0 controls succeeded.

The initial integrated checkpoint found the pinned reporter onEnd signature required an asynchronous return; this setup failure is not behavioral-red evidence. At [57c9ed0](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36292567710/job/108545334525), 252 cases passed and one failed. Serving a local 451 preserved the exact unexpected-request violation but did not alone solve retirement accounting. The finalizer also distinguishes explicitly asserted inner failures from failing owners; unrelated failed owners still reject acceptance.

[468f2e6 diagnosis](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36301183130/job/108568991244) established that Chromium's pagehide handler ran while context-console, page-console and binding delivery counters all remained zero. This is an observed transport limitation in the tested case, not a universal engine diagnosis. Bounded durable receipts at [3bfa44c](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36301462934/job/108569754626) passed all then-current 263 unit tests and the original exact HTTP regression. The ensuing full browser run had 1632 expected and 42 unexpected outcomes, zero skipped/flaky, and rejected N1 evidence. The full-run N1_READ and complete failure distribution still require measured diagnosis; an oversized browser report remains an unproven hypothesis.

Subsequent protected reds exposed inherited-origin handling, four socket cross-accounting false greens, duplicate keys in self-owned JSON and malformed UTF-8 runner input. [ffe2a83](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36303053197/job/108574243099) verified those seven corrections with 276 passes and three remaining navigation failures. The diagnostic wrapper at dd8fa277 then failed setup typing; [1ab76b8](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36328932946/job/108646999886) fixed only the two-argument exposeBinding mismatch, restoring typecheck and the same 276/3 result. Neither typing correction is behavioral-red proof.

[1205357 lifetime diagnostics](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36331467782/job/108654107286) showed duplicate init invocation in Chromium's same initial popup Document, Firefox reusing a Window/observer for a successor iframe Document without another init invocation, and WebKit losing initial-popup binding-ready delivery despite a delivered retirement. [cee8efd controls](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36331981050/job/108655541211) and the diagnostic-only [c5da33d rerun](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36332557628/job/108657166653) both reported 279 passes, nine failures, zero pending. All engines observed two sockets for one routed socket under repeated bootstrap, and zero observed sockets rather than one when only binding-ready was suppressed. The three both-ready-transports-missing negative controls passed. Installation/typecheck/build/XML/N0 succeeded, so these six new failures were meaningful behavioral reds alongside the three navigation failures.

[b4b92c8 correction](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36332843576/job/108657977295) passed 287 tests with one failure, zero pending. Firefox and WebKit navigation, all nine added controls, original exact HTTP attribution, inherited-origin and durable/evidence-corruption controls passed. Chromium's initial popup alone still failed integrity. The diagnostic-only [9de5df5 run](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36333268162/job/108659172639) repeated 287/1 and directly measured socket=true, binding=false, state=true, initial=true, top=true during the repeated bootstrap. The pinned Playwright v1.62.1 source at 26a9e470a7b3c7822084b09fb7f13902c5f37b51 confirms binding initialization replaces the exposed function; its socket mock is separately idempotent. This source reading informed the bounded correction but introduces no use of private Playwright APIs. The nine new preservation controls in this commit cover untrusted initial/loaded binding resets and conflicting ready transports; they are not claimed as previously failing tests.

**Recorded evidence stops at 9de5df5; this correction's exact-head verification is pending.** Its unit-failed predecessor never ran the browser matrix, audit or final XML check; missing browser evidence on that run does not diagnose the earlier full-run N1_READ. Its CodeQL finding check reported no new changed-code alerts, not repository-wide zero alerts. Follow PR #12 for subsequent exact heads and measured outcomes rather than treating this ledger's implementation prose as acceptance.

**Next action:** verify the current head's unit and full browser results, both finalizers, audit, XML consistency, verifier contracts, actual scanner findings and review threads. Keep original assertions, four workers, zero retries, timeouts and all evidence bounds. N1 also still needs the real loopback redirect-hop control, direct unexpected-WebSocket policy assertion and exact end-record disposition checks before final source acceptance. Current direct navigation is not redirect-hop coverage. Preserve all 211 original unit/contract identities and 1434 baseline browser cases. Reconcile actual outcomes in the PR, perform specification review before code/security/QA review, and leave the PR draft and unmerged. Any extra file, N0 alteration, private API, dependency, stage/permission/candidate-contract change, increased bound or weakened acceptance requires a scoped amendment. N2 adoption and native/human/release gates remain separate.

---

## Historical baseline and approved B0+N0 bootstrap (2026-09-27 Asia/Dhaka)

This section supersedes the dated PR #10 preparation snapshot below; that snapshot is retained as history, not current status. Main is `ecb1d438e8b3227911dc76359b9e05f127867b27`. PRs #1 through #10 are merged. [PR #10 post-merge CI](https://github.com/thefastcyberdefense/google-blogger/actions/runs/35303993418/job/105472311414) completed 2026-09-18 03:52:09 UTC with all stages successful: 211 unit/contract and 1434 browser passes, no reported failures/pending/skips/unexpected/flaky outcomes, audit and restored XML consistency. The checked-in XML remains 101248 bytes with its real generating stamp `0.1.0+bcb5b82706568c2f6f29cd1795b2589767e42146`. [Post-merge CodeQL](https://github.com/thefastcyberdefense/google-blogger/actions/runs/35303992974) and [inspected scheduled analysis](https://github.com/thefastcyberdefense/google-blogger/actions/runs/35542582610) succeeded; analysis success is not a zero-alert claim.

At bootstrap start, the branch listing contained main and `qa/local-evidence-ecb1d438` at `2852768d139c9106943d884155dcabfc0246b7ef`, with no open PRs. The old native-state branch was retained at merge but is absent from that listing; no cause is inferred and no restoration is approved. The new branch is `feat/fcd-safe-verification-bootstrap`, tracked in [PR #11](https://github.com/thefastcyberdefense/google-blogger/pull/11).

The owner accepted Reviewed Master Plan v2 (54525 bytes, SHA256 `f70d5ed9890e02ea4e95dea0f4eb15e97bb243df552fdc62700d9cc1e231c186`) and explicitly approved only this initial five-file implementation/PR/Actions boundary:

1. docs/PROJECT-PLAN.md: reconcile the baseline and shared work ledger.
2. docs/DEPLOYMENT.md: reconcile merge/evidence/retention and retain candidate boundaries.
3. .github/workflows/ci.yml: mandatory safe application-test execution and evidence finalization.
4. tools/run-isolated-tests.sh: fail-closed namespace runner, bounded execution and status preservation.
5. tests/isolation/egress-probe.mjs: controlled safety regressions and evidence validation.

No product source, fixture, dependency, lockfile, generated XML, candidate pin, job topology, permission, repository setting, merge or production change is authorized here. FCD Superpowers, Ralph and GSD remain the workflow; all project builds/tests run in GitHub Actions. Review is sequential AI specialist self-review, not independent approval.

### Accepted reporting and canonical open work

Reporting corrections R1 through R6 are accepted through Errata v2. The accepted archive is 31003 bytes, SHA256 `a06b265ecb4d55d5467a001b68021eb9fdbdd6e3c810d73b240bb1964407896e`; its integrity, manifest, repaired 21-row/eight-column CSV, restored defect identities and conservative claims were verified. No further historical evidence rewrite is required. This closes reporting scope only, not product/native/human acceptance. The withdrawn advisory remains withdrawn; the cited original audit reported zero vulnerabilities.

| Canonical defect | Current disposition |
| --- | --- |
| DEFECT-01 | CRLF-sensitive source contract: portability fix pending, diagnostics are not committed fixes |
| DEFECT-02 | Windows ZIP fixture normalization: raw-name fixture correction pending |
| DEFECT-03 | Roleless ARIA naming: source correction and direct accessibility assertions pending |
| DEFECT-04 | Mixed-Mermaid order: DOM-order correction pending; retain registration-based ten-slot automatic admission and manual opt-in beyond ten |
| DEFECT-05 | Network-guard coverage: N0 outer boundary in progress; N1/N2A/N2B/N2C browser attribution/adoption still required |
| DEFECT-06 | Sampled target-size observations: node-specific WCAG disposition pending, no universal 44px requirement |
| DEFECT-07 | Historical host Node/Python limitation: environment evidence, not a theme defect |
| DEFECT-08 | Contrast incompletes: actual rendered-node/human disposition pending |
| DEFECT-09 | Old diagnostic wrapper non-gating exit: historical limitation, not reused as an acceptance gate |
| DEFECT-10 | Reporting traceability: accepted Errata v2 scope closed |

The historical 48 supplemental axe scans include 12 with incompletes; scan-node occurrences are not unique defects. Missing network records establish neither universal isolation nor proven production contact.

### Bootstrap implementation and test-first evidence

[Initial checkpoint](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36267578570) at `5719ee9043536ae27b69d357fec7b313f5f24f81` stopped before application tests. Its first externally readable annotations were insufficient to classify the cause. The next checkpoint added diagnostic annotations without changing the regression. [Behavioral red](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36267724660/job/108475489612) at `3f1e81fa9cfa750624beda730ae3dd4b50fa1b2c` explicitly reported the outer safety namespace, protected parent positive controls, successful negative control, and `EGRESS_POLICY: controlled parent canary reachable`. This is a controlled loopback failure inside an already no-egress namespace, not a public/production/metadata request or missing-package failure. Unit/browser application suites were not reached.

The implementation replaces that harness-only direct executor with a fresh Linux network/PID namespace for every application test invocation. Only loopback is enabled; the payload guard rejects other interfaces/routes. Test processes run as the original non-root runner with empty supplementary groups, zero capability sets and no-new-privileges. The environment is allowlisted rather than forwarding credentials or proxies. The parent harness can create child namespaces but has no external network; application payloads cannot acquire sudo privileges. This is accidental-egress defense, not a complete hostile-code/filesystem sandbox.

Mandatory regressions cover controlled parent IPv4/IPv6 denial, local fixtures, Node descendants, Chromium/Firefox/WebKit, explicit browser proxy attempts, TCP/UDP no-route denial, success/nonzero status propagation, bounded timeout, failed privileged setup without payload execution, and orphan cleanup. Namespace setup failure stops before application tests. No AppArmor/host firewall change, privileged Docker socket, dependency or runtime-stack change is used.

Dependency/browser installation, static compilation/contracts, fixture build-only generation, approved audit and artifact upload retain their separate original stages. All browser-bearing Vitest and Playwright application processes and their fixture servers/children execute inside the namespace. The existing single verify job, stage names, read-only permission, exact-head checkout and package-install flags remain. Explicit stage names describe the same npm commands now run behind a mandatory gate.

Isolation records are source-bound and staged under a fresh run/attempt-specific runner-temporary directory, outside Playwright startup cleanup. The always-run browser reporting stage copies them to `test-results/isolation`, rejects missing/stale/failed required records and retains nonzero application outcomes. Upload remains always-run, so an artifact on a failed run is not acceptance. The existing pinned verifier accepts those member paths for integrity, but does not semantically validate new isolation JSON and does not select PR-head artifacts.

**Status at this implementation commit:** behavioral red observed; implementation and B0 reconciliation written; fresh exact-head full verification and substantive review still pending. Follow PR #11 for actual head/run outcomes rather than treating this document commit as a pass. **Next action:** inspect the new head's isolation assertions, full normal CI, verifier contracts and CodeQL; fix only in-scope causes without weakening tests; obtain separate merge approval only after source acceptance. If namespace feasibility requires a new file, stage inventory, privilege workaround or other scope expansion, stop for approval.

### Remaining phase order and non-goals

After separately accepted bootstrap: U0 bounded upstream applicability; N1 then N2A/N2B/N2C; P3A Windows/Linux red before P1/P2 fixes and P3B green; A1/D1/A2 hardening; L0 design then bounded Layout stories with early owner-authorized native pattern proof; C0 native comments observation before any justified C1 change; R0/R1/R2 artifact/native/human gates. These later manifests are not approved for implementation by the bootstrap click.

Preserve the reviewed v2 corrections: no docs-only PR before safe CI, Windows regression before fixes, all browser-bearing contracts/checker tests inventoried, isolation evidence survives Playwright cleanup, diagram admission is not a hard ten-render limit, Layout changes include native/fixture/parity contracts, the existing native checker does not prove interactive comments/Layout, and exact install/preview flags remain in use. No LeadPilot infrastructure, generic full-stack framework, duplicate CodeQL, automatic dependency upgrade or restoration of the owner-deleted docs/fcd-env-example.

Post-merge artifact metadata and elapsed Phase1A retention are recorded in docs/DEPLOYMENT.md. No evidence destination, replacement candidate, import, live request, human acceptance or release is inferred.

---

## Historical snapshot: baseline and development loop (2026-09-18 Asia/Dhaka)

The remainder preserves the PR #10 preparation record. Its prospective wording is historical and superseded by the current section above.

PRs #1 through #9 are merged with history preserved. Main at the start of this batch is `e1e7bb3cee62ec03cfcc290fa85fb473191eb9b4`. [PR #9 post-merge verification](https://github.com/thefastcyberdefense/google-blogger/actions/runs/35079121123/job/104738565032) completed 2026-09-16 09:33:49 UTC: every stage successful,203 unit/contract passes,1170 browser passes,0 reported failed/pending/skipped/unexpected/flaky results,95157 raw XML bytes. [Post-merge CodeQL](https://github.com/thefastcyberdefense/google-blogger/actions/runs/35079120069) successfully analyzed Python, Actions and JavaScript/TypeScript; analysis success is not a zero-vulnerability guarantee.

The owner requested the loop: compare Ledger/current FCD, research, implement a bounded story, test in GitHub Actions, review/audit, fix failures and repeat, then propose the next scoped story. Owner handles Blogger uploads and supplies actual save/render evidence; source gates do not imply native acceptance. Merge, live-site tests, imports, publishing and settings remain separately authorized. The supplied FCD URL https://blogs.fastcyberdefense.com/ is the production target, not disposable staging; a controlled-production test plan was selected, but no live execution was authorized. https://blogs.redwan.work/ is the owner's Ledger reference, not the FCD deployment target.

## Historical approved slice: distinct native empty/error states

Branch: `feat/fcd-native-states`, from exact main above. [PR #10](https://github.com/thefastcyberdefense/google-blogger/pull/10) holds final revision, Actions evidence and review decision; remains unmerged unless explicitly approved later.

The owner approved ten files, then explicitly added tests/render/responsive.spec.ts after the first implementation run identified an ambiguous legacy test selector. Approved maximum scope:

1. src/widgets/blog.pug
2. src/partials/presentation.pug
3. fixtures/home.pug
4. tools/preview.ts
5. tests/contract/native-contract.test.ts
6. tests/render/native-states.spec.ts
7. tests/render/responsive.spec.ts
8. dist/theme.xml, generated in Actions only
9. .github/workflows/ci.yml, temporary source-bound branch-only XML transfer, fully restored before acceptance
10. docs/PROJECT-PLAN.md
11. docs/DEPLOYMENT.md

No dependency, lockfile, scripts, stylesheet, native identity, CodeQL configuration or repository-setting change. Normal CI is restored to its original read-only workflow; the temporary transfer job and stale-output exception are absent from the final tree.

### Behavior and acceptance

Preserve Blog1/Header1, Layouts V3, Widget Version2, super.main, native post/comment dispatch and pagination. In noContentPlaceholder use one exclusive native chain, error first, label before general search, then archive, initial empty homepage, generic empty page. Guard initial-home wording with not data:newerPageUrl so an empty paginated page does not claim the publication has never published.

| State | Distinct heading | Recovery/context |
| --- | --- | --- |
| Error |Page not found|Address guidance; no claim that the theme itself sets HTTP status|
| Label |No articles under this label|Escaped native label when available|
| Search |No matching articles|Escaped native query when available|
| Archive |No articles in this period|Escaped native archive range when available|
| Initial empty home |No articles published yet|Honest first-publication message|
| Generic empty page |No articles on this page|Non-misleading fallback for other empty/paginated views|

Each state has one h2 beneath the existing page h1, a labelled recovery search form using native GET/q and data:blog.searchUrl, and a native homepage link. Shared Pug mixins supply production and fixture content, no duplicated fixture copy or theme-JS dependency. Dynamic context is rendered as escaped text, not HTML or attribute content.

New browser cases cover all six states with JS on/off across the existing22 Chromium width/theme projects: safe hostile literal context, one visible state/main h1, no cards/phantom pagination, named recovery controls, Enter submission preserving encoded query, keyboard home-link activation, no horizontal overflow and axe scans with violations/incomplete evidence attached. Existing representative Firefox/WebKit coverage remains in publication-acceptance.spec.ts; new native-state cases are not claimed multi-engine. All requests in the new suite are intercepted; no live blog is contacted. Native conditions/escaping are checked structurally in generated XML, not executed by Blogger in fixture tests.

### Test-first and correction history

[Test-first run35256580361](https://github.com/thefastcyberdefense/google-blogger/actions/runs/35256580361/job/105321613394) at6a5055be001afd26cf133c6580eded1cd384be2f recorded203 existing passes and8 new failures: six missing distinct states, missing exclusive dispatch, and missing shared state presentation. Browser tests were not reached; missing fixture files are not counted as behavioral red proof.

Implementation run35257043409 at1ea629a2332d492639d733ed1a9b37f1675bcdcf passed the expanded contract suite and1390 browser cases, but44 no-JS cases in responsive.spec.ts failed because form[role="search"] now legitimately matched header and recovery forms. This was a test selector assumption, not grounds to remove the recovery form or weaken visibility checks. Owner approved the eleventh file; bcb5b82706568c2f6f29cd1795b2589767e42146 checks header search explicitly and adds recovery visibility, labelled searchbox, method/action and exact form-count assertions, with guaranteed context cleanup.

[Corrected run35259136763](https://github.com/thefastcyberdefense/google-blogger/actions/runs/35259136763) passed211 unit/contract and1434 browser cases with0 failures/pending/skipped/unexpected/flaky, plus audit. Its temporary stale-XML step was intentionally skipped and is not a pass. The separate source-bound transfer job succeeded, committing only Actions-generated XML as03e473c55672bcce418552b5b7603ae18f4db989. XML is101248 bytes and carries source stamp0.1.0+bcb5b82706568c2f6f29cd1795b2589767e42146. This verified transfer is not import-candidate approval.

Final acceptance still requires the exact final head's full CI after temporary writer removal, including restored stale-XML check, full browser suite, existing verifier contracts, CodeQL and scoped sequential code/security/accessibility review. Record observed results in PR #10 rather than predeclaring them in this commit. No tests/builds run locally. No independent-review claim for sequential self-review.

## Historical next source slices and native feedback

After this bounded slice passes, propose Layout-configurable navigation/intro/CTA/footer and supported gadget boundaries, then native comment usability. Richer year/month/category filtering, narration and SVG export remain later optional features, not a mandate to clone Ledger. Do not copy Ledger's raw cached HTML restoration, unrestricted full-feed traversal, permissive Mermaid settings, publisher or personal identity mappings.

Native feedback proceeds alongside scoped source development: owner supplies backups and imports an explicitly selected verified artifact; record save outcome and rendered stamp; separately approve read-only checks against the exact blog; reproduce and fix real failures. The existing eight-view staging workflow must not be silently pointed at production. Missing native evidence does not become a fixture pass, and no completed source story implies production release approval.

## Native acceptance dependencies and release gates

Reuse fixtures/staging-views.example.json, tools/staging-check.ts and .github/workflows/staging-check.yml; no duplicate manifest or checker. Need operator confirmation, exact blog identity/origin, theme/content backup and Layout settings references, durable evidence location, actual import/save/build stamp and eight real view URLs. Search/static/error need independently chosen expectedText; expectedCanonical is optional and independently justified. Keep non-sensitive configuration outside the public repository unless publication is approved. Public-response checks cannot validate a private/login-only blog.

The staging workflow had zero recorded runs on2026-09-16; this does not establish whether an owner-side import occurred elsewhere. Source's HTML checker blocks scripts/resources and does not prove live comments/Layout/feed interactions. Require native home/article/label/search/archive/static/error/paged results, real interaction observations and resolution of native-functionality blockers. Human keyboard/screen-reader, visual/contrast/print/true zoom, measured mobile performance and field performance remain separate. Production rollout and rollback execution need specific approval.

The Phase1A pinned candidate remains9a6f484, with source artifact expiry2026-09-26 04:28:06 UTC and existing handoff expiry2026-09-26 05:58:38 UTC, subject to earlier deletion. It does not include this slice. Do not silently replace it or change verifier pins. Full tuple and replacement boundary are in docs/DEPLOYMENT.md; evidence preservation needs an approved destination.

## Historical milestones and provenance

[PR #9](https://github.com/thefastcyberdefense/google-blogger/pull/9) completed two-document native-baseline preparation ataffcc72f6718060966839c9035333eb6a8a5344b:211 is NOT its test count; it had203 unit/contract and1170 browser passes,31 verifier contracts and successful CodeQL. Real-candidate job was skipped by branch policy, not verified. Main mergee1e7bb3 preserved both parents.

[PR #8](https://github.com/thefastcyberdefense/google-blogger/pull/8) completed Phase1A at81a8f111e44808a246eea6a9c145187112fb866c:31 verifier tests,203 unit/contract and1174 browser cases; bounded original archive/XML verification produced a byte-identical handoff. Main merge0aedbcf5d8b583669631509b2c0852faf4bd612d passed [run34680616793](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34680616793). Its branch was retained at merge and later [deleted2026-09-12 07:36:10 UTC](https://api.github.com/repos/thefastcyberdefense/google-blogger/issues/events/31014774270); actor attribution does not establish manual versus automation. No restoration authorized.

Phase1A retained the approved browser-only80MiB bound after observed69523303-byte browser JSON; other safety limits unchanged. Its raw XML substring DTD check was corrected to declaration-aware Expat validation, allowing plain html doctype/inert CDATA while rejecting external identifiers/subsets/entities. [Initial red run34676406787](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34676406787/job/103506940902) contained meaningful rejection failures plus a separate archive error, not a wholly clean red run. See [pre-slice plan](https://github.com/thefastcyberdefense/google-blogger/blob/e1e7bb3cee62ec03cfcc290fa85fb473191eb9b4/docs/PROJECT-PLAN.md) for the preserved detailed historical scope.

Original Ledger reuse baseline692a82463cb8d0869a6f5e7c946ecc757cacb7e2 remains. PR #7 researched Ledger v1.5.0 at a209471279812309e68571aba8d918e68bcc16da and added18 diagram and44 Chromium cases without runtime changes; main9a6f484 passed run34672572631 with203/1170. Latest source comparison used Ledger2e5eb328adf096a42b4da50ff676de1cbfe42405, not a claim that all current source is released or deployed. Uncertain advisory claims stay in docs/UPSTREAM-AUDIT.md.

PR #6 prepared the staging worksheet; head75b50407272a46179530d2a744ca406f05030a99 passed run34427968543 and merge1f85a593f8b28fd5a37cfe2e12ac5a57d9e9c205 passed run34666092580 with185/1126. PR #5 delivered metadata and cross-browser acceptance; main8e37eb53c9cc4c13dd3d5baf1d07fe71e984f312 passed run34426823783 with185/1126. Earlier notes remain historical, not current readiness claims. Branches retained at their merges were later absent in listings; do not infer causes or recreate them.

## Invariants

Only total raw generated XML <=500000 bytes is capped; CSS/JS raw/gzip and growth are informational. Preserve network/input/timeout/retry/cache limits. Keep modular Pug/SCSS/TypeScript compiling into one XML, native V3/V2 engine, Blog1/Header1, super.main, FCD identity and applicable owner-authorized upstream license notices. No React/Vue, runtime backend or database.

Use FCD Superpowers + Ralph + GSD and relevant review roles with the project-requested workspace GitHub connection. Build/test only in Actions. Normal verification is read-only and checkout credentials are nonpersistent. No secrets in source/XML, manual generated XML edits, retained temporary writers, automatic merge, branch cleanup, publishing, DNS or live-blog operations. Branch protection remains deferred and GitHub-managed CodeQL is not duplicated. The old inaccessible-live-blog audit waiver does not waive native acceptance.
