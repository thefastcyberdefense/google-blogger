# PR B: bounded content discovery

Approved 2026-09-09: maximum 28-file manifest, branch feat/fcd-content-discovery, draft PR #4, CSS growth <=2048 raw bytes / JS <=8192 against base 18b127d014e5d02a860603b18f10dd6c7ab81169; XML <=500000. Main baseline passed run 34338858565. No merge/deployment/deletion/publication. Use FCD Superpowers, Ralph, GSD and relevant review skills. All automated execution in GitHub Actions.

## Implemented stories

B1 red contracts: d261c3cbb1aeea70fb019fdbde787c7d9e10b63c, run 34340770222, 129 inherited passes and 14 failing new contracts. Unconnected placeholders establish behavioral failures, not missing-module errors.

B2 model/identity: bounds 50 candidates, 300-character titles, 20 labels of 100 characters, validated optional ID/date. Normalizes known mobile/tracking aliases while preserving meaningful query/path distinctions. parseFeed retains original five-result adapter. No feed bodies retained or HTML inserted.

B3 transport: one shared automatic request plus one explicit shared retry; 8 entries on non-post pages, 50 on post pages; 500000 accepted decoded bytes and 8-second headers/body deadline. Credentials omitted, redirects rejected, streams cancelled, no polling/pagination/persistent storage. Native chunks can exceed remaining allowance before rejection: application cap is not exact wire-byte control.

B4 ranking: current ID/URL excluded, distinct shared labels then valid date then deterministic identity. Up to three genuine matches; no unrelated padding; Latest articles fallback only if no matches. Recent Posts up to five, excluding current post on article views.

B5 presentation: escaped native post-only shell, repeated label context (no comma split), safe text links/date/label, permanent topic/latest links, one local live-status region. No recommendations for static pages or missing current identity. No consumers means no requests. Reinitialization and renderer failure isolated.

B6 clear filter: catalog-only control, focus returned before hide, preserved order/reset/shortcuts/native submission. No full-archive index or recommendation images.

B7 verification: source bed1f1351db1cb5620dcf3680c7ab3567da0b9c3 passed 168 unit/contract and 946 browser tests, zero failures/skips/flaky/pending, in run 34342761242. Typecheck/build/XML contracts/audit/budgets passed. Overall run failed ONLY stale checked-in XML; do not call it green. Six earlier enlarged-text sidebar failures were fixed with minmax(0,1fr), min-width:0 and wrapping retry controls, not weakened assertions. Existing source security contract remained unchanged; shared deadline/byte helpers are used by transport.

B8 XML transfer: verified artifact 10100708711, source bed1f1351db1cb5620dcf3680c7ab3567da0b9c3, digest sha256:edcbe765d1fc5a492ca5b38f5ca7502756ea5df62ebbb8dd651d34f8dc5dec03. Source/job/report/budget/stamp checks preceded XML-only commit 13e5d4220eb95122bc136517e6bd02714779e77d. Temporary write permissions removed; full read-only CI restored. Final exact-head rerun is now required before acceptance; check PR #4 for current outcome. No further implementation approval needed for this closure.

## Measured source budgets

XML 95025 bytes; CSS 15716 versus base 14701 (+1015); JS 56780 versus base 51372 (+5408). Within approved limits. Gzip and final exact-head values appear in Actions artifacts. No dependencies or external discovery service added.

## Remaining gates and scope

Final read-only XML consistency/result still must pass. Source review was sequential, not independent human approval; screenshot production is not a claim of visual approval. Actual Blogger import/save, eight native views, feed settings, comments/widgets/Layout, human accessibility/print, broader browser/field performance remain pending release gates. PR C retains metadata/cross-browser work. Public feed may be private/disabled/truncated/redirected; do not change blog settings automatically.

Native V3/V2/Blog1/Header1/super.main/comments/pagination retained. Only necessary paths within approved maximum touched. Do not merge or deploy automatically.

Evidence: https://github.com/thefastcyberdefense/google-blogger/actions/runs/34342761242/job/102437182398
PR: https://github.com/thefastcyberdefense/google-blogger/pull/4
