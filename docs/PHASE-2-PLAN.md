# Phase 2 first slice: approved implementation scope

Approved 2026-09-09: 30 file targets (15 updates, 15 additions), one feature branch and draft PR. Base c3a68fc3ddbe1bdbee574e7a127d11aa82096e9e. Use FCD Superpowers and the workspace GitHub connection. All automated verification in Actions. Main, production, merge and deployment remain untouched.

Deliver compatibility tooling, idempotent library lifecycle, bundled explicit Prism grammars, strict exact-pinned Mermaid ESM loading only on diagram pages, original-source fallback, accessible zoom/reset, real-library tests, and regenerated XML. Defer SVG download, editorial/related-content redesign and infrastructure.

Candidate exact releases verified from npm on 2026-09-09: prismjs 1.30.0 and mermaid 11.17.2. Check the published Mermaid bundle as well as the npm dependency graph: rebuilding dependencies locally cannot patch an immutable CDN distribution. Third-party reports list DOMPurify advisories; their applicability needs bundle/version/call-site review. GHSA-x4vx-rjvf-j5p4 is limited to hostile live DOM objects in IN_PLACE mode and explicitly excludes string-input sanitization; CVE-2025-15599 affects DOMPurify 3.1.3 through 3.2.6 and is fixed in 3.2.7. Neither report alone establishes exploitability in this planned integration.

Steps: dependency/API/security preflight; meaningful red Actions regressions; minimal implementations; full real-library/browser/a11y checks; artifact/source consistency; self-review with exact-head evidence. No downgrade of native V3/V2, Blog1/Header1 or pagination. Keep 500000-byte XML cap and report external runtime bytes separately.

Staging URL and owner-confirmed theme import/save are not provided. Add a read-only manual staging workflow and example manifest with empty URL slots. Do not execute real staging or claim import compatibility until configured. No secrets in XML or chat.

Source references: https://mermaid.js.org/config/usage.html ; https://mermaid.js.org/config/accessibility.html ; https://prismjs.com/ ; Ledger 692a82463cb8d0869a6f5e7c946ecc757cacb7e2.
