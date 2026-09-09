# FCD development plan

## Accepted baseline

PR #1 foundation and PR #2 technical content are merged with history preserved. Main baseline ec08c4b9d1ba2cd35d9ec8a9bcbe557f2d01ca3d passed post-merge Actions (run 34315679550). No Blogger deployment, production import, DNS change or publication occurred. Earlier scope and audit provenance remain in docs/UPSTREAM-AUDIT.md and git history.

## Approved Phase 2B

PR A: editorial homepage/cards, image policy, long-form/print presentation and baseline/acceptance evidence. Approved 26-file manifest, one branch feat/fcd-editorial-experience and one draft PR, including temporary branch-only verified XML transfer. See docs/PHASE-2B-PR-A.md for story status. Do not expand file scope silently.

PR B (direction approved, implementation preview still required): shared bounded feed model, related articles and search/topic discovery refinements. Native search remains full-publication fallback; a bounded feed does not certify whole-archive coverage.

PR C (direction approved, implementation preview still required): page-type metadata validation, representative additional browser coverage, performance and staging acceptance package.

## Invariants

Preserve Blog1/Header1, Layouts V3, Widget Version 2, native expressions, super.main, labels/search/archives/pagination/comments and shared source/fixture parity. Retain technical source fallback and strict exact-pinned optional Mermaid. No framework/backend/database. No article duplicates or CSS reading-order mismatch.

Use FCD Superpowers, Ralph and GSD with relevant accessibility/security/code review. All automated builds/tests run in Actions. Show meaningful behavioral red evidence, then fixes and complete final-head verification. Keep source, fixture, actual Blogger and human evidence distinct.

## Budgets and artifact handling

XML <=500000 bytes. PR A raw CSS growth <=12288 bytes, JS <=2048 bytes against the Actions-built pinned main baseline; gzip and runtime network bytes separately reported. Normal CI read-only. Temporary approved transfer verifies source, job/report outcomes and stamp, changes only dist/theme.xml on the feature branch, and is removed before final acceptance.

## Gates and deferrals

Source-complete requires implemented accepted stories, review, full exact-head tests/audit/budgets and regenerated XML consistency. Merge requires explicit approval. Release requires actual Blogger upload/save, eight native page types, comments/widgets/Layout, human accessibility and operational approval. Missing evidence stays pending.

SVG export, narration, analytics, newsletter/backend services, publishing automation, infrastructure and replacement native cursors remain excluded. No merge/deployment/deletion is authorized by Phase 2B planning or PR A implementation approval.
