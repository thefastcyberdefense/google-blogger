# Upstream applicability and verification record

## U0 bounded review (2026-09-27)

Compared the complete nine-commit Ledger range [2e5eb328adf096a42b4da50ff676de1cbfe42405...91cc043a684d098ed4ac311045cafa18e5765d5c](https://github.com/redwan-cse/ledger-blogger-theme/compare/2e5eb328adf096a42b4da50ff676de1cbfe42405...91cc043a684d098ed4ac311045cafa18e5765d5c), base exclusive and endpoint inclusive, against FCD main `312954b6f9bf0e39b0f276ea6881f9f82146b4ff`. The endpoint's parent is `9006bbb18b79febd8525ef5026a19a029a6bb002`, not the range base. Reading only the endpoint would have missed earlier changes. All nine commit records and relevant source/test/CSS deltas were inspected; this is source applicability evidence, not an upstream test execution or independent human approval.

### Complete change inventory

| Commit | Change and disposition |
| --- | --- |
| [a214294](https://github.com/redwan-cse/ledger-blogger-theme/commit/a214294db4fe168296bb871d51d0f3b123974819) | ASCII handshake and bare-bracket-node healing, per-diagram async fallback, fallback CSS and regression assertions. Relevant concepts; do not import general-purpose repair or renderer code. |
| [4dc65ed](https://github.com/redwan-cse/ledger-blogger-theme/commit/4dc65ede6ca00ee1221cdabd678d6e5cfe89e583) | Dimension-based SVG zoom, scrollable Mermaid stage, pointer pan and pinned toolbar. Defer UX adoption; no corresponding FCD defect established. |
| [24d7113](https://github.com/redwan-cse/ledger-blogger-theme/commit/24d71138c004d66c5874a8fac3848d22ba1d63a1) | marked 18.0.11 to 18.0.12. Excluded dependency/publisher change. |
| [b88b646](https://github.com/redwan-cse/ledger-blogger-theme/commit/b88b646f2a03741e753ef6ee58923edac8bd1f53) | Playwright 1.62.1 to 1.63.0 and lockfile changes. Excluded; FCD remains pinned to 1.62.1. |
| [aa1bf7a](https://github.com/redwan-cse/ledger-blogger-theme/commit/aa1bf7ab1bdba5cc89b0e1e90659007bf2115993) | Node type definitions and undici-types update. Excluded dependency change. |
| [8e707e3](https://github.com/redwan-cse/ledger-blogger-theme/commit/8e707e3051575d001adf4a1fce880e89b9128fb0) | Publisher search-description script/style/tag stripping and malformed HTML regression. No equivalent FCD publisher path; not applicable. |
| [0f6f8d5](https://github.com/redwan-cse/ledger-blogger-theme/commit/0f6f8d58168529be882aedcedf8f60d55f56585d) | Follow-up publisher sanitization expression and test. Same non-applicability; no FCD exploit inference. |
| [9006bbb](https://github.com/redwan-cse/ledger-blogger-theme/commit/9006bbb18b79febd8525ef5026a19a029a6bb002) | v1.6 release/docs/version/generated-output changes. Provenance only, not an FCD candidate or security guarantee. |
| [91cc043](https://github.com/redwan-cse/ledger-blogger-theme/commit/91cc043a684d098ed4ac311045cafa18e5765d5c) | Markdown publisher/compiler hardening, Mermaid cleanup, actual article/dark CSS changes and seven adversarial contracts. Compare the separate runtime, publisher and theme-CSS paths; no direct import. |

Publisher changes are present in this range, particularly `scripts/publish-from-drive.ts` in the last three functional commits. They are excluded from FCD reuse, not absent from Ledger. No new Drive/OAuth service or personal-identity mapping is imported. Generated `dist/theme.xml` and golden output, release claims and all dependency replacements are excluded.

### FCD-specific applicability

| Area | Actual source/test comparison | Disposition |
| --- | --- | --- |
| Mermaid source admission | Ledger's `src/scripts/main.ts` / publisher path heals ASCII ladders and bracket nodes, strips nested fences, deduplicates headers, normalizes entities and truncates at prose headings. FCD [diagrams.ts](https://github.com/thefastcyberdefense/google-blogger/blob/312954b6f9bf0e39b0f276ea6881f9f82146b4ff/src/scripts/diagrams.ts) instead bounds input at 20000 characters, permits seven explicit diagram headers, rejects post configuration/front matter, and uses opt-in one-layer legacy normalization. | Already covered for FCD's narrower contract. Do not port general-purpose healing. Malformed ladder/nested-fence regression ideas may be proposed as a separate product-test story, not implemented by N1. |
| Mermaid execution/output | Inspected Ledger initialization is loose; FCD `diagramConfig` remains strict, `htmlLabels:false`, `maxTextSize:20000`, `maxEdges:200` with secure keys. FCD `installSvg` in **diagrams.ts** validates returned SVG, active elements, event attributes, hrefs and external CSS URLs. Original source survives failure. This validation is not in technical-content.ts. | Retain existing strict configuration and output validation. Upstream changes establish no FCD vulnerability and do not justify weakening security. |
| Mermaid regressions | FCD [diagrams.test.ts](https://github.com/thefastcyberdefense/google-blogger/blob/312954b6f9bf0e39b0f276ea6881f9f82146b4ff/tests/unit/diagrams.test.ts) covers exact bounds, malformed/duplicate headers, configuration rejection, nested literals and legacy behavior. [technical-content.spec.ts](https://github.com/thefastcyberdefense/google-blogger/blob/312954b6f9bf0e39b0f276ea6881f9f82146b4ff/tests/render/technical-content.spec.ts) covers intercepted pinned library bytes, sibling isolation, loader failure, source retention and theme races. | Source coverage already exists. Adapt only separately approved FCD-native adversarial expectations, never Ledger healed-output strings. N1 supplies a test guard, not new Mermaid product regressions or N2 migration. |
| Actual theme CSS | Compared Ledger base/endpoint `src/styles/article.scss` and `src/styles/dark.scss`, separately from publisher-emitted CSS. Changes include clipped outer Mermaid wrap plus a scrolling stage, max-height, dimension zoom/pan, toolbar stacking, light/dark fallback cards, scrollbar colors, checkbox-list marker suppression, and stronger nested-pre resets. `.code-block-wrap` already existed at the base. | Relevant UI comparison, but defer direct CSS transplant. FCD [article.scss](https://github.com/thefastcyberdefense/google-blogger/blob/312954b6f9bf0e39b0f276ea6881f9f82146b4ff/src/styles/article.scss) has its own overflow, code toolbar, focusable source and diagram viewport. No concrete FCD style defect established by this delta. |
| Code/compiler literal fidelity | Ledger publisher removes nested fences/wrappers, converts raw pre markup, limits prose transforms outside code, removes checkboxes and escapes includes. FCD has no `compileMarkdownToHtml`, `extractSearchDescription`, `.code-block-wrap` or publishing pipeline. FCD [technical-content.ts](https://github.com/thefastcyberdefense/google-blogger/blob/312954b6f9bf0e39b0f276ea6881f9f82146b4ff/src/scripts/technical-content.ts) owns text-only code-toolbar/table enhancement; [highlighting.ts](https://github.com/thefastcyberdefense/google-blogger/blob/312954b6f9bf0e39b0f276ea6881f9f82146b4ff/src/scripts/highlighting.ts) validates bundled Prism output against original text. Its browser tests cover highlighting, copy fidelity and code-only pages. | Publisher algorithm not applicable. Literal backticks, comments, includes and spacing are useful future regression concepts only. Existing FCD behavior is not replaced. |
| Search-description sanitizer | Upstream `8e707e3` / `0f6f8d5` change publisher code absent from FCD. FCD [security.test.ts](https://github.com/thefastcyberdefense/google-blogger/blob/312954b6f9bf0e39b0f276ea6881f9f82146b4ff/tests/contract/security.test.ts) and [security-boundaries.spec.ts](https://github.com/thefastcyberdefense/google-blogger/blob/312954b6f9bf0e39b0f276ea6881f9f82146b4ff/tests/render/security-boundaries.spec.ts) instead cover native safe DOM/feed/link boundaries. | Not applicable. Do not infer exploitability or import publisher/service/credential requirements. |

The complete nine-commit review found no material dependency blocking N1's browser-network foundation. It does not resolve the separate known mixed-Mermaid order defect, human accessibility issues, native Blogger acceptance or release gates. No upstream code, style, generated XML or dependency was copied. Fresh FCD Actions results belong to the exact head in [PR #12](https://github.com/thefastcyberdefense/google-blogger/pull/12), not this source-inspection table.

### Evidence limits and sources

The old reuse/license baseline remains unchanged. The comparison is bounded at `91cc043`, not a claim about a moving upstream default branch or deployed site. Reviewed source includes all nine commit diffs; base and endpoint article/dark styles; endpoint main.ts, publisher and adversarial tests; and the exact FCD paths linked above. Ledger release security prose is not a verified current alert inventory. No public blog, reference site, publisher or production endpoint was contacted or executed by U0.

## Ledger v1.5.0 research (2026-09-12)

This is an applicability review, not an instruction to replace the FCD engine. Original reuse baseline remains `692a82463cb8d0869a6f5e7c946ecc757cacb7e2`. [Ledger v1.5.0](https://github.com/redwan-cse/ledger-blogger-theme/releases/tag/v1.5.0), published 2026-09-11 17:49:41 UTC, resolves through annotated tag `47911e892e187e1a2af597819e72a5ef6394eabf` to commit `a209471279812309e68571aba8d918e68bcc16da`. GitHub reported the tag signature verified. The release API reported immutable:false despite its workflow step name; a signed tag, release asset digest and signed build attestation are distinct evidence.

The six commits after v1.4.1 (`d64f70000b2994efaa23d47cd33b385c478d3079`) were traced; v1.4.1 itself directly follows the original audited baseline. Security patches were inspected separately from large generated XML/lockfile diffs. FCD comparison base is merged main `1f85a593f8b28fd5a37cfe2e12ac5a57d9e9c205`.

| Release change | Applicability and decision |
| --- | --- |
| [Security commit 0b71cb5](https://github.com/redwan-cse/ledger-blogger-theme/commit/0b71cb5c33bfd6d13a0e5b93a0bd1326bb2ecde6): comment-avatar URL allowlisting | No identical FCD avatar-rewriting path was found in the inspected runtime entry. Do not import personal avatar mappings. FCD post links already require same-origin HTTPS without credentials/control characters, stronger than upstream's HTTP/HTTPS avatar helper for this different purpose. Retain policy and extend browser sink coverage. |
| Same commit: line-scanned Mermaid header detection and duplicate-header repair | Applicable regression ideas, not a direct patch. FCD does not use the same nested expressions or general-purpose repair parser. Preserve bounded input, restricted types, explicit legacy opt-in and no post configuration; test malformed/long inputs without broadening repair behavior. |
| Same commit: single-pass entity decoding | FCD already has a limited nonrecursive legacy sequence and no five-pass decoder. Characterize nested literals and supported arrows; do not import every entity or recursively decode author content. No FCD exploitability claim is established. |
| Same commit: Vitest 4.1.11 | Already pinned in FCD before this release, with previous Actions lockfile/audit evidence. No dependency change justified solely by this release. |
| [4598fe9](https://github.com/redwan-cse/ledger-blogger-theme/commit/4598fe93875762dc69b83f3decabe2df6be2535c): missing-Gemini graceful skip | Excluded: FCD has no imported daily publisher. Intermediate change is superseded upstream by publisher removal. |
| [7ff7f13](https://github.com/redwan-cse/ledger-blogger-theme/commit/7ff7f130c2c80b5517faae369ca79ebb817bb298): remove daily workflow and auto-publisher | Excluded: FCD deliberately omitted publishing infrastructure and has no Gemini requirement to remove. |
| [331bb3c](https://github.com/redwan-cse/ledger-blogger-theme/commit/331bb3cc47dbad82b9d0ea486e0d4314b30e2123): OAuth environment aliases | Excluded from this phase. Actual changed path is tools/get-blogger-token.ts, not the scripts path named in release prose. Do not add credentials/runtime service requirements. |
| [f58583b](https://github.com/redwan-cse/ledger-blogger-theme/commit/f58583bfa5b7023358772189d866d0fffdd25081): manual queue batching | Excluded. Source defaults to 99 items on manual runs absent an explicit limit, not unlimited publishing. Scheduled default remains one. Neither behavior is FCD theme scope. |
| [a209471](https://github.com/redwan-cse/ledger-blogger-theme/commit/a209471279812309e68571aba8d918e68bcc16da): release/docs/version changes | Record provenance only. No reason to renumber FCD as Ledger or copy generated XML, personal identity, UI or publisher settings. |

### Evidence limits

Release prose claims zero open CodeQL/Dependabot alerts. That is not a proof of zero vulnerabilities, nor independently verified current alert inventory. The exact cited GHSA-4w53-29w4-5699 / CVE-2026-33989 mapping could not be retrieved independently during research; leave it unresolved rather than substituting a different advisory. FCD's own successful npm audit is point-in-time evidence, not proof against all vulnerabilities.

Upstream release asset theme.xml was reported as 299162 bytes with SHA-256 `bf1440bf1e128bc8e0b63d474c65395f3b5d634941f8c59c766529e7dfd3c6fb`; those are API metadata, not downloaded-byte verification. It is not an FCD import candidate. Upstream release automation runs generation, XML contracts and golden tests, not FCD's complete acceptance suite. Upstream live/publisher successes do not establish FCD native compatibility.

FCD retains owner-confirmed reuse permission and the PolyForm Noncommercial reference/required notices in LICENSE. No relicensing or permission for upstream personal identity is inferred from this review. No upstream code is copied by the current docs/tests batch.

### Approved steps 1-2

Owner approval on 2026-09-12 covers reconciliation of this record and docs/PROJECT-PLAN.md plus targeted regression coverage on fresh branch feat/fcd-ledger-150-boundary-regressions. Diagram cases cover existing normalization boundaries, malformed tokens, exact length and late configuration rejection. Browser cases exercise actual compiled FCD discovery with mixed hostile/safe feed entries and all-rejected responses on home/article, checking literal DOM text, safe links, keyboard navigation, no injected active nodes/events/requests/dialogs, and retained fallback.

The new browser file runs in all 22 existing Chromium viewport/theme projects. Existing Firefox/WebKit acceptance coverage remains unchanged. These are synthetic intercepted responses, not native Blogger staging. Tests characterize retained behavior; no manufactured red-test history or security fix is claimed. If a defect is found, preserve Actions evidence and obtain the required focused fix approval. Final batch commit/run/counts/artifact/review evidence belongs in its PR, not the old baseline below.

CodeQL/default-setup inspection and implementation, additional scanning permissions, artifact verification workflows and native staging execution are later proposed steps requiring their own approval. The current batch changes no workflow, permission, dependency, runtime or generated XML.

### Historical FCD baseline evidence for that review

PR #6 merged as `1f85a593f8b28fd5a37cfe2e12ac5a57d9e9c205`, preserving history and retaining its preparation branch at merge. [Post-merge run 34666092580](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34666092580/job/103478151278) completed 2026-09-12 02:01:22 UTC with every stage successful: 185 unit/contract tests, 1126 browser tests, zero failed/pending/skipped/unexpected/flaky, 95157 raw XML bytes, audit and generated XML consistency. This closes its outstanding merge verification, not the new regression batch or native release gates.

Only total raw generated XML <=500000 bytes is capped. Component JS/CSS and gzip sizes remain informational; historical growth budgets are superseded. Security/input/network/time/retry limits remain. No staging import, publication, deployment, DNS or branch deletion was performed during this research/batch.

## Historical Phase 2 record (retained, superseded status)

The following records original Phase 2 work, not today's active branch or main state. Current milestone and remaining authorization boundaries are above and in docs/PROJECT-PLAN.md.

### Provenance and scope

Foundation merge: c3a68fc3ddbe1bdbee574e7a127d11aa82096e9e. Phase 2 branch: feat/fcd-technical-content, originally draft PR #2, subsequently merged. Ledger audit reference remains 692a82463cb8d0869a6f5e7c946ecc757cacb7e2. Reuse behavioral/regression concepts, not loose Mermaid security, personal asset/author mapping, raw HTML caching or replacement of native pagination. Native V3/V2 rendering boundaries are unchanged.

### Dependency evidence

https://github.com/thefastcyberdefense/google-blogger/actions/runs/34303571497/job/102315452096 validated Mermaid 11.17.2's CDN entry bytes against npm, identified DOMPurify 3.4.12 in its shipped bundle and found zero vulnerabilities in isolated Mermaid/Prism dependencies. Reported older DOMPurify issues were checked against primary affected-version ranges rather than accepted as proof of exploitability.

The integrated project audit found GHSA-82fw-gwwq-j7x9 in the previous Vitest 3.2.7. Patched Vitest 4.1.11 was pinned, a genuine npm lockfile generated and audited in Actions, and the temporary lockfile writer removed. Do not confuse an isolated new-library audit with the entire repository audit.

### Red/green and fixes

Test-first baseline: https://github.com/thefastcyberdefense/google-blogger/actions/runs/34303681851/job/102315785569 recorded 17 failures and two passes before the lifecycle/security/alias/staging implementation. Minimal unconnected placeholders were used to obtain behavioral failures, not missing-module errors.

Actual-library tests then caught invalid timeline source using clock colons; valid named periods replaced that fixture without loosening the parser. Next, axe caught non-focusable horizontally scrolling diagram source at ten mobile width/theme combinations. Original-source pre elements are now named focusable regions. The viewport and original source are tested from the keyboard, without excluding axe rules.

Additional coverage tests latest-theme behavior while entry loading is deliberately held, source retention after re-render, clipboard payload, malformed/oversized/configured source, dangerous links, sibling success, loader errors, code-only no-library requests, repeated initialization, and eight mocked staging responses with off-origin/redirect/stale/missing-content negatives.

### Regenerated XML

Source 5d2df4a0a787443a7dbc4e26578dc42af234e3af produced 107 passing unit/contract and 594 passing browser tests, zero skipped/unexpected/flaky browser cases, with build/types/XML/audit success:
https://github.com/thefastcyberdefense/google-blogger/actions/runs/34306353365/job/102323809393

That overall run failed only its stale checked-in XML consistency gate and is not described as green. Its regenerated XML was copied only after checking the exact source, all expected upstream job outcomes, unit/browser report totals and the embedded full build stamp. Artifact transfer commit: b410623b9bc78e6d99de409a9d3b1c7a07012356. Only dist/theme.xml was modified by that transfer.

The final normal workflow had contents:read only, nonpersistent checkout credentials and exact PR-head verification. Final run links/outcome belong in PR #2; older successful stages do not attest to later commits.

### Boundaries and subsequent work

All automated checks ran in Actions. Library requests during deterministic tests served actual exact-version package files; live CDN preflight is distinct from deterministic browser coverage. Request URL/byte reports and screenshots were in the artifacts. A fully independent external review was not performed.

This was source verification, not a Blogger import or production release. Later PRs added discovery, metadata and representative non-Chromium coverage; do not treat those completed source milestones as still pending based on historical notes. Actual import/save, native comments/widgets/feeds/Layout and human assistive-technology/visual/print/true-zoom/field-performance evidence remain pending. Input caps do not provide a hard CPU interrupt; loader timeout cannot cancel ESM import. Publishing infrastructure remains excluded.
