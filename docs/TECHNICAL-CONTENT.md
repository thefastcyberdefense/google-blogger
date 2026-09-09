# Technical content authoring and runtime policy

Phase 2 first slice, draft PR #2. Acceptance requires the complete Actions check on the exact PR head, including generated XML consistency. A passing fixture suite does not mean the Blogger theme has been imported or deployed.

## Highlighting

Prism **1.30.0** is bundled with core/markup/clike/javascript/bash/powershell/python/typescript/sql/json/yaml/docker/http. Use `<pre><code class="language-python">...</code></pre>` with HTML-escaped source. Aliases: sh/shell, ps1, py, js, ts, yml, dockerfile, xml/html. Unknown languages and blocks over 50,000 characters remain plain. No grammar autoloader, external-file or unescaped-markup plugin. Copy text is captured before highlighting; output is restricted to Prism span/text nodes and must match the original text.

## Diagrams

Use `pre.mermaid` or `pre > code.language-mermaid`. Provide meaningful single-line `accTitle:` and `accDescr:`. Source is retained separately from rendered SVG and remains visible in a details section. Original source and diagram viewport both have accessible names and keyboard focus. Rendering errors never hide the original source.

Example:

```text
flowchart TD
accTitle: Trust boundary
accDescr: Requests cross a policy enforcement point
Client --> Policy
Policy --> Service
```

Configuration frontmatter and init directives are rejected. `securityLevel: strict`, no HTML labels, maximum 200 edges and secure configuration keys are imposed by the theme, not post data. Generated SVG is checked for active elements/event handlers and external references; this is defense in depth around the audited library, not a universal sanitizer guarantee. No callbacks or SVG export/download are provided.

Mermaid **11.17.2** loads only on diagram-bearing pages from:
https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs

This is an optional third-party runtime dependency. Blogger imports one XML, but rendering diagrams requires the version-scoped ESM entry/chunks. XML size does not include those requests. There is no claim that entry-file SRI authenticates all dynamic chunks. The dependency remains exposed to CDN availability/supply-chain risk, explicitly accepted in the first-slice preview.

Limits: 20,000 source characters per diagram; ten auto-rendered diagrams, later blocks require explicit Render diagram. Oversized source stays readable but does not bypass its size cap on click. Zoom/reset stays within 100%-250% in a local scroll region. Above-limit and unknown languages are not fetched dynamically.

The loader deduplicates imports. Its 12-second UI timeout does not cancel import() or interrupt synchronous diagram processing. Retry is explicit; rejected network imports may be retried, but browser module caching can retain failures and a reload may be needed. An unresolved import remains single-flight after UI timeout. No unbounded automatic retry.

Render operations are serialized; latest theme changes supersede stale output. `aria-busy`, rendered/error states and current rendered theme are explicit. Repeated initialization does not duplicate controls; disconnected diagram state is cleaned when revisited. Original author source remains unchanged across re-rendering.

Legacy entity/header normalization is off by default; `data-legacy-mermaid="true"` enables a narrow migration path, not syntax guessing or security sanitization. Timeline periods cannot contain an unescaped separator colon, so use named periods such as Detection phase rather than raw `09:00`.

## Verification and author responsibility

Actions tests render the actual exact Mermaid distribution via intercepted version-scoped module requests, with no mock renderer. Core and negative-path tests cover languages, source preservation, copy payload, repeated initialization, blocked imports, malformed/oversized/configured diagrams, unsafe links, theme changes during loading, keyboard source access and axe checks. Staging-tool tests exercise eight mocked HTTP view responses with positive/negative cases; these are not actual Blogger results.

Preflight compared the CDN entry with npm and identified bundled DOMPurify **3.4.12**. Integrated audit additionally required upgrading foundation Vitest to patched **4.1.11**. All current dependency audit gates remain mandatory. Rendered library request URLs/byte totals and screenshots are attached to Actions reports.

This slice does not certify all possible Mermaid syntax or all browsers. Only Chromium is in the existing matrix. Input caps mitigate but do not impose a hard CPU deadline on a main-thread parser. Author-provided descriptions are checked for presence, not semantic quality. Human accessibility, actual Blogger import/runtime/native widgets and wider browser/performance evidence remain separate release gates.
