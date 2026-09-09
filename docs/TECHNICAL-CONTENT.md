# Technical content authoring and runtime policy

Status: first-slice implementation in PR #2, not yet accepted or released. Do not deploy its checked-in XML as the new implementation until it has been regenerated and verified against source.

## Highlighting

Prism 1.30.0 is bundled with an explicit core/markup/clike/javascript/bash/powershell/python/typescript/sql/json/yaml/docker/http subset. Use `<pre><code class="language-python">...</code></pre>` with HTML-escaped source. Supported aliases include sh/shell, ps1, py, js, ts, yml, dockerfile, xml/html. Unknown languages and blocks over 50,000 characters stay plain. No runtime grammar autoloader, external-file or unescaped-markup plugin is included. Copy controls retain original text before highlighting.

## Diagrams

Use `pre.mermaid` or `pre > code.language-mermaid`. Provide single-line `accTitle:` and `accDescr:`. Original source is retained independently and stays available in an open details section. Configuration frontmatter and init directives are rejected, strict security is enforced and active/external SVG content is rejected or stripped. This is defense in depth around a pinned library, not a claim of universal diagram sanitization.

Mermaid loads only when diagram blocks exist from https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs. This is an optional external dependency: XML import stays one file but diagram rendering requires CDN access. It is not fully self-contained. The ESM bundle imports version-scoped chunks; entry-file SRI does not cover those imports. No SVG download is included.

Example:

```text
flowchart TD
accTitle: Trust boundary
accDescr: Requests cross a policy enforcement point
Client --> Policy
Policy --> Service
```

For timeline periods avoid unescaped clock-colon syntax; the library interprets colon as a separator. Preserve invalid source and fix author syntax rather than silently guessing its meaning.

Limits: 20,000 source characters and 200 edges per diagram; ten auto-rendered diagrams per page, later ones require Render diagram. Oversized source remains readable but is not rendered by bypassing the cap. Zoom is bounded to 100%-250% inside a scroll region. Source normalization is off by default; data-legacy-mermaid=true permits narrowly scoped entity/header normalization. No automatic fabricated accessibility text or identity.

Loading uses a shared promise; a 12-second UI timeout cannot abort ESM import or interrupt synchronous diagram computation. Retries do not create parallel imports. Theme renders are serialized and stale results are discarded. Exact retry recovery, repeated initialization, attack cases and race coverage need final review before completion is claimed.

## Verification

All builds/tests run in GitHub Actions. The actual installed pinned Mermaid distribution is served by request interception in the Actions browser, not replaced by a mock renderer. The preflight matched the CDN entry bytes to npm and identified DOMPurify 3.4.12 in the distribution. Runtime chunk bytes/coverage and a complete final acceptance report remain to be finalized.

Existing foundation tests remain in CI. New tests cover aliases, strict configuration/source boundaries, loader behavior, actual rendering, no-diagram requests, blocked CDN fallback and eight-view staging manifest requirements. Actual Blogger import, human accessibility, complete security/race coverage and final artifact refresh are not yet complete.
