# FCD editorial design system

Source-grounded blue/navy identity from the corporate website's globals.css, audited at f2b0cfa205ce9009ae0f1abbdd2a6d2e438dd643. The brand accent is #3d8fe1 / oklch(0.6386 0.1467 251.2451); functional link colors are darker in light mode and lighter in dark mode for contrast. Tokens live in src/styles/tokens.scss. System sans/monospace fallbacks intentionally avoid network font dependencies; Inter/Fira Code are used if available locally, not claimed as bundled fonts.

Editorial signature: restrained masthead, ink-blue headlines, a lead card spanning two columns above the latest stream, useful Recent Posts sidebar. No huge hero, fake status panel, neon animation, glass or terminal decoration. Native labels provide actual topic navigation.

Widths covered in Actions: 320/360/375/390/430/640/768/1024/1280/1440/1920, light/dark. Menu is a non-modal mobile disclosure, not a popup search dialog. No focus trap is appropriate for this design. Core navigation remains visible without JS.

Simulation screenshots test stylesheet/script behavior but do not validate Blogger's actual wrapper DOM. The first implementation does not yet provide a separate one-lead-plus-two-secondary editorial region, syntax highlighting, rendered Mermaid, related articles, or card reading time. These remain explicit follow-up work, not hidden assumptions.
