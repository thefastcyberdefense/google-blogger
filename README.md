# Fast Cyber Defense Blog

Unreleased Blogger Layouts V3 / Widget Version 2 theme for the Fast Cyber Defense blog. Draft PR #15 rebuilds it on the Ledger v1.7.0 engine and layout (pinned upstream commit a3da05a8a70243c6ffc239b0e96e88260ed7b536), rebranded to FCD: the fastcyberdefense.com palette, Inter and Fira Code, and the FCD mark in place of the upstream personal identity. Draft PR #14 (the earlier FCD shell) is superseded and stays unmerged.

## Build and size policy

Node 24 LTS, npm 11+, genuine locked dependencies. Pug, SCSS and TypeScript compile one dist/theme.xml, built only in GitHub Actions and shipped as the run's theme artifact; the XML is no longer checked in. Only total generated XML is capped at 500,000 bytes. Never hand-edit generated XML.

CI runs typecheck, build, the FCD unit checks (tests/fcd), Ledger's V3 contract rules and npm audit. port/apply.py and the temporary ledger-port workflow import pinned upstream files byte-exact and apply FCD edits; both are removed before review.

## Layout zones

All seven layout zones are standard b:section elements, editable in Blogger Layout:

| Zone | `id` | Widget | Purpose |
|---|---|---|---|
| Masthead | `header` | `Header` | FCD mark, blog title and description. Locked. |
| Nav | `navlinks` | `LinkList` | Menu links |
| Intro | `intro` | `HTML` | Home hero; empty shows the FCD default |
| Topics | `topics` | `Label` | Topic pills from real labels |
| Posts | `page_body` | `Blog` | The render path. Locked. |
| CTA | `cta` | `HTML` | Closing call to action |
| Footer | `footer` | `HTML` | Footer columns and links |

## Staging and release

The first upload goes to a throwaway test Blogger blog, compared against the Ledger reference, before production. No automated upload, deployment, publication or DNS change is authorized. Source merge readiness, native platform acceptance and production release remain distinct.

## License

The Ledger engine is used by its owner under the PolyForm Noncommercial License 1.0.0 (see LICENSE).
