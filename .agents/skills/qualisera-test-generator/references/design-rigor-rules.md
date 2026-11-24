# Design rigor rules

Read this in Phase 3 for every rule marked "yes" in the applicability table in SKILL.md. Every number, limit or time below is **illustrative only**: use the value from the AC, and if the AC has none, it is an open question, not a default. If a rule does not apply, write `N/A: <reason>` in the matrix.

## Contents
1. Deterministic expected outcome
2. Assertion strategy
3. Transaction and payment flows
4. Input probing
5. Decision tables
6. BVA and EP
7. State transitions and lockout
8. Information leakage
9. Non-functional and reliability

## 1. Deterministic expected outcome (always)
Every scenario has one clear, verifiable business outcome. Supporting assertions on related state changes are fine, but never write ambiguous OR outcomes such as "button disabled / alert shown".

## 2. Assertion strategy (always)
Verify actual content, business value or state, not mere presence. For example `expect(await screen.getSuccessMessage()).toEqual(i18n.<key>)`, a balance deduction or a status badge change. An element can be visible while holding empty text, wrong data or an error banner, so `toBeDisplayed()` alone is not an assertion. Literal text follows the literal-text rule in SKILL.md Phase 2.

## 3. Transaction and payment flows
Applies when the flow moves money or value, or creates irreversible server-side records. Read [payment-rules.md](payment-rules.md) for the applicability gate and the mandatory scenarios (end-to-end, idempotency, rollback/abort, authorization/IDOR for multi-user apps). Otherwise write `N/A: <reason>`.

## 4. Input probing
Applies when the AC has user-supplied input. Explore the unwritten gaps that matter: payload and file bounds (max limit, 0-byte, unsupported extension), character and encoding (emoji, leading/trailing whitespace, whitespace-only, symbols), and interruption (network drop mid-action, app backgrounded during processing). Edge variants of a confirmed AC are tagged with that AC; they are not `@derived`. In Outline Examples, wrap values in quotes when whitespace matters, because Gherkin trims unquoted cells.

## 5. Decision tables
When conditions interact (e.g. balance x amount x PIN) and `n <= 4`, enumerate all `2^n` combinations. For `n >= 5`, use pairwise plus every row touching a boundary or high-risk outcome. Mark every infeasible or collapsed row with its reason.

## 6. BVA and EP
- Numeric and financial inputs: 0, negative, decimals, non-numeric, empty.
- Fee and balance (only if the AC defines a fee or balance): `total debit = amount + fee`; test `balance = total - 1` (invalid), `balance = total` (valid), `balance = total + 1`.
- Time boundaries: `limit - 1`, `limit`, `limit + 1` in the AC's unit (a lock ending at 15:00 means test 14:59 and 15:00). These need a controllable clock (device clock, mocked or seeded server time). If none exists, mark `@manual` or `@blocked` and add clock control to the testability requests. Never plan to wait in real time.
- Mobile `maxLength` (only when the AC states a limit): native Appium inputs silently truncate, so assert that the field value length equals the limit instead of expecting an error alert.

## 7. State transitions and lockout
Applies when the AC defines a state machine or lockout. To verify a lockout, attempt login with the **correct password**: a wrong password during lockout proves nothing. Also verify the failure-counter reset (e.g. reset after one successful login before the limit).

## 8. Information leakage
Applies to authentication and credential flows. Error messages must be generic (e.g. "Invalid email or password") to prevent account enumeration. If the AC does not state this, record it as a `derived` AC.

## 9. Non-functional and reliability (ISO 25010)
Network interruption, concurrency/double-submit idempotency, app backgrounding/resuming, accessibility. Include only what is relevant to the architecture; for offline or local-only apps skip network scenarios and write `N/A: <reason>`. These scenarios are usually `@derived` and count toward the cap of 5 per feature unless a confirmed AC asks for them.
