# Phase 2B PR A: editorial experience

Approved 2026-09-09: 26-file maximum preview, branch feat/fcd-editorial-experience, draft PR #3 and source-bound branch-only XML transfer. Base ec08c4b9d1ba2cd35d9ec8a9bcbe557f2d01ca3d. No merge/deployment/deletion or publishing. Use FCD Superpowers, Ralph, GSD and relevant accessibility/code review; all automated builds/tests run in GitHub Actions.

## Story ledger and evidence

A1 baseline/red specifications: verified. Controlled source ce278c0d7878fcd3f312c885cb55f50b232ae4f5 produced 88 expected browser failures and 616 passes in run 34330959884. Earlier incomplete fixture routing is not counted as valid red evidence.

A2 native-context presentation: implemented and fixture-tested. One lead, up to two secondary cards, remaining standard; post order and existing native dispatch preserved. Small and grouped-wrapper specimens preserve identities. Native Blogger evaluation remains an explicit separate staging gate.

A3 image/filter policy: implemented and fixture-tested. Responsive lead image eager/high; other images lazy; no promotion when lead lacks image. Native search submission and honest loaded-card counts retained. Filtering resets composition and hides empty modeled date groups.

A4 article/print: implemented and fixture-tested. Author-controlled existing figure cover, no synthesized/moved cover; bounded reading measure, normal-flow TOC and quieter CTA. Print removes chrome, wraps code and preserves article content. Corrected no-JS test setup by embedding enlargement CSS in response HTML; no assertion removed. Human print/screen-reader validation is not claimed.

A2-A4 source evidence: 388660f8e5fdb9ebb8b44f03b882748ae9b021c7 passed 129 unit/contract and 792 browser tests, with zero skipped/unexpected/flaky cases, in run 34333530076. Types/build/XML contracts/audit/growth budgets passed. The overall run failed ONLY stale checked-in XML and is not described as green.

A5 XML transfer: completed in 2c74454f9321c2764445c160790cd302e1fdc3a8; only dist/theme.xml changed in that generated commit. Verified artifact 10096964676 from run 34333530076, source 388660f8e5fdb9ebb8b44f03b882748ae9b021c7, archive digest sha256:5499d11bf3031cbbe636101619d5681c8faa7254aef41d754c95ef9031f7bfaf. Source/job/report/stamp/budget checks precede transfer; no arbitrary artifact scripts executed. Initial direct transport attempt failed without an XML commit; pinned artifact downloader completed the transfer. Temporary write permissions have been removed and full read-only CI restored.

A5 final acceptance: consult the latest exact-head PR #3 check and PR description for the final run outcome. This document does not turn pending or failed checks into passes. A transfer job alone is not source acceptance. Independent external or human review is not implied.

## Author and presentation policy

Initial homepage uses the first eligible native post, not a separate feed-driven list. Other catalogs retain standard roles. Desktop uses a full-stream lead then secondary cards; native date groups remain intact rather than flattened. No CSS order property, duplicate posts or display:contents workaround.

Add class fcd-article-cover to an existing in-body figure when desired, preserving meaningful image alt/caption. Set image loading appropriate to actual author placement; the theme does not rewrite body images. No automatic extra cover or article edits. TOC remains in normal flow; code/tables/diagrams scroll locally on screen.

## Budgets and boundaries

Measured source XML 87093 raw bytes; CSS 14701 raw (base 11408, +3293); JS 51372 raw (base 51179, +193). Limits: XML <=500000, CSS growth <=12288, JS growth <=2048. Gzip values depend on source stamp for XML and are reported by each Actions build. No new dependencies or runtime requests introduced.

Only necessary files within the approved maximum manifest are touched; there is no requirement to modify all 26. Related/feed/search expansion and SEO/cross-browser expansion remain PR B/C. Actual Blogger import/save, comments/widgets/Layout and human accessibility remain release gates. No production-readiness claim.

## Links

PR: https://github.com/thefastcyberdefense/google-blogger/pull/3
Behavior source run: https://github.com/thefastcyberdefense/google-blogger/actions/runs/34333530076/job/102407566941
XML commit: https://github.com/thefastcyberdefense/google-blogger/commit/2c74454f9321c2764445c160790cd302e1fdc3a8
