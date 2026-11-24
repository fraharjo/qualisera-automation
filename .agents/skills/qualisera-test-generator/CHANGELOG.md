# Changelog - qualisera-test-generator

## 3.0 (from 2.x)

### Behavior changes
- **`@assumption` vs `@blocked` decision rule** (Phase 2). One conventional outcome -> `@assumption`; two or more contradicting valid outcomes -> `@blocked`. Both need a concrete `Then` plus a `# Assumption:` / `# Open question:` comment. `@blocked` writes the `Then` for the (Recommended) option.
- **Modes**: `design` (default, stops at the checkpoint), `draft`, `full`, and non-interactive `batch`. Use `batch` for evals so runs are comparable.
- **Domain gates** on design-rigor rules: fee/balance, lockout and generic-error rules apply only when the AC involves them; otherwise `N/A: <reason>`.
- **`derived` is defined and capped**: only scenarios with no confirmed AC behind them, max 5 per feature, tagged `@derived`. Edge variants of a confirmed AC keep their `@AC-nn`.
- **Channel decision** (UI / API / Hybrid) with an `@api` tag; Background must match the channel.
- Language rule, tag-inheritance rule (Feature line carries `@REQ`, `@feature-*`, platform), quoted Examples values when whitespace matters.
- Removed the EXT-002-specific wording from the rules (overfitting risk); the examples are now generic.

### Structure
- SKILL.md cut from ~4,500 to ~2,800 words. Moved to `references/`: `design-rigor-rules.md`, `ui-contract-lifecycle.md`, `automation-feasibility.md`, `test-data-and-security.md`, `promotion-checklist.md`.
- The "may touch `features/`" exception now lives in one place (Ground rules).
- `scripts/check-generated.ts` automates the mechanical part of Phase 7 (`npm run check:generated -- generated/<feature>`).
- Unchanged and preserved in `references/`: `requirement-sources.md`, `test-design-techniques.md`, `payment-rules.md`, `implementation-patterns.md`.

### Eval notes
- Record `SKILL_VERSION=3.0` in the eval run. Re-run EXT-001..003 with `batch` mode, 3 runs per condition.
- Treat EXT-001..003 as the dev set. Add 3-4 new held-out requirements (at least one ambiguous, one conflicting, one that needs step reuse) and do not tune the skill against them.
