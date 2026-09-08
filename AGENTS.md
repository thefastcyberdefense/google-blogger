# FCD development agreement

Read docs/PROJECT-PLAN.md before changing architecture. This is Google Blogger Layouts V3, not a generic frontend site. Preserve widget version 2, Header1/Blog1, native data expressions and super.main render delegation. Do not rename live widget bindings as a cosmetic edit.

Use the project-requested workspace GitHub connection. Work on feature branches, never rewrite main. Reuse reviewed Ledger technical infrastructure but not personal identity, analytics or UI. Keep Pug/SCSS/TypeScript modular and compile one dist/theme.xml.

Use the approved FCD Superpowers and FCD Accessibility Reviewer ClickUp skills. They adapt Superpowers' incremental planning, TDD, systematic debugging and evidence-based review, plus Ledger's real-render accessibility gate. They are not CLI plugin installations or background agents. Upstream: https://github.com/obra/superpowers (MIT).

All automated builds/tests run in GitHub Actions. For a behavior change, demonstrate the regression fails for the correct reason, implement the fix and demonstrate green. Inspect commit-specific logs and artifacts; canceled/skipped/blocked/stale is not passed. Do not weaken tests to get green. Do not claim test-first history for inherited code.

Source CI must not use production secrets or deploy. The initialization pipeline may produce package-lock.json and dist/theme.xml as artifacts; repository writes from automation require an explicitly documented limited initialization step. Normal verification has read-only repository permission.

XML parsing, fixtures and compilation do not prove Blogger rendering. Actual import/save and expected build stamp on staging are required before production readiness. Browser automation does not establish complete WCAG conformance or human screen-reader coverage.

Security: validate untrusted URLs, use textContent for feed/cache strings, bound network data, keep secrets out of frontend XML, and do not copy upstream analytics IDs. Core content/search submit/labels/pagination must survive theme-JS failure.

PRs state scope, requirement coverage, Actions evidence and gaps. No merge, production import, DNS change, article publication or destructive cleanup without separate approval.
