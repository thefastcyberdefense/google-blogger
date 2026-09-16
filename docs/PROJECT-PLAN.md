# FCD development plan

## Current baseline and approved preparation (2026-09-16)

PRs #1 through #8 are merged with history preserved. Current main is `0aedbcf5d8b583669631509b2c0852faf4bd612d`. Every stage of [PR #8 post-merge verification](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34680616793/job/103518470521) succeeded, completed 2026-09-12 07:34:40 UTC: 203 unit/contract passes, 1170 browser passes, zero reported failed/pending/skipped/unexpected/flaky results, 95157 raw XML bytes, dependency audit and generated XML consistency. [Post-merge CodeQL](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34680616422) successfully analyzed Python, Actions and JavaScript/TypeScript; this is not a zero-vulnerability guarantee. Phase1A is complete, not an active implementation task.

On 2026-09-16 the owner approved a fresh `docs/fcd-native-staging-baseline` branch from that exact main and updates to only `docs/PROJECT-PLAN.md` and `docs/DEPLOYMENT.md`. This preparation reconciles evidence and defines the next native acceptance work. Ordinary PR Actions verification remains required. No runtime, tests, workflows, manifest example, dependencies, lockfile, generated XML or repository settings are changed. Final preparation commit, Actions outcomes and scoped sequential review belong in its PR; the baseline result above does not attest to the new commit.

This approval does NOT authorize artifact-verifier workflow_dispatch, evidence transfer to an unspecified location, Blogger import/save, staging requests, repository variables, test-content publication, Layout/comment mutations, defect implementation, merge, deployment, DNS, release/tag publication or branch restoration/deletion. Those require their own scoped approval. Branch protection remains deferred; do not duplicate or replace the existing GitHub-managed CodeQL setup.

PR #8's branch was verified present immediately after the merge. Its [head-ref deletion record](https://api.github.com/repos/thefastcyberdefense/google-blogger/issues/events/31014774270) is dated 2026-09-12 07:36:10 UTC, attributed to the owner's GitHub account; it does not distinguish a manual action from automation using that account. Only main was listed at the start of this preparation. Leave the deleted branch untouched; its merged history remains in main.

## Phase1B: dependency-ordered native acceptance plan

Goal: establish actual Blogger import/save and rendered build identity, pass the existing eight-view checks, and record native interaction findings before expanding runtime features. Risk is medium overall; import is a separately controlled staging mutation. Preparation is not execution approval.

| Order | Proposed work / responsible role | Dependencies and acceptance evidence |
| --- | --- | --- |
| 1 | Reconcile baseline and preserve handoff / Documentation and Operations | This two-document preparation; separately approve dispatch of the existing verifier on main and evidence storage. Require successful contracts and real-candidate verification, exact verifier/source identities, and an approved durable evidence location. Do not substitute a new candidate. |
| 2 | Establish dedicated staging target and content / Owner-operator with QA | Supply non-sensitive blog name/ID, exact public HTTPS origin and operator. Inventory existing content first; separately approve any creation/publication. Real content must support all eight views including true pagination. |
| 3 | Back up and import exact XML / Authorized Blogger operator | Steps1-2, backup references and separate approval for this blog/candidate. Back up theme and content separately, record Layout settings, import through theme controls, record UTC save outcome and rendered stamp. A successful upload alone is not a pass. |
| 4 | Configure and run existing eight-view checks / QA and Operations | Confirmed import plus complete real manifest and separate configuration/dispatch approval. Reuse fixtures/staging-views.example.json, tools/staging-check.ts and .github/workflows/staging-check.yml. Require all eight PASS lines, complete successful run and exact checker revision. |
| 5 | Native interaction smoke pass / QA with operator | Native views available; separate scope for mutations. Observe navigation, no-JS reading/fallback, selected feed behavior, Header1/Blog1/Layout, comments and existing menu/search/TOC/copy/theme controls; capture environment and evidence. Full accessibility and field performance remain separate. |
| 6 | Classify and propose bounded defect fixes / Technical lead, QA, relevant implementer and Code Review | Reproduce theme versus checker versus content/configuration/platform failures. Record severity, affected files, expected behavior, regression and native retest. Obtain specific implementation approval before code changes. |
| 7 | Close native baseline and scope Phase2 / Documentation and QA | Record artifact/import/view/interaction evidence and unresolved gates in these existing records. Require import/save, correct rendered identity, all eight automated views and no unresolved critical native-functionality blocker. Untested areas remain pending. |

The owner must supply the staging identity/operator, approved evidence location, real content/URLs and independent visible-text expectations. Search/static/error need expectedText. Use expectedCanonical only for a separately justified platform canonicalization, never inferred from the response being tested. Do not publish owner-specific configuration in the public repository without approval. A private/login-only staging blog cannot satisfy the current public-response checker.

The existing staging workflow had zero recorded runs when checked on 2026-09-16; this does not establish whether any unrecorded owner-side import has occurred. No import/save evidence or completed real manifest has been supplied in this work. The checker parses returned HTML with resources/scripts blocked; it does not prove live interactions, comment submission, Layout editing, human accessibility or field performance. Preserve its run/log reference; it does not currently upload a dedicated staging evidence artifact.

Approved candidate remains source `9a6f484a2c389c3b256dcd58d88742118fc01905`, not current main or a documentation-branch build. Its source artifact expires 2026-09-26 04:28:06 UTC; the existing verified handoff expires 2026-09-26 05:58:38 UTC, both subject to earlier deletion. Both metadata endpoints reported unexpired on 2026-09-16; no new archive download or verifier dispatch is implied. Preserve evidence before expiry only to an approved location. A fresh handoff does not extend the original source artifact lifetime. Full tuple, digest and procedure remain in docs/DEPLOYMENT.md.

For an approved defect fix: use a fresh branch from rechecked main, capture meaningful behavioral red evidence in Actions, implement the smallest correction, complete exact-head CI and applicable review, obtain separate history-preserving merge approval, verify post-merge Actions, then obtain explicit candidate-replacement/reimport approval if theme bytes change. No manually patched XML, relaxed checks or unrelated feature bundle.

## Historical pre-PR #8 baseline

PRs #1 through #7 are merged with history preserved. Main `9a6f484a2c389c3b256dcd58d88742118fc01905` passed every stage of [post-merge run 34672572631](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34672572631/job/103496602996), completed 2026-09-12 04:28:15 UTC: 203 unit/contract tests, 1170 browser tests, zero failed/pending/skipped/unexpected/flaky, 95157 raw XML bytes, dependency audit and generated XML consistency. PR #7's Ledger v1.5.0 applicability and retained-boundary regression scope is complete. No deployment or native import has occurred in this work.

GitHub-managed CodeQL was enabled by the owner and successfully analyzed JavaScript/TypeScript, Python and Actions on this main in [setup run 34675220615](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34675220615). Analysis success is not zero-alert assurance; query selection, alert inventory and merge blocking are separate. Branch-protection work is deferred by owner request; this phase makes no repository-setting or CodeQL changes.

## Completed Phase 1A: historical scope and evidence

Owner approved on 2026-09-12: branch `feat/fcd-artifact-verification`, one initially draft and subsequently merged [PR #8](https://github.com/thefastcyberdefense/google-blogger/pull/8), five-file implementation boundary:

1. `.github/workflows/artifact-verification.yml`: isolated Actions contracts and pinned-candidate validation/handoff upload, contents:read and actions:read only.
2. `tools/verify-artifact.py`: standard-library-only verifier for repository/source/run/attempt/job/stages, bounded download, safe archive inspection, XML checksum/stamp and report validation.
3. `tests/artifact/test_verify_artifact.py`: deterministic positive/negative contracts, including transport credential separation and byte limits.
4. `docs/DEPLOYMENT.md`: explicit candidate replacement, historical candidate retention and handoff procedure.
5. This existing plan: baseline, authorization and remaining gates. No competing work ledger.

Candidate replacement is explicitly authorized: source `9a6f484a2c389c3b256dcd58d88742118fc01905`, run34672572631 attempt1, job103496602996, artifact10291252454, archive SHA256 `1fedb62352c275addd266e83b3955ada49341b176114ea269884e9d0ca2bd069`. The selected generating workflow is `.github/workflows/ci.yml`. Output XML remains byte-identical to its selected artifact and carries that source's full stamp, not the verifier branch's stamp. No XML regeneration or source commit of generated output.

The owner additionally approved 80 MiB only for `test-results/browser.json` after its observed size of 69523303 bytes exceeded the initial 64 MiB limit. Unit/build-size reports stay at64 MiB. Retain all other archive, timeout, checksum and XML safeguards. These are verifier safety bounds, not theme JS/CSS growth caps.

Acceptance: meaningful Actions red rejection cases before implementation; green contracts with no skips; real pinned-archive verification including every member's path/type/CRC/actual length, individual XML checksum against generating-job output, source stamp and per-test reports; verified handoff upload; complete normal exact-head project CI; scoped sequential review. Final exact-head runs, counts, checksum, artifact and review outcomes belong in PR #8. No pending or earlier-head result is final acceptance.

The live candidate exposed a verifier false positive: a raw substring DTD ban rejected the legitimate `<!DOCTYPE html>` and declaration-like Prism CDATA. The correction parses XML declarations: allows only a plain html doctype, rejects external identifiers/internal subsets/entities before processing them, and treats CDATA/comments as inert. It does not edit source XML or relax external-entity protections. Positive and malicious-declaration tests preserve the distinction.

The initial scaffold run had expected failed rejection assertions plus an archive error, not a wholly clean red run. Specific observable failures in [run34676406787](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34676406787/job/103506940902) establish missing checksum/path/type/evidence enforcement; no setup failure is counted as behavioral proof. The64 MiB and declaration false-positive failures remain historical evidence, not accepted handoffs.

## Later phases (proposals, not implementation authorization)

After Phase1B native acceptance above: Phase2 addresses distinct empty/error states and native pagination/interaction acceptance, with focused fixes from staging evidence. Phase3: approved Layout editability and declared supported gadgets, preserving native identities. Phase4: real reading/comment usability plus human keyboard, screen-reader, visual, print and true zoom. Phase5: native metadata/share previews and measured mobile lab performance; field data separate. Phase6: separately approved release package, rollback rehearsal, production authorization and bounded monitoring. Phase7: optional reader-benefit features such as narration or SVG export, never wholesale Ledger cloning.

Do not duplicate the working GitHub-managed CodeQL setup. Phase1A artifact-verification implementation is complete; further scanning permissions, repository rules, staging execution and release operations remain separately controlled.

## Historical milestones and provenance

Original Ledger reuse baseline remains `692a82463cb8d0869a6f5e7c946ecc757cacb7e2`. Ledger v1.5.0 research pins `a209471279812309e68571aba8d918e68bcc16da`; classifications and uncertain advisory claims remain in docs/UPSTREAM-AUDIT.md. PR #7 added18 diagram cases and44 Chromium browser executions without runtime/dependency changes. It did not claim newly fixed vulnerabilities or manufacture red history for retained behavior.

PR C delivered conditional native metadata, bounded parsed-output validation, independent canonical and explicit Schema.org context checks, representative Firefox/WebKit coverage and synthetic observations. [PR #5](https://github.com/thefastcyberdefense/google-blogger/pull/5) holds final source evidence. Main8e37eb53c9cc4c13dd3d5baf1d07fe71e984f312 passed run34426823783 with185 unit/contract and1126 browser cases.

PR #6 prepared the staging worksheet without theme/schema changes. Head75b50407272a46179530d2a744ca406f05030a99 passed run34427968543; merge1f85a593f8b28fd5a37cfe2e12ac5a57d9e9c205 passed run34666092580 with185/1126. Earlier phase notes are historical. Branches were retained at their authorized merges; later listings showed only main. Do not infer who removed them or silently restore/delete branches. Earlier recorded merged PR heads were confirmed reachable from main.

## Invariants and authorization boundaries

Only total raw generated XML <=500000 bytes is capped. No fixed CSS, bundled JS or per-phase growth caps. Component/raw/gzip sizes remain informational. Preserve all security/input/network/time/retry limits.

Preserve Layouts V3, Widget Version2, Blog1/Header1, super.main, native feeds/comments/labels/archives/pagination/Layout behavior and FCD identity. Modular Pug/SCSS/TypeScript remains; no React/Vue, backend or database. Preserve owner-confirmed reuse permission and required license notices. Do not import Ledger's publisher, personal identity mappings, cached HTML or permissive Mermaid settings.

FCD Superpowers + Ralph + GSD and relevant specialist reviews use the workspace GitHub connection. All automated project builds/tests run in GitHub Actions. Sequential self-review is not independent approval. Normal CI remains read-only; Phase1A introduced no contents:write, production credentials or temporary XML writer.

Source completion, feature-head verification, post-merge verification, artifact verification, native staging, human acceptance and release approval remain separate. Merge requires explicit owner confirmation with a history-preserving merge commit. Native eight-view import/save/stamp, widget/feed/comment/Layout, human accessibility/visual/true zoom/print and field performance remain pending. The old inaccessible-live-blog audit waiver does not waive staging.

The current two-document preparation authorizes no merge, Blogger import/save, staging requests, repository variables/settings, branch protection, CodeQL changes, release/tag publication, article publication, deployment, DNS or branch deletion/restoration.
