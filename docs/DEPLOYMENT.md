# Artifact handoff, native acceptance and release boundaries

## Current L1 status and native-checkpoint procedure (2026-10-03 Asia/Dhaka)

This section supersedes the 2026-10-01 L1 status and procedure directly below and the present-tense status in every older section; they remain dated history. Main is still `ad5e5d9e3e17089ea39d3c62e065d829dd97f235`, the merge of PR #13. L1, now including owner-approved design v1 (the Navigation, Intro, Call to Action and Footer gadgets), is source-verified through US-014 on `feat/fcd-l1-native-shell` in [draft PR #14](https://github.com/thefastcyberdefense/google-blogger/pull/14), which is unmerged. Its exact-head evidence lives in the PR and in the current L1 checkpoint of docs/PROJECT-PLAN.md.

**No verified import candidate exists.** Every fully green run uploads `fcd-theme-<sha>`, a zip holding only that run's compiled XML (retained 90 days), and records the XML's own SHA-256 in a run notice. That artifact is for the owner's inspection and is not a candidate selection. Any upload must use the downloaded bytes of an explicitly selected head, verified against that notice, never a regenerated or hand-edited file. The pinned artifact verifier still verifies only historical `9a6f484` and must not be described as validating L1 artifacts; repinning is separate scope.

### L1 native-checkpoint procedure (a procedure, not an authorization)

Each Blogger step below needs its own explicit owner approval. Agents make no automated requests to https://blogs.fastcyberdefense.com/, including read-only fetches; the owner makes every production observation in his own browser.

1. **Inventory, B1 quick check.** On the public homepage, run a read-only console snippet and share the output: at minimum `Array.from(document.querySelectorAll('.widget')).map(w => ({ id: w.id, type: w.className, section: w.closest('.section')?.id }))`. Alternatively open each gadget's Layout edit dialog without saving and copy its `widgetId=` value. Confirm the saved ids of Blog Search, Attribution, Report Abuse and Profile, and confirm that `LinkList1`, `HTML1`, `HTML2` and `HTML3` are not already used by a saved gadget. If any of those four ids is taken, stop: the theme's declared id must change in source, test-first, before any upload.
2. **Dispositions, B2.** Confirm the gadget matrix in [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md): Header1, Blog1, Label1 and BlogArchive1 kept; Profile1 in the sidebar; Attribution1 then ReportAbuse1 in the footer; the new Navigation, Intro, Call to Action and Footer gadgets in their own sections; and the saved Blog Search gadget deleted by the owner in Layout, because FCD's own search is the single search.
3. **Prove on a disposable blog first (recommended R0/R1-early).** Reproduce the broken masthead there with the same four saved gadgets, then upload the selected L1 artifact before considering production.
4. **Backups.** Export the current theme, back up content separately, and screenshot the Layout page with every section and gadget.
5. **Upload and prompt observation.** Use Blogger's theme controls, never Settings > Import Content. Record any prompt about gadgets the new theme does not declare and the choice made. Delete a gadget only where its approved disposition says so.
6. **Layout check.** Confirm that Navigation, Intro, Call to Action and Footer each appear as their own section holding one gadget, next to Header1, the sidebar and the footer gadgets. Open each new gadget without saving and confirm the fresh-install defaults render on the public page. Then enter the owner's content: Navigation links in the owner's order; Intro copy without headings; exactly one heading, a line and a link in the Call to Action; a sentence or two without headings in the Footer.
7. **Capture.** Save result and UTC time, the rendered `theme-build` stamp, where each kept and new gadget lands, and 390 and 1280 px captures in light and dark of the masthead and drawer, the first home page's intro band, home page 2 (older posts: it must show the plain publication heading and no intro band, which checks `data:newerPageUrl` outside Blog1), an article, a label or search view, the call-to-action band and the footer. Also capture the Layout editor showing every section.
8. **Rollback triggers.** Save failure, stamp mismatch, missing posts or navigation, duplicated gadgets, a new gadget missing from Layout or showing defaults over saved copy, a second or missing h1, a masthead, sidebar or footer regression, or lost Attribution: restore the saved theme and Layout settings, confirm the rendered identity and record the evidence. Content recovery is separate.

Fixture screenshots are design references only. Automated evidence cannot prove Blogger save or import, where kept gadgets land, whether they use the theme's default markups, how saved gadget copy renders, the `no-items` class, Layout editor behavior or real content.

---

## Historical L1 status and native-checkpoint procedure (2026-10-01 Asia/Dhaka; superseded 2026-10-03)

This section supersedes the present-tense status in the sections below, which remain dated history. Main is `ad5e5d9e3e17089ea39d3c62e065d829dd97f235`, the merge of PR #13; [post-merge run 36586048928](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36586048928/job/109466535788) passed every stage with 450 unit/contract and 1,674 browser cases. "Current main is `ecb1d438...`" and the prospective PR #10 and PR #11 statements below are historical. L1 work is on `feat/fcd-l1-native-shell` in [draft PR #14](https://github.com/thefastcyberdefense/google-blogger/pull/14); its exact-head evidence lives in the PR and in the L1 checkpoint of docs/PROJECT-PLAN.md.

**No verified import candidate exists.** The checked-in XML keeps its historical stamp until the US-006 transfer, and that transfer commit is not a candidate selection. The pinned artifact verifier still verifies only historical `9a6f484` and must not be described as validating L1 artifacts; repinning is separate scope. Any upload must use the downloaded and fingerprinted bytes of an explicitly selected accepted head, never a regenerated or hand-edited file.

### L1 native-checkpoint procedure (a procedure, not an authorization)

Each Blogger step below needs its own explicit owner approval. Agents make no automated requests to https://blogs.fastcyberdefense.com/, including read-only fetches; the owner makes every production observation in his own browser.

1. **Inventory, input B1.** On the public homepage, run a read-only console snippet and share the output: the L1 contract's Appendix B snippet (widget id, type and parent section, plus a tag, id and class skeleton of `#header` and `#sidebar`), or at minimum `Array.from(document.querySelectorAll('.widget')).map(w => ({ id: w.id, type: w.className, section: w.closest('.section')?.id }))`. Alternatively open each extra gadget's Layout edit dialog without saving and copy its `widgetId=` value. Guessed ids such as `Attribution1` risk duplicate gadgets after upload.
2. **Dispositions, input B2.** Confirm the gadget matrix in [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md): Attribution and Report Abuse to the footer, Profile to a sidebar Contributors card, blog search removed at the checkpoint, and Header1, Blog1, Label1 and BlogArchive1 kept.
3. **Prove on a disposable blog first (recommended R0/R1-early).** Reproduce the broken masthead there with the same four gadgets and the post-N2A artifact, then upload the selected L1 artifact before considering production.
4. **Backups.** Export the current theme, back up content separately, and screenshot the Layout page with every section and gadget.
5. **Upload and prompt observation.** Use Blogger's theme controls, never Settings > Import Content. Record any prompt about gadgets the new theme does not declare and the choice made. Delete a gadget only where its approved disposition says so.
6. **Capture.** Save result and UTC time, the rendered `theme-build` stamp, where each kept gadget lands, the masthead, sidebar and footer at 390 and 1280 px in light and dark, and the Layout editor showing the header, sidebar and footer sections.
7. **Rollback triggers.** Save failure, stamp mismatch, missing posts or navigation, duplicated gadgets, a masthead or sidebar regression, or lost Attribution: restore the saved theme and Layout settings, confirm the rendered identity and record the evidence. Content recovery is separate.

Fixture screenshots are design references only. Automated evidence cannot prove Blogger save or import, where kept gadgets land, whether they use the theme's default markups, the `no-items` class, Layout editor behavior or real content.

---

## Historical status and bootstrap boundary (2026-09-27 Asia/Dhaka; superseded 2026-10-01)

This section supersedes the dated preparation snapshot below while preserving its candidate tuples and historical procedures. [PR #10](https://github.com/thefastcyberdefense/google-blogger/pull/10) was merged on explicit approval. Current main is `ecb1d438e8b3227911dc76359b9e05f127867b27`; [post-merge run 35303993418](https://github.com/thefastcyberdefense/google-blogger/actions/runs/35303993418/job/105472311414) completed 2026-09-18 03:52:09 UTC with all stages successful, 211 unit/contract and 1434 browser passes, audit and XML consistency. This is source evidence, not native/import/human/release acceptance. CodeQL analysis also succeeded, not a guarantee of zero alerts.

The owner approved B0+N0 in [PR #11](https://github.com/thefastcyberdefense/google-blogger/pull/11), branch `feat/fcd-safe-verification-bootstrap`: only the two existing records, existing CI workflow and two new isolation files listed in docs/PROJECT-PLAN.md. This approval permits bounded source implementation, one PR and Actions verification, not a merge, candidate replacement, import, live request, settings change, publishing, DNS change, release/tag, rollback or branch cleanup. No product, lockfile or generated XML modification is part of bootstrap.

Accepted Errata v2 closes reporting corrections R1 through R6 only. Product fixes, native Blogger checks and human accessibility acceptance remain open; the accepted reports need no additional rewrite. The project ledger retains canonical defect identities and exact accepted archive hash.

### Retention and candidate status

[Post-merge artifact 10531587199](https://api.github.com/repos/thefastcyberdefense/google-blogger/actions/artifacts/10531587199) metadata was refreshed for this bootstrap. Name: `fcd-evidence-ecb1d438e8b3227911dc76359b9e05f127867b27`; run 35303993418; source/head main `ecb1d438e8b3227911dc76359b9e05f127867b27`; size 104472550 bytes; GitHub-reported archive digest `8ffe382c3cefa4c447b5a38c523f718a80e8e6ef1a25cdc8d70d4ef825d0a28e`; `expired: false`; recorded expiry 2026-10-02 03:52:02 UTC (09:52:02 Asia/Dhaka), subject to earlier deletion. This is a metadata refresh, not fresh downloaded-byte verification or selection for Blogger import. An approved durable destination is still required for preservation.

The Phase1A source/handoff retention timestamps below, 2026-09-26 04:28:06 and 05:58:38 UTC, have elapsed. Earlier availability statements remain historical, not current availability claims. No fresh availability or downloaded-byte re-verification of those archives is claimed. Do not silently repin, dispatch, weaken expiry checks, or substitute PR #10/bootstrap artifacts. The checked-in XML still has the genuine source stamp `0.1.0+bcb5b82706568c2f6f29cd1795b2589767e42146` and 101248-byte size, without any manual stamp edit.

### Isolation and provenance compatibility

Bootstrap adds a mandatory fail-closed namespace gate before application tests; its protected behavioral red and current verification status are recorded in docs/PROJECT-PLAN.md and PR #11. Dependency/browser installs, audit and upload remain separate from the no-egress application boundary. Each Vitest/Playwright payload and its children get loopback-only networking and non-root/no-new-privilege execution. No live site is used to prove the regression; no host firewall/AppArmor or privileged Docker-socket workaround is approved.

The existing source verify job, exact stage inventory, read-only checkout/permissions, install flags, upload layout and retention are retained. Existing npm stage labels now include mandatory isolation execution, not skipped commands. A run/attempt-specific temporary directory preserves isolation records across Playwright output cleanup; the always-run browser report stage finalizes them under `test-results/isolation` and rejects missing/stale/failed required evidence. Original nonzero payload status is preserved even if receipt writing fails. Partial artifacts still upload after failure, and are not passing evidence.

The pinned verifier remains unchanged: `CANDIDATE` and `REQUIRED_STEPS` are in tools/verify-artifact.py; it expects one successful verify job from a pinned push/main source/run attempt, exact repository association and artifact metadata. PR-head artifacts are not that candidate class. Only dist/theme.xml, build-size.json, unit-report.json and test-results/browser.json are semantically selected. New isolation JSON members receive archive integrity checking, not automatic semantic acceptance from that verifier. Their source acceptance comes from mandatory CI checks and substantive review. Any new stage/topology, future schema or candidate repin requires separate scope and negative tests.

No native/public requests, uploads or production mutation occurred in bootstrap. The owner remains the Blogger operator; production is not disposable staging. Source merge readiness, selected/download-verified artifact readiness, native save/build-stamped views, human acceptance and release permission remain separate.

### Operational references checked for this slice

- [Linux unshare](https://man7.org/linux/man-pages/man1/unshare.1.html): network/PID/mount namespace lifetime and kill-child semantics.
- [Linux setpriv](https://man7.org/linux/man-pages/man1/setpriv.1.html): non-root identities, capability removal and no-new-privileges inheritance.
- [GitHub workflow triggers](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows): opening/updating a PR executes source CI; draft is not a safety guard.

No dependency upgrade or platform migration is implied by these checks. Runner capability and browser behavior require exact-commit Actions evidence, not an assumed feasibility pass.

---

## Historical preparation snapshot (2026-09-18 Asia/Dhaka)

The remainder preserves the earlier candidate/history/operator record. Prospective PR #10 statements are historical and superseded by the current section above; candidate values and native/release controls remain unchanged.

Main baseline is `e1e7bb3cee62ec03cfcc290fa85fb473191eb9b4`, with PRs #1-9 merged. [PR #9 post-merge CI](https://github.com/thefastcyberdefense/google-blogger/actions/runs/35079121123/job/104738565032) completed2026-09-16 09:33:49 UTC: all stages successful,203 unit/contract and1170 browser passes,0 reported failed/pending/skipped/unexpected/flaky results,95157-byte XML, audit and generated consistency. [Post-merge CodeQL](https://github.com/thefastcyberdefense/google-blogger/actions/runs/35079120069) analyzed Python, Actions and JavaScript/TypeScript successfully; this is not zero-alert or release assurance.

[PR #10](https://github.com/thefastcyberdefense/google-blogger/pull/10) is the owner-approved distinct native-state implementation on feat/fcd-native-states. Owner approved an eleven-file boundary after the existing no-JS search test needed a selector correction. Source development, Actions verification, sequential review and branch-only generated XML transfer are approved. Merge, import, live requests, publishing, settings, DNS, release/tag creation and branch deletion/restoration are not.

Owner will handle Blogger uploads and share save/render evidence. Supplied https://blogs.fastcyberdefense.com/ is the production target, not disposable staging; only controlled-production test planning was selected. No backup/save/build-stamp evidence has yet been supplied in this work. Ledger's https://blogs.redwan.work/ is the reference site, not the FCD target. Existing staging-only checks must not be silently redirected to production. Do not request OAuth credentials or introduce a publisher merely for owner-assisted theme uploads.

## Native-state XML: generated, not yet selected for import

The corrected [run35259136763](https://github.com/thefastcyberdefense/google-blogger/actions/runs/35259136763) at source `bcb5b82706568c2f6f29cd1795b2589767e42146` passed211 unit/contract and1434 browser tests, no reported failures/pending/skips/unexpected/flaky, and dependency audit. The temporary stale-XML step was skipped for source-bound generation, not counted as a pass. [Transfer job105334684908](https://github.com/thefastcyberdefense/google-blogger/actions/runs/35259136763/job/105334684908) verified same-run artifact identity/repository/source, archive digest and size, selected XML type/length/CRC/checksum and full stamp, then committed only dist/theme.xml without force-pushing.

Generated-output commit: `03e473c55672bcce418552b5b7603ae18f4db989`. Actual XML source stamp: `0.1.0+bcb5b82706568c2f6f29cd1795b2589767e42146`; size101248 raw bytes. XML is copied from Actions, not edited locally. Subsequent documentation/workflow commits do not change its generating stamp. The temporary transfer job, write permission and stale-output exception have been removed; final exact-head CI must pass the restored consistency check, normal tests/audit, contracts and CodeQL. Final observed evidence and review belong in PR #10 rather than predeclaring pending runs successful here.

This source update does NOT replace the Phase1A candidate below. That older candidate lacks these new states. Before any upload of the new implementation, explicitly select and record the exact source/run/attempt/artifact/archive digest/XML digest/size/stamp tuple and verify the downloaded bytes. A documentation or cleanup commit's generated artifact is not implicitly preferred. The existing pinned artifact verifier still verifies only9a6f484 and must not be represented as verifying PR #10's new XML. No verifier pin change or dispatch is part of this slice.

## Previously approved Phase1A candidate (unchanged)

| Field | Pinned value |
| --- | --- |
| Repository |thefastcyberdefense/google-blogger (1361530973)|
| Generating source |`9a6f484a2c389c3b256dcd58d88742118fc01905`|
| Workflow |.github/workflows/ci.yml, FCD theme verification|
| Run / attempt |[34672572631](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34672572631) /1, push/main|
| Generating job |[103496602996](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34672572631/job/103496602996), completed2026-09-12 04:28:15 UTC|
| Artifact |[10291252454](https://api.github.com/repos/thefastcyberdefense/google-blogger/actions/artifacts/10291252454)|
| Name |fcd-evidence-9a6f484a2c389c3b256dcd58d88742118fc01905|
| Verified archive SHA256 |`1fedb62352c275addd266e83b3955ada49341b176114ea269884e9d0ca2bd069`|
| Archive bytes |99701644|
| Source expiry |2026-09-26 04:28:06 UTC (10:28:06 AM Asia/Dhaka), subject to earlier deletion|
| Verified XML bytes |95157|
| Actual stamp |`0.1.0+9a6f484a2c389c3b256dcd58d88742118fc01905`|
| Verified XML SHA256 |`25b06c6c3414a3c4094153ba272de2445cd801318d38541a4edfc0fdffce4ce3`|
| Reports |203 unit/contract and1170 browsers,0 failures/pending/skips/unexpected/flaky/retries|

The individual XML checksum was computed from downloaded bytes and matched the generating job's unique checksum line. Archive digest, XML digest and signed provenance are different concepts. This handoff is not a signed build attestation.

[Final Phase1A verification](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34676925901) at verifier81a8f111e44808a246eea6a9c145187112fb866c passed31 contracts with0 failures/errors/skips and live-candidate verification/upload. Output [artifact10291819197](https://api.github.com/repos/thefastcyberdefense/google-blogger/actions/artifacts/10291819197), named fcd-verified-handoff-81a8f111e44808a246eea6a9c145187112fb866c, contains theme.xml, theme.xml.sha256, verification.json. GitHub-reported output archive:32055 bytes, SHA256 `549b19b099b2d23e70ad2a8bf59d8bdfc50edcbe9d883603af1b33cad51fdb0a`, expiry2026-09-26 05:58:38 UTC (11:58:38 AM Asia/Dhaka).

Both original/handoff metadata matched and reported unexpired on2026-09-16; handoff availability was checked again2026-09-17. Those are metadata checks, not fresh archive downloads. Phase1A verified original archive bytes in Actions; no independent redownload-byte validation of its re-uploaded handoff archive is claimed. Verify downloaded XML against the recorded digest before separately authorized use.

Preserve evidence in an approved durable location before expiry; no destination has been supplied. A new handoff does not extend the original artifact lifetime. Missing/expired logs or artifacts block re-verification; stop and obtain a reviewed replacement rather than silently selecting another run or relaxing checks. A separately approved main workflow_dispatch can reverify this old candidate while evidence remains available, but cannot validate PR #10's new states.

### Historical candidates and checked-in XML

Previous candidate: source8e37eb53c9cc4c13dd3d5baf1d07fe71e984f312, run34426823783 attempt1, job102713723132, artifact10133169422, archive SHA256 `01cbf0d6abcf65a494b5c091d094628f4fadd230af3242a048efc03c36b024be`, expiry2026-09-24 01:55:41 UTC;185/1126 tests and95157-byte XML. Only metadata verification was recorded then; owner explicitly replaced it in Phase1A. See [historical pre-slice procedure](https://github.com/thefastcyberdefense/google-blogger/blob/e1e7bb3cee62ec03cfcc290fa85fb473191eb9b4/docs/DEPLOYMENT.md).

Before PR #10, checked-in XML carried historical stamp0.1.0+ba4c9852803cbfcb60d3536199963af395cd6315. This branch's Actions-generated XML now carries bcb5b827 as recorded above. Normal CI normalizes only the build stamp when comparing generated versus checked-in XML; do not modify a stamp manually. Preparation/regression branch artifacts were never implicit import candidates.

## Retained artifact-verifier safety boundaries

The unchanged .github/workflows/artifact-verification.yml runs contracts on PRs; its real-candidate job is restricted to the original same-repository feat/fcd-artifact-verification branch or explicit dispatch on main. The real-candidate job is intentionally skipped on feat/fcd-native-states: not a live verification pass. Checkout is nonpersistent; permissions contents:read/actions:read; no publisher or production credentials.

The verifier pins repository and head repository IDs/names, source SHA, workflow ID/path, event, run attempt, generating job/stages, artifact identity/association, size/digest/expiry. Bounded authenticated API downloads are separated from unauthenticated allowlisted HTTPS storage requests; tokens and signed URLs are not forwarded/logged. All ZIP members undergo path/type/CRC/actual-length checks without extraction/execution; only four evidence files are retained. XML parsing allows plain html doctype and inert CDATA/comments, rejects external identifiers/internal subsets/entities, requires correct head stamp and unique generating-log checksum. Strict JSON and bounded result traversal validate totals and individual outcomes before artifact expiry/association recheck and fresh output creation. Upload requires verification success.

| Boundary | Limit |
| --- | --- |
| Compressed archive |160 MiB|
| Expanded members |1 GiB|
| Any member |256 MiB|
| Browser JSON only |80 MiB, explicitly owner approved|
| Other selected reports |64 MiB|
| API JSON / job log |8 MiB /32 MiB|
| ZIP entries |10000|
| Storage requests per download |At most3 after API redirect|
| Network deadline / request timeout |300 seconds total per transport /at most30 seconds each|
| Process / outer timeout / job |330 seconds /360 seconds /10 minutes|
| Raw XML |500000 bytes, sole theme-size cap|

Original verified archive inventory:396 entries,172591716 expanded bytes,69523303-byte browser.json. Only the browser-report limit was raised from64 to80MiB. These processing limits are not CSS/JS growth caps. Output XML is byte-identical, not regenerated; no artifact code is executed.

## Operator inputs and eight-view worksheet

Reuse [fixtures/staging-views.example.json](../fixtures/staging-views.example.json), not a new schema. Its blank fields are intentionally blocked. The owner supplied the FCD production URL and blog identity in conversation, but that does not establish import or authorize live changes. Keep owner-specific records outside public source unless approved. Public checks need publicly readable non-sensitive pages; no passwords, OAuth tokens or private content in the manifest.

Required operator inputs: confirmed target blog name/ID and exact public HTTPS origin, authorized operator, backup date/location for theme and content separately, Layout/widget settings, durable evidence destination, selected XML digest/stamp, import/save time/result and rendered-stamp evidence. Inventory existing content first; creating/publishing sample articles/pages or mutating comments/widgets requires separate scope. Have real content sufficient for label/search/archive/pagination and representative technical article behavior.

| View | Native URL / expected evidence |
| --- | --- |
| home |Initial populated catalog;HTTP200,visible main and heading|
| article |Actual permalink;HTTP200,visible article-view/title/populated body|
| label |Existing populated label;HTTP200|
| search |Native results;HTTP200,independent expected visible text|
| archive |Populated archive;HTTP200|
| static |Actual page;HTTP200,independent expected visible text|
| error |Nonexistent URL returning themed HTTP404 and expected text, not soft404|
| paged |Actual older/newer results;HTTP200 and native navigation links|

All views exactly once, URLs from observed native output, same configured HTTPS origin, no credentials/fragments or redirects. Origin has no query/fragment/path beyond slash. build is the imported full stamp, not necessarily checker HEAD. expectedText is mandatory for search/static/error, never hidden/script text. Optional expectedCanonical requires an independently justified credential-free same-origin HTTPS URL without fragments/control characters; do not infer it from the tested response or insert empty optional values. Preserve robots/indexing policy rather than changing it to make checks pass.

After separately authorized import and complete inputs, obtain approval for FCD_STAGING_MANIFEST_JSON configuration and dispatch of the existing read-only staging workflow. Current approval does not adapt that workflow for production. Record checker SHA/run and imported source separately. Require all eight outcomes and full successful completion. Existing workflow logs results rather than uploading a dedicated evidence artifact. It had zero recorded runs on2026-09-16; this does not rule out unreported owner activity.

## Controlled import, native feedback and rollback plan

1. Before a separately approved import, export the existing theme, back up content separately, record Layout/widget settings and a recovery location. Use Blogger theme controls, never Settings > Import Content for theme XML; do not enable automatic content publication.
2. Select and verify the exact XML tuple; agree target/operator, maintenance window and rollback triggers such as save failure, missing posts or broken navigation. For production, the exact import and any rollback require explicit authorization.
3. Owner/operator imports and records UTC save result/errors and rendered stamp. A successful upload alone is not a pass. If save fails or stamp differs, preserve evidence; do not patch generated XML manually.
4. After separate read-only test authorization, assess the real views and native HTTP statuses, metadata, labels/archives/pagination, selected feed mode, no-JS reading/fallback, Header1/Blog1/Layout, menu/search/TOC/copy/theme and comment rendering. Comment submission, moderation and Layout changes remain scoped mutations. Untested feed modes remain pending.
5. For PR #10 specifically, record actual error, empty search, empty label, empty archive, initial-empty-home and generic-empty behavior where safely available. Never delete/unpublish production posts to manufacture empty-home coverage. If a scenario cannot safely exist on production, use a separately authorized disposable blog or leave that native scenario pending. Fixture coverage is not a substitute.
6. Record defects by view/state/environment with exact reproduction, expected/actual result, evidence, severity and owner. Distinguish theme versus checker versus content/configuration/platform failures. Propose bounded changes; Actions regressions, generated XML, review, merge and replacement/reimport approvals remain separate.
7. For an authorized rollback, restore recorded theme/widget settings, confirm save/rendered identity and native views, and treat content recovery separately. This implementation performs no restore.

## Human and release gates

Human keyboard/screen-reader review needs named reviewer/date/browser/OS/assistive technology/view/state/theme and evidence. Check headings/landmarks/skip-link/focus order/visibility/return, menu/search/TOC/copy/comments, meaningful image and diagram descriptions, no traps. Axe violations and incomplete results remain separate; no automated conformance claim.

Require light/dark contrast, narrow reflow/text spacing,200% enlargement,true400% zoom where applicable, local code/table/diagram scrolling and print. Fixture width is not true zoom; WebKit is not all Safari/iOS devices. Fix confirmed theme-owned WCAG A/AA defects without global suppression. Record lab methods/limits; synthetic timings are not field p75 CLS/INP. No analytics install is implied.

All views require meaningful title, no unintended duplicate canonical/description/social fields; non-error views require valid unique same-origin canonical, error may omit it. Article schema is post-only with headline/identity matching independent expectation; optional native author/date/image values must be valid or omitted, not invented. Retain all-head-content ownership and current robots policy. Parsed checks bound responses to2MB and block scripts/resources; they do not prove interactive widgets or search-engine eligibility.

Retain public feed fallbacks and500000 accepted decoded byte/8-second request bounds with bounded retries. Author covers remain existing fcd-article-cover figures, not synthesized/duplicated images. Preserve FCD identity and upstream licenses, native V3/V2 and500000 raw XML cap; CSS/JS sizes remain informational.

Source readiness, exact final-head CI, artifact verification, native import/views, human review and release approval are separate. No known passing fixture result proves Blogger compatibility. The old inaccessible-live-blog waiver does not waive these gates. Sequential specialist self-review is not independent approval. Production release and deployment remain unauthorized/unperformed in this work.

## References

- [Blogger widget conditional/include tags](https://support.google.com/blogger/answer/46995?hl=en), rechecked2026-09-18 Asia/Dhaka for exclusive conditional syntax; field-level native runtime behavior still needs Blogger evidence.
- [Blogger backup versus content import](https://support.google.com/blogger/answer/41387?hl=en), rechecked2026-09-16.
- [Blogger theme controls](https://support.google.com/blogger/answer/1227173?hl=en).
- [GitHub artifact API](https://docs.github.com/en/rest/actions/artifacts) and [workflow job logs](https://docs.github.com/en/rest/actions/workflow-jobs), references checked2026-09-12.
- [GitHub artifact validation](https://docs.github.com/en/actions/tutorials/store-and-share-data).

No new runtime dependency or theme technology decision is part of this slice.
