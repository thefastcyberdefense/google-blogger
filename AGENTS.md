# FCD development agreement

Read docs/PROJECT-PLAN.md before changing architecture. This is Google Blogger Layouts V3, not a generic frontend site. Preserve Widget Version 2, Header1/Blog1, native data expressions and super.main delegation. Do not rename widget bindings for cosmetics.

Use the project-requested workspace GitHub connection. Work on feature branches, never rewrite main. Reuse reviewed Ledger infrastructure without its personal identity, analytics or UI. Keep Pug/SCSS/TypeScript modular and compile one dist/theme.xml.

Use FCD Superpowers, Ralph Development Loop and GSD Development Workflow together. Load FCD Accessibility Reviewer for UI work and Code Review for substantive changes. These are approved ClickUp workflow adaptations, not installed CLI plugins or background agents. No independent-review claim for sequential self-review. Sources: https://github.com/obra/superpowers ; https://github.com/snarktank/ralph ; https://github.com/open-gsd/gsd-core .

All automated builds/tests run in GitHub Actions. Demonstrate regressions fail for the correct behavior, then implement and demonstrate green. Inspect exact-commit evidence; canceled/skipped/blocked/stale is not passed. Preserve inherited regression coverage without manufacturing test-first history.

Source CI must not deploy or use production secrets. Ordinary verification is read-only. Approved temporary artifact transfers are feature-branch-only, source-bound, verified and removed before acceptance. No manually edited XML or lockfiles.

XML parsing and shared-presentation fixtures do not prove Blogger rendering. Actual import/save and build-stamped native staging views are required before production readiness. Browser automation is not full WCAG or human screen-reader validation.

Validate untrusted URLs, use safe text construction, bound fetches and keep secrets out of XML. Core content/search/labels/pagination must survive theme-JS failure. Do not add raw cached HTML or upstream analytics.

PR A preserves native post order and wrappers, uses one lead plus up to two secondary cards only on initial home, and does not automatically duplicate or move author cover images. No-JS styles must be present in response markup; testing a style injection load event with JavaScript disabled can hang.

PRs state scope, evidence and remaining gates. No merge, production import, DNS change, article publication or destructive cleanup without separate approval.
