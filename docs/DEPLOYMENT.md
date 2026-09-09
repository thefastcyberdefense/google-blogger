# Blogger staging and deployment boundaries

The foundation is merged on main; Phase 2 is an unmerged feature branch. Neither merge nor production deployment is authorized by technical-content verification.

## Build and artifact

Use the exact successful Actions source SHA. Download its regenerated `dist/theme.xml`; validate its full `theme-build` stamp. CI compares committed XML to a fresh build, normalizing only the historic build-stamp value. No other mismatch is accepted. Optional Mermaid assets are exact-version jsDelivr ESM modules, not included in XML bytes; block CDN access to verify readable-source fallback before production.

## Staging workflow

1. Export the existing Blogger XML/content and record Layout widgets before any live change.
2. Create/use a dedicated staging Blogger blog with non-sensitive representative posts and page types.
3. Owner or explicitly authorized operator imports and saves the XML through Blogger. No theme upload API or automated import is claimed.
4. Copy the structure in `fixtures/staging-views.example.json` into repository variable `FCD_STAGING_MANIFEST_JSON`, using real URLs for home/article/label/search/archive/static/error/paged, exact source build and expected content for search/static/error. Keep credentials out; current workflow supports public read-only views.
5. Run **Read-only Blogger staging checks** manually after the workflow is available on the selected trusted ref. It installs the locked dependencies and Chromium, writes variable data to a temporary JSON file, and calls `npm run staging:check`. It cannot seed posts, import XML, deploy or merge.
6. Missing origin/build/view URLs block validation. The checker requires same-origin HTTPS, one of every view type, expected HTTP statuses (404 for error), exact metadata stamp and view-appropriate native content/metadata. Empty search/error/static views use expected text rather than a fabricated populated-post assertion.
7. Record actual import/save and native threaded/unthreaded comments, feeds, Layout editor and page-type behavior. Automated smoke checks do not replace those acceptance records or human screen-reader/zoom checks.
8. Request explicit production deployment only after all release gates pass. Rollback restores exported XML and widget configuration.

All automated project checks remain Actions-based. Main and production stay untouched during PR #2. No staging URL/import evidence has been supplied, so the real checkpoint is pending, not green. Simulated HTTP tests are separate and labeled.

For no-JS wide tables use caption/header scopes plus `tabindex="0"` and an accessible name where keyboard scrolling must work across browsers. Diagram source fallback stays keyboard-focusable when enhancements initialize; no-JS author markup must remain plain readable code.
