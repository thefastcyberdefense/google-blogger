# FCD development status and Phase 2 boundary

The unreleased foundation was merged in PR #1 at c3a68fc3ddbe1bdbee574e7a127d11aa82096e9e, with history preserved and no deployment. Its full original plan and audit remain in git history and docs/UPSTREAM-AUDIT.md.

The owner approved Phase 2 direction and the first 30-path implementation preview: 15 updated and 15 new paths, one branch `feat/fcd-technical-content`, one draft PR (#2), plus exact-pinned optional Mermaid CDN loading. Use FCD Superpowers, FCD Accessibility Reviewer and source review; all automated builds/tests run in Actions. Main, merge, production imports and DNS changes are excluded.

## First-slice objectives

- Preserve native Blog1/Header1, Layouts V3, Widget Version 2, server-rendered content, labels/search/pagination/comments and the hardened source/fixture parity boundary.
- Bundle a reviewed explicit Prism grammar subset; no runtime language fetches or content reformatting. Unknown/oversized code remains plain.
- Load an exact-reviewed Mermaid module only for diagrams, deduplicate loading and preserve source. Strict security, no post-controlled configuration, awaited serialized rendering, local error handling, bounded zoom/reset and accessible descriptions/controls.
- Add read-only staging tooling for eight real page types; missing configuration/import evidence is pending, not passed.
- Preserve prior tests and add actual-library, negative-input, source/copy, initialization, keyboard and async-theme tests. Regenerate XML through Actions and verify final source consistency.

## Evidence and workflow

Candidate releases verified 2026-09-09: Prism 1.30.0, Mermaid 11.17.2. Preflight validated exact CDN entry and DOMPurify 3.4.12 in its bundle. Integrated test-runner audit required patched Vitest 4.1.11. The test-first baseline recorded 17 failures and two passes before implementation; later tests exposed invalid timeline syntax and a real keyboard focus defect. See PR #2 and docs/UPSTREAM-AUDIT.md for exact run links.

Normal CI stays read-only. Approved branch-only lock/XML artifact transfers must bind source/check outcomes and be removed before final acceptance. A stale XML check remains a failure even when all behavior tests pass. No partial run or successful artifact upload constitutes final verification.

## Acceptance and deferrals

First-slice source acceptance requires complete checks on the exact PR head, safe readable fallback, supported-code/representative-diagram rendering, retained foundation coverage, and regenerated XML parity. Actual Blogger upload/save, native comments/widgets/Layout, complete page-type SEO, performance/field data, cross-browser and human accessibility are separate release gates.

Deferred: SVG export, lead-plus-secondary editorial composition, article cover policy, related content, expanded search indexing, service-link verification, audio narration, publishing automation and infrastructure. Do not copy Ledger's personal identity/asset mappings, loose Mermaid config, raw cached HTML or replacement of native cursors.

Original 500,000-byte XML ceiling stays enforced. External runtime library bytes are reported separately. Input limits are not a guaranteed CPU interrupt. No production-readiness claim is implied by simulation fixtures or helper API tests.
