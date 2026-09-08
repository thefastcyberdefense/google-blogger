# Fast Cyber Defense Blog

Production-oriented Blogger Layouts V3 theme, currently under initialization on a feature branch. **Not yet approved for Blogger import or production.**

## Stack

Node 24.20.0 LTS; Pug + SCSS + TypeScript bundled into `dist/theme.xml`. Native Widget Version 2, Blog1 and Blogger server-rendered content. No React or backend required.

## Development

Use `.nvmrc` with your Node version manager. Once the initialization lockfile has been committed, install with `npm ci`; `npm run build` generates the XML. `npm run preview` serves labeled simulation fixtures, not Blogger-interpreted templates.

Project policy: all automated verification is executed in GitHub Actions. The pipeline runs clean install, typecheck, compilation, XML contract validation, unit/contract tests and browser/a11y tests. Download commit-specific reports and XML from Actions; do not call a queued/skipped check a pass. Initial dependency resolution is explicitly distinguished from a reproducible committed-lockfile build.

## Deployment

Export the existing Blogger theme/content and record Layout settings. Upload the generated XML to a **separate staging blog** through Theme > Restore, save it, configure widgets and verify the build stamp. Test real home/article/label/search/archive/static/error/paginated views and comments. Only deploy to production after separate approval. Rollback restores the saved XML and widget settings.

The live FCD blog audit was waived by the owner; actual import verification was not. See [project plan](docs/PROJECT-PLAN.md).

## Provenance and identity

Engine reference: [Ledger](https://github.com/redwan-cse/ledger-blogger-theme), pinned audit commit `692a82463cb8d0869a6f5e7c946ecc757cacb7e2`; owner confirmed reuse permission. Applicable upstream notices remain in reused source and LICENSE. FCD's company website is the branding/business-link source of truth. No personal Ledger avatars, analytics or automated publishing are included.

Approved development skills: FCD Superpowers and FCD Accessibility Reviewer in ClickUp. These are workflow adaptations, not a installed CLI plugin or autonomous runtime agent.
