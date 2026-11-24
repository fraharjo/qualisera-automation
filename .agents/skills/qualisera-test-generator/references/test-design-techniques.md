# Test design techniques

Contents: techniques (1-7), quality checklist, heuristics for edge cases, worked example.

Use a technique only when the AC gives it something to work on. Name the technique in the scenario pool so a reviewer can see why a scenario exists.

## 1. Equivalence partitioning (EP)

Split each input into classes the system should treat the same, then test one representative per class.

- Valid classes: typical value, each distinct valid format (for example, letters only, letters with spaces, with emoji).
- Invalid classes: empty, whitespace only, too short, too long, wrong type, forbidden characters, malformed format.

Test one value per class, not ten values from the same class.

## 2. Boundary value analysis (BVA)

For every limit, test just outside, on, and just inside it.

| Limit | Values to test |
| :--- | :--- |
| Min = 1 | 0 (invalid), 1 (valid), 2 (valid) |
| Max = 50 | 49 (valid), 50 (valid), 51 (invalid) |

Remember that "length" depends on what is counted. Check how the requirement counts characters: emoji and combining characters can be multiple code units, and trailing spaces may or may not be trimmed before counting. If the AC does not say, that is an open question, not a guess.

### Pair Boundary Rule for Rolling & Window Limits
Whenever a window, rolling time limit (e.g. past 2 years / 24 months), or date cap exists, split into two distinct paired scenarios:
1. **Inside Boundary (Threshold - 0)**: Record at the exact innermost valid limit (e.g. Month 24) -> MUST BE INCLUDED / ACCEPTED.
2. **Outside Boundary (Threshold + 1)**: Record one step beyond the limit (e.g. Month 25) -> MUST BE EXCLUDED / REJECTED.

## 3. Decision tables

Use when behavior depends on a combination of conditions (permission granted/denied times device state times user role). List the conditions as columns, enumerate the meaningful combinations, and record the expected action for each. Collapse rows that behave identically and say so.

## 4. State transitions

Use when an object has a lifecycle (draft, saved, archived, deleted, restored). Draw the states and transitions, then cover:

- Every valid transition at least once.
- Invalid transitions (an action not allowed in a state) and what the user sees.
- Sequences that return to a previous state (create, delete, undo).
- Interruptions mid-transition (back button, app backgrounded, process killed).

## 5. Use-case and flow variations

For each main flow, cover: the main success path, each alternative path in the requirement, and each point where the user can cancel or go back.

## 6. Error guessing and heuristics

Use experience-based prompts to find what the requirement forgot:

- Duplicates (same name twice, same item added twice).
- Case and whitespace differences (`Item`, `item`, ` item `).
- Rapid repeated actions (double tap, tap during loading).
- Leaving the screen with unsaved input.
- Very long text, very many items, zero items.
- Special content: emoji, right-to-left text, accented characters, markup-like or script-like strings, newline characters. These check safe handling and correct display, not attack technique.

### UI Widget & State Mutation Heuristics
- **Radio Button Mutability**: Tap an already selected radio button (must remain selected, not unexpectedly deselect).
- **Pill / Chip / Tab Group Switch**: Switching categories or year chips dynamically reloads dependent lists and resets or re-evaluates active selections and submit button states.
- **Post-Success Mutation**: Changing input or period selections after a success toast/banner (does the success banner immediately dismiss or persist?).
- **Duplicate Actions**: Submitting or downloading the exact same entity/file twice (overwrite behavior, duplicate file naming `(1)`, or duplicate banner display).
- **Empty Search/Filter in Populated Datasets**: Applying an on-screen filter or search query that returns zero results on a populated screen (is the primary action/download button still visible or hidden?).

## 7. Pairwise (only when many independent parameters)

When several independent settings multiply into too many combinations, cover every pair of values at least once instead of every combination. Skip it for small input spaces.

## Quality checklist (run per feature, not per AC)

Mark each item as covered, not applicable (with a reason), or a gap.

- **UI states**: ideal, empty, loading, error, partial or overflow (long text, truncation).
- **Accessibility**: labels for screen readers, touch target size, contrast, focus order, text scaling.
- **Localization**: every supported language, no mixed-language screens, text that grows and gets truncated, date and number formats.
- **Mobile lifecycle**: backgrounding and resuming mid-flow, rotation, process death and restore, low memory, interruptions (call, notification).
- **Network**: offline, slow connection, loss and return of connection mid-action, server errors (4xx, 5xx), timeouts. Only where the feature touches a network.
- **Permissions and hardware**: permission denied, denied permanently, granted then revoked, hardware absent. Camera, storage, notifications.
- **Concurrency and idempotency**: double submit, two quick actions in a row, retry after failure.
- **Data**: persistence after restart, backup and restore, migration after an update, import limits.
- **Security-relevant input**: unusual input is handled safely, sensitive data is not shown in logs or screenshots.

## Worked example (short)

AC-03: "An item name must be 1 to 50 characters. The Save button saves the item."

| ID | Bucket | Technique | Scenario |
| :--- | :--- | :--- | :--- |
| ITEM-P01 | Positive | EP | Save an item with a typical name |
| ITEM-E01 | Edge | BVA | Name with exactly 1 character is saved |
| ITEM-E02 | Edge | BVA | Name with exactly 50 characters is saved |
| ITEM-N01 | Negative | BVA | Name with 51 characters is rejected with a clear message |
| ITEM-N02 | Negative | EP | Empty name cannot be saved |
| ITEM-N03 | Negative | EP | Whitespace-only name cannot be saved |
| ITEM-E03 | Edge | Error guessing | Name with emoji and accented characters is saved and displayed correctly |
| ITEM-E04 | Edge | Error guessing | Duplicate name behavior (open question if the AC is silent) |
| ITEM-E05 | Edge | State transition | App is backgrounded while the name field is filled; input is kept on return |

Triage: P01 and N02 become `@p0 @smoke`; N01, N03, E01, E02, E03 become `@p1 @regression`; pure stress/extreme cases become `@p2 @regression`; E04 is blocked until the duplicate rule is defined; E05 is `@p2 @automated @lifecycle` if the runner can background the app.
