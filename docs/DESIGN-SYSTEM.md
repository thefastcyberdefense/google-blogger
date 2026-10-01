# FCD editorial design system

Source-grounded blue/navy identity from the corporate website's globals.css, audited at f2b0cfa205ce9009ae0f1abbdd2a6d2e438dd643. The brand accent is #3d8fe1 / oklch(0.6386 0.1467 251.2451); functional link colors are darker in light mode and lighter in dark mode for contrast. Tokens live in src/styles/tokens.scss. System sans/monospace fallbacks intentionally avoid network font dependencies; Inter/Fira Code are used if available locally, not claimed as bundled fonts.

Editorial signature: restrained masthead, ink-blue headlines, a lead card spanning two columns above the latest stream, useful Recent Posts sidebar. No huge hero, fake status panel, neon animation, glass or terminal decoration. Native labels provide actual topic navigation.

Widths covered in Actions: 320/360/375/390/430/640/768/1024/1280/1440/1920, light/dark. Menu is a non-modal mobile disclosure, not a popup search dialog. No focus trap is appropriate for this design. Core navigation remains visible without JS.

Simulation screenshots test stylesheet/script behavior but do not validate Blogger's actual wrapper DOM. The first implementation does not yet provide a separate one-lead-plus-two-secondary editorial region, syntax highlighting, rendered Mermaid, related articles, or card reading time. These remain explicit follow-up work, not hidden assumptions.

## Native gadgets and shell chrome (L1, 2026-10-01)

Masthead: Header1 owns one brand row (brand link plus Theme and, below 640 px, Menu). Gadgets that Blogger places in the `header` section render after Header1 in a compact tray: text at most 0.875rem in the muted token, images and icons at most 32 px, headings no larger than body text, inline wrapping. The theme hides nothing. Blogger's platform `svg-icon-24` icons are sized to 24 px because the theme turns off Blogger's widget CSS.

Chrome rule: theme-owned cards (`.sidebar-panel`: Recent Posts and Follow the research) keep their chrome. The native `sidebar` section (`.sidebar-widgets`) never draws its own border, background, padding or shadow, and Blogger's empty `no-items` section is not displayed on public pages (`body:not(#layout)`), so it stays editable in the Layout editor. A data-conditional `has-items` card for populated gadgets is planned, not shipped: a populated archive currently renders without a card frame.

| Gadget | L1 destination | Presentation | Disposition |
| --- | --- | --- | --- |
| Header1 | `header`, locked | brand row with controls | keep |
| Blog1, Label1 | unchanged | unchanged | keep |
| BlogArchive1 | `sidebar` | native content, no section frame | keep |
| Attribution | `footer` by saved id (US-004, pending B1) | compact text link, no logo | retain in footer |
| Report Abuse | `footer` by saved id (US-004, pending B1) | small link | retain in footer |
| Profile | `sidebar` Contributors card by saved id (US-004, pending B1) | avatars at most 48 px | retain in sidebar |
| Blog search | not supported (duplicates the primary search) | compact in the masthead tray while saved | remove at the native checkpoint |
| Any other gadget | `sidebar` | neutral, no card chrome | n/a |

Until US-004 lands, saved Attribution, Report Abuse and Profile gadgets stay wherever Blogger saved them and are contained in the masthead tray. Fixture screenshots are design references, not Blogger proof.
