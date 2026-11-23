# Payment & Transaction Rules (conditional)

Read this file only when the **Transaction & Payment Flows** rule in `SKILL.md` applies. Do not force these scenarios onto apps that have no real transaction flow.

## Applicability gate

- **Core transaction gate (scenarios 1-3)**: The flow moves money or value (checkout, transfer, top-up, billing, subscription), or creates irreversible server-side records.
- **Multi-user gate (scenario 4 - IDOR)**: In addition to the core gate, the app has multiple users or accounts.

If the core gate is false (e.g., offline or local-only app with no real transaction), write `N/A: <reason>` in the matrix, for example `N/A: offline single-user app, no server-side transactions`. If only the multi-user gate is false (single-user app with server billing), cover scenarios 1-3 and mark scenario 4 as `N/A: single-user app, no cross-user authorization boundary`. Do not invent cloud, account or payment constraints to justify the scenarios.

## Mandatory scenarios (when the gate passes)

1. **Full end-to-end path**: initiate, process, success confirmation. Assert the business outcome (balance change, status value, record created), not only that a success screen is visible.
2. **Idempotency**: a rapid retry or double-submit must process exactly once (zero double charges). Drive it with parallel API requests and assert backend state. This needs a test API; if there is none, mark the scenario `@blocked` and list the API in the testability requests. Do not use sub-300ms UI double-taps as the main check, they are unreliable.
3. **Rollback and abort**: a network failure or user cancellation mid-flight must restore balance and state with no orphan records. Assert both the user-visible state and the backend record.
4. **Authorization and IDOR guard** *(multi-user apps only)*: user A must not be able to view, approve or pay transactions that belong to user B. This needs two isolated test users from the data factory.

## Data and environment needs

Add what is missing to the testability requests:
- Two isolated users for multi-user/IDOR checks (never shared static accounts), created per test or via a seed/reset endpoint.
- A test API or backend inspection hook for state assertions.
- Sandbox payment cards and `@example.com` test domains only.
- A controllable clock if the flow has time limits (expiry, cut-off times).

## Writing the scenarios

- One behavior and one clear business outcome per scenario, with the expected result from the AC or from business state. If the AC does not specify success wording, follow the **literal-text / i18n rule** in `SKILL.md` (assert state, tag `@assumption`, ask for the copy).
- Tag security scenarios `@security`, concurrency ones `@concurrency`, and keep the `@feature-<module>`, platform, and runner tags required by the taxonomy.
- Fee and balance boundaries follow the **BVA fee & balance rule** in `SKILL.md`: `total debit = amount + fee`, then test `total - 1`, `total`, `total + 1`.
