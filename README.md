# Fast Cyber Defense Blog

The hardened Blogger Layouts V3 / Widget Version 2 foundation was merged in PR #1. Phase 2 technical-content implementation is in **draft PR #2**, not merged or deployed.

## Development

Node 24.20.0 (`.nvmrc`), npm 11+, genuine committed lockfile. `npm ci`, `npm run build` produce `dist/theme.xml`; `npm run preview` serves labeled shared-presentation fixtures at localhost:4173. All automated project verification is GitHub Actions-based.

Production templates preserve native Blogger data, Blog1/Header1, labels/comments/pagination. No React, server or database is introduced. The ordinary preview is not a Blogger expression interpreter or live rendering proof.

## Phase 2 branch

Prism 1.30.0 explicit grammars are bundled. Mermaid 11.17.2 is loaded from an exact-pinned jsDelivr ESM URL only for diagram-bearing articles, with strict security, source fallback, bounded zoom and accessible controls. This introduces an optional external runtime dependency; it is not part of the XML byte size. See [technical authoring](docs/TECHNICAL-CONTENT.md) and [audit](docs/UPSTREAM-AUDIT.md).

Vitest was upgraded to patched 4.1.11 after the integrated audit detected an advisory affecting the prior foundation version. All existing tests remain required. New tests use the actual pinned libraries in Actions, not mock-only rendering.

**Not yet accepted:** final actual-library checks, complete adversarial/lifecycle coverage, XML regeneration/consistency and remaining operational documentation. The checked-in XML is still the earlier foundation artifact until the source change is regenerated in Actions. Do not deploy this branch's old artifact as the new technical implementation.

## Staging

`npm run staging:check` validates eight configured native view types. Copy `fixtures/staging-views.example.json`, supply only real staging URLs and the exact imported build, then run through the manual read-only workflow with repository variable FCD_STAGING_MANIFEST_JSON. The workflow does not upload themes or seed posts. Empty configuration is blocked, not passed.

Actual Blogger upload/save, native comments/widgets/Layout, full SEO/performance and human accessibility require separate evidence. Credentials must not be embedded in XML or pasted into chat. Production and merge require explicit approval.

Editorial redesign, related articles, SVG export and other advanced work outside the approved first slice remain deferred. FCD Superpowers and FCD Accessibility Reviewer guide development; their presence is not independent review or autonomous background execution.
