# Reuse, foundation hardening and evidence boundaries

## Provenance

Ledger audit reference: 692a82463cb8d0869a6f5e7c946ecc757cacb7e2. Owner confirmed reuse permission. Reused/adapted V3 root and widget identities, compiler/build-stamp/size conventions, Blog super.main bean preparation, native Blog1 body/view/date/label patterns, comments delegation and cursor pagination. Personal identities, analytics, raw-HTML caches and publishing scripts are excluded. FCD corporate tokens were inspected in the current corporate source, not the private application copied.

## Original PR blockers

The initial review found valid hyphenated URLs rejected by a corrupted character class, substring-based deployment false positives, and separate browser-fixture markup with production-state drift.

URL validation now checks character codes 0-31 and 127 while preserving safe same-origin HTTPS permalinks. Deployment smoke checks parse inert HTML, validate exact unique metadata and visible populated publication DOM, reject login/redirect/CSS-only responses and bound size/time. Presentation now shares brand/header/search/card/article mixins; structural comparison and a deliberate label-removal negative control protect production/fixture parity.

Original failing baseline: https://github.com/thefastcyberdefense/google-blogger/actions/runs/34252776585/job/102151027708 (19 passed, 44 failed). Verified blocker-fix head d02cb6f7be574d6e7fe1b71cd33ab58f39c1524e passed 65 unit/contract and 330 browser tests: https://github.com/thefastcyberdefense/google-blogger/actions/runs/34254004137/job/102155082010 . This does not attest to later revisions.

## Approved foundation-hardening scope

The owner approved foundation hardening while explicitly deferring advanced features. The batch adds scoped native XML contracts, CSS-only table containment, wider accessibility/failure-state coverage, responsive text reflow and reconciled documentation. Main and deployment remain unchanged.

### Static native-render checks

The validator checks actual parsed XML rather than global token presence: V3/V2, no legacy root, exactly one skin/head/body, unique section/widget/includable identities, locked Blog1 inside main#content, Header1, skip target, single-item class guard, required FCD includables, actual native post body output, comment dispatch/delegation, older/newer links, empty-state markup, one native head owner and exact-format build stamp. Expression checks examine only expression-bearing attributes and ignore descriptive XML comments.

Fourteen invalid-output mutation cases plus positive/current/comment-only controls test the validator. These do not interpret Blogger expressions or prove every include resolves in Google's runtime. Inherited comments/widgets and actual native layout still need staging verification.

### No-JavaScript tables and reflow

A twelve-column evidence table exposed a real no-theme-JS containment gap. Tables now provide local horizontal scrolling through CSS; JS can progressively add labeled keyboard-operable wrappers without hiding content globally. Native table/column-header roles are asserted in browser tests. Authoring requirements for no-JS keyboard access across browsers are documented in DEPLOYMENT.md.

At 320px and 200% text size, the expanded tests exposed masthead overflow. Flexible header/search wrapping fixes that while retaining the strict page-width assertion. Horizontal scrolling tests use ArrowRight; the earlier End input exercised vertical behavior and was corrected as a test-design error, not hidden with a skip.

### Accessibility and failure states

Axe covers home/article/paged/empty/error initial and expanded states across 11 widths and light/dark themes, including no-result state and open TOC. Behavior tests assert native search GET payload, slash handling while editing, Ctrl+K focus, menu visibility/escape/focus return, theme persistence, accurate clipboard payload and denial announcements, storage failure, reduced motion, skip link, keyboard table scrolling and 200% text reflow. Five-view no-theme-JS coverage is retained. No broad axe suppression or retry-based masking was added.

## Hardening evidence

Red baseline at 9e4b0606d6c9b378f7ab4fb36799d9b46d1843c3: https://github.com/thefastcyberdefense/google-blogger/actions/runs/34255006028/job/102158765768 recorded 67 passed, 15 failed. These were behavior/contract assertions, not dependency setup errors.

At 8e17a7fcc8cbba23f7f2ec06f5ddd429e024856e, all 82 unit/contract tests passed, but browser checks found text reflow and the End-key test issue: https://github.com/thefastcyberdefense/google-blogger/actions/runs/34255435310/job/102159928017 . Not a passing acceptance run.

At 9a8a1b5969d21ee9bac5c57c2a2e6e9494535ee2, 82 unit/contract and 484 browser tests passed, with no skipped/flaky browser cases. Install/type/build/XML/audit passed. The overall run correctly **failed only its stale checked-in XML gate**: https://github.com/thefastcyberdefense/google-blogger/actions/runs/34256183053/job/102162826698 . This run is not described as green.

The generated XML from that run was transferred after checking exact source, job-stage outcomes, browser report totals and artifact stamp. It was committed in 1031863fd942525f1f4fc4045017c12ddda9c45c. Temporary artifact-write permission is removed in the final workflow; normal CI is contents:read only. Final acceptance requires the complete successful check on the latest PR head, including XML consistency.

The transfer also exposed that Playwright clears test-results when starting. Unit JSON now lives at unit-report.json and is uploaded separately so the final artifact retains both unit and browser evidence. No production credentials or external publication job are present.

## Remaining gates and review decision boundary

This is a reviewable unreleased foundation, not the full original publication definition of done. Advanced editorial/technical-content features are next-milestone work by explicit approval. No Mermaid/highlighting/related-article implementation is falsely claimed here.

Actual Blogger import/save, native comment/widget/page-type behavior, full SEO/performance and human screen-reader/inclusive testing remain pending. 200% text scaling does not stand in for 400% browser zoom. Modeled native wrappers and parsed static contracts do not prove real Google runtime output. The live-blog audit waiver does not waive those gates.

All automated project verification ran in GitHub Actions. Source review is sequential self-review, not independent external approval. Neither a passing fixture suite nor this document authorizes merging main or deploying production.
