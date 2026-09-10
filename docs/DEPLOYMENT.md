# Staging and deployment boundaries

PRs #1 through #5 are merged without deployment. Exact main `8e37eb53c9cc4c13dd3d5baf1d07fe71e984f312` passed every stage of [post-merge verification](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34426823783/job/102713723132) on 2026-09-10. Source completion and merge verification do not establish native Blogger acceptance or release approval.

The current owner-approved batch is preparation only, on `docs/fcd-staging-preparation`. No theme import/save, staging execution, repository-variable configuration, content publication, deployment, DNS change, merge or deletion is performed or authorized by these instructions. Steps below involving external changes are a future gated procedure, not standing permission to execute them.

## Artifact selection

Use fresh XML from a complete successful exact-head Actions run, record its full theme-build stamp and digest. Checked-in XML retains its actual generating stamp; CI normalizes only that metadata value for comparison. Any other stale output fails. XML is generated in Actions and transferred back into the repository only through an explicitly approved source-bound feature-branch operation. Remove temporary write permission before final acceptance. This preparation changes no XML and introduces no writer.

Only total raw XML is capped at 500000 bytes. JS/CSS raw/gzip reports are informational, with no fixed component/growth cap. Optional pinned Mermaid CDN modules are external to XML size and remain a separate supply-chain/availability dependency.

### Candidate handoff: verified main run, not an import approval

| Field | Recorded evidence |
| --- | --- |
| Repository | thefastcyberdefense/google-blogger |
| Generating revision | `8e37eb53c9cc4c13dd3d5baf1d07fe71e984f312` |
| Workflow/run/attempt | FCD theme verification / [34426823783](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34426823783) / 1, push to main |
| Job | [102713723132](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34426823783/job/102713723132), success, completed 2026-09-10 01:55:49 UTC |
| Tests | 185 unit/contract passed, 0 failed/pending; 1126 browser passed, 0 skipped/unexpected/flaky |
| Artifact name | `fcd-evidence-8e37eb53c9cc4c13dd3d5baf1d07fe71e984f312` |
| Artifact ID / metadata | [10133169422](https://api.github.com/repos/thefastcyberdefense/google-blogger/actions/artifacts/10133169422) |
| GitHub-reported archive SHA-256 | `01cbf0d6abcf65a494b5c091d094628f4fadd230af3242a048efc03c36b024be` |
| Archive size | 99,634,650 bytes, not the theme XML size |
| Expires | 2026-09-24 01:55:41 UTC, subject to earlier deletion |
| XML raw size from Actions notice | 95,157 bytes |
| Expected generated stamp | `0.1.0+8e37eb53c9cc4c13dd3d5baf1d07fe71e984f312`, derived from the verified run source and generator; inspect the downloaded XML before use |
| Individual XML SHA-256 | Pending downloaded-file verification against this run's size-evidence log |
| Downloaded archive-byte verification | Pending; API metadata was checked, archive contents were not downloaded in preparation |
| Native import/save and rendered stamp | Pending owner action and evidence |

The archive digest is not the individual XML digest and is not a signed provenance attestation. The recorded candidate is intentionally pinned to the already-verified main run; do not silently replace it with a later documentation-branch artifact, which has a different generated stamp even if runtime content is unchanged. If selecting a replacement, update the complete source/run/artifact/digest/stamp tuple and repeat verification before obtaining import approval.

Before any separately authorized import:

1. Open the exact run above and download the named artifact through its Artifacts section using an authorized GitHub account. Recheck repository, source SHA, attempt, complete success and unexpired artifact metadata. Do not use a similarly named artifact from another run or an expired signed download URL.
2. Verify the downloaded archive's SHA-256 against the recorded archive digest. Treat mismatches as blocking even if a downloader reports only a warning. Inspect only expected data files; do not execute scripts from an artifact. Any automated project/artifact validation must run in GitHub Actions, not as a local substitute.
3. Inspect its `dist/theme.xml`: full expected stamp exactly once, 95,157 raw bytes, and individual XML SHA-256 matching the `sha256sum dist/theme.xml` output in this run's size-evidence step. Record that XML digest separately. Inspect `build-size.json`, unit and browser reports against the tuple/totals above. Do not edit XML to change its stamp.
4. Preserve the verified archive/XML and evidence in an approved location before expiry. Do not commit large archives, credentials, private content or arbitrary third-party files into this public repository. If evidence has expired or cannot be verified, stop and obtain fresh approved Actions evidence rather than claiming this handoff passed.

## Eight-view manifest worksheet

Use [fixtures/staging-views.example.json](../fixtures/staging-views.example.json), not a new competing manifest schema. Its empty fields intentionally block execution. Formatting is the only change to that example in this preparation; no real staging configuration is implied. Keep owner-specific configuration outside the public repository unless explicitly approved for publication.

| Input | Required owner-supplied value |
| --- | --- |
| Staging identity | Dedicated non-sensitive Blogger blog name and blog ID, recorded with the handoff outside the runtime manifest |
| `origin` | Exact public HTTPS origin, no credentials, path beyond `/`, query or fragment; do not use production as a placeholder |
| `build` | Full stamp read from the verified XML actually selected for import; for the candidate above, use its recorded expected stamp only after downloaded-file verification |
| `views` | All eight types exactly once, each with a real absolute URL on the configured origin, without credentials or fragments |
| `expectedText` | Nonempty visible main-content excerpt for search, static and error; use known intended content, not hidden text or script strings |
| `expectedCanonical` | Optional per-view independent expectation for intentional platform canonicalization; omit unless explicitly known and justified |

| View | Select a real native URL with these properties |
| --- | --- |
| `home` | Initial home catalog, HTTP 200, visible populated main and heading |
| `article` | Actual post permalink, HTTP 200, visible article-view, post title and populated article-body; a catalog is not an article |
| `label` | Existing label catalog, HTTP 200, populated native results |
| `search` | Native search URL, HTTP 200, required expected visible text |
| `archive` | Existing archive view, HTTP 200, populated native results |
| `static` | Actual static page, HTTP 200, required expected visible text |
| `error` | Nonexistent URL producing the theme's real HTTP 404 page, required expected visible text; soft-404 HTTP 200 fails |
| `paged` | Actual native older/newer pagination URL, HTTP 200, visible catalog and native pagination links |

Record URLs as observed from the staging blog, not guessed path shapes. All requests must resolve directly: the existing checker rejects redirects and expects 200 except 404 for error. Do not weaken these assertions to accommodate an uninvestigated failure.

By default metadata identity is compared with the requested URL under the existing normalization policy. When the owner independently expects a different canonical (for example native search canonicalization), add `expectedCanonical` to that view as a same-origin absolute HTTPS URL without credentials, fragments or control characters. Do not add empty optional values, infer the expected canonical from the response being tested, or change robots/indexing policy to pass checks.

### Configuration and execution gate (not performed)

After separately authorized import/save and complete owner inputs, obtain go-ahead to set the repository variable `FCD_STAGING_MANIFEST_JSON` to the completed JSON and dispatch the existing **Read-only Blogger staging checks** workflow. Record the checker branch and resolved commit separately from the imported theme stamp; they need not be the same revision. The existing workflow passes the variable into `STAGING_MANIFEST_JSON`, writes a temporary manifest and runs `npm run staging:check` in Actions with contents:read and nonpersistent checkout credentials. No workflow or permission changes are part of this batch.

Missing configuration is blocked, not passed. Require the completed run URL, exact checker revision, manifest identity, all eight per-view PASS lines and final success. The workflow currently logs results rather than uploading a dedicated staging evidence artifact; preserve the run/log reference, and do not claim an artifact was produced. A passing checker still cannot prove interactive comments, Layout editing, full accessibility or field performance.

## Metadata acceptance matrix

All views: one meaningful title, no unintended duplicate canonical/description/social fields, safe HTTPS metadata destinations. Non-error views: unique same-origin canonical. Error views may omit canonical; any supplied canonical must still be valid. Article views: exactly one article schema, headline matching article heading and mainEntityOfPage matching the independent expected identity. Other views must not carry article schema. When present, authors have valid types/nonempty names, dates are valid ISO timestamps, modification is not before publication, and images are safe URLs. Optional fields are omitted when native values are unavailable. Do not invent dates, image URLs or author profiles. Do not add a second canonical alongside native all-head-content.

home: website metadata; article: article metadata; label/search/archive/paged/static/error: website metadata. Supported Schema.org contexts and inheritance are explicit, not a general JSON-LD processor. Existing robots/search/archive indexing policy is recorded, not changed automatically. This is the FCD acceptance policy, not a statement that every checked field is required for Google eligibility. Rich-results/indexing success is not guaranteed.

The checker parses returned HTML with scripts/resources blocked and enforces a 2MB response cap. It does not execute Blogger expressions, check image accessibility, certify native widgets, or prove SEO indexing. Duplicate metadata from native all-head-content can only be conclusively assessed on actual rendered Blogger output.

## Owner-assisted native acceptance

These remain pending, independently evidenced gates. Preparation is not authorization to execute them.

1. Identify the dedicated staging blog and operator. Before a separately approved import, export the existing theme and back up content; record widget settings and rollback evidence in an approved non-public location. Blogger theme backup and post/page/comment content backup are different operations. Do not upload theme XML using Settings > Import Content or enable automatic content publication.
2. Obtain separate authorization for the exact staging blog and verified XML artifact. Owner or explicitly authorized operator imports/saves that theme through Blogger's theme controls, records UTC time and actual save success/errors, then checks the rendered build stamp. Do not substitute the production publication.
3. Complete the eight-view worksheet and, with execution go-ahead, configure/dispatch the existing read-only Actions workflow. Metadata and visible-content checks must both pass; retain catalog-as-article and hidden-content safeguards.
4. Record real feed behavior under the intended Full/Short/Until Jump Break/Custom/None/redirect configuration, escaped labels/current identity, archives and native older/newer links. Record Blog1/Header1, widgets and Layout editor behavior without silently renaming or removing bindings. Any mutation during widget/comment testing needs its own approved staging scope.
5. Obtain human keyboard and screen-reader evidence with reviewer, date, browser/OS/assistive technology, view, state, viewport/theme, observed result and evidence link. Include landmarks/headings/skip link, focus order/visibility/return, menu/search/TOC/copy, comments, meaningful image/diagram descriptions and no keyboard traps. Record automated axe violations and incomplete checks separately; do not imply axe provides human approval.
6. Record light/dark visual and contrast checks, narrow reflow, text spacing, 200% text enlargement, true 400% browser zoom where applicable, local table/code/diagram scrolling and print output. Fixtures at a narrow viewport are not true zoom evidence. Playwright WebKit is not every Safari/iOS device. Confirmed theme-owned WCAG A/AA failures require a focused fix, not global rule suppression.
7. Measure real staging load/interaction/layout behavior and document methods and limitations. Synthetic fixture timings, displacement controls and request logs are diagnostics, not field 75th-percentile CLS/INP guarantees. Field performance remains pending until suitable real-user evidence exists; no analytics installation is implied.
8. Obtain separate production authorization only after applicable acceptance gates. Any rollback is an explicitly authorized restore of exported theme and recorded widget settings, with verification afterward; this preparation executes no rollback.

### Evidence record to complete later

| Gate | Current status | Required record |
| --- | --- | --- |
| Source and main merge verification | Passed at the pinned main revision | Exact main run above |
| Preparation commit verification | Pending when this document was committed | Final exact-head run and sequential review in the preparation PR |
| Downloaded artifact/XML verification | Pending | Archive digest result, individual XML digest, stamp and reports |
| Native staging import/save | Pending | Blog identity, operator, separate approval, backup references, save result/time and rendered stamp |
| Eight native views | Pending | Completed owner manifest, checker revision, Actions run/logs and all eight outcomes |
| Feeds/widgets/comments/Layout | Pending | Real native interaction/settings evidence within approved scope |
| Human accessibility/visual/print/true zoom | Pending | Named reviewer and device/state-specific observations, defects and retests |
| Field performance | Pending | Real-user measurements and method, not fixture diagnostics |
| Release approval/deployment | Not authorized / not performed | Separate owner decision and later deployment evidence |

No staging import/save evidence or real eight-view configuration has been supplied. The old inaccessible-live-blog audit waiver does not waive future native staging validation. Do not modify blog settings, publish posts, deploy or delete branches as part of preparation.

## Feed and author policies retained

Public feeds may be Full/Short/Until Jump Break/Custom/None or redirected; private feeds are unavailable. Existing 500000 accepted decoded byte/8-second request and bounded retry limits stay in effect. Never silently broaden them because CSS/JS caps were removed. Native latest/topic links remain fallback. Covers are existing author figures using fcd-article-cover, not automatic duplicate images.

## Official guidance checked 2026-09-10

- [Blogger: Back up or import your blog](https://support.google.com/blogger/answer/41387?hl=en): theme backup is separate from content import; content import can publish posts/pages if enabled.
- [Blogger: Use themes](https://support.google.com/blogger/answer/1227173?hl=en): theme selection/customization and backup controls. Verify actual staging UI before any separately approved import.
- [GitHub: Download workflow artifacts](https://docs.github.com/actions/managing-workflow-runs/downloading-workflow-artifacts): exact run selection, read access and expiration.
- [GitHub: Store/share and validate artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data): artifact SHA-256 validation; a mismatch warning is blocking under this project's handoff policy.

No new technology or dependency decision was made. Source/evidence and accessibility-checklist review are sequential self-review, not independent human approval.
