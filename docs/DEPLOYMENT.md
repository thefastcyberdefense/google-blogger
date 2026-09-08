# Blogger staging and release gate

Foundation verification is not production deployment. Keep main and the production blog untouched until separately approved.

1. Select a successful check on the exact PR/source commit. Record artifact ID, source stamp and checksum. Check unit/browser reports and XML/source consistency, not just an old green badge.
2. Export the existing Blogger theme XML and post content; record all Layout widget settings. Store the backup outside public repository history.
3. Seed a separate staging Blogger blog with representative populated, empty/error, technical-table, code, labels and pagination cases. Use non-sensitive data, not upstream personal posts.
4. Upload the generated `dist/theme.xml` using Theme > Restore, save through Blogger and inspect the resulting `meta[name="theme-build"]`. Native import/save evidence must be recorded; no Blogger theme-upload API is assumed.
5. Configure Header1, Blog1, labels/sidebar without cosmetic identity changes. Verify actual homepage/post/label/free-text search/archive/static/error/paginated output, native comments (threaded and unthreaded), feeds and Layout editor behavior.
6. Run staging automation from GitHub Actions. The current `npm run deploy:check` requires `STAGING_URL`, `EXPECTED_THEME_BUILD`, and installed pinned Chromium (`npx --no-install playwright install --with-deps chromium`). It checks exact unique stamp, visible populated publication DOM, usable links and response/destination bounds. It deliberately rejects empty staging unless seeded; it is a smoke check, not a complete page-type acceptance suite.
7. Run actual imported-page browser/a11y/performance checks through Actions before release. Fixtures model native wrappers and share markup but cannot prove Blogger expression evaluation or Google-generated DOM. Human screen-reader/inclusive review and 400% browser zoom remain separate evidence gaps until performed.
8. Request production theme replacement approval only after all release gates pass. If needed, restore the exported theme and recorded widget settings as rollback.

## Table authoring

The foundation contains oversized tables with CSS even when theme JS is disabled. Provide caption and header scope. Add `tabindex="0"` and an informative accessible name to a wide table, or author a named focusable scroll region, for no-JS keyboard access across browsers that do not focus scroll containers automatically. The enhancement supplies a labeled wrapper when JS works. Preserve native table semantics.

## Artifact maintenance

Generated XML must come from Actions, not manual edits. CI normalizes only `theme-build` for checked-in/source comparison; any other mismatch blocks acceptance. A branch-limited artifact transfer may be used for an approved source change, but its writer must be removed before accepting the final head. Normal CI stays read-only. Never label a run successful when only the artifact upload succeeded.

No DNS change, article publication, main-site modification or production import is part of initialization/hardening. Missing staging or human evidence is pending/blocked, not passed.
