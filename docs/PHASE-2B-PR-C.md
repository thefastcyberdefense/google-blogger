# PR C acceptance hardening

Approved 2026-09-10: PR C batch, isolated branch feat/fcd-publication-acceptance, one draft PR, source-bound XML transfer if needed; no merge/deployment/deletion. Base 96ba43115b25fc55155c128a0d2e83e1c46339dc passed post-merge Actions run34365338022. Preserve inherited168 unit/contract and946 browser checks.

Owner correction supersedes all earlier size-growth policies: total raw generated XML <=500000 bytes (500KB). Raw JS and compiled CSS have NO fixed cap or growth limit; sizes/gzip reports remain informational. tools/generate.ts is additionally amended under the explicit size-policy request. No weakening of security, content correctness or accessibility checks.

C1 baseline and metadata red tests in progress. C2 parsed-output validator and conditional native metadata pending. C3 representative Firefox/WebKit acceptance pending. C4 staging integration/docs pending. C5 final full verification/XML parity pending. Native Blogger import/save, human accessibility/print and field performance remain separate blocked/pending release gates. No live staging configuration supplied.

Current official references checked: https://developers.google.com/search/docs/appearance/structured-data/article and https://playwright.dev/docs/test-projects . Missing recommended author/date/image values are omitted, not fabricated. Preserve native all-head-content ownership and jsonEscaped bindings. No robots or indexing-policy changes. No new dependency/runtime feature.
