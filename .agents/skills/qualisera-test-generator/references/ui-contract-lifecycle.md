# UI contract lifecycle and selector rules

## Contents
1. Selector rules
2. Initial run: the checklist
3. Subsequent run: new build reconciliation
4. Element diagnosis
5. Audit

## 1. Selector rules
- **Existing apps**: never invent selectors. Search existing page objects (`features/*/pages/`) and extract real locators from UI dumps (`adb shell uiautomator dump`, Appium Inspector, or browser DOM).
- **Greenfield, unfinished or shift-left features**: wrap unmapped locators with `this.contract('<screen>-<element>-<type>')`.
- Always declare assertion selectors: success screens (home/dashboard), validation error elements, generic credential error banners.
- Prefer accessibility ids over XPath. If a testability hook is missing, list it in the matrix as a developer request instead of writing brittle XPath.

## 2. Initial run: the checklist
When any element uses `this.contract(...)`, output an **Actionable Missing Locator / UI Contract Checklist** table in chat and in `test-matrix.md`:

| Screen | Element getter | Recommended contract ID | Dev format |
| :--- | :--- | :--- | :--- |

Then ask whether the user wants to fill in known selectors now or keep the contracts for developer handoff.

## 3. Subsequent run: new build reconciliation
When a new app build or staging deployment arrives, offer three options before or during execution. Drafts in `generated/` are the default; updating promoted Screen Objects under `features/` happens **only** when the user explicitly selects A or B, and this is the only permitted edit outside `generated/`.
- **[A] Auto-scan**: connect to the device/browser, dump the active UI tree, reconcile contracts and update the Screen Objects.
- **[B] Interactive fill-in**: the user gives selectors in chat (e.g. `submitBtn uses #btn-checkout`) and the agent updates the Screen Objects.
- **[C] Skip and execute**: run with the existing contract fallbacks.

## 4. Element diagnosis
Classify every missing or failing element into one of four categories:
- `TESTABILITY GAP`: the element is visible on screen/in the UI tree (has text or shape) but lacks `content-desc`, `resource-id` or `data-testid`. Action: developer request, not a functional defect.
- `POTENTIAL DEFECT`: the element is completely absent at the state where an AC requires it. Action: flag as a potential bug or missing feature.
- `CONDITIONAL / STANDBY`: a dynamic element that appears only after a trigger (`error...`, `toast...`, `alert...`, `modal...`). Expected to be absent on the initial screen state.
- `TIMING / NAVIGATION MISMATCH`: the active Activity (Android) or URL (Web) does not match the target screen. Action: fix synchronization or waits.

## 5. Audit
`npm run check:contracts` lists all unresolved UI contracts across all Screen Objects at any time.
