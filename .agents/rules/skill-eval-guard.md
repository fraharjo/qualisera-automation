# Skill Regression Eval Guard (`qualisera-test-generator`)

Whenever you edit `.agents/skills/qualisera-test-generator/SKILL.md` or any file under `.agents/skills/qualisera-test-generator/references/`:

1. **Automatically run the regression evaluation** defined in `.agents/skills/qualisera-test-generator/evals/golden-suite.md` before declaring the skill change complete (unless the user explicitly says to skip evals).
2. Run all 3 Golden Benchmark Cases in parallel using read-only `research` subagents that strictly follow `SKILL.md` (Phases 1–5):
   - **Case 1: SauceDemo / Swag Labs (`EXT-001`)** — Web login access controls (`locked_out_user`), error dismissal, and checkout mandatory fields/completion.
   - **Case 2: RealWorld Conduit (`EXT-002`)** — Web complex article CRUD, dynamic slug updates on title changes, and JWT ownership/IDOR authorization (`401`/`403`).
   - **Case 3: OWASP Secure Password Reset (`EXT-003`)** — Android anti-account enumeration, 15-minute token expiry BVA, password complexity, and multi-device session invalidation.
3. Score all 3 outputs using the 5-criterion rubric (`0–2` per criterion, max `30` total) in `golden-suite.md` and report:
   - Score per case and total score (`X / 30`).
   - Any regressed criteria or missed expected signals compared to the benchmark baseline.
4. If any case drops below `9.0 / 10` or misses a critical signal (e.g., Gate 1 human review pause, deterministic measurable outcomes, IDOR authorization rigor, anti-enumeration, or anti-scope-creep), flag the regression immediately and propose a fix before finishing.
