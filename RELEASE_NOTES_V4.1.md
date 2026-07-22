# MM Vulnerability Explorer V4.1 — Lamina Precision Polish

## Release scope

- Introduces shared MM Security Intelligence visual tokens.
- Harmonizes spacing, typography, badges, shadows, borders and reduced-motion behavior.
- Changes the Hero wording from “Executive decision” to “Operational decision”.
- Reinforces the MM Intelligence Score product signature.
- Improves the Operational Assessment document hierarchy.
- Synchronizes every displayed confidence label during client-side rerenders.
- Keeps the corrected PDF export binding so each export uses the latest CVE.
- Adds branded `Page X of Y` PDF pagination.
- Updates `CHANGELOG.md` for the 1.3.0 release.

## Suggested checks before push

1. Search a Critical CVE and a Low CVE.
2. Verify Hero A/B/C fallbacks with complete and incomplete source data.
3. Export CVE A, search CVE B, then export again and verify the second PDF.
4. Confirm both confidence labels display the same value.
5. Check desktop and mobile layouts.
6. Run `npm install` followed by `npm run build` in the normal development environment.

## Suggested commit

```text
release: MM Vulnerability Explorer v1.3.0

- add Lamina precision design tokens and visual polish
- align operational decision terminology
- improve PDF branding and pagination
- fix confidence label synchronization
- retain latest-CVE PDF export binding
- update changelog and release notes
```
