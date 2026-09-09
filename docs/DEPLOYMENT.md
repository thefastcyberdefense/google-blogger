# Blogger staging and deployment boundaries

PR #1 and PR #2 are merged on main without deployment. PR #3 editorial experience remains unmerged. Source verification, merge approval and actual production deployment are separate decisions.

## Artifact selection

Use the fresh XML artifact from the latest successful exact-head Actions run, and record its full theme-build stamp. PR #3's committed XML was generated from source 388660f8e5fdb9ebb8b44f03b882748ae9b021c7 and transferred in commit 2c74454f9321c2764445c160790cd302e1fdc3a8 after source/report/budget checks. Ordinary read-only CI compares it against fresh compilation, normalizing only the historical stamp. No other content mismatch is allowed.

The Actions artifact includes reports, screenshots and size evidence. Optional exact-version Mermaid ESM is external to XML bytes; verify readable-source fallback when CDN loading is blocked. XML is not a promise of fully self-contained diagrams.

## Author-controlled covers

To use a cover, apply class fcd-article-cover to an existing in-body figure with a meaningful image alternative and optional caption. The theme does not synthesize a duplicate hero, scrape, move or remove images. Authors control whether an above-fold body image should be eager; do not blanket-prioritize all images. Print removes navigation/toolbars/promotional chrome; author content and technical-source readability still need human review.

## Owner-assisted staging sequence

1. Export existing XML/content and record Layout widget settings before changes.
2. Use a dedicated Blogger staging blog with non-sensitive representative content. Public feed-dependent tests require compatible feed settings.
3. Owner or explicitly authorized operator imports and saves the selected XML. No automated Blogger import is claimed or authorized by a CI run.
4. Configure repository variable FCD_STAGING_MANIFEST_JSON from fixtures/staging-views.example.json using real home/article/label/search/archive/static/error/paged URLs, exact build stamp and expected visible content for search/static/error. Do not include credentials.
5. Run the separate manual read-only workflow on the trusted ref. Missing configuration blocks checks; it never seeds posts, imports XML, deploys or merges.
6. Record actual native comments, labels, cursors, feeds and Layout editor behavior. Confirm lead/secondary roles on initial homepage only, no duplicated posts, meaningful image alternatives and no duplicated author covers.
7. Record human keyboard, zoom/print and screen-reader checks separately from automated Chromium/axe results.
8. Request explicit production release after all gates pass. Restore exported XML/widget configuration if an approved deployment needs rollback.

Actual staging URL/import/save evidence has not been supplied. Simulated fixtures and mocked HTTP responses are not actual Blogger-rendering evidence. Keep production unchanged until separately approved. Never paste passwords or secrets into XML or chat.
