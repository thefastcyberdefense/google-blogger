# Changelog

## 0.1.0 - unreleased foundation

### Foundation implementation

- Added audited project plan before code, isolated feature branch, Node 24.20.0 and genuine dependency lockfile.
- Added modular Pug/SCSS/TypeScript Blogger V3/V2 shell, native dispatch and FCD initial header/cards/article/sidebar/search/TOC/copy controls.
- Saved FCD Superpowers and FCD Accessibility Reviewer ClickUp skills.
- Added Actions-only build, XML, type/unit/browser/axe and dependency checks, with artifact reports and screenshots.

### Reviewed blocker fixes

- Corrected URL validation to accept hyphenated Blogger slugs while rejecting controls, foreign origins, credentials and unsafe schemes.
- Replaced substring deployment checks with bounded parsed DOM and exact build-stamp validation.
- Shared production/fixture presentation, modeled wrapper/image/page states, and added structural/negative-control checks.
- Recorded failing baseline then passing blocker regression suite; details in docs/UPSTREAM-AUDIT.md.

### Approved foundation hardening

- Added scoped XML native-render rules and 14 deliberate invalid-output mutations plus valid/comment-only controls.
- Added twelve-column table fixture and no-theme-JS local-scroll regression.
- Added CSS-only table containment and flexible header/search layout for enlarged text at narrow widths.
- Expanded axe to five initial/expanded page states; verified table and header accessibility roles.
- Added native search GET submission, clipboard payload/success/denial, storage failure, reduced motion, skip-link focus, keyboard scrolling and 200% text-scaling tests.
- The red baseline recorded 15 failures. Follow-up testing revealed and addressed 320px text overflow; a mistaken End-key test was corrected to ArrowRight without removing its scrolling assertion.
- Kept artifact consistency mandatory and documented exact-head acceptance, next-milestone scope and staging/manual gaps.

Acceptance depends on the final PR-head Actions run. No release, merge, production import or independent external approval is implied. Mermaid/highlighting/related content and other advanced publication features stay in the next milestone; actual Blogger and human accessibility gates remain pending.
