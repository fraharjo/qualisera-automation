# Promotion checklist

The skill never promotes. After Phase 7, when the user approves a draft, remind them of these manual steps. The project README is authoritative if it differs.

1. Move files per the README layout (currently `.feature` to `features/<feature>/features/`, `.screen.ts` to `features/<feature>/pages/`, `.steps.ts` to `features/<feature>/steps/`). Fix import paths: drafts use paths relative to `generated/`.
2. Add npm scripts for a new module in `package.json`, one per platform the feature covers. The platform tag in the filter is mandatory, otherwise a `@web` scenario would run on Android:
   ```json
   "test:feature:<name>:android": "wdio run wdio.android.conf.ts --cucumberOpts.tags=\"@feature-<name> and @automated and @android and not @blocked\"",
   "test:feature:<name>:web": "wdio run wdio.web.conf.ts --cucumberOpts.tags=\"@feature-<name> and @automated and @web and not @blocked\""
   ```
   Add the iOS script (`wdio.ios.conf.ts`, `@ios`) only once that config exists.
3. Confirm every scenario has `@automated` (or `@manual`), `@feature-<name>`, a platform tag and its runner tag. Then run `npm run lint:tags && npm run typecheck` and the new `test:feature:<name>:<platform>` script.
4. Add a row to the README tag table (`@feature-<name>`) and run `npm run docs:generate`.
