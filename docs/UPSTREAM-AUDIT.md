# Phase 2 upstream and verification record

## Provenance and scope

Foundation merge: c3a68fc3ddbe1bdbee574e7a127d11aa82096e9e. Phase 2 branch: feat/fcd-technical-content, draft PR #2. Main remains unchanged. Ledger audit reference remains 692a82463cb8d0869a6f5e7c946ecc757cacb7e2. Reuse behavioral/regression concepts, not loose Mermaid security, personal asset/author mapping, raw HTML caching or replacement of native pagination. Native V3/V2 rendering boundaries are unchanged.

## Dependency evidence

https://github.com/thefastcyberdefense/google-blogger/actions/runs/34303571497/job/102315452096 validated Mermaid 11.17.2's CDN entry bytes against npm, identified DOMPurify 3.4.12 in its shipped bundle and found zero vulnerabilities in isolated Mermaid/Prism dependencies. Reported older DOMPurify issues were checked against primary affected-version ranges rather than accepted as proof of exploitability.

The integrated project audit found GHSA-82fw-gwwq-j7x9 in the previous Vitest 3.2.7. Patched Vitest 4.1.11 was pinned, a genuine npm lockfile generated and audited in Actions, and the temporary lockfile writer removed. Do not confuse an isolated new-library audit with the entire repository audit.

## Red/green and fixes

Test-first baseline: https://github.com/thefastcyberdefense/google-blogger/actions/runs/34303681851/job/102315785569 recorded 17 failures and two passes before the lifecycle/security/alias/staging implementation. Minimal unconnected placeholders were used to obtain behavioral failures, not missing-module errors.

Actual-library tests then caught invalid timeline source using clock colons; valid named periods replaced that fixture without loosening the parser. Next, axe caught non-focusable horizontally scrolling diagram source at ten mobile width/theme combinations. Original-source pre elements are now named focusable regions. The viewport and original source are tested from the keyboard, without excluding axe rules.

Additional coverage tests latest-theme behavior while entry loading is deliberately held, source retention after re-render, clipboard payload, malformed/oversized/configured source, dangerous links, sibling success, loader errors, code-only no-library requests, repeated initialization, and eight mocked staging responses with off-origin/redirect/stale/missing-content negatives.

## Regenerated XML

Source 5d2df4a0a787443a7dbc4e26578dc42af234e3af produced **107 passing unit/contract and 594 passing browser tests**, zero skipped/unexpected/flaky browser cases, with build/types/XML/audit success:
https://github.com/thefastcyberdefense/google-blogger/actions/runs/34306353365/job/102323809393

That overall run **failed only its stale checked-in XML consistency gate** and is not described as green. Its regenerated XML was copied only after checking the exact source, all expected upstream job outcomes, unit/browser report totals and the embedded full build stamp. Artifact transfer commit: b410623b9bc78e6d99de409a9d3b1c7a07012356. Only dist/theme.xml was modified by that transfer.

The final normal workflow has contents:read only, does not preserve checkout credentials and tests the exact PR head. It must pass the regenerated/checked-in consistency check before acceptance. Final run links/outcome belong in the PR description; older successful stages do not attest to later commits.

## Boundaries and remaining release work

All automated checks ran in Actions. Library requests during deterministic tests serve actual exact-version package files; live CDN preflight is distinct from deterministic browser coverage. Request URL/byte reports and screenshots are in the artifacts. A fully independent external review was not performed.

This is source verification, not a Blogger import or production release. The empty real staging manifest was not executed as a passing check. Actual import/save, native comments/widgets/Layout, broader SEO/performance, non-Chromium coverage and human assistive-technology review remain pending. Input caps do not provide a hard CPU interrupt; loader timeout cannot cancel ESM import. Broader content and infrastructure work remain deferred.
