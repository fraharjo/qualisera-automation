# Evaluation Suite: `qualisera-test-generator`

Regression benchmark for validating and comparing `qualisera-test-generator` across skill edits, model upgrades, or A/B tests (with skill vs. without skill) using industry-standard public specifications.

## How to Run This Evaluation

1. **A/B Test (Baseline vs. Skill):** Run the same Golden Case prompt in isolated sessions — one without reading `.agents/skills/`, and one following `SKILL.md`.
2. **Regression Test (v1 vs. v2):** After modifying `SKILL.md` or `references/`, re-run all 3 Golden Cases (Phases 1–5) and compare scores against the previous run.
3. **Blind Scoring:** Score each output against the **Scoring Rubric** below (`0–2` per criterion, max `10` per case, `30` total). For unbiased comparisons, anonymize outputs before judging.

---

## Golden Case 1 — SauceDemo (Swag Labs) Login & Checkout (`EXT-001`)

**Prompt / Requirement:**
- **Module:** `saucedemo-checkout`
- **Platform:** Web (`@web`)
- **Role:** Shopper (`standard_user`) / Locked-out user (`locked_out_user`)
- **Source:** Public QA Benchmark Specification — SauceDemo / Swag Labs (`https://www.saucedemo.com/`)
- **Acceptance Criteria:**
  - **AC-01:** Entering `locked_out_user` with a password on Login denies access, prevents navigation to Inventory, shows `Epic sadface: Sorry, this user has been locked out.` with error indicators, and clicking the "X" button dismisses the error banner.
  - **AC-02:** Leaving Username blank shows `Epic sadface: Username is required`; leaving Password blank shows `Epic sadface: Password is required`.
  - **AC-03:** On Checkout Information, First Name, Last Name, and Postal Code are mandatory (blank shows `Error: First Name is required` / `Error: Last Name is required` / `Error: Postal Code is required`). Clicking Finish on Checkout Overview redirects to Checkout Complete displaying `Thank you for your order!` and clears the shopping cart.

**Expected Skill Signals:**
1. Generates positive, negative, and edge scenarios (e.g. whitespace-only credentials, single-character input, dismissing error banner and re-attempting valid login).
2. Uses declarative business language with deterministic assertions (does not rely on element presence alone).
3. Respects tag taxonomy: `@REQ-EXT-001`, `@AC-01`..`@AC-03`, `@feature-saucedemo-checkout`, `@web`, `@automated`, `@smoke`/`@regression`.
4. Reuses existing Background steps (`Given the user opens the web application`).
5. Stops at **Phase 5 (Human Review Checkpoint)** before generating implementation code.

---

## Golden Case 2 — RealWorld ("Conduit") Article CRUD & Ownership (`EXT-002`)

**Prompt / Requirement:**
- **Module:** `conduit-articles`
- **Platform:** Web (`@web`)
- **Role:** Authenticated author / Non-author user / Unauthenticated guest
- **Source:** Public Open-Source Specification — RealWorld ("Conduit")
- **Acceptance Criteria:**
  - **AC-01:** An authenticated user can create an article with required `title`, `description`, `body` and optional `tagList`. The system generates a unique URL-friendly `slug` from `title` and assigns the authenticated user as `author`.
  - **AC-02:** The author can edit `title`, `description`, or `body` of their own article. Modifying `title` must also update the article `slug`.
  - **AC-03:** The author can delete their own article via its `slug`. Unauthenticated requests receive `401 Unauthorized`, and authenticated non-authors attempting to edit or delete another user's article receive `403 Forbidden`.

**Expected Skill Signals:**
1. Covers positive CRUD, negative field validations (empty title/description/body returning `422`), slug collisions on identical titles, and slug re-generation on title update.
2. Rigorous authorization & IDOR coverage: unauthenticated user receives `401`, non-author user attempting edit or delete receives `403`.
3. Anti-Scope-Creep: Does not invent non-essential speculative suites (e.g. TalkBack, offline sync, network drop) on a web API specification.
4. Deterministic assertions: Exact HTTP status codes (`201`, `200`, `422`, `401`, `403`, `404`) and specific slug values without vague placeholder assertions.
5. Does not mix disparate actions (Create, Edit, Delete) into a single ambiguous Scenario Outline.

---

## Golden Case 3 — OWASP / ISTQB Secure Password Reset (`EXT-003`)

**Prompt / Requirement:**
- **Module:** `password-reset`
- **Platform:** Android (`@android`)
- **Role:** Registered user / Unregistered user
- **Source:** Public Security QA Specification — OWASP / ISTQB
- **Acceptance Criteria:**
  - **AC-01:** Submitting either a registered or unregistered email on the password reset form displays a generic confirmation message (`If your email exists in our system, a reset link has been sent`) to prevent account enumeration.
  - **AC-02:** A generated password reset token expires automatically after 15 minutes or immediately after a single successful use.
  - **AC-03:** Setting a new password enforces complexity rules (minimum 8 characters, alphanumeric + at least one special character) and rejects weak passwords.
  - **AC-04:** After a successful password reset, all existing active user sessions across devices are invalidated, requiring a fresh login.

**Expected Skill Signals:**
1. Anti-Account Enumeration: Asserts identical generic success message and identical response state regardless of whether email is registered or unregistered.
2. Security & Token Expiry: Skenario single-use token invalidation, plus 15-minute expiry boundary (`14:59` valid, `15:00` expired) tagged `@blocked` with a controllable clock testability request (never real-time waiting).
3. BVA on Password: Boundary 7 characters (rejected), 8 characters valid, complexity rules (missing digit, missing special char).
4. Session Invalidation: Multi-device session invalidation check.
5. Uses isolated dynamic users / test profiles without hardcoding production credentials or leaking passwords in plain logs.

---

## Scoring Rubric (0–2 per criterion, max 10 per case, max 30 total)

| Criterion | 0 (Poor) | 1 (Partial) | 2 (Strong) |
| :--- | :--- | :--- | :--- |
| **1. AC Traceability & Coverage** | Missing ACs or only happy paths | All ACs covered, weak negative/edge or missing verdict table | Every AC has positive + negative + edge with explicit AC mapping, `derived` separation, and verdict (`@blocked` excluded from `Full`) |
| **2. ISTQB Design Rigor** | Ad-hoc list of tests | Mentions some BVA/negative cases | Rigorous BVA (incl. boundaries/time), IDOR/authorization rigor, state transition rigor, anti-enumeration, no unflagged assumptions |
| **3. Shift-Left & Ambiguity Handling** | Invents missing specs or rejects input | Lists unstructured questions | Separates facts vs. `@assumption` vs. `@blocked`, bundles prioritized multiple-choice Q&A with `(Recommended)` |
| **4. Anti-Hallucination & Scope Discipline** | Hallucinates copy/endpoints/unrealistic scopes | Minor assumptions stated as fact or bloated scope | Respects app context, limits speculative derived cases (max 3-5), deterministic measurable outcomes, zero invented policy-referencing assertions |
| **5. Repo & Workflow Compliance** | Ignores repo layout, tags, or review gate | Partial tag or workflow compliance | Full tag taxonomy aligned with `scripts/lint-tags.ts`, reuse of existing repo step definitions, Phase 5 review gate respected |
