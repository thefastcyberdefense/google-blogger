# FCD development plan

## Accepted baseline

PRs1-4 merged with history preserved, without deployment. Current approved PR C base96ba43115b25fc55155c128a0d2e83e1c46339dc passed post-merge run34365338022:168 unit/contract and946 browser tests. Preserve that coverage.

## Active PR C

Approved metadata, representative browser and acceptance batch on feat/fcd-publication-acceptance, one draft PR and source-bound branch-only XML transfer if needed. The owner's explicit size-policy amendment additionally authorizes removing growth gates from tools/generate.ts. See docs/PHASE-2B-PR-C.md.

Implement conditional native author/date fields, bounded parsed-output validation integrated with read-only staging, adversarial metadata controls, Firefox/WebKit390/1280 light/dark representative projects, request/timing observations and release evidence documentation. No dependency changes or wholesale native/template redesign. Stop for a material out-of-scope runtime defect rather than silently expanding this batch.

## Current size policy

Only complete raw generated theme XML <=500000 bytes. No fixed CSS, raw bundled JavaScript or growth limit. Component/raw/gzip sizes are reports, not gates. Historical PR A/B budgets remain historical and are superseded from10 September2026. Network input/time/retry limits, audit/security/accessibility requirements remain unchanged.

## Invariants and workflow

Preserve V3/V2, Blog1/Header1, super.main, native comments/labels/archive/pagination and shared presentation. FCD Superpowers + Ralph + GSD, specialist accessibility/code review as applicable. All automated project execution in GitHub Actions. Meaningful red tests, exact-head green and honest self-review provenance. Normal CI read-only; temporary approved XML transfer changes only feature-branch dist/theme.xml after immutable provenance/report checks and is removed before final acceptance.

## Completion boundaries

Source acceptance: approved implementation, current tests/audit/XML contracts/metadata checks and artifact parity. Merge requires owner confirmation. Native platform acceptance requires actual Blogger import/save, eight views and widget/comment/Layout evidence. Human accessibility/print and field performance remain separate. Production deployment requires explicit approval.

PR C can finish source tooling and engine coverage without supplied staging, but cannot finish native release acceptance by simulation. No publishing, deployment, branch deletion, robots/indexing-policy edits, analytics or infrastructure changes.
