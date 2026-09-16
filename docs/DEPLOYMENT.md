# Artifact handoff, staging and release boundaries

## Current status and authority (2026-09-16)

PRs #1 through #8 are merged without deployment in this work. Current main `0aedbcf5d8b583669631509b2c0852faf4bd612d` passed every stage of [post-merge verification](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34680616793/job/103518470521), completed 2026-09-12 07:34:40 UTC:203 unit/contract and1170 browser passes, no reported failed/pending/skipped/unexpected/flaky results,95157 raw XML bytes, audit and generated XML consistency. [Post-merge CodeQL](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34680616422) successfully analyzed Python, Actions and JavaScript/TypeScript; successful analysis is not zero-alert or release assurance.

Phase1A is complete and merged through [PR #8](https://github.com/thefastcyberdefense/google-blogger/pull/8). Its final verifier revision, Actions evidence and approved handoff are recorded below. Main's post-merge CI did not dispatch the separate pinned-artifact verifier. Current main, the verifier revision and the generating theme revision must not be conflated.

The owner approved only a fresh `docs/fcd-native-staging-baseline` preparation branch and changes to this document and docs/PROJECT-PLAN.md on 2026-09-16. Ordinary PR verification is required; final preparation evidence belongs in its PR. Artifact-verifier dispatch, evidence preservation to an unspecified destination, staging import/save, repository variables, staging requests, content/widget/comment mutations, defect implementation, merge, production deployment, DNS and branch restoration/deletion are not authorized by this approval. No staging or production operation is performed by these instructions.

## Approved replacement candidate (unchanged by preparation)

| Field | Pinned value |
| --- | --- |
| Repository | thefastcyberdefense/google-blogger (1361530973) |
| Generating source | `9a6f484a2c389c3b256dcd58d88742118fc01905` |
| Workflow | `.github/workflows/ci.yml`, FCD theme verification |
| Run / attempt | [34672572631](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34672572631) /1, push to main |
| Generating job | [103496602996](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34672572631/job/103496602996), completed2026-09-12 04:28:15 UTC |
| Artifact metadata | [10291252454](https://api.github.com/repos/thefastcyberdefense/google-blogger/actions/artifacts/10291252454) |
| Artifact name | `fcd-evidence-9a6f484a2c389c3b256dcd58d88742118fc01905` |
| Archive SHA256 | `1fedb62352c275addd266e83b3955ada49341b176114ea269884e9d0ca2bd069` |
| Archive bytes |99701644|
| Source-artifact expiry |2026-09-26 04:28:06 UTC (10:28:06 AM Asia/Dhaka), subject to earlier deletion|
| Verified XML bytes |95157|
| Required XML build stamp |`0.1.0+9a6f484a2c389c3b256dcd58d88742118fc01905`|
| Verified source reports |203 unit/contract passes,1170 browser passes; zero failures/pending/skips/unexpected/flaky|
| Individual XML SHA256 |`25b06c6c3414a3c4094153ba272de2445cd801318d38541a4edfc0fdffce4ce3`, computed from downloaded XML and matched with the generating job's unique checksum output in Phase1A|

The archive digest is not the XML digest or a signed build attestation. Approval explicitly selected this replacement; never substitute another run because its artifact name looks similar. Verification code revisions and generated theme source revisions are intentionally different. The newer post-merge artifact for0aedbcf is source-CI evidence, not an automatically approved import candidate.

### Verified Phase1A handoff and retention

[Final verification run34676925901](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34676925901) at verifier revision `81a8f111e44808a246eea6a9c145187112fb866c` passed31 verifier test methods with zero failures/errors/skips and the real-candidate verification/upload. The generating source remains9a6f484 as pinned above.

| Field | Recorded handoff |
| --- | --- |
| Artifact |[10291819197](https://api.github.com/repos/thefastcyberdefense/google-blogger/actions/artifacts/10291819197)|
| Name |`fcd-verified-handoff-81a8f111e44808a246eea6a9c145187112fb866c`|
| Files |theme.xml, theme.xml.sha256, verification.json|
| Archive bytes |32055|
| GitHub-reported output archive SHA256 |`549b19b099b2d23e70ad2a8bf59d8bdfc50edcbe9d883603af1b33cad51fdb0a`|
| Expiry |2026-09-26 05:58:38 UTC (11:58:38 AM Asia/Dhaka), subject to earlier deletion|

On 2026-09-16 both original and handoff artifact metadata reported unexpired and matched the recorded identity/digest/size. This was a metadata refresh, not a fresh byte download or verification run. Phase1A verified original archive bytes in Actions; no separate redownload-byte validation of the re-uploaded output archive is claimed. Consumers must verify downloaded XML against the recorded individual digest before separately authorized import. The approved XML is copied byte-for-byte, not regenerated.

Proposed next evidence operation: after separate approval, dispatch the existing artifact-verification workflow on main to reverify this same candidate and record the resolved verifier SHA, run/attempt, contract and live-job outcomes. Do not change pins or lower limits. Preserve original evidence and verified handoff in an explicitly approved durable location before expiry. No evidence destination has been supplied. A newly uploaded handoff does not extend the original source artifact lifetime. If original artifacts/logs expire or become unavailable, stop and obtain a separately approved replacement with a complete new tuple and verification; do not substitute silently.

### Historical candidates (not selected)

Previous candidate: source8e37eb53c9cc4c13dd3d5baf1d07fe71e984f312, run34426823783 attempt1, job102713723132, artifact10133169422, archive SHA256 `01cbf0d6abcf65a494b5c091d094628f4fadd230af3242a048efc03c36b024be`, expiry2026-09-24 01:55:41 UTC. It had185/1126 passing tests and95157-byte XML; only metadata verification was recorded during preparation. This is superseded by the owner's Phase1A candidate replacement, not erased history.

Preparation and later regression branch artifacts are not implicit import candidates. Checked-in dist/theme.xml retains its original source stamp `0.1.0+ba4c9852803cbfcb60d3536199963af395cd6315`; normal CI compares generated content after normalizing only that historical stamp. Do not confuse checked-in XML with the replacement artifact or edit its stamp manually.

## Verification process and safety limits

`.github/workflows/artifact-verification.yml` runs deterministic standard-library contracts on PRs targeting main. The real pinned-candidate job runs after successful contracts only for the same-repository approved feature branch, or a later explicit workflow_dispatch on main. No automatic production/staging operation. Candidate job uses contents:read and actions:read; checkout does not persist credentials. The verifier is guarded to run in Actions and receives its exact source revision separately. On the current preparation branch, real-candidate verification is expected to be skipped by that branch gate; do not count the skip as a verification pass. No workflow change or dispatch is part of this preparation.

Verification checks exact repository/head repository IDs and names, source SHA, workflow ID/path, event, run attempt, generating job and complete successful mandatory stages. It requires exact artifact identity/association, size, pinned digest and unexpired metadata. It then retrieves the generating job log and the archive using bounded HTTPS reads, explicitly separating authenticated API requests from unauthenticated allowlisted storage requests. No Authorization header is forwarded to storage; no signed URLs, tokens or raw transport errors appear in the handoff.

| Safety boundary | Limit |
| --- | --- |
| Compressed archive |160 MiB|
| Total expanded members |1 GiB|
| Any member |256 MiB|
| Browser JSON only |80 MiB (83886080 bytes), owner approved|
| Other selected reports |64 MiB|
| API JSON / job log |8 MiB /32 MiB|
| ZIP entries |10000|
| Storage requests per download |At most3 after the API redirect|
| Network deadline / request timeout |300 seconds total per transport / at most30 seconds per request|
| Verifier process |330-second alarm,360-second outer timeout,10-minute job ceiling|
| Raw theme XML |500000 bytes, the sole theme size cap|

The actual candidate inventory observed in Actions was396 entries,172591716 expanded bytes; browser.json69523303 bytes. The initial64 MiB report limit blocked it. Only browser.json was increased to80 MiB; no other limit was loosened. JS/CSS raw/gzip are informational and are not capped by these archive-processing limits.

No archive path is extracted. Before reading members, reject traversal/absolute/ambiguous/control-character paths, duplicate case-folded entries, encrypted entries, symlinks/special types and unexpected top-level layout. Stream every member to check CRC and actual length under expansion limits; retain only the four selected evidence files in memory. Never execute archive scripts, HTML, report attachments or lockfile code.

Verify XML byte length and SHA256 against the unique checksum output in the pinned generating job; parse well-formed XML and require one correct stamp in head. A plain `<!DOCTYPE html>` is allowed, but external identifiers, internal DTD subsets and entities are rejected by parser callbacks before processing. Declaration-like literals inside Prism CDATA/comments are inert, not XML declarations. No theme content is rewritten.

Validate build-size source and raw XML length, unit totals and every assertion, browser totals and individual outcomes with bounded traversal. Nonzero failed/pending/skipped/unexpected/flaky cases, retries, missing tests or inconsistent evidence fail. Recheck artifact association/expiry before writing the output.

### Verified handoff output

Only after all checks pass, create `verified-handoff/theme.xml`, `theme.xml.sha256` and `verification.json`, then upload as `fcd-verified-handoff-<verifier-sha>` with14-day retention. The report identifies generating source/run/artifact, verifier revision/run, actual XML digest/stamp/counts, limits and limitations. The output XML is copied byte-for-byte, not regenerated. Output publication is skipped on a failed verification step; partial files are not an approved handoff.

Download the handoff from the exact fully successful final verification run linked in PR #8. Confirm the verifier revision and original candidate tuple; verify the downloaded XML checksum against its recorded digest before any separately authorized import. Preserve source and handoff evidence in an approved location before expiration. If an artifact/log expires or a download is unavailable, stop: do not use an arbitrary replacement, weaken checks or claim a pass. A verified handoff is not a signed attestation, native acceptance or release approval.

## Eight-view manifest worksheet

Use [fixtures/staging-views.example.json](../fixtures/staging-views.example.json); empty fields intentionally block execution. Keep owner-specific configuration outside the public repository unless explicitly approved for publication. Do not invent staging URLs or results. The example and runtime schema remain unchanged by this preparation.

| Input | Required value |
| --- | --- |
| Blog identity |Dedicated non-sensitive staging blog name and ID, kept with handoff outside manifest|
| Operator |Named authorized owner/operator and confirmed access to the selected staging blog|
| origin |Exact public HTTPS origin, no credentials, path beyond slash, query or fragment; not production|
| build |Full verified XML stamp of the actual imported candidate|
| views |All eight types exactly once; real absolute URLs on configured origin without credentials/fragments|
| expectedText |Nonempty intended visible main-content excerpt for search/static/error|
| expectedCanonical |Optional independent same-origin HTTPS expectation for intentional canonicalization; omit unless known and justified|
| Evidence location |Approved destination for backups, operator records, XML/checksum/report and run/log references; do not commit private records|

Inventory existing staging content before requesting changes. Enough approved content must exist to exercise a real article, label, search, archive, static page and pagination. Representative technical content should include headings, code, tables and images, with an existing approved diagram where appropriate. Creating or publishing test content needs separate staging authorization. Publicly readable staging must contain no sensitive data; a private/login-only blog cannot satisfy the current checker. Do not modify indexing or feed settings implicitly.

| View | Real native URL requirements |
| --- | --- |
| home |Initial populated catalog, HTTP200, visible main/heading|
| article |Actual permalink, HTTP200, visible article-view/title/populated body, not catalog|
| label |Existing populated label view, HTTP200|
| search |Native search, HTTP200, expected visible text|
| archive |Existing populated archive, HTTP200|
| static |Actual page, HTTP200, expected visible text|
| error |Nonexistent URL with actual HTTP404 themed output and expected text, not soft404|
| paged |Real older/newer catalog URL, HTTP200 and native pagination links|

Obtain URLs from actual staging, not guessed paths. Existing checker rejects redirects. Default canonical expectation uses the requested URL under existing normalization. Independently justified expectedCanonical must be credential-free same-origin HTTPS without fragments/control characters; do not infer it from returned HTML or insert an empty optional value. Do not change robots/indexing policy to pass.

## Owner-assisted native acceptance (separate approvals required)

1. Identify staging blog/operator. Before a separately approved import, export existing theme, back up content and record widget settings/rollback references in an approved non-public location. Theme backup and content import are different. Never send theme XML through Settings > Import Content or enable automatic content publication.
2. Obtain approval for the exact blog and verified XML. Owner or authorized operator imports/saves through Blogger theme controls; record UTC time, save success/errors and rendered stamp. Never substitute production. If save fails or stamp differs, preserve evidence and stop; do not patch generated XML manually.
3. Complete the eight-view manifest; with separate go-ahead set FCD_STAGING_MANIFEST_JSON and dispatch existing Read-only Blogger staging checks. Record checker commit separately from theme stamp. Require complete run, all eight outcomes, metadata and visible-content checks. Current staging workflow logs results, not a dedicated evidence artifact.
4. Record actual feeds under intended Full/Short/Until Jump Break/Custom/None/redirect settings, labels, archives, pagination, Blog1/Header1 and Layout editor behavior. Mutating widget/comment tests need approved staging scope. Initial smoke coverage targets the selected configuration; untested modes remain pending. Check native reading/navigation with theme JavaScript disabled and honest fallback for unavailable/empty-safe feed responses.
5. Record human keyboard/screen-reader evidence with reviewer/date/browser/OS/assistive technology/view/state/theme and evidence links: landmarks, headings, skip link, focus order/visibility/return, menu/search/TOC/copy/comments, meaningful alt/diagram descriptions, no traps. Axe violations/incomplete results remain separate; no automated conformance claim. Phase1B's basic keyboard/narrow-screen smoke is not the later full human accessibility gate.
6. Record visual/contrast, narrow reflow, text spacing,200% enlargement, actual400% browser zoom where applicable, local code/table/diagram scroll and print output. Fixture width is not true zoom; WebKit is not every Safari/iOS device. Fix confirmed theme-owned WCAG A/AA failures, never globally suppress them.
7. Measure staging load/interaction/layout behavior and document methods/limitations. Synthetic observations are not field p75 CLS/INP. Field evidence remains pending; analytics installation is not implied.
8. Obtain separate production approval only after applicable gates; rehearse authorized staging rollback using backups and widget settings. Preparation deploys/restores nothing. For a later approved restore, use recorded theme/widget backups, validate save/rendered identity and native views afterward, and treat content recovery separately from theme recovery.

For every finding, record view/state, reproduction, expected/actual behavior, evidence, severity and ownership. Distinguish theme defects from checker, content, configuration and platform issues. Propose a bounded source/test fix before implementing. A changed theme requires reviewed Actions-generated output, explicit replacement-candidate approval and separately authorized reimport/retest; a passing documentation-branch build does not select a new theme.

## Metadata and retained policies

Every view requires meaningful title and no unintended duplicate canonical/description/social fields. Non-error views require unique same-origin canonical; error may omit it. Article schema is post-only, with headline and identity matching independent expectation. Validate optional author/date/image values; omit unavailable native values rather than inventing them. Retain all-head-content ownership, explicit Schema.org contexts, existing robots policy and native visible-content checks. Rich-results/indexing success is not guaranteed.

Parsed HTML checks block scripts/resources and bound responses to2MB; they do not evaluate Blogger expressions, prove interactive widgets, check meaningful image descriptions or certify production SEO. Native import/save and real views remain mandatory, not waived by the old inaccessible-live-blog audit decision.

Public feed modes and native fallback remain. Retain500000 accepted decoded bytes/8-second request bounds and bounded retries. Covers remain author-controlled existing figures using fcd-article-cover, not auto-duplicated images. Preserve native V3/V2 and FCD branding/license notices.

## Evidence state and phase exit

| Gate | Current evidence / required next record |
| --- | --- |
| PR #8 source/main verification |Passed at0aedbcf; complete post-merge CI and CodeQL links above|
| Phase1A verifier and handoff |Passed at81a8f111; approved generating source9a6f484; digest/stamp/report tuple above|
| Current preparation |Two-document changes only; final exact-head Actions/review to be recorded in its PR|
| Fresh main artifact-verifier dispatch |Not performed by this preparation; requires separate approval|
| Evidence preservation |Destination not supplied; no transfer authorized by this preparation|
| Staging identity/import/save |No supplied blog/operator/backup/save/rendered-stamp record in this work|
| Eight native views |Zero staging-workflow runs returned on2026-09-16; real manifest and successful run remain pending|
| Native interactions |Feed/navigation/widget/comment/Layout evidence pending within approved scope|
| Human accessibility/visual/print/true zoom |Pending; basic smoke or fixture automation does not satisfy these gates|
| Field performance |Pending; no field-data claim|
| Production release/deployment |Not authorized or performed in this work|

Phase1B closure requires the selected XML's successful native import/save, correct rendered stamp, all eight automated views passing and no unresolved critical native-functionality blocker, with native smoke results and limitations recorded. An untested area remains pending. This is a native-baseline gate, not production release approval. Sequential specialist self-review is not independent approval.

## Official references

- [Blogger backup versus content import](https://support.google.com/blogger/answer/41387?hl=en)
- [Blogger theme controls](https://support.google.com/blogger/answer/1227173?hl=en)
- [GitHub artifact API](https://docs.github.com/en/rest/actions/artifacts)
- [GitHub workflow job logs](https://docs.github.com/en/rest/actions/workflow-jobs)
- [GitHub artifact download/validation](https://docs.github.com/en/actions/tutorials/store-and-share-data)

Blogger backup guidance rechecked2026-09-16: theme backup uses Theme controls; content backup/import is a separate procedure. API references checked2026-09-12 and artifact availability refreshed2026-09-16; theme-controls reference checked2026-09-10. No new runtime dependency or theme technology decision.
