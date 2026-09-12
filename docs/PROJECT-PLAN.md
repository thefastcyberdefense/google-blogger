# FCD development plan

## Current baseline

PRs #1 through #7 are merged with history preserved. Main `9a6f484a2c389c3b256dcd58d88742118fc01905` passed every stage of [post-merge run 34672572631](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34672572631/job/103496602996), completed 2026-09-12 04:28:15 UTC: 203 unit/contract tests, 1170 browser tests, zero failed/pending/skipped/unexpected/flaky, 95157 raw XML bytes, dependency audit and generated XML consistency. PR #7's Ledger v1.5.0 applicability and retained-boundary regression scope is complete. No deployment or native import has occurred in this work.

GitHub-managed CodeQL was enabled by the owner and successfully analyzed JavaScript/TypeScript, Python and Actions on this main in [setup run 34675220615](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34675220615). Analysis success is not zero-alert assurance; query selection, alert inventory and merge blocking are separate. Branch-protection work is deferred by owner request; this phase makes no repository-setting or CodeQL changes.

## Active approved Phase 1A: artifact verification only

Owner approved on 2026-09-12: branch `feat/fcd-artifact-verification`, one draft [PR #8](https://github.com/thefastcyberdefense/google-blogger/pull/8), five-file implementation boundary:

1. `.github/workflows/artifact-verification.yml`: isolated Actions contracts and pinned-candidate validation/handoff upload, contents:read and actions:read only.
2. `tools/verify-artifact.py`: standard-library-only verifier for repository/source/run/attempt/job/stages, bounded download, safe archive inspection, XML checksum/stamp and report validation.
3. `tests/artifact/test_verify_artifact.py`: deterministic positive/negative contracts, including transport credential separation and byte limits.
4. `docs/DEPLOYMENT.md`: explicit candidate replacement, historical candidate retention and handoff procedure.
5. This existing plan: baseline, authorization and remaining gates. No competing work ledger.

Candidate replacement is explicitly authorized: source `9a6f484a2c389c3b256dcd58d88742118fc01905`, run34672572631 attempt1, job103496602996, artifact10291252454, archive SHA256 `1fedb62352c275addd266e83b3955ada49341b176114ea269884e9d0ca2bd069`. The selected generating workflow is `.github/workflows/ci.yml`. Output XML remains byte-identical to its selected artifact and carries that source's full stamp, not the verifier branch's stamp. No XML regeneration or source commit of generated output.

The owner additionally approved 80 MiB only for `test-results/browser.json` after its observed size of 69523303 bytes exceeded the initial 64 MiB limit. Unit/build-size reports stay at64 MiB. Retain all other archive, timeout, checksum and XML safeguards. These are verifier safety bounds, not theme JS/CSS growth caps.

Acceptance: meaningful Actions red rejection cases before implementation; green contracts with no skips; real pinned-archive verification including every member's path/type/CRC/actual length, individual XML checksum against generating-job output, source stamp and per-test reports; verified handoff upload; complete normal exact-head project CI; scoped sequential review. Final exact-head runs, counts, checksum, artifact and review outcomes belong in PR #8. No pending or earlier-head result is final acceptance.

The live candidate exposed a verifier false positive: a raw substring DTD ban rejected the legitimate `<!DOCTYPE html>` and declaration-like Prism CDATA. The correction parses XML declarations: allows only a plain html doctype, rejects external identifiers/internal subsets/entities before processing them, and treats CDATA/comments as inert. It does not edit source XML or relax external-entity protections. Positive and malicious-declaration tests preserve the distinction.

The initial scaffold run had expected failed rejection assertions plus an archive error, not a wholly clean red run. Specific observable failures in [run34676406787](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34676406787/job/103506940902) establish missing checksum/path/type/evidence enforcement; no setup failure is counted as behavioral proof. The64 MiB and declaration false-positive failures remain historical evidence, not accepted handoffs.

## Next phases (proposals, not implementation authorization)

Phase1B: separately authorized native staging import/save of the verified candidate, rendered-stamp confirmation and existing eight-view validation. Requires dedicated non-sensitive blog identity and real owner inputs; no guessed URLs/content. Phase2: distinct empty/error states and native pagination/interaction acceptance, with focused fixes from staging evidence. Phase3: approved Layout editability and declared supported gadgets, preserving native identities. Phase4: real reading/comment usability plus human keyboard, screen-reader, visual, print and true zoom. Phase5: native metadata/share previews and measured mobile lab performance; field data separate. Phase6: separately approved release package, rollback rehearsal, production authorization and bounded monitoring. Phase7: optional reader-benefit features such as narration or SVG export, never wholesale Ledger cloning.

Do not duplicate the working GitHub-managed CodeQL setup. Artifact verification is now Phase1A's approved scope; other scanning permissions, repository rules, staging execution and release operations remain separately controlled.

## Historical milestones and provenance

Original Ledger reuse baseline remains `692a82463cb8d0869a6f5e7c946ecc757cacb7e2`. Ledger v1.5.0 research pins `a209471279812309e68571aba8d918e68bcc16da`; classifications and uncertain advisory claims remain in docs/UPSTREAM-AUDIT.md. PR #7 added18 diagram cases and44 Chromium browser executions without runtime/dependency changes. It did not claim newly fixed vulnerabilities or manufacture red history for retained behavior.

PR C delivered conditional native metadata, bounded parsed-output validation, independent canonical and explicit Schema.org context checks, representative Firefox/WebKit coverage and synthetic observations. [PR #5](https://github.com/thefastcyberdefense/google-blogger/pull/5) holds final source evidence. Main8e37eb53c9cc4c13dd3d5baf1d07fe71e984f312 passed run34426823783 with185 unit/contract and1126 browser cases.

PR #6 prepared the staging worksheet without theme/schema changes. Head75b50407272a46179530d2a744ca406f05030a99 passed run34427968543; merge1f85a593f8b28fd5a37cfe2e12ac5a57d9e9c205 passed run34666092580 with185/1126. Earlier phase notes are historical. Branches were retained at their authorized merges; later listings showed only main. Do not infer who removed them or silently restore/delete branches. Earlier recorded merged PR heads were confirmed reachable from main.

## Invariants and authorization boundaries

Only total raw generated XML <=500000 bytes is capped. No fixed CSS, bundled JS or per-phase growth caps. Component/raw/gzip sizes remain informational. Preserve all security/input/network/time/retry limits.

Preserve Layouts V3, Widget Version2, Blog1/Header1, super.main, native feeds/comments/labels/archives/pagination/Layout behavior and FCD identity. Modular Pug/SCSS/TypeScript remains; no React/Vue, backend or database. Preserve owner-confirmed reuse permission and required license notices. Do not import Ledger's publisher, personal identity mappings, cached HTML or permissive Mermaid settings.

FCD Superpowers + Ralph + GSD and relevant specialist reviews use the workspace GitHub connection. All automated project builds/tests run in GitHub Actions. Sequential self-review is not independent approval. Normal CI remains read-only; Phase1A introduces no contents:write, production credentials or temporary XML writer.

Source completion, feature-head verification, post-merge verification, artifact verification, native staging, human acceptance and release approval remain separate. Merge requires explicit owner confirmation with a history-preserving merge commit. Native eight-view import/save/stamp, widget/feed/comment/Layout, human accessibility/visual/true zoom/print and field performance remain pending. The old inaccessible-live-blog audit waiver does not waive staging.

Phase1A authorizes no merge, Blogger import/save, staging requests, repository variables/settings, branch protection, CodeQL changes, release/tag publication, article publication, deployment, DNS or branch deletion.
