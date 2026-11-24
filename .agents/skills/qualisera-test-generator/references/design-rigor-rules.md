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
10. Data export and document generation
11. Overlays, modals, and navigation lifecycle
12. Visual evidence and requirement discrepancy scan

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
- **Pair Boundary Testing for Window Limits**: When testing rolling periods or calendar caps (e.g. 24 months), split into two separate scenarios: (1) inside boundary (month 24) must be accepted/displayed, (2) outside boundary (month 25) must be excluded/rejected.
- Mobile `maxLength` (only when the AC states a limit): native Appium inputs silently truncate, so assert that the field value length equals the limit instead of expecting an error alert.

## 7. State transitions and lockout
Applies when the AC defines a state machine or lockout. To verify a lockout, attempt login with the **correct password**: a wrong password during lockout proves nothing. Also verify the failure-counter reset (e.g. reset after one successful login before the limit).

## 8. Information leakage
Applies to authentication and credential flows. Error messages must be generic (e.g. "Invalid email or password") to prevent account enumeration. If the AC does not state this, record it as a `derived` AC.

## 9. Non-functional and reliability (ISO 25010)
Network interruption, concurrency/double-submit idempotency, app backgrounding/resuming, accessibility. Include only what is relevant to the architecture; for offline or local-only apps skip network scenarios and write `N/A: <reason>`. These scenarios are usually `@derived` and count toward the cap of 5 per feature unless a confirmed AC asks for them.

## 10. Data export and document generation (Universal)
Applies whenever an application generates or downloads data files (PDF statements, CSV exports, Excel sheets, TXT reports, or JSON exports) across Web, Android, or iOS. An assertion on mere file existence or a success toast is insufficient.

### Atomic Assertion Principle for Document Verification
To ensure precise fault localization in automated test runs, avoid bundling all document validations into a single giant test case. Break down document inspection into distinct atomic scenarios:
1. **Header & Metadata Integrity**: Verify author/account name, user identifier/email, document title, generation date, and target period label.
2. **Table Column Structure**: Verify presence, names, and visual ordering of all expected tabular columns.
3. **Data Parity & Zero Leakage**: Every row/record in the exported file must match backend records for the selected period/filter; zero records from adjacent periods or unauthorized accounts.
4. **Data Formatting & Compliance**: Verify currency formatting (e.g. `Rp...`, `$`, `€`), locale-appropriate date formats, and regulatory/privacy disclosures.
5. **Layout & Volume Thresholds**: Test 3 boundary states: (a) zero records (empty state in document), (b) standard single-page dataset, (c) heavy dataset exceeding single-page threshold to verify multi-page pagination (`Page 1 of X`) without overlapping or clipped text.
6. **Boundary & Timezone Handling**: Records generated at the first second (`00:00:00`) and the last second (`23:59:59`) of the target period in the application's timezone must be correctly included without timezone clipping.
7. **Filter Independence**: Explicitly verify whether the exported file applies active on-screen search/filter criteria or exports the entire raw period dataset.
8. **Status Inclusion**: Verify whether non-successful statuses (Pending, Failed, Cancelled, Refunded) are included with distinct status badges or excluded.

## 11. Overlays, modals, and navigation lifecycle (Universal)
Applies to any overlay UI element: Dialogs, Bottom Sheets, Drawers, Lightboxes, Modals, Popovers, and Native Share Sheets.
- **Triple Exit Rule**: Every overlay must have test scenarios verifying all available exit mechanisms:
  1. *Explicit Control*: Tapping Close `X`, Cancel, or Done button.
  2. *Backdrop / Scrim Tap*: Clicking or tapping outside the modal boundary on the dimmed backdrop.
  3. *System / Hardware Back*: Triggering system navigation (Android `driver.back()`, iOS swipe-from-edge gesture, or Web `Escape` key).
- **Multi-Hop Navigation & State Preservation**:
  When a flow navigates from `Screen A` -> `Modal` -> `Sub-screen B` (e.g. Help Center / External Webview) -> `Back`:
  - Verify back navigation returns cleanly to `Screen A`.
  - Verify intermediate modal is not stuck open.
  - Verify underlying form state, selected radio options, or input drafts are preserved without unintended reset.

## 12. Visual evidence and requirement discrepancy scan (Shift-Left)
Applies whenever Figma frames, wireframes, screenshots, or UI hierarchy dumps accompany requirement tickets. In Phase 2, actively scan for and document an **Observations / Potential Defects** table before designing test cases:
- **Broken Assets & Placeholders**: Missing images, broken asset icons, or exposed placeholder strings (`Lorem ipsum`, `chara_placeholder`, `alt_image`).
- **Localization & Language Mixing**: Inconsistent language usage across connected screens (e.g. English main app navigating to an untranslated native-language help page).
- **Visual vs Specification Gaps**: Critical business constraints present in visual mockups (e.g. 2-year rolling limit text) that are completely omitted from Jira user stories/ACs.
- **Sorting Contradictions**: Differences in sort direction between screens or between UI display (e.g. descending) and exported documents (e.g. ascending).
