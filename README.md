# Qualisera Multi-Platform Test Automation Framework 🚀

> **Enterprise-Grade Agentic Mobile & Web Test Automation**: WebdriverIO v8, Appium 2 (UiAutomator2 & XCUITest), Cucumber BDD, TypeScript, Allure Reporting, and Interactive Manual QA Dashboard.

---

## ⚡ Quick Start

### 1. Setup & Installation
```bash
# Clone or navigate to the repository
cd ~/Documents/qualisera-automation

# Install dependencies
npm install

# Setup environment configuration
cp .env.example .env

# Setup Appium UiAutomator2 driver (one-time setup for Android)
npm run appium:setup
```

### 2. Run Tests
```bash
# Run Android Smoke Suite (Critical P0)
npm run test:smoke

# Run Full Android Regression Suite
npm run test:regression

# Run End-to-End (E2E) Journey Suite
npm run test:e2e

# Launch Interactive Manual QA Dashboard (for hardware/biometric tests)
npm run test:manual:dashboard

# Generate & Open Allure Report in Browser
npm run report
```

---

## 🧠 Qualisera Test Generator Skill

This repository comes equipped with `.agents/skills/qualisera-test-generator`, an agentic skill that turns business requirements (PRDs, Jira tickets, Figma mockups, User Stories) into high-rigor, traceable Cucumber BDD test suites for Mobile and Web.

### How to Trigger in Chat / Cara Memanggil di Chat

#### 🇬🇧 English
Simply mention:
- *"Help me generate test cases and BDD features for this requirement..."*
- *"Create a test design and screen object for the checkout feature below..."*
- *"Analyze the PRD in requirements/inputs/onboarding/PRD.pdf and generate its BDD suite..."*
- *"Run full mode to generate test-matrix.md, feature file, screen objects, and step definitions in one go."*

#### 🇮🇩 Bahasa Indonesia
Cukup ketik perintah seperti:
- *"Bantu generate test case dan BDD feature untuk requirement login ini..."*
- *"Buat test design dan screen object untuk fitur checkout berikut..."*
- *"Analisis PRD di requirements/inputs/onboarding/PRD.pdf lalu generate BDD test suites-nya..."*
- *"Langsung generate semuanya sekali jalan (mode full) untuk fitur payment..."*

### Artifacts Produced
Artifacts are generated in `generated/<feature>/`:
1. `test-matrix.md` - Complete ISTQB test matrix with AC traceability, positive/negative/edge scenarios, datasets, and open questions.
2. `<feature>.feature` - Gherkin BDD feature file with strict runner and taxonomy tags.
3. `<feature>.screen.ts` - TypeScript Screen Object extending `BaseScreen` with smart contract locators (`this.contract(...)`) and i18n support.
4. `<feature>.steps.ts` - Cucumber step definitions implementing new scenario steps.

---

## 🔄 5-Step Workflow

```
1. Input Requirement ➔ 2. Trigger Skill di Chat ➔ 3. Review Matrix & Draft ➔ 4. Promotion Gate ➔ 5. Run Test
 (PRD / Jira / Figma)       (qualisera-test-generator)      (generated/<feature>/)        (features/<feature>/)    (npm run test:smoke)
```

1. **Input Requirement**: Place PRDs (`.pdf`, `.docx`, `.html`) in `requirements/inputs/<feature>/` or paste ACs into chat.
2. **Trigger Skill**: Ask the agent in chat using `design` (matrix only) or `full` (matrix + feature + screen + steps) mode.
3. **Review Draft**: Review `test-matrix.md` and check if there are any open questions.
4. **Promotion**: Move verified draft files from `generated/<feature>/` to `features/<feature>/`.
5. **Run & Verify**: Run `npm run test:smoke` or view reports via `npm run report`.

---

## 🏷️ Mandatory Tag Taxonomy

Every Gherkin scenario must adhere to standardized tags. Validate compliance anytime using `npm run lint:tags`:

| Category | Allowed Tags | Example |
| :--- | :--- | :--- |
| **Traceability** | `@REQ-<KEY>`, `@AC-<nn>`, `@JIRA-<KEY>` | `@AC-01`, `@REQ-APP-101` |
| **Module** | `@feature-<name>` | `@feature-checkout`, `@feature-sample` |
| **Priority** | `@p0`, `@p1`, `@p2` | `@p0` (Smoke/Critical), `@p1` (Regression) |
| **Runner Filter** | `@smoke`, `@regression`, `@e2e` | Filtered via wdio cucumberOpts tags |
| **Execution** | `@automated`, `@manual` | `@manual` tests run via Manual Dashboard |
| **Platform** | `@android`, `@ios`, `@web` | Target execution environment |
| **Technique** | `@positive`, `@negative`, `@bva`, `@functional`, `@security`, `@permission`, `@lifecycle`, `@network`, `@concurrency`, `@localization`, `@accessibility` | Test design classification |
| **Status (Optional)** | `@assumption`, `@blocked`, `@derived` | Flags open questions / unconfirmed behavior |

---

## 🛡️ Validation & Utility Commands

```bash
# Extract raw requirement text from .pdf, .docx, .html, .csv
npm run req:extract requirements/inputs/<feature>/PRD.pdf -- --save

# Mechanically verify a generated test draft (taxonomy, derived limits, matrix sync)
npm run check:generated -- generated/<feature>

# Lint test tags across all feature files
npm run lint:tags

# Audit unresolved UI contracts across Screen Objects
npm run check:contracts

# Synchronize test specifications and RTM documents (Markdown, CSV, XLSX)
npm run docs:generate

# Check TypeScript syntax and compilation integrity
npm run typecheck
```

---

## 📂 Project Structure

```text
qualisera-automation/
├── .agents/
│   └── skills/
│       ├── qualisera-test-generator/   # BDD Test Design Skill & References
│       └── app-quality-advisor/        # Mobile QA Advisory Skill
├── apps/                               # Target mobile binaries (.apk, .ipa)
├── docs/                               # Generated specifications & RTM exports
├── generated/                          # AI Staging area (drafts awaiting approval)
├── features/                           # Production BDD test suites by module
│   └── sample/
│       ├── features/                   # Gherkin feature files (*.feature)
│       ├── pages/                      # Screen Objects (POM)
│       └── steps/                      # Cucumber step definitions
├── requirements/                       # Requirement input gateway
│   ├── _template.md                    # PRD template
│   └── inputs/                         # Raw PRDs (.pdf, .docx), Jira notes, Figma mockups
├── reports/                            # Allure results and manual execution logs
├── scripts/                            # CLI utilities (lint-tags, generate-docs, manual-dashboard)
├── shared/                             # Core framework
│   ├── config/env.config.ts            # Environment variables & connection settings
│   ├── data/data-factory.ts            # Universal Dynamic Test Data Hub
│   ├── pages/base.screen.ts            # BaseScreen with Smart Contracts & i18n
│   └── steps/common.steps.ts           # Reusable shared step definitions
├── wdio.android.conf.ts                # Android Appium capability configuration
├── wdio.shared.conf.ts                 # Shared WebdriverIO runtime configuration
├── tsconfig.json                       # TypeScript compiler options
└── package.json
```

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
