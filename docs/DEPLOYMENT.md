# Staging and deployment boundaries

PR #1 through PR #3 merged without deployment. PR B discovery is draft PR #4. Merge and release approvals remain separate; no Blogger import, publishing, DNS changes or deletions are authorized by implementation.

## Artifact

Use XML from the latest complete successful exact-head Actions run. Discovery XML was generated from bed1f1351db1cb5620dcf3680c7ab3567da0b9c3 and committed only after artifact/source/report validation in 13e5d4220eb95122bc136517e6bd02714779e77d. Full read-only CI must confirm consistency, normalizing only historical theme-build metadata. Temporary artifact writers are removed before acceptance. Optional pinned Mermaid CDN bytes remain external to XML.

## Native Blogger checks

Export existing XML/content and record widget settings first. An owner or explicitly authorized operator imports/saves to a dedicated staging Blogger blog. Record blog identity, exact build stamp and eight real view URLs in FCD_STAGING_MANIFEST_JSON. The separate read-only staging workflow validates configured views; it never uploads XML or publishes content. Missing configuration stays blocked.

Check post-only recommendations, canonical post identity, label encoding, current-post exclusion and related/latest/empty/failure states on native Blogger output. Static pages must have no related shell. Confirm native comments, widgets, Layout editor, labels and cursors remain correct. Fixtures are not expression interpreters.

## Feed policy

Public site feeds can be Full, Short, Until Jump Break, Custom, None or redirected. Private blogs do not support public feeds. PR B does not change these settings. Requests are fixed same-origin JSON feed requests, reject redirects, omit credentials and accept at most 500000 decoded bytes with an 8-second deadline. Post candidate count 50; non-post Recent Posts 8; one automatic attempt plus one shared explicit retry. Full feeds may exceed the byte cap: retain native fallback rather than silently increasing limits. No full-archive search claim, JSONP/proxy or persistent cache.

## Human and production gates

Authors may use fcd-article-cover on an existing meaningful figure; no auto-generated duplicate cover. Verify human keyboard, zoom/print and screen-reader behavior separately. Discovery navigation is hidden for print; article technical source remains readable. Record actual Blogger import/save and human results before release. Request explicit production approval after all applicable gates pass. Rollback restores exported XML/widget settings. No credentials in theme or chat.
