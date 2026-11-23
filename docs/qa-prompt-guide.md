# QA Prompting Guide for AI (Qualisera Automation)

A practical, step-by-step guide for manual testers, QA engineers, and developers to generate, review, and execute test automation suites using AI agents within the Qualisera framework.

> [!TIP]
> **TL;DR (Quick Start)**: Drop requirement notes, Jira text, or Figma screenshots into `requirements/inputs/<feature>/` and jump directly to **[Section 4: Fast-Track Method](#-4-fast-track-method-recommended-default)** to copy a 1-sentence prompt!

---

## 🚀 1. Getting Started: Who & What Is This For?

### Who is this guide for?
- **Manual Testers & QA Engineers**: Generate structured BDD feature files and test matrices from Jira stories, Figma designs, or simple text notes without writing code manually.
- **Automation Engineers**: Accelerate Screen Object and Step Definition drafting with standardized ISTQB techniques (EP, BVA, Decision Tables).
- **Developers & Product Owners**: Validate acceptance criteria completeness and uncover edge-case gaps before development begins.

### Which tools run these prompts?
You can use these prompts in any AI assistant operating inside this repository:
- **Google Antigravity (AGY)**: Reads `.agents/skills/` natively.
- **Cursor IDE / VS Code AI / Claude Code / GitHub Copilot**: If your AI tool does not automatically detect repository skills, simply prefix your prompt with:
  > *"Please read `.agents/skills/qualisera-test-generator/SKILL.md` before proceeding."*

### How does the AI work here?
The framework includes specialized QA skills in `.agents/skills/`:
1. `qualisera-test-generator`: Analyzes requirements into test matrices, Gherkin `.feature` files, Screen Objects, and step definitions.
2. `app-quality-advisor`: Audits usability, empty states, accessibility, and UX quality from screenshots and UI evidence.

> [!NOTE]
> **Jira & Figma Input Rule**: The AI cannot read live Jira tickets or Figma links directly unless an MCP connector is configured. Paste the ticket text and attach Figma screenshots (`.png`, `.jpg`). Supported raw input formats: `.txt`, `.md`, `.csv`, `.png`. If your tool cannot parse `.xlsx` or `.docx`, export them to `.csv` or `.txt` first.

> [!IMPORTANT]
> **The Approval Gate Rule**: The AI is instructed **never to write test code immediately**. It will first design a **Test Coverage Matrix** and ask you clarifying questions. You review the matrix, answer any questions, and only when you say **"Approved"** (or **"Setuju"**) will the AI write the code.

---

## 🔄 2. End-to-End Workflow (6-Step Lifecycle)

```
[1. Input] ────────► [2. Matrix & Qs] ────────► [3. Approval Gate]
 Drop raw files in    AI analyzes AC &           You review, answer
 requirements/inputs  designs matrix table       questions & approve
                                                         │
                                                         ▼
[6. Run & Report] ◄── [5. Promotion]  ◄──────── [4. Draft Code]
 Execute test runner   Move from generated/      Safe staging in
 & open Allure         to features/ suite        generated/<feature>
```

1. **Input**: Provide requirements (raw text, Jira ticket, Figma screenshots in `requirements/inputs/<feature>/`).
2. **Matrix & Questions**: The AI analyzes the Acceptance Criteria (AC), applies ISTQB techniques (EP, BVA), and lists open questions.
3. **Approval Gate**: You review the matrix, answer questions, and reply **"Approved"** (or request adjustments).
4. **Draft Code Generation**: The AI generates Gherkin `.feature` files, Screen Objects, and step definitions in `generated/<feature>/`.
5. **Promotion**: Once reviewed, the files are promoted to `features/<feature>/` and verified with `npm run typecheck`.
6. **Execution & Reporting**: Run tests via WebdriverIO (`npm test`) and view the interactive Allure Dashboard (`npm run report:open`).

---

## 📖 3. Plain-English Glossary (Don't Get Lost in Jargon)

| Term | What It Means in Simple Words |
| :--- | :--- |
| **Acceptance Criteria (AC)** | The official checklist of what a feature must do to be considered complete (e.g., "Password must be at least 8 characters"). |
| **BDD (Behavior-Driven Development)** | Software testing methodology using human-readable `Given-When-Then` natural language syntax. |
| **Gherkin** | The structured keywords (`Feature`, `Scenario`, `Given`, `When`, `Then`) used inside `.feature` files. |
| **Step Definition** | The underlying TypeScript code that connects each Gherkin sentence to browser/app actions. |
| **Coverage Matrix** | A traceability table mapping requirements to positive, negative, and edge test scenarios. |
| **ISTQB** | International standard software testing techniques (Equivalence Partitioning, Boundary Value Analysis, State Transition). |
| **Boundary Value Analysis (BVA)** | Testing values at the extreme edges (e.g., if transfer limit is Rp10.000 to Rp50.000.000, test Rp9.999, Rp10.000, Rp50.000.000, and Rp50.000.001). |
| **Equivalence Partitioning (EP)** | Grouping inputs into valid and invalid sets so you test smart without brute-forcing every single input. |
| **Screen Object** | A TypeScript class representing an app screen/page, storing element locators (buttons, inputs) and user actions. |
| **Draft (`generated/`)** | Safe staging folder where the AI writes initial code. It will never break production tests while in draft. |
| **Promoted (`features/`)** | The official test suite folder. Code here is executable by runners (`npm test`) and checked by TypeScript (`npm run typecheck`). |
| **Self-Healing** | The AI diagnoses failed tests (e.g., changed button id or timing issue) and proposes minimal locator or wait fixes. |
| **Typecheck (`npm run typecheck`)** | Running the TypeScript compiler (`tsc --noEmit`) to verify that all imports, types, and syntax are 100% error-free. |
| **Allure Report** | Interactive web dashboard showing test execution history, pass/fail charts, duration, and error screenshots. |
| **@p0 vs @p1 vs @p2** | `@p0` = Blocker / Critical user journey (always paired with `@smoke`).<br>`@p1` = Core feature requirement (paired with `@regression`).<br>`@p2` = Edge cases, secondary paths (paired with `@regression`). |
| **@automated vs @manual** | `@automated` runs via WebdriverIO runners.<br>`@manual` runs via the interactive QA Dashboard (`npm run test:manual:dashboard`) for OTPs, physical biometrics, or camera scans. |

---

## ⚡ 4. Fast-Track Method (Recommended Default)

This is the fastest and easiest way. You don't need to type long prompts.

### Step 1: Drop requirement files
Save your requirement notes, exported tickets, or screenshots into:
`requirements/inputs/<feature-name>/`
- Raw notes (`notes.txt` or `requirements.md`)
- Exported test cases (`cases.csv`)
- Figma screenshots (`screen_1.png`)

### Step 2: Send the Prompt

#### 🇮🇩 Indonesian Prompt
```text
Halo, tolong buatkan test suite Cucumber BDD untuk platform [Android / iOS / Web] berdasarkan seluruh materi requirement yang ada di folder `requirements/inputs/[nama_fitur]`.

Aturan penting:
1. Berhenti setelah membuat Test Coverage Matrix dan daftar pertanyaan terbuka. JANGAN tulis kode dulu sebelum saya review dan setujui (approval gate).
2. Tentukan mana skenario yang @automated dan mana yang @manual (misal: OTP fisik, hardware/kamera).
3. Jika ada requirement yang ambigu atau bertentangan, tanyakan satu per satu dengan rekomendasi solusinya.
```

#### 🇬🇧 English Prompt
```text
Hi, please create a Cucumber BDD test suite for [Android / iOS / Web] based on all requirement materials in `requirements/inputs/[feature_name]`.

Critical rules:
1. Stop immediately after producing the Test Coverage Matrix and open questions. DO NOT generate code until I review and approve (approval gate).
2. Clearly classify scenarios into @automated vs @manual (e.g. physical OTP, biometric hardware).
3. If you find ambiguities or contradictions, list them with your recommended options.
```

---

## 💡 5. Real-World Worked Example: Login & Account Lockout

Here is an exact walkthrough showing what you give the AI and what you get back.

### The Input You Provide:
Save the following text as `requirements/inputs/login/notes.txt`:
```text
Feature: User Login
Platform: Android & Web
AC:
1. User enters valid email format and password (minimum 8 characters).
2. If wrong password is entered 3 times consecutively, the account is locked for 15 minutes.
3. Countdown timer or lockout notice ("Akun dikunci 15 menit") must be displayed during active lockout state.
```

### Prompt Sent:
Send the Fast-Track prompt from Section 4, replacing `[Android / iOS / Web]` with `Web` and `[feature_name]` with `login`.

### What the AI Returns (Summary Preview):
*(Example preview — actual AI output will adapt to your live app locators)*

1. **Coverage Matrix Table**:
   - `TC-LOGIN-01` (`@AC-01 @p0 @smoke @automated`): Successful login with valid email and 8-character password.
   - `TC-LOGIN-02` (`@AC-01 @p1 @regression @automated`): Password < 8 characters rejected with client validation error.
   - `TC-LOGIN-03` (`@AC-01 @p1 @regression @automated`): Incorrect password attempt 1 and 2 shows generic credentials error.
   - `TC-LOGIN-04` (`@AC-02 @p0 @smoke @automated`): 3rd consecutive failed password attempt triggers 15-minute account lockout.
   - `TC-LOGIN-05` (`@AC-02 @p1 @regression @automated`): 4th attempt with *correct* password while locked is rejected.
   - `TC-LOGIN-06` (`@AC-02 @p2 @regression @automated`): Lockout duration boundary (14:59 locked vs 15:00 unlocked).
   - `TC-LOGIN-07` (`@AC-01 @p1 @regression @automated`): Invalid email format (missing `@` or domain) shows validation message.
   - `TC-LOGIN-08` (`@AC-03 @p1 @regression @automated`): Lockout notice and countdown timer displayed during active lockout state.

2. **Full Scenario Snippet Example**:
   ```gherkin
   @REQ-LOGIN @AC-01 @feature-login @p0 @smoke @automated @web @functional
   Scenario: Successful login with valid email and 8-character password
     Given the user is on the login page
     When the user submits email "tester@example.com" and password "ValidPass1!"
     Then the user should be redirected to the dashboard screen
   ```

3. **Clarifying Questions**:
   - *Q1*: Is the 3x failure counter reset upon successful login, or only after 15 minutes? (Recommendation: reset counter immediately on successful login).
   - *Q2*: Is lockout applied per account or per client device/IP? (Recommendation: per account).
   - *Q3*: Test data: Should we reset lockout state via API/database fixture to prevent test runner flakiness? (Recommendation: yes, use dynamic test fixture).

---

## 💬 6. How to Respond & Approve

When the AI presents the matrix and questions, use one of these quick response templates. Both **"Approved"** and **"Setuju"** are recognized by the AI.

### Option A: 1-Word Approval (Fastest, No Changes)
If you agree with all scenarios and recommendations, simply reply:
> **`Approved`** (or **`Setuju`**)

---

### Option B: Approve with Specific Answers

#### 🇮🇩 Indonesian
```text
Matrix untuk fitur [nama_fitur] saya setujui dengan jawaban berikut:
1. Jawaban Q1: [Gunakan rekomendasi kamu / counter reset saat login sukses].
2. Jawaban Q2: [Lock berlaku per akun].
3. Perubahan tambahan: [Tambahkan 1 skenario negatif untuk field email kosong].

Silakan generate draft kodenya di `generated/[nama_fitur]/` (feature file, screen object, dan step definitions).
```

#### 🇬🇧 English
```text
The matrix for feature [feature_name] is approved with the following answers:
1. Q1: [Accepted your recommendation / reset counter on success].
2. Q2: [Lock applies per account].
3. Additional adjustment: [Add 1 negative scenario for empty email field].

Please proceed to generate the draft code in `generated/[feature_name]/` (feature file, screen object, and step definitions).
```

---

### Option C: Promote Draft to Production (After Code Review)

Once the generated files in `generated/<feature>/` look solid, promote them:

#### 🇮🇩 Indonesian
```text
Draft di `generated/[nama_fitur]/` sudah saya review dan oke.
Tolong promote kodenya ke `features/[nama_fitur]/`, rapikan path import-nya, tambahkan script npm `test:feature:[nama_fitur]` di package.json, lalu jalankan `npm run lint:tags && npm run typecheck` untuk memastikan tidak ada error.
```

#### 🇬🇧 English
```text
The draft in `generated/[feature_name]/` is reviewed and approved.
Please promote the code to `features/[feature_name]/`, update import paths, add the `test:feature:[feature_name]` script to package.json, and run `npm run lint:tags && npm run typecheck` to verify zero errors.
```

---

## 🛠️ 7. Detailed Method: Specific Jira / Figma Tickets

Use this method when you have specific Jira AC text and manual test cases you want to cross-reference.

#### 🇮🇩 Indonesian
```text
Gunakan skill qualisera-test-generator untuk fitur [NAMA_FITUR] pada platform [Android / iOS / Web].

--- SUMBER DATA ---
Jira Ticket : [Contoh: JIRA-APP-201] (teks tiket di-paste di bawah)
Figma Frame : [Screenshot terlampir]
Manual Cases: [Path ke file CSV/Excel atau paste di sini]

--- ACCEPTANCE CRITERIA (Persis dari Jira) ---
[Paste deskripsi dan seluruh butir AC]

--- YANG SAYA INGINKAN ---
1. Berhenti setelah membuat Test Coverage Matrix dan pertanyaan; JANGAN tulis kode sebelum saya setujui.
2. Bandingkan manual test case saya dengan skenario kamu: mana yang sudah tercover, mana yang belum ada di catatan saya, dan mana manual test case saya yang tidak punya dasar AC.
3. Tulis draft kode hanya di `generated/[nama_fitur]/` setelah saya beri approval.
```

#### 🇬🇧 English
```text
Use the qualisera-test-generator skill for feature [FEATURE_NAME] on [Android / iOS / Web].

--- SOURCES ---
Jira Ticket : [e.g. JIRA-APP-201] (ticket text pasted below)
Figma Frame : [Screenshots attached]
Manual Cases: [Path to CSV/Excel or paste table here]

--- ACCEPTANCE CRITERIA (Verbatim from Jira) ---
[Paste description and all AC items]

--- WHAT I WANT ---
1. Stop after the coverage matrix and open questions; DO NOT write code until I approve.
2. Compare my manual test cases with your scenario pool: what is covered, what is missing from mine, and which of my test cases have no AC basis.
3. Write draft code strictly to `generated/[feature_name]/` after my approval.
```

---

## 🎨 8. UX & App Quality Audit (`app-quality-advisor`)

### When to use this?
Use this skill when you want to audit usability, empty states, error handling, accessibility, or form validation from app screenshots or test evidence **before** or **during** QA testing.

#### 🇮🇩 Indonesian
```text
Gunakan skill app-quality-advisor.
Evidence     : [Lampirkan screenshot / paste Allure error / deskripsi alur]
Fitur        : [Nama fitur atau modul]
Deliverable  : [Pilih: findings table / issue draft Jira / saran acceptance criteria]

Catatan: Tandai hal yang tidak terlihat langsung di evidence sebagai "Needs verification". Berikan rekomendasi yang solutif untuk developer dan designer.
```

#### 🇬🇧 English
```text
Use the app-quality-advisor skill.
Evidence     : [Attach screenshots / paste Allure error / describe flow]
Feature      : [Feature or module name]
Deliverable  : [Choose: findings table / Jira issue drafts / requirement suggestions]

Note: Mark anything not directly visible in the evidence as "Needs verification". Provide actionable recommendations for developers and designers.
```

---

## 🩹 9. Self-Healing: Fixing Failing Tests

### When to use this?
Use this when a test fails after an app update, element ID rename, UI redesign, or timeout issue.

#### 🇮🇩 Indonesian
```text
Skenario [@JIRA-APP-201 / @AC-02] pada fitur [nama_fitur] mengalami failure di platform [Android / iOS / Web].

--- ALLURE ERROR LOG ---
[Paste pesan error atau stack trace Allure di sini]

--- PERUBAHAN UI TERBARU ---
[Sebutkan jika ada perubahan accessibilityId, resource-id, teks tombol, atau struktur halaman dari developer]

Tolong periksa Screen Object dan Step Definition terkait. Temukan akar masalahnya (apakah salah selector, timing/wait, test data, atau memang bug aplikasi). Berikan usulan perbaikan minimal. Jika ini adalah bug asli aplikasi, jelaskan kenapa dan jangan ubah tesnya agar pura-pura pass.
```

#### 🇬🇧 English
```text
Scenario [@JIRA-APP-201 / @AC-02] in feature [feature_name] failed on [Android / iOS / Web].

--- ALLURE ERROR LOG ---
[Paste error log or Allure stack trace here]

--- RECENT UI / LOCATOR CHANGES ---
[Mention any accessibilityId, resource-id, button label changes, or page hierarchy updates from devs]

Inspect the Screen Object and Step Definitions. Identify the root cause (selector mismatch, timing/wait issue, test data, or a real application bug). Propose a minimal fix. If this is a real app defect, report it clearly instead of modifying the test just to make it pass.
```

---

## 🏷️ 10. Tag Taxonomy Cheat Sheet

Every Gherkin scenario must use standardized tags so our automated test runners (`wdio`) and manual dashboard know exactly how to execute them.

| Need | Tag Pattern | Example | Explanation |
| :--- | :--- | :--- | :--- |
| **Traceability** | `@AC-<id>`<br>`@JIRA-<ticket>` | `@AC-01`<br>`@JIRA-APP-201` | Links test directly to acceptance criteria and Jira tickets. |
| **Module** | `@feature-<name>` | `@feature-login` | Enables running a single feature: `npm run test:feature:login`. |
| **Priority** | `@p0`, `@p1`, `@p2` | `@p0`<br>`@p1` | `@p0` = Blocker / Core path.<br>`@p1` = Major requirement.<br>`@p2` = Edge / Low priority. |
| **Runner** | `@smoke`, `@regression` | `@smoke`<br>`@regression` | `@p0` is **always paired with `@smoke`**.<br>`@p1` and `@p2` are **paired with `@regression`**. |
| **Execution** | `@automated`<br>`@manual` | `@automated`<br>`@manual` | `@automated` runs via WebdriverIO.<br>`@manual` runs via Manual Dashboard (`http://localhost:3000`). |
| **Platform** | `@web`, `@android`, `@ios` | `@android`, `@web` | Specifies target execution device/browser. |
| **Technique** | `@positive`, `@negative`, `@bva` | `@bva`, `@negative` | Identifies test design methodology. |
| **Specialized** | `@security`, `@permission`, `@lifecycle`, `@network`, `@concurrency`, `@localization`, `@accessibility` | `@permission`<br>`@network` | Used for special test conditions (camera access, offline network, biometric auth, multi-language). |
| **Triage / Blocked** | `@blocked-by-question`<br>`@assumption` | `@blocked-by-question` | Used when a scenario is blocked pending PO clarification or based on a documented assumption. |

---

## 🖥️ 11. Test Execution & Manual QA Dashboard

### Running Automated Tests
```bash
# Run Android Smoke Suite
npm run test:smoke

# Run Full Android Regression
npm run test:regression

# Run Web Smoke Suite
npm run test:web:smoke

# Run a specific feature
npm run test:feature:sample
```

### Viewing Allure Reports
```bash
# Generate and open the interactive Allure report dashboard
npm run report:open
```

### Manual QA Execution Dashboard (`@manual`)
For scenarios that require physical hardware, camera scanning, SMS OTP, or manual exploratory judgment:
1. Scenarios tagged with `@manual` are automatically excluded from WDIO automated runners.
2. Launch the interactive Manual QA Execution Dashboard:
   ```bash
   npm run test:manual:dashboard
   ```
3. Open `http://localhost:3000` in your browser to:
   - View all `@manual` test cases synchronized live from `.feature` files.
   - Record execution status (`Passed`, `Failed`, `Blocked`, `Not Executed`).
   - Link Jira bug tickets (e.g. `APP-BUG-101`) on failure.
   - Attach screenshot evidence directly from clipboard or file upload.
   - Save session results to `reports/manual-results/manual-execution-results.json`.

---

## 🛡️ 12. Security Guardrails & Troubleshooting

### ⚠️ Security Rules (Never Leak Sensitive Data)
1. **Never Paste Real Passwords / Tokens**: Never paste production API keys, bearer tokens, OTPs, or real customer credentials into prompts. Use placeholders like `TEST_STANDARD_USER` and `Secret123!`.
2. **Sanitize Screenshots**: Mask credit card numbers, personal phone numbers, and customer names before attaching Figma or app screenshots.
3. **Allure Log Privacy**: When pasting Allure logs, check that request/response headers do not contain `Authorization: Bearer <token>`.

### ❓ Common Troubleshooting Scenarios

| Problem | Root Cause | How to Fix It |
| :--- | :--- | :--- |
| **The AI wrote code immediately without asking for approval.** | Prompt was missing the explicit approval gate instruction. | Reply: *"Stop. Revert the generated files. Provide only the Coverage Matrix and open questions first for my review."* |
| **The AI rejected a requirement saying it's too ambiguous.** | Requirement lacks clear boundaries or numbers (e.g. "Transfer must be fast"). | Prompt: *"Proceed with generating scenarios for the clear parts, and tag the ambiguous criteria with `@blocked-by-question` or `@assumption`."* |
| **`npm run typecheck` shows errors after promotion.** | Relative import paths in Screen Object or Steps are pointing to the wrong folder depth. | Reply: *"Fix import paths in features/[feature] so Screen Object imports from `@shared/pages/base.screen` (or `../../../shared/pages/base.screen`) and steps import from `../pages/[feature].screen`."* |
| **Selectors fail on live app.** | AI generated generic accessibility IDs or resource-ids that differ from your team's live build. | Inspect live DOM or Appium hierarchy, copy the exact selector, and feed it to the AI using **Section 9 (Self-Healing)**. |
