# FCD development plan

## Accepted baseline

PRs #1 through #5 are merged with history preserved, without deployment. Main at `8e37eb53c9cc4c13dd3d5baf1d07fe71e984f312` passed [post-merge run 34426823783](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34426823783/job/102713723132), completed 2026-09-10 01:55:49 UTC: 185 unit/contract tests and 1,126 browser tests, zero failed/pending unit cases or skipped/unexpected/flaky browser cases. Installation, typecheck, compilation, XML contracts, dependency audit, generated XML consistency, artifact upload and cleanup all passed. XML: 95,157 raw bytes. Preserve this coverage.

PR C source scope is complete. [PR #5](https://github.com/thefastcyberdefense/google-blogger/pull/5) holds the final feature-head evidence and resolutions of the independent canonical expectation, Schema.org context and synthetic observation review findings. Its old draft/unmerged paragraph is historical; GitHub's merged state and the post-merge run above supersede it. Earlier counts in docs/PHASE-2B-PR-C.md are historical, not current acceptance totals.

On 2026-09-10 only main remained before this preparation branch was created. GitHub ancestry comparisons confirmed all five recorded merged PR heads are ancestors of the main commit above. Missing branch names do not erase that merged history; unknown post-merge branch-only commits were not assessed. Do not recreate or delete branches as a cleanup side effect.

## Active milestone: native staging preparation

Owner-approved preparation-only scope on fresh branch `docs/fcd-staging-preparation`, created from the verified main commit above. Reuse this plan, docs/DEPLOYMENT.md and fixtures/staging-views.example.json; do not create a competing ledger or restart source implementation.

1. Reconcile completed PR C/source and post-merge evidence in the existing records.
2. Assemble a source-bound artifact handoff and readable eight-view manifest worksheet, retaining empty unknown owner inputs rather than inventing staging URLs or results.
3. Review the worksheet against the existing staging validator/workflow and document the exact remaining owner, native and human gates. Verify the preparation commit through normal GitHub Actions; final exact-head evidence belongs in the preparation PR.

Only these three existing files are in this preparation batch. No theme/runtime, tests, dependencies, lockfile, generated XML, workflow permissions, repository variables or Blogger settings change. There is no new behavior needing a fabricated red-test history. No staging workflow dispatch, theme import/save, content publication, deployment, DNS change, merge or branch deletion is authorized by preparation approval.

Preparation can finish without a staging blog. Executing native acceptance cannot: the owner must identify a dedicated non-sensitive staging blog, approve the exact import separately, provide import/save and build-stamp evidence, and supply all eight real view URLs plus required visible-text expectations. Artifact metadata is recorded, not a claim of downloaded-byte verification or signed attestation. See docs/DEPLOYMENT.md for the pending transfer checks and owner worksheet.

## Completed PR C scope (historical authorization)

Approved metadata, representative browser and acceptance batch on feat/fcd-publication-acceptance, one draft PR and source-bound branch-only XML transfer if needed. The owner's explicit size-policy amendment additionally authorized removing growth gates from tools/generate.ts. See docs/PHASE-2B-PR-C.md.

Delivered conditional native author/date fields, bounded parsed-output validation integrated with read-only staging, adversarial metadata controls, Firefox/WebKit 390/1280 light/dark representative projects, synthetic observations and release evidence documentation. No dependency changes or wholesale native/template redesign. Synthetic observations are diagnostics, not field CLS/INP guarantees. New runtime defects require a focused approved fix batch, not silent expansion of preparation.

## Current size policy

Only complete raw generated theme XML <=500000 bytes. No fixed CSS, raw bundled JavaScript or growth limit. Component/raw/gzip sizes are reports, not gates. Historical PR A/B budgets remain historical and are superseded from 10 September 2026. Network input/time/retry limits, audit/security/accessibility requirements remain unchanged.

## Invariants and workflow

Preserve V3/V2, Blog1/Header1, super.main, native comments/labels/archive/pagination and shared presentation. FCD Superpowers + Ralph + GSD, specialist accessibility/code review as applicable. All automated project execution in GitHub Actions. Meaningful red tests for behavior changes, exact-head green and honest self-review provenance. These are ClickUp workflow adaptations; sequential self-review is not independent approval. Normal CI read-only; temporary approved XML transfer changes only feature-branch dist/theme.xml after immutable provenance/report checks and is removed before final acceptance. No temporary writer is introduced by this preparation.

## Completion boundaries

Source acceptance: approved implementation, current tests/audit/XML contracts/metadata checks and artifact parity. Post-merge verification: passed for the exact main commit above. Preparation verification: assess the new branch's own Actions evidence, not the previous main run. Merge requires owner confirmation and a history-preserving merge commit.

Native platform acceptance requires actual Blogger import/save, eight views and feed/widget/comment/Layout evidence. Human accessibility/visual/true-zoom/print and field performance remain separate pending gates. Production deployment requires explicit approval. The old inaccessible-live-blog audit waiver does not waive future staging acceptance.

No publishing, deployment, branch deletion, robots/indexing-policy edits, analytics or infrastructure changes. Next external dependency: owner-supplied staging identity and separate import authorization; do not substitute production or synthetic fixtures.
