# FCD development plan

## Current baseline and approved batch

PRs #1 through #6 are merged with history preserved. Main `1f85a593f8b28fd5a37cfe2e12ac5a57d9e9c205` passed every stage of [post-merge run 34666092580](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34666092580/job/103478151278), completed 2026-09-12 02:01:22 UTC: 185 unit/contract tests, 1126 browser tests, zero failed/pending unit cases or skipped/unexpected/flaky browser cases, 95157-byte raw XML, audit and XML consistency. PR #6's staging preparation is complete, not an active implementation task. Its branch was retained at merge. No deployment or native import has occurred in this work.

On 2026-09-12 the owner approved steps 1-2 of the Ledger v1.5.0 research plan on a fresh feature branch: `feat/fcd-ledger-150-boundary-regressions`, created from the exact main above. Steps 3-5 are not implementation authorization.

## Active milestone: upstream applicability and retained-boundary regressions

1. Reconcile docs/UPSTREAM-AUDIT.md and this existing plan. Pin Ledger v1.5.0 to `a209471279812309e68571aba8d918e68bcc16da`, keep the original reuse baseline, and classify release changes as covered, applicable, excluded or unresolved. Record actual post-merge evidence rather than stale PR draft text.
2. Extend tests/unit/diagrams.test.ts for nested entities, malformed header tokens, opt-in legacy handling, exact input boundaries and long comment/whitespace/configuration cases. Add tests/render/security-boundaries.spec.ts for malicious feed values through the real compiled theme into Recent Posts and related DOM, safe keyboard navigation and empty-safe-result fallback. Retain all existing tests and run normal Actions on the final exact head.

Initial scope is four files: these two existing records, the existing diagram unit suite and one browser regression file. No runtime, native Pug/SCSS, dependency/lockfile, generated XML, workflow, permission or repository-setting change is planned. This is characterization of retained behavior, not a claim of a newly fixed vulnerability or manufactured failing-test history. If a new test exposes a real defect, distinguish it from a faulty fixture/assertion, preserve the Actions failure, and get the required focused fix approval before expanding scope.

Acceptance: nested encoded literals are not recursively decoded; marked legacy arrows receive only existing supported normalization; malformed first header tokens fail; unmarked/comment-separated duplicate headers are not silently auto-repaired (preparation is not Mermaid syntax validation); exactly 20000 source characters remain accepted and 20001 rejected; late configuration overrides fail; strict rendering/limits remain intact. Browser acceptance: hostile title/label strings remain text, unsafe URLs are omitted, accepted same-origin links work from the keyboard, generated lists contain no injected active elements/events, no payload-triggered requests/dialogs occur, and an all-rejected response retains honest native fallback.

New browser coverage runs in the existing 22 Chromium viewport/theme projects. Existing representative Firefox/WebKit coverage is retained, not silently expanded or represented as covering the new file. No local automated project tests/builds. Source inspection and sequential specialist review are not independent approval. Final commit, run, counts, artifacts and review decision belong in this batch's PR; baseline results above do not attest to the new tests.

## Later proposed steps, not approved by this batch

Step 3: inspect actual CodeQL/default-setup state before proposing a pinned least-privilege scanning workflow; absence of a committed workflow does not prove scanning is disabled. Any security-events:write reporting permission needs separate approval. Step 4: approved read-only Actions artifact verification, with fail-closed source/run/digest/stamp/report checks and no publisher or XML writer. Step 5: owner-assisted native staging execution after separate import/configuration authorization and supplied real inputs. Do not execute these as a side effect of steps 1-2.

## Historical source and preparation milestones

PR C source scope is complete. [PR #5](https://github.com/thefastcyberdefense/google-blogger/pull/5) records final feature-head evidence and resolutions of independent canonical expectation, Schema.org context and synthetic observation findings. Main `8e37eb53c9cc4c13dd3d5baf1d07fe71e984f312` passed [run 34426823783](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34426823783/job/102713723132): 185 unit/contract, 1126 browser tests, 95157-byte XML. Earlier counts in docs/PHASE-2B-PR-C.md are historical.

PR #6 prepared docs/DEPLOYMENT.md and the readable empty fixtures/staging-views.example.json without runtime/schema changes. Head `75b50407272a46179530d2a744ca406f05030a99` passed [run 34427968543](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34427968543/job/102717145046). Current main post-merge evidence is recorded above. On 2026-09-10 ancestry comparisons confirmed the five earlier recorded PR heads remained reachable from main after their branch names disappeared; unknown post-merge branch-only commits were not assessed. Do not recreate/delete branches as cleanup.

PR C delivered conditional native author/date fields, bounded parsed metadata validation integrated with read-only staging, adversarial controls, representative Firefox/WebKit projects, synthetic observations and release evidence documentation. No wholesale template redesign. Synthetic observations are diagnostics, not field CLS/INP guarantees.

## Current size policy and invariants

Only complete raw generated XML <=500000 bytes. No fixed CSS, bundled JavaScript or per-phase growth limits. Component/raw/gzip sizes are reports, not gates. Historical PR A/B budgets are superseded from 10 September 2026; security/input/network/time/retry limits remain unchanged.

Preserve Layouts V3, Widget Version 2, Blog1/Header1, super.main, native comments/feeds/labels/archive/pagination/Layout behavior and shared presentation. Keep modular Pug/SCSS/TypeScript; no React/Vue, backend or database. Preserve applicable upstream license notices and FCD identity. Do not copy Ledger's publisher, personal identity mappings, raw cached HTML, permissive Mermaid settings or generated theme wholesale.

Use FCD Superpowers + Ralph + GSD and relevant specialist passes through the project-approved workspace GitHub connection. All automated execution is in Actions. Normal CI stays contents:read with pinned actions and nonpersistent checkout credentials. Any later necessary XML regeneration uses separately approved provenance-verified Actions output; no manual XML/lockfile edits or lingering temporary writers.

## Completion boundaries and next external dependency

Source acceptance and exact-main merge verification are separate from new-batch verification, downloaded artifact verification, native acceptance, human review and release approval. New batch remains unverified until its own full run and review. Merge requires explicit owner confirmation and a history-preserving merge commit; retain branches unless separately authorized otherwise.

The existing candidate import artifact in docs/DEPLOYMENT.md remains pinned to its recorded run and source; this batch does not silently replace it. Archive-byte verification, individual XML checksum and actual stamp inspection remain pending before import. Staging requires dedicated non-sensitive blog identity, eight real URLs, visible-text expectations and owner-confirmed import/save. Native feed/widget/comment/Layout evidence, human accessibility/visual/true zoom/print and field performance remain pending. The old inaccessible-live-blog audit waiver does not waive future staging.

No Blogger import/save, staging dispatch, repository variables, publication, deployment, DNS, robots/indexing-policy edits, analytics, merge or branch deletion is authorized by this batch.
