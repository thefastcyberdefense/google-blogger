# Reuse, verification and limitations

Ledger audit commit: 692a82463cb8d0869a6f5e7c946ecc757cacb7e2. Owner confirmed ownership and reuse permission. Reused/adapted: V3 root contract, compiler pipeline/build stamp/size cap, default Blog super.main bean preparation, Common title include, Blog1 native dispatch, data-view post/body/labels/date patterns and older/newer URLs.

Redesigned: FCD header, cards, article layout, sidebar, search, theme tokens and footer. Recent posts uses bounded JSON parsing and safe DOM, not cached raw HTML. Personal analytics, identity and publishing scripts are excluded.

## Three PR #1 review blockers: remediation

The reviewed source was 39737d77bb7e0065d549935c056a139a57dfffd9. The user approved a 15-file remediation batch while keeping main untouched.

### URL validation

The old serialized character class rejected literal hyphens and missed most control characters. The corrected validator uses character-code checks (0 through 31, plus 127), retains HTTPS/same-origin/no-credentials checks, and accepts hyphenated Blogger slugs and staging hostnames. Unit tests cover every control-character code, relative/absolute hyphenated links and multi-entry feeds. Browser feed fixtures now use three realistic hyphenated permalinks.

### Deployment inspection

The old global substring checks could accept CSS-only pages. tools/deploy-check.ts now parses HTML in Chromium with page JavaScript disabled and all resource requests blocked. It requires exactly one matching head meta[name=theme-build], a visible main landmark and either a visible nonempty article/title or a catalog with visible populated same-origin article links. Empty staging is not silently passed. Redirected, non-2xx, unexpected-destination and login responses are rejected, and response size/time are bounded.

The checker requires the existing pinned Playwright Chromium installation: in Actions, run `npx --no-install playwright install --with-deps chromium` before `npm run deploy:check`. No new dependency was added. The CLI tests mock fetch in isolated child processes and parse the resulting HTML with Chromium; they do not contact a real staging blog. Production scripts and remote styles are not executed by this smoke check; full live interaction testing is still separate.

### Presentation parity

src/partials/presentation.pug now owns header, brand/search controls, cards, byline, article shell and share/CTA markup for both production and fixtures. Blogger expressions and widget declarations remain explicit boundaries; this is not a fabricated Blogger expression interpreter.

Fixtures model Header1/Blog1/section/post wrappers, two image and two imageless cards, the is-single article body class, pagination, empty and error views. Structural tests compare compiled production XML and parsed fixture DOM for header controls/wrappers, image attributes, card slots, article heading and body container. A temporary negative-control mutation removes the shared production search label and verifies the fixture accessibility contract rejects it. Temporary copies are discarded; repository source is not mutated during that test.

Wrappers are still modeled, not captured from a real Blogger import. The parity gate reduces source/fixture drift but cannot prove Google's runtime markup or expression evaluation. The remainder of the footer/sidebar/topic/empty-state simulation still has explicit fixture data; no claim of universal structural equivalence is made.

## Evidence

Failing baseline: https://github.com/thefastcyberdefense/google-blogger/actions/runs/34252776585/job/102151027708

At 7cf2a65226ca552255d1a120abe8f55f7106ef57, Actions recorded 19 passing and 44 failing unit/contract regressions, including incorrect URL acceptance/rejection, false deployment passes, article state and native-wrapper fixture omissions. These failures were assertions, not missing dependencies.

Green implementation: https://github.com/thefastcyberdefense/google-blogger/actions/runs/34253362294/job/102152940018

At 677a596283ac20d3c15f689ec4236fdd8c4987a1, Actions passed 65 unit/contract and 330 browser tests, with zero failed/pending unit tests and zero skipped/unexpected/flaky browser tests. Install, typecheck, build, XML contracts and moderate-or-higher dependency audit gate passed. An intermediate shared-attribute escaping error was caught by XML validation and corrected using normal escaped Pug attributes; no check was weakened.

Corrected XML was transferred from that successful Actions artifact, with its exact source stamp checked, and committed as 82311939f06da7257aeec9d3dbcc973a561fd151. Normal CI is read-only again and compares checked-in XML with a fresh build while normalizing only the build-stamp value. Later commits must obtain their own successful checks; the linked run does not attest to future revisions. Screenshots and full machine-readable reports remain in Actions artifacts.

All automated project tests/builds ran in GitHub Actions. No local automated project testing, merge or production deployment was performed.

## Remaining release gates

Native commentPicker delegates to super.commentPicker instead of copying Ledger's explicit comments suite. This still requires actual threaded/unthreaded Blogger staging validation. Only reviewed Common and Blog defaultmarkup overrides are currently included; other native behavior is inherited, not claimed as a full override port.

Ledger's large enhancement script and extensive 39-rule checker have not been fully ported. Initial source tests are narrower. The original initialization did not have demonstrated red-green history; the linked new blocker regressions do.

Actual Blogger import/save, page-type/native-widget rendering, broader SEO, advanced article features, performance and human accessibility remain pending. The main website's brand source was reviewed, not copied; only verified root company links are used. The inaccessible live-blog audit waiver does not waive future staging validation.
