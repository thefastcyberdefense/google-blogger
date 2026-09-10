# PR C: metadata and cross-browser acceptance

Approved10 September2026, isolated branch feat/fcd-publication-acceptance, draft PR#5, source-bound feature-branch XML transfer; no merge/deployment/deletion. Base96ba43115b25fc55155c128a0d2e83e1c46339dc passed post-merge run34365338022,168 unit/contract and946 browser tests. Inherited coverage remains intact.

## Owner size-policy correction

Only total raw generated XML <=500000 bytes (500 KB). No fixed JS, compiled CSS or per-phase growth limit. tools/generate.ts additionally changed under that explicit correction. Component raw/gzip sizes are informational; removed stale baseline/growth gates from CI. Security/input/network limits and performance review remain, not weakened.

## Implemented and verified source behavior

C1 red evidence:08992ea89b5261fee2fb280db16af527f3810ffd, run34421055855,169 passed/2 failed unit-contract tests (missing author/date guards and unimplemented parsed metadata checker). No missing-module/setup error used as behavioral red evidence.

C2 metadata: author and publication date omitted when unavailable; native all-head-content owns canonical/base metadata. Bounded2MB parsed-HTML checker validates eight view types, title/canonical/social multiplicity and URLs, JSON-LD structure/graph limits, post-only article schema, headline/identity consistency and optional author/date/image validity. Staging retains its visible-content/article-type checks and additionally calls the same checker. Synthetic fixtures explicitly model expected rendered output and do not interpret Blogger expressions. Missing optional fields are not claimed as mandatory Google requirements. Robots/indexing policy unchanged.

C3 engine coverage: all22 Chromium projects retained; eight representative Firefox/WebKit projects (390/1280, light/dark) select the new acceptance suite. It executes production compiled scripts against controlled responses for filter/reset/native search, menu/theme/focus, TOC, related fallback, copy success/failure, print, no-JS enlarged text and actual pinned Mermaid success/blocked-source behavior. No dependency changes. Engine coverage is not full Safari/iOS device certification.

C4 evidence: request inventory, reserved dimensions, navigation timing/supported-entry observations, screenshots, traces, axe violations/incomplete results and size reports. These are synthetic diagnostics, not field CWV or comprehensive visual/human screen-reader approval. Native comments/Layout and actual Blogger metadata remain external acceptance. Additional field/performance investigation requires actual staging.

Source ba4c9852803cbfcb60d3536199963af395cd6315 passed172 unit/contract and1066 browser tests (zero skips/unexpected/flaky) in run34421613685; types/build/XML contracts/audit passed. The overall run failed ONLY stale checked-in XML and is not described as green. Browser total comprises1034 Chromium cases plus16 Firefox and16 WebKit cases from4 representative tests per new project.

C5 XML: artifact10131362293 from that exact source/run, digest sha256:b096169aa7770de80c8236f4bacc038fb5532024a2ea58667c3defa8ec267a56. Verified immutable provenance, job/report totals, installed engine projects, source stamp and XML95157 bytes before XML-only commit4dd1c1b329dea3035a346563d1b2151fc5bc5868. Temporary contents:write removed and complete read-only CI restored. Final exact-head outcome belongs in PR#5; no pending run is a pass.

## Review and boundaries

Source comparison retains native V3/V2/Blog1/Header1/super.main/comments/pagination and existing runtime scripts. This is a sequential source/evidence review, not independent external approval. There is no need to change every file in the maximum preview when existing fixtures/routes serve acceptance needs. No main write/merge/deploy/delete authorized.

Source acceptance requires the complete final run including XML consistency. Actual Blogger import/save, configured eight-view results, native widgets/comments/Layout, human accessibility/print/visual review and real field/performance evidence remain pending. Do not declare the full project production-ready solely from fixtures. No staging configuration has been supplied or executed as a passing check.

## Sources

https://github.com/thefastcyberdefense/google-blogger/actions/runs/34421613685/job/102698137871
https://github.com/thefastcyberdefense/google-blogger/commit/4dd1c1b329dea3035a346563d1b2151fc5bc5868
https://developers.google.com/search/docs/appearance/structured-data/article
https://playwright.dev/docs/test-projects
