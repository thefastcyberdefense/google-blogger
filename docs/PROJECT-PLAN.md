# FCD development plan

## Current L1 native-shell checkpoint (2026-10-03 Asia/Dhaka)

### Dated status note

This note supersedes the 2026-10-01 L1 checkpoint directly below and the present-tense status in every older section; they remain dated history and none of their evidence is rewritten. Main is unchanged at **`ad5e5d9e3e17089ea39d3c62e065d829dd97f235`**. Every L1 story through US-014 is source-verified on `feat/fcd-l1-native-shell` in [draft PR #14](https://github.com/thefastcyberdefense/google-blogger/pull/14), which stays a draft and unmerged.

The last source head is **`f812ef22c4cd92e4d96e949ac038d480e17fea1b`**. [Run 37110232904](https://github.com/thefastcyberdefense/google-blogger/actions/runs/37110232904/job/111166534189), attempt 1, passed every stage including the restored stale-XML check: **492 unit/contract cases and 1,784 browser cases (N1 240, N2A 1,038, N0-only 506)**, zero unexpected, skipped, flaky or retried, the N1 summary accepted with 1,802 contexts and 1,278 discovered owners, and 23 notices with no warnings or errors. Its theme artifact `fcd-theme-f812ef22c4cd92e4d96e949ac038d480e17fea1b` holds a 115,943-byte XML (sha256 `1ef8368a09d7d7993df4ff7b4ab49815b538b8e82fc6c856b249e20ffe163f6b`), 23% of the 500,000-byte cap. The checked-in XML comes from the transfer bot commit `029c57c` and differs from fresh output only by its build stamp. The records commits after `f812ef2` change docs only; their exact-head run is recorded in PR #14.

### Owner decisions since 2026-10-01

- **2026-10-02, search:** FCD's own `#site-search` is the single masthead search; the theme gives a saved Blog Search gadget no search presentation and the owner deletes it in Layout at the native checkpoint.
- **2026-10-02, design v1 approved:** the shell becomes four Layout-editable regions (Navigation, Intro, Call to Action and Footer gadgets) delivered in the order L1-nav, L2-intro, L3-CTA, L4-footer, then design tokens and components. B1 is no longer a blocker; it becomes a quick check before upload.
- **2026-10-02, CI additions:** a downloadable theme zip artifact, annotation hygiene and the `ubuntu-24.04` runner pin (US-008 to US-010). Every gate, threshold, population, permission and action pin is unchanged.
- **2026-10-03, focus:** theme design and functionality first, with lean tests that prove the design rather than growing test infrastructure.

### Story state since 2026-10-01

Every transfer reused the reviewed US-006 pattern with only its comment changed, every bot commit touched only `dist/theme.xml`, and every restore returned `ci.yml` to blob `5d8081ee24f562444104675e4dfd8d88e56883b2` exactly.

| Story | Red | Green | Transfer, bot, restore and final run |
| --- | --- | --- | --- |
| US-004b gadget homes, test-first | `e6e6b46`, [37044880789](https://github.com/thefastcyberdefense/google-blogger/actions/runs/37044880789): 463 passed, 3 failed (C3, C4, C5) | `d2951ca`, `6729340` | `98b1e94` ([37045989151](https://github.com/thefastcyberdefense/google-blogger/actions/runs/37045989151)), bot `0ca312f`, restore `80ab3d3` ([37048395261](https://github.com/thefastcyberdefense/google-blogger/actions/runs/37048395261)): 466 unit, 1,784 browser |
| US-008 theme zip artifact | before: only the evidence artifact | `dc6f817`, zipped in `5b5db3c` | [36994476778](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36994476778): `fcd-theme-<sha>` zip holding only the XML |
| US-009 annotation hygiene | 17 warnings at [36965694584](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36965694584) | `5b5db3c` | [36994476778](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36994476778): 0 warnings |
| US-010 runner pin | `ubuntu-latest` migration notice | `9fd46f1` | [37028886801](https://github.com/thefastcyberdefense/google-blogger/actions/runs/37028886801) on `ubuntu-24.04`, notice gone |
| US-011 L1-nav | `502b822`, [37054390299](https://github.com/thefastcyberdefense/google-blogger/actions/runs/37054390299): 468 passed, 4 failed (C6 and three navigation-layout checks) | `6b7ac9c` | `9c781bc` ([37088503721](https://github.com/thefastcyberdefense/google-blogger/actions/runs/37088503721)), bot `ad16c28`, restore `3d5409d` ([37090077928](https://github.com/thefastcyberdefense/google-blogger/actions/runs/37090077928)): 472 unit, 1,784 browser, XML 109,174 bytes |
| US-012 L2-intro | `eacfdd9`, [37095950269](https://github.com/thefastcyberdefense/google-blogger/actions/runs/37095950269): 474 passed, 5 failed (C7 and four intro-layout checks) | `c2efffd`; test-only fix `1877edd` | `7860107` ([37096811376](https://github.com/thefastcyberdefense/google-blogger/actions/runs/37096811376): 478 passed, 1 failed, the negative-control defect below), then [37097206981](https://github.com/thefastcyberdefense/google-blogger/actions/runs/37097206981) at `1877edd`, bot `4c9687f`, restore `29bf93f` ([37098602820](https://github.com/thefastcyberdefense/google-blogger/actions/runs/37098602820)): 479 unit, 1,784 browser, XML 112,498 bytes |
| US-013 L3-CTA | `b2a9a9a`, [37100736525](https://github.com/thefastcyberdefense/google-blogger/actions/runs/37100736525): 481 passed, 5 failed (C8 and four cta-layout checks) | `73d33cd` | `d3c446a` ([37102573412](https://github.com/thefastcyberdefense/google-blogger/actions/runs/37102573412)), bot `a792646`, restore `3d423c4` ([37103772911](https://github.com/thefastcyberdefense/google-blogger/actions/runs/37103772911)): 486 unit, 1,784 browser, XML 114,028 bytes |
| US-014 L4-footer | `4f7913b`, [37105773321](https://github.com/thefastcyberdefense/google-blogger/actions/runs/37105773321): 488 passed, 4 failed (C9 and three footer-layout checks) | `26990a5` | `6098c11` ([37109007493](https://github.com/thefastcyberdefense/google-blogger/actions/runs/37109007493)), bot `029c57c`, restore `f812ef2` ([37110232904](https://github.com/thefastcyberdefense/google-blogger/actions/runs/37110232904)): 492 unit, 1,784 browser, XML 115,943 bytes |
| Records | n/a | this commit and the two before it | docs only |

Every red run failed exactly the new checks it predicted; all mutation controls and inherited tests passed. The 2026-10-01 rows for US-004 (blocked on B1), US-006 and US-007 are superseded: US-004 shipped without a failing-first test and was redone as US-004b, and US-006 and US-007 completed as recorded in PR #14.

### What design v1 delivered

- **US-011 L1-nav:** locked LinkList1 in a `navigation` section inside the theme-owned `#primary-navigation`; saved links render in the owner's order, with design v1 defaults until any are saved. Contract C6 plus navigation-layout checks.
- **US-012 L2-intro:** on the first home page an ink band holds the theme-owned `h1#intro-heading`, locked HTML1 in an `intro` section (saved copy first, the standfirst otherwise) and the Topics section; every view keeps one h1. Contract C7 plus intro-layout checks.
- **US-013 L3-CTA:** `aside.cta-band` between the content and the footer on every view with locked HTML2 in a `cta` section; the in-article call to action is gone. Contract C8 plus cta-layout checks.
- **US-014 L4-footer:** the brand and locked HTML3 in a `footer` section beside theme-owned links, then a base row with the copyright and the native Attribution and Report Abuse gadgets; no footer headings. Contract C9 plus footer-layout checks.

The layout checks apply the shipped `b:skin` CSS to the shared fixtures without theme JavaScript and add no browser titles, so the browser populations stay 1,784. Section and widget names, and every Header1, Blog1 and Label1 behavior, are unchanged; the new ids are sections `navigation`, `intro`, `cta`, `footer` and widgets LinkList1 and HTML1 to HTML3. See [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) for the regions and copy rules and [UPSTREAM-AUDIT.md](UPSTREAM-AUDIT.md) for Ledger reuse.

### Disclosed deviations

- **US-012 negative control:** its first version looked for the band rule as verbatim source text, which the Sass-compressed skin spells differently, so run 37096811376 failed one test while every intro behavior check passed. Test-only commit `1877edd` finds the rule by selector and property; later controls follow the same method. No theme change.
- **Red-run reasons:** job logs are not publicly readable, so each red reason is taken from the failing test titles in the run annotations, with unchanged source and passing sibling and mutation tests.
- **US-013:** the in-article call to action was removed and mixin `fcdShareAndCta` renamed `fcdShare`; the article keeps its share actions.
- **US-014:** the copyright has no year, so it never goes stale; "Back to content" became "Back to top" (`#top`, the HTML top-of-document fragment); the old footer note line became the blurb.
- **Fixtures:** the shared mixins model each gadget's default copy. How Blogger renders saved gadget copy is not proven here.

### Gates and next action

Native gates stay with the owner, following [DEPLOYMENT.md](DEPLOYMENT.md): the B1 quick check including free ids LinkList1 and HTML1 to HTML3, deleting the saved Blog Search gadget, the four new gadgets in Layout, home page 2 for `data:newerPageUrl` outside Blog1, saved-gadget reconciliation, upload-prompt observation, the rendered build stamp, and human keyboard, screen-reader and zoom review (R2). No candidate is selected, the verifier stays pinned to historical `9a6f484`, and no Blogger upload, Layout change, gadget deletion, publishing, settings, DNS, merge or ready transition is authorized. Agents make no automated requests to https://blogs.fastcyberdefense.com/.

**Next action:** the design tokens and components story (cards and the signal line) on PR #14, test-first with one reviewed transfer cycle; then the native checkpoint whenever the owner chooses.

---

## Historical L1 native-shell checkpoint (2026-10-01 Asia/Dhaka; superseded 2026-10-03)

### Dated status note

This note supersedes the present-tense status in every section below. Those sections remain dated history; none of their evidence is rewritten. On 2026-10-01, main is **`ad5e5d9e3e17089ea39d3c62e065d829dd97f235`**, the owner-approved merge of [PR #13](https://github.com/thefastcyberdefense/google-blogger/pull/13) (N2A source acceptance `19b8821c58c45e4d0b48f6599fe44056ddcb6d4f` onto `457ae985`). [Post-merge run 36586048928](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36586048928/job/109466535788), attempt 1, push/main, completed 2026-09-29 15:08 UTC with every stage successful: **450 unit/contract cases and 1,674 browser cases (N1 240, N2A 928, N0-only 506)**, zero unexpected, skipped, flaky or retried. The `feat/fcd-n2a-guard-adoption` branch is absent after the merge; the owner accepted that deletion and no restoration is planned. Wording below that calls `457ae985`, `312954b6`, `ecb1d438` or `e1e7bb3` current main, PR #13 unmerged, or `44dd85c` the latest checkpoint is historical as of its own date.

### L1 scope, approval and identity

The owner approved **FCD-L1-SHELL-CONTRACT-v1** (labels L1-regression and L1-shell, stories US-001 to US-007) on 2026-09-29 for `feat/fcd-l1-native-shell` from `ad5e5d9`, tracked in [draft PR #14](https://github.com/thefastcyberdefense/google-blogger/pull/14). It addresses the shell problems in the owner's production screenshot (saved gadgets stacked in the masthead, an oversized Blogger logo, a misaligned Theme button and an empty framed sidebar box) without hiding native content, renaming sections, widgets or classes, or changing Blog1, Header1 or Label1 behavior or the editorial arrangement.

FCD Blogger is the Fast Cyber Defense identity and branding edition of the owner's Ledger theme concept. Both projects belong to the same owner: Ledger is his personal project and Fast Cyber Defense is his solely owned company. On 2026-10-01 he named [Ledger v1.7.0](https://github.com/redwan-cse/ledger-blogger-theme/releases/tag/v1.7.0) (`a3da05a8a70243c6ffc239b0e96e88260ed7b536`) as the source concept and asked for LICENSE to say so. That LICENSE update is an owner-approved addition to the contract's file manifest; see [UPSTREAM-AUDIT.md](UPSTREAM-AUDIT.md).

### Story state

| Story | Commits | Evidence and state |
| --- | --- | --- |
| US-001 fixtures and failing regressions | `de37c8b` to `f0e989a`; repair `0c3ad33` | Run 36753875460 at `f0e989a` was a setup failure (adoption-test counts not updated), not red evidence. Behavioral red [36811297221](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36811297221) at `0c3ad33`: 1,696 expected and 88 unexpected browser rows, consistent with the four new native-shell titles T0 to T3 across 22 Chromium projects; T4 and every inherited row passed. |
| US-001b static contracts C1 and C2 | `beb3492` | Red [36812898882](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36812898882): 453 passed and 3 failed (C1, C2 and the C2 logo mutation control), as predicted. |
| US-002 masthead | `33aa3e6` | [36813382079](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36813382079): 456 unit/contract cases passed; 1,762 of 1,784 browser rows passed, and the only failures were the 22 T2 sidebar rows owned by US-003. |
| US-003 sidebar chrome | `a209484` | Green [36821652522](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36821652522/job/110238320165): 456 unit/contract cases and 1,784 browser rows passed (N1 240, N2A 1,038, N0-only 506), zero unexpected, skipped, flaky or retried; both finalizers accepted and audit passed. The stale-XML step failed as expected until US-006. |
| US-004 explicit destinations | none | **Blocked on input B1**, the live widget inventory (saved widget ids, types and sections). The Ledger Layout screenshots the owner shared are design reference, not B1. |
| US-005 records and LICENSE | `302d77a` and this commit | Docs and LICENSE only. |
| US-006 XML transfer and restored CI | pending | The only run that establishes L1 source verification. |
| US-007 reviews and PR handoff | pending | Sequential self-review, disclosed as not independent. |

Two sequencing deviations are disclosed. The static C1 and C2 checks arrived in their own red commit (US-001b) because a failing unit stage skips the render stage. Owner direction on 2026-10-01 narrowed US-003 to a CSS-only change in `src/styles/layout.scss`, using T2 as its already-failing test: the native section no longer draws its own frame, and Blogger's empty `no-items` section is hidden on public pages only (`body:not(#layout)`). The planned C3, C4 and P2 checks and the data-conditional `has-items` archive card (S4) were not delivered, so a populated archive renders without a card frame until a follow-up story. The `b:template-skin` editor rules are unchanged and no static check covers editor visibility.

Measured populations: N2A 1,038 (from 928), browser total 1,784, contexts 1,802 and 1,278 discovered owners; N1 240 and N0-only 506 are unchanged. The checked-in XML keeps its historical stamp until the transfer. Exact-head runs, artifacts and review records belong in PR #14, not in this ledger.

### Gates and next action

Open source gates: the US-006 transfer, then a restored-CI exact-head run with every stage green including the stale-XML check, then US-007 reviews. Native gates stay with the owner: B1, upload-prompt observation, where kept gadgets land, the rendered build stamp, the Layout editor, and human keyboard, screen-reader and zoom review. No candidate is selected, the verifier stays pinned to historical `9a6f484`, and no Blogger upload, Layout change, gadget deletion, publishing, settings, DNS, merge or ready transition is authorized. Agents make no automated requests to https://blogs.fastcyberdefense.com/.

**Next action:** complete US-006 and US-007 on PR #14 and stop at the draft PR. US-004 resumes on the same branch, with its own red, green and transfer cycle, when the owner supplies B1.

---

## Historical N2A implementation and reporting handoff (2026-09-29 Asia/Dhaka; superseded 2026-10-01)

This section supersedes every present-tense status and prospective instruction in the preserved historical snapshots below. The approved main baseline is **`457ae98576d2ed101bc9efcba50022d915bf29b8`**, the verified PR #12 merge. N2A work stays on **`feat/fcd-n2a-guard-adoption`**, [draft PR #13](https://github.com/thefastcyberdefense/google-blogger/pull/13), **unmerged with the branch retained**. The latest fully verified implementation checkpoint is **`44dd85cdba038403c9db63b10d51ff4f05e9f620`**. This reporting/ledger commit must receive its own exact-head Actions and review; the PR records that resulting SHA/run after execution, not a self-referential pass asserted before this commit exists.

### Accepted baseline and exact approval

B0+N0, U0, N1 source acceptance and Errata v2 reporting R1-R6 are closed. [PR #12 post-merge run 36345776255](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36345776255/job/108694498836), attempt 1, verified the actual merge on 2026-09-27 at 20:04:44 UTC: all 21 stages, **297 unit/contract cases and 1674 browser cases**, no failed/pending/unexpected/skipped/flaky/retried outcomes, both N0/schema-1 finalizers, audit and XML consistency. Post-merge [CodeQL 36345775163](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36345775163) succeeded. The N1 branch was retained immediately after merge and post-merge verification but was absent from the later N2A planning listing; no deletion cause or restoration is inferred or authorized.

The owner explicitly approved **FCD-N2A-APPROVAL-v1**, 53403 bytes, SHA256 **`54b37650a4243ada790ab06af2d8b22b4a3e60a1f55ec6ed887e8b7b82cb6419`**, based on the exact merge above. Approval covers the seventeen-file maximum manifest and this PR description, including necessary in-scope fixes, Actions verification and this existing ledger. Planning language was not consent; the explicit owner approval was. The packet's phrase about 297 inherited assertions means **297 inherited test cases and every assertion within them**, not permission to reduce their assertion count.

| Approved paths | Purpose |
| --- | --- |
| `docs/PROJECT-PLAN.md`, `.github/workflows/ci.yml` | Current ledger; bounded reporting inside existing stages |
| `tests/helpers/browser-network.ts`, `isolated-test.ts`, `browser-network-reporter.ts`, `browser-network-scope.ts`, `render-fixtures.ts`, `guarded-axe.ts` (all under `tests/helpers/`) | Guard, canonical identities, runner ownership, indexed evidence, finite local plans, owned normal axe |
| `tools/finalize-browser-network.ts` | Schema-2 reconciliation and truthful complete evidence |
| `tests/unit/browser-network.test.ts`, `tests/unit/browser-network-adoption.test.ts` | Inherited controls and compatibility/source/capacity regressions |
| `tests/render/network-isolation.spec.ts`, `a11y.spec.ts`, `interactions.spec.ts`, `native-states.spec.ts`, `responsive.spec.ts`, `publication-acceptance.spec.ts` (all under `tests/render/`) | Existing N1 and five adopted consumers without reduced coverage |

After this ledger addition, sixteen approved paths differ from main; `tests/render/network-isolation.spec.ts` remains byte-identical, Git blob `6938d3551f98a93e760adbeb0e8eb3012f2eb34d`. The reporting follow-up changes only the existing workflow and this ledger. Product source, fixture producers, checked-in XML, packages/lockfile/pins, all test configs, N0 wrapper/probe, artifact verifier/contracts/workflow, staging/deployment checker/workflow, upstream audit and deployment documentation remain outside the N2A diff. Do not restore `docs/fcd-env-example`.

### Implemented compatibility and adoption

N2A-01 through N2A-06 are implemented and full-matrix verified at `44dd85c`. Schema **2**, policy **`n2a-v1`**, uses canonical stage/file/full-title-path/project/repeat ownership, complete indexed discovery/results and paired context records. N0 remains the connectivity boundary; browser guards provide bounded attribution and fixture policy, not universal browser-internal/Node-network coverage or a hostile-code sandbox.

Finite owner-selected plans serve immutable local HTML and the installed pinned Mermaid entry/flowchart/dagre closure. Exact origin/path/query/method/resource, digest/length, distinct/cumulative byte budgets, forward phases and one-time bounded release gates remain enforced. No URL-derived file reads, external forwarding, arbitrary response callbacks or runtime network access was added. The fixture default is now inherited through `base.extend({serviceWorkers:'block', ...})`; explicit invalid option rejection remains strict.

Normal pinned AxeBuilder retains both a11y scans, all tags, frame coverage and complete result structures. Guard-owned aggregation leases observe and finalize only their own pages before close; the primary stays active. Broad storage-failure mocks remain unchanged; only unnecessary receipt reads are avoided, while genuinely missing retirement evidence still fails. Native-state serialization is whitespace-compacted with structural equality, not truncated. Single-context no-JS cases use runner-owned contexts; publication fallback keeps its genuine second guarded no-JS context and real feed abort. Publication also retains real Mermaid render/blocked reload, controlled completion and displacement measurements. No product/UI redesign or upstream runtime import occurs in this test-infrastructure slice.

All five consumer migrations retain titles, browser selection, assertions, full axe evidence, explicit attachments, viewport/theme/no-JS behavior, exact search/recovery semantics, HTTP 503 versus network-abort distinctions, screenshots and failure controls. Bounded AST/call-site checks reject representative raw factories/routes/HAR/forwarding/unguarded axe/import bypasses, with a narrow unchanged N1 low-level exception. They do not claim to defeat arbitrary malicious reflection.

### Meaningful failures and corrections

The PR retains the full commit/run history rather than replacing failed checkpoints. Representative gates:

| Evidence | Actual result and disposition |
| --- | --- |
| Ownership/response foundations through `dd0099d`, `3af9cc6`, `4beef293` | Runnable ownership, response-ledger and raw encoded-path regressions preceded fixes; complete accepted checkpoints recorded in PR #13 |
| Axe/storage controls at `815b50bc`, corrected through `a265488` | Six actual lifecycle failures reproduced; normal scans/storage assertions preserved; frozen-lease test-adapter repair was a separate setup correction |
| Extra primary/missing-plan controls, verified at `68fa1c8` | Three real false-green regressions corrected; 402 units/1674 browsers passed, but only 240 adopted owners, explicitly N2A-incomplete |
| [Adoption red 36457905472](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36457905472/job/109048849197) at `9f28acf` | 425 passes/seven failures: five unguarded consumers plus wrong required JS mode and absent actual primary page |
| [Incomplete adoption 36461260508](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36461260508/job/109060092223) at `b45481c` | 440 passes/ten failures; rejected missing consumer/synthetic population; browser stage not reached |
| [Full-adoption red 36462968118](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36462968118/job/109066070232) at `36a53c7a` | 450 units passed; 1275 browser passes/399 unexpected; both finalizers rejected |
| [Fixture fix 36508872515](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36508872515/job/109216573497) at `44dd85c` | 450 units/1674 browsers passed; full 1168-owner adoption accepted |
| [Reporting red 36511604969](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36511604969/job/109224752556) at `dcfd8c405a36a261dacd2965fdb0d0639ce9a366` | Attempt 1 completed 2026-09-29 02:29:57 UTC: 450 units/1674 browsers passed and both finalizers accepted, but the new reporting contract measured `n1:240`, `n2a:null`, `n0Only:null` and failed the reporting stage; subsequent audit/XML checks were skipped, not passed |

The shared fixture failure was confirmed from representative actual stacks, configuration and pinned Playwright 1.62.1 semantics: module-level `test.use()` applies to the loading suite, not a reliable reusable fixture default for every importer. The net correction from `36a53c7a` to `44dd85c` is one helper file, two additions/one deletion, moving `serviceWorkers:'block'` into `base.extend` and removing the suite-scoped call. Validators, consumers and matrix stayed unchanged. The initial tuple-declaration typecheck failure at `959965e` and the canceled pre-test `14e3aee` run are not behavioral-red evidence; the unrelated child-error mapping was restored exactly. Not all 399 failure stacks were individually inspected.

### Verified implementation checkpoint and measured populations

[Source run 36508872515](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36508872515/job/109216573497), **attempt 1**, job **109216573497**, exact source **`44dd85cdba038403c9db63b10d51ff4f05e9f620`**, ran **2026-09-29 01:39:37 to 01:56:16 UTC**. All **21 stages passed**: install/typecheck/build/XML contracts, N0/unit, preview/full browser matrix, both finalizers, audit, stamp-normalized XML consistency, upload and cleanup. Actual totals were **450 units**, zero failed/pending, and **1674 browser passes**, zero unexpected/skipped/flaky/retried. Complete failure inventory was empty with zero omitted rows/failures. Browser duration: **817763.693 ms**.

| Runtime population | Owners/cases | Render contexts | Ordinary axe auxiliary pages |
| --- | ---: | ---: | ---: |
| N1 network isolation | 240 | 690 | 0 |
| N2A a11y | 110 | 110 | 220 |
| N2A interactions | 154 | 154 | 0 |
| N2A native states | 264 | 264 | 132 |
| N2A responsive | 220 | 220 | 0 |
| N2A publication | 180 | 210 | 30 |
| N2A subtotal | 928 | 958 | 382 |
| Remaining N0-only browser cases | 506 | Not claimed as N2A contexts | Not claimed |

Schema-2 finalization accepted with no errors/readErrors, **1168 adopted owners**, all six files, **38 index pages**, `n2aScopeComplete:true`, **1692 contexts = 690 N1 render + 958 ordinary render + 44 unit guard contexts**. Ordinary contexts include 30 genuine secondary no-JS publication contexts. N1 has legitimate manual contexts; it is not one context per owner.

Accepted capacity measurements at this checkpoint: **3425 staged files / 8697870 bytes**, largest staged file **30580 bytes**, discovery/results indexes **2671/2660 bytes**, no reporter-error marker. Browser/unit JSON: **66803485/114279 bytes**. Artifact inputs: **3843 files / 726 directories / 183123187 bytes**, largest file **66803485**, no symlinks/missing roots/truncation. Response diagnostics: **974 planned contexts**, maximum distinct **933601 bytes**, maximum charged/fulfilled **16777216 bytes** from the deliberate boundary control, maximum **29 rules**, **3660 responses / 38 transitions / 38 gates**. Managed-page diagnostics: **995 contexts / 1388 pages / 397 leases / 395 auxiliary pages**, maximum **3 pages / 6 documents** per context; 395 includes 382 ordinary plus 13 unit-control auxiliary pages. Six complete positive worker diagnostics were inspected; Firefox's matching-worker URL count of zero is an observation without an inferred cause.

[Verifier 36508872493](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36508872493/job/109216374046) ran **31 contracts**, zero failures/errors/skips; candidate job **109216408803** was skipped. [CodeQL 36508869051](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36508869051) passed all three analyses. [Finding 109216531509](https://github.com/thefastcyberdefense/google-blogger/runs/109216531509) explicitly reported **No new alerts in code changed by this pull request**, zero annotations, not repository-wide zero alerts. Complete review-thread enumeration returned zero.

[Artifact 11009007097](https://api.github.com/repos/thefastcyberdefense/google-blogger/actions/artifacts/11009007097): `fcd-evidence-44dd85cdba038403c9db63b10d51ff4f05e9f620`, **108074008 bytes**, digest **`sha256:8ff2bafe7aefb2b4c1e34cd9e6f333a126db2377a573fa9fb1d26ea4d053e115`**, created **2026-09-29 01:56:13 UTC**, expires **2026-10-13 01:56:05 UTC**, not expired when retrieved. Metadata only: not independently downloaded/hash-verified and not selected as a candidate.

### Reporting completion and final-head gate

The reporting correction keeps both finalizers and original failure propagation intact. It classifies actual normal-report outcomes by canonical file membership, publishing **N1/N2A/N0-only**, historical baseline and total counts with passed/unexpected/skipped/flaky/retried fields. Same-leaf foreign paths are not attributed to adopted files. Data-only controls exercise file normalization and failed/missing/skipped/flaky/retried outcomes; the actual three-population regression remains mandatory. These reporting controls are not extra browser identities or part of the 450-unit count.

The complete registered Mermaid catalog is published from the source/run/attempt-bound finalizer summary in pages of at most eight entries, each carrying page count, accepted/rejected state and the SHA256 of the complete ordered catalog. Safe path/id/size/digest metadata, unique membership, lossless page reconstruction and a 12000-byte diagnostic-page bound are checked before publication. Full summary/raw records remain unchanged in the artifact. The 25-module static preflight is only a subset; it is not substituted for the registered dagre-inclusive catalog. Final-head execution must establish the actual complete catalog count, bytes and digest.

No source job, stage identity, permission, checkout policy, upload member, retention, test selection, worker count, retry or timeout changed. No diagnostic sample replaces complete evidence or turns rejected records into acceptance. N2A-07 remains gated until this reporting/ledger head passes the complete normal workflow and substantive final review. The PR must record its exact head, run/attempt/job, actual populations/capacity, complete catalog, verifier/scanner outcomes and artifact metadata; the already verified checkpoint above must not be relabeled as that later execution.

### Review provenance, limits and one next action

Earlier specification/consumer-preservation review and evidence reconciliation used two read-only AI reviewers; the coordinating assistant inspected exact migration and inherited-unit diffs, challenged unsupported findings and retained every assertion/deadline/expected-error control. The fixture correction and this bounded reporting/ledger follow-up use explicit sequential specification, code/security and QA review by the coordinating assistant. This is not a new independent review, human accessibility acceptance or GitHub approval review. Reporting changes require exact diff review and fresh Actions; all automated project builds/tests run only in Actions.

Preserve the approved response ceilings: HTML **500000 bytes**, Mermaid module **2097152**, distinct assets **8388608/context**, fulfilled responses **16777216/context**, release gate **3000 ms**. Unchanged limits include inline **65536**, all-phase rules **64**, declared counts **1-32**, requests/documents **128 each/context**, receipt **512 characters**, evidence file **131072**, lifecycle records **4096**, staging files **4100**, staging **16 MiB**, unit/browser reports **16/80 MiB**, archive/expanded/member/entries **160 MiB/1 GiB/256 MiB/10000**, four workers, zero retries and N0/unit/render/job **120 s/300 s/1100 s/25 minutes**. Boundary-plus-one failures remain required. Product cap remains only total raw generated XML **<=500000 bytes**; checked-in XML is unchanged at **101248 bytes**, with component/gzip figures informational.

**Next action:** verify and review this reporting/ledger head in Actions, record final evidence in [PR #13](https://github.com/thefastcyberdefense/google-blogger/pull/13), then stop draft/unmerged with the branch retained. Separate exact-head merge approval and authorized post-merge verification come later. Conflict-free Git state is not correctness or merge authorization.

DEFECT-05 remains open overall: N2B remaining render/unit and N2C contract/checker/subprocess adoption are not implemented or approved here. Portability, ARIA naming, mixed Mermaid order, rendered-node contrast/target-size dispositions, Layout design and native comments remain separate roadmap work; accepted reporting corrections are not reopened. Native import/save/rendered build, real Layout/comments, human screen-reader/true zoom, field performance, candidate verification and release gates remain unverified here. Preserve native V3/V2, Header1/Blog1, super.main, posts/comments/labels/archives/pagination, FCD identity and licenses. No candidate repin, live-blog request, import, publishing, DNS/settings operation, ready transition, merge, branch deletion or history rewrite. Historical candidate retention deadlines elapsed; durable preservation requires an approved destination. `docs/DEPLOYMENT.md` stays outside this slice and its old present-tense text is not current authority.

---

## Historical baseline and approved U0+N1 (2026-09-27 Asia/Dhaka; superseded 2026-09-29)

This section supersedes the preserved historical bootstrap and PR #10 snapshots below. Main is the verified PR #11 merge `312954b6f9bf0e39b0f276ea6881f9f82146b4ff`. [Post-merge source run 36288775447](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36288775447/job/108534626444) passed all 21 stages with 211 unit/contract and 1434 browser passes, no reported pending/skipped/unexpected/flaky results, audit and XML consistency. [Post-merge CodeQL](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36288775048) succeeded in three languages; this is not a repository-wide zero-alert claim. The 31 artifact-verifier contracts passed on the identical pre-merge source tree in run 36285583516, not claimed as a post-merge execution. Bootstrap branch remains at `7c30c3cccad22a337cea88c99d1f9ab87238aeb9`; leave it untouched.

B0+N0 source acceptance and accepted Errata v2 reporting R1-R6 are closed. DEFECT-05 is not closed: browser attribution/adoption remains N1 then N2A/N2B/N2C. The other canonical product/native/human defects below remain open as stated. The checked-in XML is still 101248 bytes and this slice does not modify it, its historical generating stamp, the product source or dependencies.

### Current approval and implementation boundary

Branch `feat/fcd-browser-network-guards`, [draft PR #12](https://github.com/thefastcyberdefense/google-blogger/pull/12), starts from the verified main above. Owner approved FCD-U0-N1-APPROVAL-v1 (SHA256 `8ff763b1df9a933d1e5e8f08a1131c49b4c4bbbfc3c7a1b18f1751138b01e921`) and subsequently the two-file public document-start WebSocket observation experiment; the owner then requested continued N1 implementation without merging. The exact ten-file boundary remains:

1. docs/UPSTREAM-AUDIT.md
2. docs/PROJECT-PLAN.md
3. .github/workflows/ci.yml
4. playwright.config.ts
5. tests/helpers/browser-network.ts
6. tests/helpers/isolated-test.ts
7. tests/helpers/browser-network-reporter.ts
8. tests/render/network-isolation.spec.ts
9. tests/unit/browser-network.test.ts
10. tools/finalize-browser-network.ts

No N0 wrapper/probe change, dependency/lockfile change, product/fixture migration, generated XML change, candidate pin, job topology/permission/stage/timeout change, repository setting, branch deletion, production request, ready-for-review transition or merge is authorized. Use the project-selected workspace connection and FCD Superpowers + Ralph + GSD. Builds/tests run only in Actions. Review is sequential AI source/specification/security/QA review, not independent human approval.

### U0 disposition

[UPSTREAM-AUDIT.md](UPSTREAM-AUDIT.md) records the full nine-commit Ledger comparison from `2e5eb328...` through `91cc043...`, including the intermediate publisher, dependency, Mermaid and actual article/dark CSS changes. FCD's bounded strict Mermaid/source-retention and literal code paths differ materially from Ledger's repair-oriented compiler. Reuse no publisher, broad repair, loose configuration, personal identity, generated output or dependency tree. Useful product regression and UI concepts are separately deferred, not smuggled into N1. No material U0 dependency blocks this foundation.

### N1 behavior and evidence contract

The new guard uses pinned public Playwright APIs before pages, service workers blocked, no caller proxy/credential/HAR/state override, and exact synthetic origin/path/method/query/resource rules. Known responses are local. Denial counts are exact and bounded. Unexpected requests fail their owning test at teardown even when caught by application code. Denied navigations receive an inert local 451 document; resource denials are aborted. A local 451 is not retirement proof: the earlier opaque-document-only explanation is withdrawn in light of the independently verified delivery loss below. No normal guard path continues/fetches a remote request or connects a WebSocket to a server. Redirect statuses and headers are rejected in fixture policy.

HTTP request observation is independent of context routing and detects later page overrides. Public document-start WebSocket observation supplements native events, which miss fully mocked sockets; constructor/binding integrity, acknowledgment and lifecycle flushing are checked. N0 remains the connectivity boundary, not browser interception. Dedicated workers are not accepted guard consumers: their locally supplied resource path is exercised and worker creation is attributed as a failure. These tests are not universal worker/browser-internal/Node-network coverage or a hostile-code sandbox. Existing raw browser suites remain N0-only until their approved N2 migration.

A Window-level immutable controller now owns separate per-Document identities and counters. Repeated bootstrap must reuse the same observer for the same Document; successor Documents in a surviving Window receive new identities before their first socket. Top-level readiness has two actual public transports, binding and console, reconciled by UUID, Page/main Frame, security origin and initial-document status. Console cannot identify arbitrary subframes, which continue to require their binding. Duplicate same-transport or contradictory registrations fail; no registration is fabricated from a socket or retirement. A failed ready acknowledgment is accepted only with that document's independently received console readiness. Missing both transports remains a failure.

Retirement keeps bounded synchronous browser-local receipts under per-context/per-document keys. Recovery reads only already-known keys through live same-origin frames, never arbitrary storage or remote requests. Security origin is captured from globalThis.origin, not location.origin on inherited blank frames. Missing, malformed, contradictory or inaccessible old-origin evidence fails closed. Initial zero-attempt blank-document handling remains a narrow exception, not proof of every browser lifecycle.

The latest bounded correction handles the verified Chromium initial-popup binding refresh during a second trusted init-script invocation. An independent bootstrap capability stays in the installed script's closure, not in the controller's public properties or self-owned records. Exactly one refresh is permitted only for the same live initial top-level Document before any socket attempt or socket-delivery failure; the WebSocket wrapper and controller must be unchanged. It never repairs constructor replacement, resets counters, creates a duplicate ready record, or permits a page-triggered reset. Loaded-document binding changes still fail integrity. Fresh Actions results must validate this correction; it is not predeclared accepted here.

The reusable fixture wraps the runner-owned context before its page fixture, preserving runner options/artifacts; manual factory contexts share bounded lifecycle/evidence rules. Success, negative controls, setup/handler/assertion/close/write failure behavior, no-JS, frames, popup first navigation, reload, override detection and parallel/zero-request records must be verified. Eight scoped cases are declared for all 30 existing projects (22 Chromium plus eight Firefox/WebKit); totals and success are derived from actual discovery/results, not this planned matrix.

Schema 1 / policy n1-v1 stages at `${FCD_ISOLATION_EVIDENCE}-browser-network`, outside both N0's strict root and Playwright output cleanup. A fresh source/run/attempt manifest is initialized in the existing unit stage. UUID-based exclusive start/end writes bind stage, engine, project, title, worker, retry, process, exact expected control codes, safe rule/disposition data and lifecycle outcomes. No raw request URL/query, cookies, credentials, headers or bodies enter these records. Bounds fail explicitly rather than truncate required evidence.

The independent reporter inventories the scoped tests and records outcomes/context annotations. The data-only finalizer reconciles inventory, normal browser JSON, the required real Vitest factory consumer and all lifecycle pairs. Missing/stale/duplicate/truncated/wrong-schema/unfinished/unexplained/zero-discovery evidence fails CI. Exact negative controls still throw and must have passed owning tests; they are not a global ignore-errors mode. Always-run reporting attempts both finalizers and publishes valid partial diagnostics under `test-results/browser-network/` without changing the original test result. The existing artifact verifier remains unchanged and does not semantically attest to N1 JSON.

### Test-first history and current verification gate

[937f64b checkpoint](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36290894923) retained 211 existing passes and exposed missing unexpected-request attribution after a local positive control. [b736bdb detailed red](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36291059239/job/108541107714) recorded 211 passes and four new failures: the attribution promise resolved, and each engine had pageRoutes=1, contextRoutes=0, HTTP=1 but native observedWebSockets=0 during a successful local exchange. No external endpoint was tested.

[1a0e379 experiment](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36291269398/job/108541694200) passed all three independent document-observation controls plus the 211 existing cases; the original HTTP-attribution red remained. This proved only the bounded experiment, not complete N1. [cedacf1 policy/evidence checkpoint](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36291937014/job/108543565017) passed 215 and failed 14 new requirements against runnable placeholders, zero pending; explicit assertions included wildcard/redirect/denial policy acceptance and missing attribution. Setup, typecheck and N0 controls succeeded.

The initial integrated checkpoint found the pinned reporter onEnd signature required an asynchronous return; this setup failure is not behavioral-red evidence. At [57c9ed0](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36292567710/job/108545334525), 252 cases passed and one failed. Serving a local 451 preserved the exact unexpected-request violation but did not alone solve retirement accounting. The finalizer also distinguishes explicitly asserted inner failures from failing owners; unrelated failed owners still reject acceptance.

[468f2e6 diagnosis](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36301183130/job/108568991244) established that Chromium's pagehide handler ran while context-console, page-console and binding delivery counters all remained zero. This is an observed transport limitation in the tested case, not a universal engine diagnosis. Bounded durable receipts at [3bfa44c](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36301462934/job/108569754626) passed all then-current 263 unit tests and the original exact HTTP regression. The ensuing full browser run had 1632 expected and 42 unexpected outcomes, zero skipped/flaky, and rejected N1 evidence. The full-run N1_READ and complete failure distribution still require measured diagnosis; an oversized browser report remains an unproven hypothesis.

Subsequent protected reds exposed inherited-origin handling, four socket cross-accounting false greens, duplicate keys in self-owned JSON and malformed UTF-8 runner input. [ffe2a83](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36303053197/job/108574243099) verified those seven corrections with 276 passes and three remaining navigation failures. The diagnostic wrapper at dd8fa277 then failed setup typing; [1ab76b8](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36328932946/job/108646999886) fixed only the two-argument exposeBinding mismatch, restoring typecheck and the same 276/3 result. Neither typing correction is behavioral-red proof.

[1205357 lifetime diagnostics](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36331467782/job/108654107286) showed duplicate init invocation in Chromium's same initial popup Document, Firefox reusing a Window/observer for a successor iframe Document without another init invocation, and WebKit losing initial-popup binding-ready delivery despite a delivered retirement. [cee8efd controls](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36331981050/job/108655541211) and the diagnostic-only [c5da33d rerun](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36332557628/job/108657166653) both reported 279 passes, nine failures, zero pending. All engines observed two sockets for one routed socket under repeated bootstrap, and zero observed sockets rather than one when only binding-ready was suppressed. The three both-ready-transports-missing negative controls passed. Installation/typecheck/build/XML/N0 succeeded, so these six new failures were meaningful behavioral reds alongside the three navigation failures.

[b4b92c8 correction](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36332843576/job/108657977295) passed 287 tests with one failure, zero pending. Firefox and WebKit navigation, all nine added controls, original exact HTTP attribution, inherited-origin and durable/evidence-corruption controls passed. Chromium's initial popup alone still failed integrity. The diagnostic-only [9de5df5 run](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36333268162/job/108659172639) repeated 287/1 and directly measured socket=true, binding=false, state=true, initial=true, top=true during the repeated bootstrap. The pinned Playwright v1.62.1 source at 26a9e470a7b3c7822084b09fb7f13902c5f37b51 confirms binding initialization replaces the exposed function; its socket mock is separately idempotent. This source reading informed the bounded correction but introduces no use of private Playwright APIs. Nine preservation controls accompanying the correction cover untrusted initial/loaded binding resets and conflicting ready transports; they are not claimed as previously failing tests.

**Recorded evidence stops at 9de5df5; this correction's exact-head verification is pending.** Its unit-failed predecessor never ran the browser matrix, audit or final XML check; missing browser evidence on that run does not diagnose the earlier full-run N1_READ. Its CodeQL finding check reported no new changed-code alerts, not repository-wide zero alerts. Follow PR #12 for subsequent exact heads and measured outcomes rather than treating this ledger's implementation prose as acceptance.

**Next action:** verify the current head's unit and full browser results, both finalizers, audit, XML consistency, verifier contracts, actual scanner findings and review threads. Keep original assertions, four workers, zero retries, timeouts and all evidence bounds. N1 also still needs the real loopback redirect-hop control, direct unexpected-WebSocket policy assertion and exact end-record disposition checks before final source acceptance. Current direct navigation is not redirect-hop coverage. Preserve all 211 original unit/contract identities and 1434 baseline browser cases. Reconcile actual outcomes in the PR, perform specification review before code/security/QA review, and leave the PR draft and unmerged. Any extra file, N0 alteration, private API, dependency, stage/permission/candidate-contract change, increased bound or weakened acceptance requires a scoped amendment. N2 adoption and native/human/release gates remain separate.

---

## Historical baseline and approved B0+N0 bootstrap (2026-09-27 Asia/Dhaka)

This section supersedes the dated PR #10 preparation snapshot below; that snapshot is retained as history, not current status. Main is `ecb1d438e8b3227911dc76359b9e05f127867b27`. PRs #1 through #10 are merged. [PR #10 post-merge CI](https://github.com/thefastcyberdefense/google-blogger/actions/runs/35303993418/job/105472311414) completed 2026-09-18 03:52:09 UTC with all stages successful: 211 unit/contract and 1434 browser passes, no reported failures/pending/skips/unexpected/flaky outcomes, audit and restored XML consistency. The checked-in XML remains 101248 bytes with its real generating stamp `0.1.0+bcb5b82706568c2f6f29cd1795b2589767e42146`. [Post-merge CodeQL](https://github.com/thefastcyberdefense/google-blogger/actions/runs/35303992974) and [inspected scheduled analysis](https://github.com/thefastcyberdefense/google-blogger/actions/runs/35542582610) succeeded; analysis success is not a zero-alert claim.

At bootstrap start, the branch listing contained main and `qa/local-evidence-ecb1d438` at `2852768d139c9106943d884155dcabfc0246b7ef`, with no open PRs. The old native-state branch was retained at merge but is absent from that listing; no cause is inferred and no restoration is approved. The new branch is `feat/fcd-safe-verification-bootstrap`, tracked in [PR #11](https://github.com/thefastcyberdefense/google-blogger/pull/11).

The owner accepted Reviewed Master Plan v2 (54525 bytes, SHA256 `f70d5ed9890e02ea4e95dea0f4eb15e97bb243df552fdc62700d9cc1e231c186`) and explicitly approved only this initial five-file implementation/PR/Actions boundary:

1. docs/PROJECT-PLAN.md: reconcile the baseline and shared work ledger.
2. docs/DEPLOYMENT.md: reconcile merge/evidence/retention and retain candidate boundaries.
3. .github/workflows/ci.yml: mandatory safe application-test execution and evidence finalization.
4. tools/run-isolated-tests.sh: fail-closed namespace runner, bounded execution and status preservation.
5. tests/isolation/egress-probe.mjs: controlled safety regressions and evidence validation.

No product source, fixture, dependency, lockfile, generated XML, candidate pin, job topology, permission, repository setting, merge or production change is authorized here. FCD Superpowers, Ralph and GSD remain the workflow; all project builds/tests run in GitHub Actions. Review is sequential AI specialist self-review, not independent approval.

### Accepted reporting and canonical open work

Reporting corrections R1 through R6 are accepted through Errata v2. The accepted archive is 31003 bytes, SHA256 `a06b265ecb4d55d5467a001b68021eb9fdbdd6e3c810d73b240bb1964407896e`; its integrity, manifest, repaired 21-row/eight-column CSV, restored defect identities and conservative claims were verified. No further historical evidence rewrite is required. This closes reporting scope only, not product/native/human acceptance. The withdrawn advisory remains withdrawn; the cited original audit reported zero vulnerabilities.

| Canonical defect | Current disposition |
| --- | --- |
| DEFECT-01 | CRLF-sensitive source contract: portability fix pending, diagnostics are not committed fixes |
| DEFECT-02 | Windows ZIP fixture normalization: raw-name fixture correction pending |
| DEFECT-03 | Roleless ARIA naming: source correction and direct accessibility assertions pending |
| DEFECT-04 | Mixed-Mermaid order: DOM-order correction pending; retain registration-based ten-slot automatic admission and manual opt-in beyond ten |
| DEFECT-05 | Network-guard coverage: N0 outer boundary in progress; N1/N2A/N2B/N2C browser attribution/adoption still required |
| DEFECT-06 | Sampled target-size observations: node-specific WCAG disposition pending, no universal 44px requirement |
| DEFECT-07 | Historical host Node/Python limitation: environment evidence, not a theme defect |
| DEFECT-08 | Contrast incompletes: actual rendered-node/human disposition pending |
| DEFECT-09 | Old diagnostic wrapper non-gating exit: historical limitation, not reused as an acceptance gate |
| DEFECT-10 | Reporting traceability: accepted Errata v2 scope closed |

The historical 48 supplemental axe scans include 12 with incompletes; scan-node occurrences are not unique defects. Missing network records establish neither universal isolation nor proven production contact.

### Bootstrap implementation and test-first evidence

[Initial checkpoint](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36267578570) at `5719ee9043536ae27b69d357fec7b313f5f24f81` stopped before application tests. Its first externally readable annotations were insufficient to classify the cause. The next checkpoint added diagnostic annotations without changing the regression. [Behavioral red](https://github.com/thefastcyberdefense/google-blogger/actions/runs/36267724660/job/108475489612) at `3f1e81fa9cfa750624beda730ae3dd4b50fa1b2c` explicitly reported the outer safety namespace, protected parent positive controls, successful negative control, and `EGRESS_POLICY: controlled parent canary reachable`. This is a controlled loopback failure inside an already no-egress namespace, not a public/production/metadata request or missing-package failure. Unit/browser application suites were not reached.

The implementation replaces that harness-only direct executor with a fresh Linux network/PID namespace for every application test invocation. Only loopback is enabled; the payload guard rejects other interfaces/routes. Test processes run as the original non-root runner with empty supplementary groups, zero capability sets and no-new-privileges. The environment is allowlisted rather than forwarding credentials or proxies. The parent harness can create child namespaces but has no external network; application payloads cannot acquire sudo privileges. This is accidental-egress defense, not a complete hostile-code/filesystem sandbox.

Mandatory regressions cover controlled parent IPv4/IPv6 denial, local fixtures, Node descendants, Chromium/Firefox/WebKit, explicit browser proxy attempts, TCP/UDP no-route denial, success/nonzero status propagation, bounded timeout, failed privileged setup without payload execution, and orphan cleanup. Namespace setup failure stops before application tests. No AppArmor/host firewall change, privileged Docker socket, dependency or runtime-stack change is used.

Dependency/browser installation, static compilation/contracts, fixture build-only generation, approved audit and artifact upload retain their separate original stages. All browser-bearing Vitest and Playwright application processes and their fixture servers/children execute inside the namespace. The existing single verify job, stage names, read-only permission, exact-head checkout and package-install flags remain. Explicit stage names describe the same npm commands now run behind a mandatory gate.

Isolation records are source-bound and staged under a fresh run/attempt-specific runner-temporary directory, outside Playwright startup cleanup. The always-run browser reporting stage copies them to `test-results/isolation`, rejects missing/stale/failed required records and retains nonzero application outcomes. Upload remains always-run, so an artifact on a failed run is not acceptance. The existing pinned verifier accepts those member paths for integrity, but does not semantically validate new isolation JSON and does not select PR-head artifacts.

**Status at this implementation commit:** behavioral red observed; implementation and B0 reconciliation written; fresh exact-head full verification and substantive review still pending. Follow PR #11 for actual head/run outcomes rather than treating this document commit as a pass. **Next action:** inspect the new head's isolation assertions, full normal CI, verifier contracts and CodeQL; fix only in-scope causes without weakening tests; obtain separate merge approval only after source acceptance. If namespace feasibility requires a new file, stage inventory, privilege workaround or other scope expansion, stop for approval.

### Remaining phase order and non-goals

After separately accepted bootstrap: U0 bounded upstream applicability; N1 then N2A/N2B/N2C; P3A Windows/Linux red before P1/P2 fixes and P3B green; A1/D1/A2 hardening; L0 design then bounded Layout stories with early owner-authorized native pattern proof; C0 native comments observation before any justified C1 change; R0/R1/R2 artifact/native/human gates. These later manifests are not approved for implementation by the bootstrap click.

Preserve the reviewed v2 corrections: no docs-only PR before safe CI, Windows regression before fixes, all browser-bearing contracts/checker tests inventoried, isolation evidence survives Playwright cleanup, diagram admission is not a hard ten-render limit, Layout changes include native/fixture/parity contracts, the existing native checker does not prove interactive comments/Layout, and exact install/preview flags remain in use. No LeadPilot infrastructure, generic full-stack framework, duplicate CodeQL, automatic dependency upgrade or restoration of the owner-deleted docs/fcd-env-example.

Post-merge artifact metadata and elapsed Phase1A retention are recorded in docs/DEPLOYMENT.md. No evidence destination, replacement candidate, import, live request, human acceptance or release is inferred.

---

## Historical snapshot: baseline and development loop (2026-09-18 Asia/Dhaka)

The remainder preserves the PR #10 preparation record. Its prospective wording is historical and superseded by the current section above.

PRs #1 through #9 are merged with history preserved. Main at the start of this batch is `e1e7bb3cee62ec03cfcc290fa85fb473191eb9b4`. [PR #9 post-merge verification](https://github.com/thefastcyberdefense/google-blogger/actions/runs/35079121123/job/104738565032) completed 2026-09-16 09:33:49 UTC: every stage successful,203 unit/contract passes,1170 browser passes,0 reported failed/pending/skipped/unexpected/flaky results,95157 raw XML bytes. [Post-merge CodeQL](https://github.com/thefastcyberdefense/google-blogger/actions/runs/35079120069) successfully analyzed Python, Actions and JavaScript/TypeScript; analysis success is not a zero-vulnerability guarantee.

The owner requested the loop: compare Ledger/current FCD, research, implement a bounded story, test in GitHub Actions, review/audit, fix failures and repeat, then propose the next scoped story. Owner handles Blogger uploads and supplies actual save/render evidence; source gates do not imply native acceptance. Merge, live-site tests, imports, publishing and settings remain separately authorized. The supplied FCD URL https://blogs.fastcyberdefense.com/ is the production target, not disposable staging; a controlled-production test plan was selected, but no live execution was authorized. https://blogs.redwan.work/ is the owner's Ledger reference, not the FCD deployment target.

## Historical approved slice: distinct native empty/error states

Branch: `feat/fcd-native-states`, from exact main above. [PR #10](https://github.com/thefastcyberdefense/google-blogger/pull/10) holds final revision, Actions evidence and review decision; remains unmerged unless explicitly approved later.

The owner approved ten files, then explicitly added tests/render/responsive.spec.ts after the first implementation run identified an ambiguous legacy test selector. Approved maximum scope:

1. src/widgets/blog.pug
2. src/partials/presentation.pug
3. fixtures/home.pug
4. tools/preview.ts
5. tests/contract/native-contract.test.ts
6. tests/render/native-states.spec.ts
7. tests/render/responsive.spec.ts
8. dist/theme.xml, generated in Actions only
9. .github/workflows/ci.yml, temporary source-bound branch-only XML transfer, fully restored before acceptance
10. docs/PROJECT-PLAN.md
11. docs/DEPLOYMENT.md

No dependency, lockfile, scripts, stylesheet, native identity, CodeQL configuration or repository-setting change. Normal CI is restored to its original read-only workflow; the temporary transfer job and stale-output exception are absent from the final tree.

### Behavior and acceptance

Preserve Blog1/Header1, Layouts V3, Widget Version2, super.main, native post/comment dispatch and pagination. In noContentPlaceholder use one exclusive native chain, error first, label before general search, then archive, initial empty homepage, generic empty page. Guard initial-home wording with not data:newerPageUrl so an empty paginated page does not claim the publication has never published.

| State | Distinct heading | Recovery/context |
| --- | --- | --- |
| Error |Page not found|Address guidance; no claim that the theme itself sets HTTP status|
| Label |No articles under this label|Escaped native label when available|
| Search |No matching articles|Escaped native query when available|
| Archive |No articles in this period|Escaped native archive range when available|
| Initial empty home |No articles published yet|Honest first-publication message|
| Generic empty page |No articles on this page|Non-misleading fallback for other empty/paginated views|

Each state has one h2 beneath the existing page h1, a labelled recovery search form using native GET/q and data:blog.searchUrl, and a native homepage link. Shared Pug mixins supply production and fixture content, no duplicated fixture copy or theme-JS dependency. Dynamic context is rendered as escaped text, not HTML or attribute content.

New browser cases cover all six states with JS on/off across the existing22 Chromium width/theme projects: safe hostile literal context, one visible state/main h1, no cards/phantom pagination, named recovery controls, Enter submission preserving encoded query, keyboard home-link activation, no horizontal overflow and axe scans with violations/incomplete evidence attached. Existing representative Firefox/WebKit coverage remains in publication-acceptance.spec.ts; new native-state cases are not claimed multi-engine. All requests in the new suite are intercepted; no live blog is contacted. Native conditions/escaping are checked structurally in generated XML, not executed by Blogger in fixture tests.

### Test-first and correction history

[Test-first run35256580361](https://github.com/thefastcyberdefense/google-blogger/actions/runs/35256580361/job/105321613394) at6a5055be001afd26cf133c6580eded1cd384be2f recorded203 existing passes and8 new failures: six missing distinct states, missing exclusive dispatch, and missing shared state presentation. Browser tests were not reached; missing fixture files are not counted as behavioral red proof.

Implementation run35257043409 at1ea629a2332d492639d733ed1a9b37f1675bcdcf passed the expanded contract suite and1390 browser cases, but44 no-JS cases in responsive.spec.ts failed because form[role="search"] now legitimately matched header and recovery forms. This was a test selector assumption, not grounds to remove the recovery form or weaken visibility checks. Owner approved the eleventh file; bcb5b82706568c2f6f29cd1795b2589767e42146 checks header search explicitly and adds recovery visibility, labelled searchbox, method/action and exact form-count assertions, with guaranteed context cleanup.

[Corrected run35259136763](https://github.com/thefastcyberdefense/google-blogger/actions/runs/35259136763) passed211 unit/contract and1434 browser cases with0 failures/pending/skipped/unexpected/flaky, plus audit. Its temporary stale-XML step was intentionally skipped and is not a pass. The separate source-bound transfer job succeeded, committing only Actions-generated XML as03e473c55672bcce418552b5b7603ae18f4db989. XML is101248 bytes and carries source stamp0.1.0+bcb5b82706568c2f6f29cd1795b2589767e42146. This verified transfer is not import-candidate approval.

Final acceptance still requires the exact final head's full CI after temporary writer removal, including restored stale-XML check, full browser suite, existing verifier contracts, CodeQL and scoped sequential code/security/accessibility review. Record observed results in PR #10 rather than predeclaring them in this commit. No tests/builds run locally. No independent-review claim for sequential self-review.

## Historical next source slices and native feedback

After this bounded slice passes, propose Layout-configurable navigation/intro/CTA/footer and supported gadget boundaries, then native comment usability. Richer year/month/category filtering, narration and SVG export remain later optional features, not a mandate to clone Ledger. Do not copy Ledger's raw cached HTML restoration, unrestricted full-feed traversal, permissive Mermaid settings, publisher or personal identity mappings.

Native feedback proceeds alongside scoped source development: owner supplies backups and imports an explicitly selected verified artifact; record save outcome and rendered stamp; separately approve read-only checks against the exact blog; reproduce and fix real failures. The existing eight-view staging workflow must not be silently pointed at production. Missing native evidence does not become a fixture pass, and no completed source story implies production release approval.

## Native acceptance dependencies and release gates

Reuse fixtures/staging-views.example.json, tools/staging-check.ts and .github/workflows/staging-check.yml; no duplicate manifest or checker. Need operator confirmation, exact blog identity/origin, theme/content backup and Layout settings references, durable evidence location, actual import/save/build stamp and eight real view URLs. Search/static/error need independently chosen expectedText; expectedCanonical is optional and independently justified. Keep non-sensitive configuration outside the public repository unless publication is approved. Public-response checks cannot validate a private/login-only blog.

The staging workflow had zero recorded runs on2026-09-16; this does not establish whether an owner-side import occurred elsewhere. Source's HTML checker blocks scripts/resources and does not prove live comments/Layout/feed interactions. Require native home/article/label/search/archive/static/error/paged results, real interaction observations and resolution of native-functionality blockers. Human keyboard/screen-reader, visual/contrast/print/true zoom, measured mobile performance and field performance remain separate. Production rollout and rollback execution need specific approval.

The Phase1A pinned candidate remains9a6f484, with source artifact expiry2026-09-26 04:28:06 UTC and existing handoff expiry2026-09-26 05:58:38 UTC, subject to earlier deletion. It does not include this slice. Do not silently replace it or change verifier pins. Full tuple and replacement boundary are in docs/DEPLOYMENT.md; evidence preservation needs an approved destination.

## Historical milestones and provenance

[PR #9](https://github.com/thefastcyberdefense/google-blogger/pull/9) completed two-document native-baseline preparation ataffcc72f6718060966839c9035333eb6a8a5344b:211 is NOT its test count; it had203 unit/contract and1170 browser passes,31 verifier contracts and successful CodeQL. Real-candidate job was skipped by branch policy, not verified. Main mergee1e7bb3 preserved both parents.

[PR #8](https://github.com/thefastcyberdefense/google-blogger/pull/8) completed Phase1A at81a8f111e44808a246eea6a9c145187112fb866c:31 verifier tests,203 unit/contract and1170 browser cases; bounded original archive/XML verification produced a byte-identical handoff. Main merge0aedbcf5d8b583669631509b2c0852faf4bd612d passed [run34680616793](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34680616793). Its branch was retained at merge and later [deleted2026-09-12 07:36:10 UTC](https://api.github.com/repos/thefastcyberdefense/google-blogger/issues/events/31014774270); actor attribution does not establish manual versus automation. No restoration authorized.

Phase1A retained the approved browser-only80MiB bound after observed69523303-byte browser JSON; other safety limits unchanged. Its raw XML substring DTD check was corrected to declaration-aware Expat validation, allowing plain html doctype/inert CDATA while rejecting external identifiers/subsets/entities. [Initial red run34676406787](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34676406787/job/103506940902) contained meaningful rejection failures plus a separate archive error, not a wholly clean red run. See [pre-slice plan](https://github.com/thefastcyberdefense/google-blogger/blob/e1e7bb3cee62ec03cfcc290fa85fb473191eb9b4/docs/PROJECT-PLAN.md) for the preserved detailed historical scope.

Original Ledger reuse baseline692a82463cb8d0869a6f5e7c946ecc757cacb7e2 remains. PR #7 researched Ledger v1.5.0 at a209471279812309e68571aba8d918e68bcc16da and added18 diagram and44 Chromium cases without runtime changes; main9a6f484 passed run34672572631 with203/1170. Latest source comparison used Ledger2e5eb328adf096a42b4da50ff676de1cbfe42405, not a claim that all current source is released or deployed. Uncertain advisory claims stay in docs/UPSTREAM-AUDIT.md.

PR #6 prepared the staging worksheet; head75b50407272a46179530d2a744ca406f05030a99 passed run34427968543 and merge1f85a593f8b28fd5a37cfe2e12ac5a57d9e9c205 passed run34666092580 with185/1126. PR #5 delivered metadata and cross-browser acceptance; main8e37eb53c9cc4c13dd3d5baf1d07fe71e984f312 passed run34426823783 with185/1126. Earlier notes remain historical, not current readiness claims. Branches retained at their merges were later absent in listings; do not infer causes or recreate them.

## Invariants

Only total raw generated XML <=500000 bytes is capped; CSS/JS raw/gzip and growth are informational. Preserve network/input/timeout/retry/cache limits. Keep modular Pug/SCSS/TypeScript compiling into one XML, native V3/V2 engine, Blog1/Header1, super.main, FCD identity and applicable owner-authorized upstream license notices. No React/Vue, runtime backend or database.

Use FCD Superpowers + Ralph + GSD and relevant review roles with the project-requested workspace GitHub connection. Build/test only in Actions. Normal verification is read-only and checkout credentials are nonpersistent. No secrets in source/XML, manual generated XML edits, retained temporary writers, automatic merge, branch cleanup, publishing, DNS or live-blog operations. Branch protection remains deferred and GitHub-managed CodeQL is not duplicated. The old inaccessible-live-blog audit waiver does not waive native acceptance.
