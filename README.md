# Fast Cyber Defense Blog

A modular cybersecurity publication theme for Google Blogger **Layouts V3 / Widget Version 2**. Development is on `feat/fcd-blogger-foundation`; main and production are unchanged. The repository foundation is implemented, but the full publication milestone and Blogger import/render validation remain incomplete.

## Build

Use Node **24.20.0** from `.nvmrc` with npm 11 or newer. The npm-generated `package-lock.json` is committed.

```sh
npm ci
npm run build
```

The build compiles Pug + SCSS + bundled TypeScript into `dist/theme.xml`. No React, Vue, backend or database is needed. The checked-in XML is the verified initial artifact with its original source build stamp; rebuild or select the newest successful Actions artifact when making subsequent changes. Do not manually edit generated XML.

## Verification policy

All project automation is executed in GitHub Actions. PRs run against their exact head commit with read-only repository permissions and pinned action revisions. There is no remaining lockfile/bootstrap writer, production secret or deployment job.

Gates: clean npm installation, TypeScript, build, XML/V3 contracts, Vitest, generated browser fixtures, Chromium Playwright responsive/interaction/axe tests and dependency audit. Reports, screenshots, traces on failure and XML are uploaded as `fcd-evidence-<source-sha>` for 14 days.

[First complete successful Actions run](https://github.com/thefastcyberdefense/google-blogger/actions/runs/34245507747) tested source `9aa3c57bbbdec38568a20d1eeeb25ae68f2dc166` after lockfile initialization. Later commits need their own checks; this is not a claim that all future revisions pass.

## Preview and source layout

`npm run preview` serves localhost:4173; `/` and `/article` are explicitly labeled simulation fixtures. The browser suite uses those fixtures with the real compiled stylesheet/script bundle. It **does not evaluate Blogger expressions** and is not live-site proof.

`src/theme.pug` is the XML shell; `src/defaultmarkups/` and `src/widgets/` define native rendering; `src/partials/` handles metadata; `src/styles/` and `src/scripts/` are modular enhancements. `tools/`, `tests/`, `fixtures/` and `docs/` contain verification and operational material.

## Implemented foundation

FCD light/dark design tokens, responsive masthead, non-modal mobile menu, native-label topics, lead/latest card styling, native single-article content, Recent Posts via bounded safe feed parsing, inline loaded-card filtering with native full-blog search submit, theme toggle, TOC, reading time on posts, code-copy controls, scrollable tables/code, basic native SEO plus JSON-LD, sidebar/archive and company footer.

Ledger reuse is architectural, not a renamed UI: V3 root/dispatch, Blog1/labels/pagination expressions and compiler conventions. Raw HTML cache hydration, personal identities, analytics and publishing scripts were not ported. See [upstream audit](docs/UPSTREAM-AUDIT.md).

## Still required

Real Blogger import/save and all page-type/native-comment checks; broader native widget overrides/contracts; separate lead-plus-secondary editorial area; cover duplication handling; card reading time; syntax highlighting; rendered Mermaid; related-label articles; complete page-type SEO/performance budgets; and human accessibility evaluation. Do not call this production-ready or the entire initial milestone done.

## Blogger deployment

Export existing theme/content and record widget settings. Upload an Actions-generated XML to a **separate staging blog** via Theme > Restore, save it and verify the `theme-build` stamp. Configure Header1/Blog1/topics/sidebar without cosmetic ID changes. Test actual home/article/label/search/archive/static/error/pagination, comments, feeds, navigation and no-theme-JS content. Production replacement requires separate approval; rollback restores the saved XML/widgets. See [deployment guide](docs/DEPLOYMENT.md).

The live FCD blog audit was waived; future import/render validation was not.

## Development skills

**FCD Superpowers** and **FCD Accessibility Reviewer** are saved in ClickUp. They are project-specific development/review skills, not installed CLI plugins or autonomous background agents. See `AGENTS.md` and the [project plan](docs/PROJECT-PLAN.md).

Suggested read-only skill evaluation prompts: “Review FCD initialization against its CI evidence”; “Audit the FCD mobile search accessibility plan.” These evaluations have not been run against a baseline agent.

## Provenance

Ledger reference: `692a82463cb8d0869a6f5e7c946ecc757cacb7e2`; owner confirmed reuse permission. Preserve LICENSE notices. Corporate brand/business source: https://fastcyberdefense.com/. Only verified root business links are used until exact routes are audited.
