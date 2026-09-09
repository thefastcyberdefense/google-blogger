# FCD development plan

## Accepted baseline

PR #1 foundation, PR #2 technical content and PR #3 editorial presentation are merged with history preserved, without deployment. Main baseline 18b127d014e5d02a860603b18f10dd6c7ab81169 passed post-merge Actions run 34338858565. Native Blogger import and human release evidence remain pending.

## Phase 2B

PR A completed source integration: native-order editorial roles, images, filtering, author-controlled cover and print. Historical scope/evidence in docs/PHASE-2B-PR-A.md. No automatic production release.

PR B approved implementation: up to 28 files, branch feat/fcd-content-discovery, one draft PR, bounded shared feed/identity/ranking, related articles, Recent Posts migration, clear filter, tests and verified XML-only transfer. See docs/PHASE-2B-PR-B.md. No new dependencies, recommendation images, persistent cache, full-archive index or backend.

PR C direction only: metadata, representative additional-browser coverage, performance and actual staging acceptance. Exact implementation preview still required.

## Invariants and workflow

Preserve Blog1/Header1, V3/V2, super.main, native expressions/comments/labels/archive/pagination, shared presentation and technical fallbacks. Use FCD Superpowers + Ralph + GSD and relevant accessibility/code review. All automated execution in Actions. Real behavioral red, exact-head green, honest self-review provenance. Source/fixture/native Blogger/human evidence remain distinct.

## Current budgets

PR B measures base 18b127d014e5d02a860603b18f10dd6c7ab81169 through Actions; raw JS growth <=8192, CSS <=2048; XML <=500000. Preserve historical PR A budget evidence, do not silently change acceptance thresholds. Normal CI read-only. Only the approved temporary branch-specific XML writer may use write permission, and it must validate source/job/reports/stamp before committing dist/theme.xml only, then be removed before final acceptance.

## Gates

Source complete: accepted behavior, reviewed source, full exact-head checks/audit/budgets and generated XML parity. Merge requires owner approval. Release requires actual Blogger import/save/eight views, native comments/widgets/Layout, human checks and operational approval. No merge/deployment/deletion/publication follows from planning or test success.

SVG export, narration, analytics, newsletter/backend services, publishing automation, infrastructure and replacement cursors remain excluded.
