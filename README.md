# Fast Cyber Defense Blog

Unreleased Google Blogger Layouts V3 / Widget Version 2 theme. The hardened foundation was merged in PR #1. Phase 2 technical content is in **draft PR #2**, unmerged and not deployed. Main stays at the approved foundation merge until separately authorized.

## Build

Node 24.20.0 (`.nvmrc`), npm 11+, genuine dependency lockfile:

```sh
npm ci
npm run build
npm run preview
```

Pug + SCSS + bundled TypeScript generate `dist/theme.xml`. The XML contains the explicit Prism grammar subset; optional Mermaid is loaded externally only on diagram pages. No React, server or database is introduced. Do not edit generated XML manually.

The regenerated Phase 2 XML is committed from Actions output, replacing the old foundation artifact. It preserves its actual generating source stamp. Normal CI compares checked-in XML with a fresh build while normalizing only that stamp; any other difference blocks acceptance. Use the latest successful exact-head Actions artifact for a deployment candidate.

## Technical features

Prism **1.30.0** covers Bash, PowerShell, Python, JavaScript, TypeScript, SQL, JSON, YAML, Docker, HTTP and XML with aliases. It highlights only article blocks and preserves original copy text. Unknown/oversized blocks remain plain.

Mermaid **11.17.2** loads via exact-pinned jsDelivr ESM when diagrams exist. It uses strict configuration, immutable original-source retention, serialized theme-aware rendering, accessible source and viewport regions, bounded zoom/reset and visible failure fallback. SVG export and arbitrary post-supplied configuration are excluded. The dependency is optional but third-party: one XML import does not mean diagrams are fully self-contained. See [authoring policy](docs/TECHNICAL-CONTENT.md).

Vitest is pinned to patched **4.1.11** after the integrated audit found an advisory in the foundation's previous 3.2.7. The lockfile was generated/audited in Actions. Main's graph has not been changed by this PR.

## Verification

All automated testing/builds occur in GitHub Actions. The full foundation suite remains, alongside real-library rendering, source keyboard access, theme-during-load races, malformed/oversized/configured/unsafe-link diagrams, repeated initialization, exact copy payloads, blocked CDN fallback and staging-tool responses. Request interception serves the real locked Mermaid distribution, not a mock renderer. Reports include unit JSON, Playwright JSON/HTML, screenshots, axe data and optional-library request bytes.

Run 34306353365 recorded 107 unit/contract and 594 browser passes but correctly failed the stale checked-in XML gate. The XML was then regenerated, its stamp/reports/job results checked, and committed. Final acceptance must use the complete successful check on the latest [PR #2 head](https://github.com/thefastcyberdefense/google-blogger/pull/2), not that intermediate failed run.

Routine CI is read-only with pinned action commits. Temporary source-bound artifact-transfer permission was removed. No audit threshold was weakened and no accessibility rule was suppressed.

## Preview and staging

`npm run preview` serves labeled shared-presentation fixtures at localhost:4173. Native Blogger data expressions, comments and widgets are not interpreted by those fixtures.

`npm run staging:check` reads an eight-view manifest. Configure repository variable `FCD_STAGING_MANIFEST_JSON` from the empty example only after an owner-confirmed Blogger import/save, then run the separate manual read-only workflow. It does not upload XML, seed posts or deploy. Missing real URLs/import evidence remains blocked.

Actual Blogger rendering, comments/widgets/Layout, full page-type SEO/performance, cross-browser and human accessibility remain release gates. No credentials belong in XML or chat. Merge and production replacement require explicit approval.

## Next milestone

Editorial lead/secondary composition, cover/card policy, expanded discovery, related articles, SVG export and wider release work remain deferred. Ledger personal identities, cached raw HTML, analytics and publishing automation were not ported. FCD Superpowers and FCD Accessibility Reviewer guide development; checks and self-review are not an independent external approval.
