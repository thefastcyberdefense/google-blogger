# FCD editorial design system

Source-grounded blue/navy identity from the corporate website's globals.css, audited at f2b0cfa205ce9009ae0f1abbdd2a6d2e438dd643. The brand accent is #3d8fe1 / oklch(0.6386 0.1467 251.2451); functional link colors are darker in light mode and lighter in dark mode for contrast. Tokens live in src/styles/tokens.scss. System sans/monospace fallbacks intentionally avoid network font dependencies; Inter/Fira Code are used if available locally, not claimed as bundled fonts.

Editorial signature: restrained masthead, a home-only ink intro band (design v1), ink-blue headlines, a lead card spanning two columns above the latest stream, useful Recent Posts sidebar, one quiet call-to-action band and a two-row footer. No fake status panel, neon animation, glass or terminal decoration. Native labels provide actual topic navigation.

Widths covered in Actions: 320/360/375/390/430/640/768/1024/1280/1440/1920, light/dark. Menu is a non-modal mobile disclosure, not a popup search dialog. No focus trap is appropriate for this design. Core navigation remains visible without JS.

Simulation screenshots test stylesheet/script behavior but do not validate Blogger's actual wrapper DOM. The first implementation does not yet provide a separate one-lead-plus-two-secondary editorial region, syntax highlighting, rendered Mermaid, related articles, or card reading time. These remain explicit follow-up work, not hidden assumptions.

## Layout regions (design v1, 2026-10-03)

Owner-approved design v1 (2026-10-02) makes the shell four Layout-editable regions. The theme owns structure, headings, controls and search; each gadget owns only its copy or links, and a fresh install shows the design v1 defaults until the owner saves content. Each new gadget is a locked Version 2 widget alone in its own section (`maxwidgets='1'`, `showaddelement='false'`). Shared Pug mixins render the same markup for the theme and the fixtures.

| Region | Section / gadget | Theme-owned | Gadget-owned (default) |
| --- | --- | --- | --- |
| Masthead, every view | `header` / Header1; `navigation` / LinkList1 | brand row, Theme and Menu, the `#primary-navigation` drawer, `#site-search` | Navigation links (Latest, Topics, Guides, Company website with a decorative external mark) |
| Intro, first home page only | `intro` / HTML1, then `topics` / Label1 | ink band, eyebrow, `h1#intro-heading` "Security knowledge. Practical defense." | standfirst ("Research, threat insights, and guidance for stronger security.") |
| Call to action, every view | `cta` / HTML2 in `aside.cta-band` | full-width band between the content and the footer | h2 "Need help securing your organization?", one line and the Explore FCD services button |
| Footer, every view | `footer` / HTML3; `footer-gadgets` / Attribution1, ReportAbuse1 | brand name; Company website, Publication feed and Back to top links; copyright | tagline "Quick to Act, Strong to Protect." and blurb |

Copy rules for the owner's saved gadget content: Intro copy carries no heading (the theme owns the page h1); the Call to Action uses exactly one heading, a line and a link; Footer copy is a sentence or two with no heading. Saved content replaces the whole default for that gadget, including the default Call to Action button.

Layout behavior:

- Masthead: brand, links and search share one row when they fit and wrap on medium widths. Below 640 px, Menu discloses a stacked drawer with 48 px links above full-width search. Navigation links are at least 44 px tall.
- Intro: on the first home page only (`data:view.isHomepage and not data:newerPageUrl`) the band bleeds to the viewport edge with an ink background, white display headline, mono eyebrow with a brand dot that pulses only without reduced motion, and on-ink Topics chips. Other multi-item views keep the plain publication heading, so every view has exactly one h1. Print resets the band to plain text.
- Call to action: elevated full-width band with a top rule; copy and the 46 px button share a row when they fit, and the button is full width below 640 px. Print hides the band.
- Footer: brand and gadget copy on the left, links right-aligned on one row from 768 px; below 768 px the links stack under the copy with their text aligned to the brand. A bordered base row holds the copyright and the compact Attribution and Report Abuse gadgets (text at most 14 px). The footer carries no headings.

Tokens added: ink (`--ink`, `--ink-edge`, `--ink-line`, `--on-ink`, `--on-ink-muted`, `--on-ink-accent`) and call to action (`--cta-bg`, `--cta-fg`; navy with white text in light mode, the light accent with dark text in dark mode). Measured contrast: intro h1 17:1, eyebrow, links and focus 9.6:1, copy 9.6:1 and chips 13.2:1; CTA copy 12.4:1 and 5.6:1 light, 11.6:1 and 7.5:1 dark, button 17:1 light and 10.2:1 dark; footer text 13.6:1 light and 13.5:1 dark, muted footer text 6.2:1 light and 8.8:1 dark. These are token-pair calculations, not rendered-node or human contrast acceptance.

## Tokens and components (design v1, US-015)

The last design v1 story is CSS only: markup, sections, widget ids and every Header1, Blog1 and Label1 behavior are unchanged. It brings the design artifact's signature details to the shipped shell.

Tokens added: `--soft-border` (#d8e2ee light, #2d3d5a dark) for quiet card edges, `--mark` (#1a2a48 light, #2b4a7a dark) for the FCD mark tile, `--shadow` for the card hover and `--radius-card` (.875rem, 14 px) shared by every card.

- Signal line: a 3 px `--brand` line along the masthead's top edge (`.site-header::before`) replaces the earlier thick top border. A light highlight sweeps across it every 8 s only without a reduced-motion request; otherwise the line is static.
- Sweep cost (2026-10-04): the sweep animates transform only. With motion allowed the line is three masthead widths wide with the highlight at its centre, and the masthead clips the excess (`overflow-x: clip`, with `hidden` where clip is unsupported), so no frame restyles or repaints the line and the highlight follows the previous path and timing. In local Chromium (fixture masthead, four pages idle for 6 s) main-thread task time fell from about 0.3 s to 0.01 s and style recalculations from about 1,440 to 1; that is a local observation, not field data. The intro eyebrow pulse (first home page only) still animates box-shadow and is the remaining repainting animation.
- FCD mark: a 44 px `--mark` tile with white type and a faint accent inner ring; it stays hidden below 640 px.
- Cards: soft border, 14 px corners, 22 px padding and a 21 px title; the lead and secondary top rules are unchanged. On hover the border darkens to `--border` and the shadow appears; the 3 px lift and a 1.03 image zoom run only without a reduced-motion request.
- Advisory strip: labels above card and article titles read as mono uppercase 14 px text in `--primary`, separated by decorative slashes with empty alternative text, so assistive technology never announces them.
- Sidebar cards: Recent Posts, Follow the research, the Profile card and a populated archive card share the card radius, the soft border and 22 px padding, with one mono uppercase 14 px heading voice in `--muted-text`.

Measured contrast (token pairs, not rendered-node or human acceptance): advisory strip 6.6:1 light and 9.0:1 dark on the card surface; the mark's white type 14.3:1 light and 8.9:1 dark; sidebar headings 6.2:1 light and 8.8:1 dark. The fix commit `ec0565b` stated 6.4:1, 9.7:1 and 14.6:1; the figures here are the recomputed ones, also recorded in `4f381ec`.

Not added from the design artifact: card reading time and an avatar meta row, which Blogger does not provide natively.

## Native gadgets and shell chrome (L1)

Masthead: Header1 owns one brand row (brand link plus Theme and, below 640 px, Menu). Gadgets that Blogger places in the `header` section render after Header1 in a compact tray: text at most 0.875rem in the muted token, images and icons at most 32 px, headings no larger than body text, inline wrapping. The theme hides nothing. Blogger's platform `svg-icon-24` icons are sized to 24 px because the theme turns off Blogger's widget CSS.

Chrome rule: theme-owned cards (`.sidebar-panel`: Recent Posts and Follow the research) keep their chrome. The native `sidebar` section (`.sidebar-widgets`) never draws its own border, background, padding or shadow, and Blogger's empty `no-items` section is not displayed on public pages (`body:not(#layout)`), so it stays editable in the Layout editor. A populated archive gets a card only when Blogger supplies archive data (`has-items` from `data:this.data`, US-004b); an empty archive draws nothing.

| Gadget | L1 home | Presentation | Disposition |
| --- | --- | --- | --- |
| Header1 | `header`, locked | brand row with controls | keep |
| LinkList1 (Navigation) | `navigation`, inside the masthead drawer | Navigation links | new; the owner manages links in Layout |
| HTML1 (Intro) | `intro`, first home page only | intro band copy | new |
| HTML2 (Call to Action) | `cta`, every view | band copy and link | new |
| HTML3 (Footer) | `footer`, every view | footer tagline and blurb | new |
| Blog1 | unchanged | unchanged | keep |
| Label1 | `topics`, now inside the intro band | Topics chips (on-ink on the first home page) | keep |
| BlogArchive1 | `sidebar` | card only with archive data | keep |
| Profile1 | `sidebar` | Authors card: a heading from the gadget title ("Authors" when untitled) on team blogs, one row per author with a small avatar beside the name, theme-drawn default avatar | keep; theme-owned main since US-016 |
| Attribution1 | `footer-gadgets` | compact text-only credit, no logo | keep; theme-owned main since US-016 |
| ReportAbuse1 | `footer-gadgets` | small link | keep |
| Blog Search | none: FCD's `#site-search` is the single search (owner decision 2026-10-02) | compact in the masthead tray while saved | the owner deletes it in Layout at the native checkpoint |
| Any other gadget | `sidebar` | neutral, no card chrome | n/a |

The new gadget ids LinkList1 and HTML1 to HTML3 were assumed free. At the first native upload each new section held one gadget, but Navigation arrived hidden; a widget snapshot from the owner would show whether an earlier saved LinkList1 kept its hidden state. Fixture screenshots are design references, not Blogger proof.

## First native upload (owner, 2026-10-04)

The owner uploaded a CI theme artifact to production and shared light and dark home-page screenshots and three Layout screenshots; agents made no request to the blog. Rendered as designed: the signal line, the FCD mark, the intro band with its defaults, the initial empty-home state, the sidebar cards, the call to action, the two-row footer, dark mode and one h1.

Native rule learned: on Blogger, a widget's `super.main` resolves to Blogger's built-in markup for that widget type, not to the theme's `b:defaultmarkup`. Attribution1 rendered the Blogger logo (near invisible in dark mode) and Profile1 a bulleted list with an oversized photo, a black default icon and no heading. Where the design depends on a gadget's markup, the theme now renders that gadget's own main (US-016); ReportAbuse1 and BlogArchive1 keep `super.main`.

Authors card (US-016): the team heading uses the gadget title, or "Authors" when it is untitled; each author is one row with the avatar beside, not inside, the name link. Author photos are decorative (empty alternative text) because the name follows; the default avatar is a theme-drawn circle in `--muted-surface` and `--muted-text`, hidden from assistive technology, so it reads in both themes; if Blogger still renders its sprite avatar, it takes `--muted-text`.

Owner Layout items, not theme defects: unhide the Navigation gadget and save its links; delete the saved Blog Search gadget, which still renders its own search row above `#site-search`; Popular Posts and Featured Post saved in the Posts section are recommended for deletion; the two hidden AdSense gadgets and the hidden Pages gadget in Brand render nothing.
