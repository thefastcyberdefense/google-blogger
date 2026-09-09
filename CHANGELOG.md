# Changelog

## Unreleased: Phase 2B PR B

- Added bounded normalized feed model and shared transport with source identity, byte/time limits and one shared explicit retry.
- Added deterministic post-only related articles and honest latest/empty/error native fallbacks; current article excluded from both consumers.
- Migrated Recent Posts without removing the original safe five-result parser contract.
- Added catalog clear/reset focus handling, preserving native full-publication search.
- Added identity/ranking/stream/timeout/redirect/retry/renderer isolation/native context and compiled browser regressions.
- Fixed Actions-discovered sidebar overflow at 200% text without suppressing tests.
- Approved budgets enforced against merged PR A: JS +8192, CSS +2048 raw bytes; XML <=500000.
- XML transferred from verified Actions source to the feature branch; full read-only final-head verification remains required. No merge/deployment.

## Phase 2B PR A (merged without deployment)

Native-order editorial homepage/cards, responsive lead image hints, author-controlled cover convention, reading measure and print styling. Source verification: 129 unit/contract and 792 browser tests before merge; main post-merge run 34338858565 passed.

## Phase 2 technical content (merged without deployment)

Prism 1.30.0 explicit grammar subset; Mermaid 11.17.2 optional strict ESM rendering and source fallback; accessible controls and lifecycle; read-only eight-view staging tooling with article/hidden-content fixes. Vitest 4.1.11 patched and genuinely locked/audited. 127 unit/contract and 594 browser tests before merge.

## Foundation

Native V3/V2 engine, shared FCD presentation, safe search/feed, source-fixture parity, XML mutation contracts, keyboard/a11y/no-JS regressions. Actual Blogger and human release gates remain separate.
