# Reuse and limitations

Ledger audit commit: 692a82463cb8d0869a6f5e7c946ecc757cacb7e2. Owner confirmed ownership and reuse permission. Reused/adapted: V3 root contract, compiler pipeline/build stamp/size cap, default Blog super.main bean preparation, Common title include, Blog1 native dispatch, data-view post/body/labels/date patterns and older/newer URLs.

Redesigned: FCD header, home cards, article layout, sidebar, search, theme tokens and footer. Recent posts uses bounded JSON parsing and safe DOM, not cached raw HTML. Personal analytics, identity and publishing scripts are excluded.

Important deviation: native commentPicker delegates to super.commentPicker rather than copying Ledger's explicit full comments suite. This requires actual threaded/unthreaded Blogger staging tests before acceptance. Only reviewed Common and Blog defaultmarkup overrides are currently included; the remaining native widget behavior is inherited, not falsely described as a full port of all Ledger overrides.

Ledger's 98KB enhancement script and extensive 39-rule checker have not been fully ported. Initial source tests are narrower. The new tests do not establish all upstream guarantees, and initial test-first commits were made before a runnable baseline existed; no verified red-green TDD history is claimed.

The main FCD website token source was reviewed, not its private application copied. Exact corporate service/social URLs beyond the root remain unverified, so footer/CTA use only the verified root. Live FCD Blogger audit was waived; real import/render verification remains pending.
