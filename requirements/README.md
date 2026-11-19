# Requirements Directory 📋

This directory serves as the **input gateway (Stage 1)** for feature specifications prior to automation scenario authoring.

## Supported Input Formats:
1. **Product Requirement Document (PRD)** in Markdown format (`.md`).
2. **User Stories & Acceptance Criteria (AC)** from Jira / Linear.
3. **UI Flow Notes / Figma Links**.

## Naming and Layout
```text
requirements/
├── _template.md                 # copy this to start a new feature
├── <feature>.md                 # one PRD per feature (ACs, constraints, open questions)
└── inputs/<feature>/            # raw attachments: Jira text, Figma screenshots, manual test cases CSV
```
The names match `generated/<feature>/` and `features/<feature>/`, so one feature keeps one name end to end. Files starting with `_` are templates or examples and are never test sources.

## How to Use with AI Skills:
Copy `_template.md` to `requirements/box-sharing.md` and fill it in (e.g., `requirements/box-sharing.md`), then instruct the agent:
```text
"Use the nexus-test-generator skill to design test scenarios based on requirements/box-sharing.md targeting the Android platform, and save draft outputs to generated/box-sharing/"
```
