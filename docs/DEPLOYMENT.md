# Staging and deployment boundaries

PRs1-4 are merged without deployment; PR C is acceptance hardening. Never equate green source CI or a merged PR with a Blogger import.

## Artifact selection

Use fresh XML from a complete successful exact-head Actions run, record its full theme-build stamp and digest. Checked-in XML retains its actual generating stamp; CI normalizes only that metadata value for comparison. Any other stale output fails. XML is generated in Actions and transferred only through an explicitly approved source-bound feature-branch operation. Remove temporary write permission before final acceptance.

Only total raw XML is capped at500000 bytes. JS/CSS raw/gzip reports are informational, with no fixed component/growth cap. Optional pinned Mermaid CDN modules are external to XML size and remain a separate supply-chain/availability dependency.

## Metadata acceptance matrix

All views: one meaningful title, no unintended duplicate canonical/description/social fields, safe HTTPS metadata destinations. Non-error views: unique same-origin canonical. Error views may omit canonical; any supplied canonical must still be valid. Article views: exactly one article schema, headline matching article heading and mainEntityOfPage matching canonical. Other views must not carry article schema. When present, authors have valid types/nonempty names, dates are valid ISO timestamps, modification is not before publication, and images are safe URLs. Optional fields are omitted when native values are unavailable. Do not invent dates, image URLs or author profiles. Do not add a second canonical alongside native all-head-content.

home: website metadata; article: article metadata; label/search/archive/paged/static/error: website metadata. Existing robots/search/archive indexing policy is recorded, not changed automatically. This is the FCD acceptance policy, not a statement that every checked field is required for Google eligibility. Rich-results/indexing success is not guaranteed.

The checker parses returned HTML with scripts/resources blocked and enforces a2MB response cap. It does not execute Blogger expressions, fetch image accessibility, certify native widgets, or prove SEO indexing. Duplicate metadata from native all-head-content can only be conclusively assessed on actual rendered Blogger output.

## Owner-assisted native acceptance

1. Export existing theme/content and record widget settings.
2. Owner or explicitly authorized operator imports/saves the chosen XML into a dedicated non-sensitive staging blog.
3. Record blog identity, artifact source/stamp and eight real home/article/label/search/archive/static/error/paged URLs. Configure FCD_STAGING_MANIFEST_JSON with expected visible text for search/static/error, without credentials.
4. Run the existing manual read-only staging workflow. Missing configuration blocks checks. Metadata and visible-content checks must both pass; catalog-as-article/hidden-content safeguards remain.
5. Verify real canonical/social/JSON-LD output, native feed and escaped labels/current identity; inspect actual comments, Layout editor, labels and pagination.
6. Record human keyboard, meaningful alt/diagram descriptions, screen-reader, true browser zoom and print evidence separately. Playwright WebKit is not every Safari/iOS device. Axe alone does not certify WCAG.
7. Measure real staging load/interaction/layout behavior. Synthetic fixture timings/request logs are diagnostics, not field75th-percentile CWV. No analytics installation is implied.
8. Obtain separate production authorization; rollback restores exported XML and widget settings.

No staging import/save evidence or real eight-view configuration is supplied yet. Native platform and production-readiness gates remain pending. Do not modify blog settings, publish posts, deploy or delete branches as part of verification.

## Feed and author policies retained

Public feeds may be Full/Short/Until Jump Break/Custom/None or redirected; private feeds are unavailable. Existing500000 accepted decoded byte/8-second request and bounded retry limits stay in effect. Never silently broaden them because CSS/JS caps were removed. Native latest/topic links remain fallback. Covers are existing author figures using fcd-article-cover, not automatic duplicate images.
