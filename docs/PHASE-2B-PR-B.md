# Phase 2B PR B: content discovery

Approved 2026-09-09: maximum 28-file manifest (21 existing/7 new), branch feat/fcd-content-discovery, one draft PR, raw JS growth <=8192 bytes and CSS <=2048 against base 18b127d014e5d02a860603b18f10dd6c7ab81169; XML <=500000. Verified main run 34338858565 passed. Source-bound XML-only transfer is approved on this branch; no merge/deployment/deletion/publication.

Use FCD Superpowers, Ralph and GSD, plus accessibility/code review. All automated builds/tests run in Actions. Skills are workflow adaptations, not native background runners. A self-review is not independent human approval.

## Implementation

The shared model retains bounded title, safe same-origin URL, comparison identity, optional validated Blogger ID, at most 20 labels of 100 characters and optional ISO publication time. At most 50 entries are inspected. Bodies/HTML are not retained. The original parseFeed adapter retains five-item safety semantics.

Comparison identity removes fragments, m=0/1, utm_*, gclid and fbclid; unrelated query data and case-sensitive paths stay distinct. Label keys normalize Unicode NFKC, whitespace and case, with distinct labels counted once. Related ranking excludes current ID or URL, sorts shared-label count then publication date then deterministic identity, and returns at most three. Genuine matches are not padded with unrelated posts; no matches use Latest articles. No safe records means native fallback links.

One controller chooses one shared 50-entry request on native post views or an 8-entry Recent Posts request elsewhere. Related UI is guarded by native data:view.isPost; static pages do not receive the shell. A page without consumers does not fetch. Reinitialization cannot restart controller budgets. Failure in one renderer is isolated from the other.

Transport accepts only the constructed same-origin /feeds/posts/default?alt=json endpoint, omits credentials, disallows redirects, validates HTTP/content type/destination, and reads at most 500000 accepted bytes. The 8-second deadline covers headers and body; oversize/stalled streams are cancelled. One automatic attempt plus at most one shared explicit retry per page, no automatic pagination/polling. Individual network chunks can exceed the remaining application allowance before rejection; this is not a precise wire-byte cap. No persistent caching, external proxy, JSONP or new dependency.

Recent Posts shows at most five and excludes the current post on article views. Related links are text-first with optional label/date, no new image requests. Permanent native topic/latest links survive JS failure. One local live status avoids competing result announcements; retry remains visibly exhausted after its single allowance.

Clear filter exists only for loaded catalog cards and nonempty queries. It focuses the input before hiding itself, restores the original editorial composition/order and preserves native full-publication form submission. Article search does not pretend to filter the archive.

## Story and evidence ledger

B1 behavioral red established at d261c3cbb1aeea70fb019fdbde787c7d9e10b63c: run 34340770222 recorded 129 inherited passes and 14 failing discovery contract tests. Unconnected placeholders were used for executable red assertions, not missing-module errors.

B2-B6 model/identity, transport/retry, ranking, native shell/Recent Posts and clear filter are implemented. Unit tests cover byte boundary, stalled headers/body, redirects, HTTP/schema failures, duplicates/identity/labels/date limits, exact ranking, retry/coalescing and native-shell mutation/escaping controls. Browser tests execute actual compiled runtime with controlled feed responses, including post/static/repeated initialization, unsafe fields, no-JS, enlarged text, print and clear/reset.

The first integrated check found a retained source-level safety contract requiring the deadline and byte limit in feed.ts. Shared signal/byte-limit helpers now remain there and are actually used by transport; the inherited security test was not weakened or edited.

B7 integrated verification/review and B8 XML transfer/final read-only acceptance remain pending until the latest exact-head Actions outcome and artifact provenance are recorded in PR #4. Earlier partial or failed runs are not final passes.

## Acceptance and limitations

The approved B-01 through B-29 preview remains the scope reference. Preserve inherited 129 unit/contract and 792 browser coverage; no dependency or test-matrix changes. New source-level safety checks supplement, not replace, browser behavior. No exhaustive real Blogger or human screen-reader validation is claimed.

The public feed is a bounded recent candidate set, not the full archive. Missing identity disables personalized recommendations. Private/disabled/truncated/redirected feeds may fail; native links remain. No blog settings are changed automatically.

Actual Blogger import/save, labels/identities/feed settings, comments/widgets/Layout, human accessibility/print and wider browser/field performance are separate release gates. PR C retains metadata/cross-browser expansion. Related navigation is omitted from print. No merge or deployment until separately approved.
