# Staging before production

1. Select a successful Actions run and record source SHA, artifact checksum and outstanding gates.
2. Export the existing Blogger XML, content and Layout configuration before changing any live theme.
3. Upload dist/theme.xml to a separate staging Blogger blog using Theme > Restore, then save in Blogger.
4. Check the theme-build metadata matches the artifact's source commit. Configure Header1/Blog1/topics/sidebar widgets without cosmetic ID changes.
5. Check actual home, post, label, search, archive, static, error and pagination views. Include native comments, feeds and theme-JS-disabled content.
6. Run staging browser/a11y and performance checks through Actions; human screen-reader testing remains separate. The initial deploy:check is only a homepage smoke gate, not the full suite.
7. Ask for production replacement approval only after import/render and other release gates pass.
8. Restore the saved XML and widget configuration if rollback is needed.

No production theme, post content, main website or DNS is modified by source CI. Missing staging URL or expected build is BLOCKED, not a pass.
