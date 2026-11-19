# QA Prompting Guide for AI (Qualisera Automation)

Ready-to-use prompts for the AI skills in `.agents/skills/`. Replace the `[...]` placeholders. Tag rules follow the README taxonomy; priority is `@p0/@p1/@p2` with the paired runner tag `@smoke` / `@regression`.

> The agent cannot read Jira or Figma unless a connector is installed. Paste the ticket text and attach Figma screenshots. If a source cannot be read, the skill will ask for an export instead of guessing.

---

## ⚡ Quick Frictionless Method (Any Format in `requirements/inputs/`)

You don't need to manually type PRDs or tables. Simply drop any raw requirement files into `requirements/inputs/<feature-name>/`:
- Raw Jira text (`jira_notes.txt`)
- Excel test case drafts (`cases.xlsx` or `.csv`)
- Figma screenshots (`screens.png`)
- Specification document (`prd.docx` or `spec.pdf`)

Then prompt:
```text
Hi, please create a Cucumber BDD test suite for [Android / iOS / Web] based on all the requirement materials in `requirements/inputs/[feature_name]`.
If you find any ambiguity or need to decide between @automated vs @manual for complex scenarios, please ask me questions one by one with your recommendations.
```

---

## 1. Design tests from a requirement (`qualisera-test-generator`)

```text
Use the qualisera-test-generator skill for feature [FEATURE_NAME, e.g. box] on [Android / iOS / Web].

--- SOURCES ---
Jira: [KEY, e.g. KTK-201] (text pasted below)
Figma: [frame names, screenshots attached]
My manual test cases: [path to CSV, e.g. docs/my-cases.csv, or pasted table]

--- ACCEPTANCE CRITERIA (verbatim from Jira) ---
[Paste description, AC field, and relevant comments]

--- KNOWN CONSTRAINTS ---
[Limits, supported languages, permissions, dependencies]

--- WHAT I WANT ---
1. Stop after the coverage matrix and open questions; do not write code until I approve.
2. Compare my manual test cases with your scenario pool: which ones are covered, which are missing from mine, and which of mine have no AC.
3. List conflicts between Jira and Figma.
4. After approval, write drafts to generated/[feature]/ only.
```

## 2. Generate code after approving the matrix

```text
The matrix for [FEATURE_NAME] is approved with these changes: [corrections / answers to open questions].
Generate test-matrix.md, [feature].feature, [feature].screen.ts and [feature].steps.ts in generated/[feature]/.
Reuse existing steps from shared/steps and features/*/steps. Mark any unverified selector with a TODO.
```

## 3. Promote a reviewed draft

```text
The draft in generated/[feature]/ is reviewed. Promote it to features/[feature]/, fix imports,
add the test:feature:[feature] script to package.json, run npm run typecheck and report errors.
```

## 4. Audit UX from evidence (`app-quality-advisor`)

```text
Use the app-quality-advisor skill. Evidence: [screenshots / Allure report / UI dump / description].
Feature: [name]. Deliver: [findings table / issue drafts / chat draft / requirement suggestions].
Mark anything you cannot see in the evidence as "Needs verification".
```

## 5. Self-healing: fix a failing test

```text
Scenario [@JIRA-KEY / @AC-xx] in feature [name] fails on [Android / Web].

--- ALLURE ERROR LOG ---
[Paste error log or stack trace]

--- RECENT UI / LOCATOR CHANGES ---
[Any id or screen hierarchy changes from the dev team]

Inspect the Screen Object and step definitions, find the root cause (selector, timing, data, or real bug),
and propose a fix. If it looks like a real app bug, say so instead of changing the test to pass.
```

## Tag cheat sheet

| Need | Tags |
| :--- | :--- |
| Traceability | `@AC-01`, `@JIRA-KTK-201` |
| Module | `@feature-<module>` |
| Priority + runner | `@p0 @smoke`, `@p1 @regression`, `@p2 @regression` |
| Execution | `@automated` or `@manual` |
| Platform | `@android`, `@ios`, `@web` |
| Type | `@functional`, `@negative`, `@bva`, `@security`, `@permission`, `@lifecycle` |

## 6. Manual Test Execution Dashboard (`@manual`)

For scenarios that require physical hardware, camera scanning, SMS OTP, or manual exploratory judgment:
1. Scenarios tagged with `@manual` are automatically excluded from WDIO automated runners.
2. Launch the interactive Manual QA Execution Dashboard:
   ```bash
   npm run test:manual:dashboard
   ```
3. Open `http://localhost:3000` to:
   - View all `@manual` test cases synchronized live from `.feature` files.
   - Record execution status (`Passed`, `Failed`, `Blocked`, `Not Executed`).
   - Link Jira bug tickets (e.g., `KTK-BUG-101`) on failure.
   - Attach screenshot evidence directly from clipboard or file upload.
   - Save session results to `reports/manual-results/manual-execution-results.json`.
