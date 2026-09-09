# Phase 2B PR A: editorial experience

Approved 2026-09-09: 26-file preview, one branch feat/fcd-editorial-experience, one draft PR, branch-only source-bound XML transfer. Base ec08c4b9d1ba2cd35d9ec8a9bcbe557f2d01ca3d. No merge/deployment/deletion or publishing. Use FCD Superpowers + Ralph Development Loop + GSD Development Workflow and the accessibility reviewer. All automated builds/tests in GitHub Actions.

## Story ledger

A1: baseline measurements and behavioral red tests (in progress).
A2: native-context lead/secondary/standard cards without duplicate posts or a replacement posts loop (pending).
A3: responsive image policy and existing loaded-card filter layout (pending).
A4: long-form, opt-in in-body cover convention and print handling (pending).
A5: full exact-head evidence, self-review and regenerated XML consistency (pending).

Initial home uses first native eligible post as lead, next two as secondary, remaining standard. Other page types retain normal chronological catalogs. Small counts collapse naturally. Native V3/V2/Blog1/Header1/super.main/comments/pagination remain intact. No CSS reordering or display:contents flattening. Filtering uses a regular grid and clearing restores the original composition.

An author may mark an existing in-body figure fcd-article-cover. No automatic extra cover, body scraping or content edits. Normal-flow TOC, approximately 65-75ch prose measure, quieter CTA and print styles. No new runtime dependencies or requests.

Budgets: XML <=500000 bytes; added raw compiled CSS <=12288 bytes; added raw bundled JS <=2048 bytes against Actions-built base. Record gzip separately. Preserve existing regression coverage. Actual Blogger import/save, human accessibility and cross-browser expansion are separate gates, not passed by simulations.

Related content/feed/search expansion and SEO expansion remain PR B/C. Exact approved manifest is the owner-approved PR A preview; stop for any required out-of-scope files. This initial record makes no completion claims.
