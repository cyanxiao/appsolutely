# Validation — November 7, 2026

## Automated checks

- Raycast SDK: `@raycast/api` 2.11.1, checked against the stable npm release and installed TypeScript definitions.
- `npm test`: 26 tests passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed, including manifest schema, author lookup, icon validation, ESLint, and Prettier.
- `npm run build`: passed using Raycast's official production bundler.
- `npm run dev`: compiled and registered **Open Appsolutely** in Raycast.

Coverage includes folder hierarchy operations, cycle prevention, nested navigation data, application identity, search, migration, recovery, concurrent saves, high-resolution icons, transparent icon rejection, system icon fallback, folder preview compositing, and cache invalidation.

## Native verification

- Browsed discovered applications with real icons and launched an application from the grid.
- Created nested folders, moved applications between them, renamed and moved folders, and reopened the command to verify persistence.
- Searched globally from a folder and cleared search to restore its contents.
- Checked that deleting a folder subtree returned its applications to Home.
- Verified high-resolution icons and the system icon fallback for Books, whose legacy ICNS contains only transparent pixels.
- Verified a folder's composite icon updated when an app was removed.
- Captured the screenshots in `docs/screenshots/` using only stock macOS apps in a temporary demonstration layout, then restored the original organization.

## Checks before Store submission

- Inspect the Action Panel directly, including Reset Layout. The automation session could invoke registered shortcuts and forms but could not open the popup, including in Raycast's own Root Search.
- Verify discovery with disposable application installs, removals, and renames. No installed applications were modified during native testing.
- Check both appearance themes and capture Store-formatted 2000×1250 images with **Capture Window → Save to Metadata**.
- Confirm the intended Raycast Store author handle.

The build and development commands write to Raycast's extension development directory. Lint contacts Raycast for the author lookup and manifest schema. Appsolutely's runtime code makes no network requests.

No Raycast Store publication was performed. Repository-sharing checks are documented in [Privacy](PRIVACY.md).
