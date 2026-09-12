# Upstream applicability and verification record

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

### Current FCD baseline evidence

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
