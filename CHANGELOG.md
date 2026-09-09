# Changelog

## Unreleased: Phase 2 technical content

- Added exact Prism 1.30.0 grammar subset, manual article-only highlighting, safe token output and copy-source fidelity.
- Added Mermaid 11.17.2 pinned optional ESM loading, single-flight lifecycle, strict configuration, source validation/fallback and bounded zoom/reset.
- Preserved original diagram text, coalesced theme changes and added explicit busy/rendered/error states.
- Fixed Actions-discovered keyboard-inaccessible original-source regions at mobile widths without suppressing axe rules.
- Corrected an invalid colon-delimited timeline test fixture rather than weakening diagram parsing.
- Added real-library Chromium fixtures, request accounting, blocked CDN, unsafe/configured/oversized input, repeated initialization, copy and theme-race tests.
- Added read-only eight-view staging manifest/workflow and mocked-response tests. Actual Blogger import/save remains pending.
- Integrated audit found GHSA-82fw-gwwq-j7x9 in foundation Vitest 3.2.7; pinned patched 4.1.11 and generated a genuine audited lockfile in Actions.
- Dependency preflight confirmed the Mermaid CDN entry matches npm and contains DOMPurify 3.4.12; reports claiming older sanitizer vulnerabilities were checked against primary affected-version ranges.

No merge or deployment. Accept only after the exact final PR head passes all mandatory checks and regenerated XML consistency. SVG export, broader editorial/search/related-content work and production release remain outside this slice.

## 0.1.0 foundation

Merged in PR #1 with history preserved. Native V3/V2 renderer, initial FCD presentation, hardened XML/parity/no-JS table/keyboard/a11y gates and the earlier three merge-blocker fixes remain required regression coverage. Source and human/runtime evidence boundaries are retained.
