# Implementation patterns (selectors, i18n, code example)

Contents: selector conventions, BaseScreen pattern, i18n architecture, mobile-specific coverage notes, few-shot example, validation commands.

## Selector conventions & Smart Contracts

Never guess selectors. Priority of sources:
1. Real UI dump or live DOM inspection (`adb shell uiautomator dump`, Appium Inspector, browser DevTools).
2. For pending, unfinished, or shift-left features: wrap with `this.contract('<screen>-<element>-<type>')`.
   - On Web: matches `[data-testid="<id>"]`, `[name="<id>"]`, `#<id>`.
   - On Mobile: matches `~<id>` (accessibility ID).
   - This prevents brittle XPath guessing and gives developers a clear testability contract to implement.

## BaseScreen pattern (`shared/pages/base.screen.ts`)

```typescript
// Live element (verified):
get btnSubmit() { return this.getSelector('#submit-btn', 'login-submit-btn'); }
get headerDashboard() { return this.getByI18n(i18n.dashboard.header); }

// Unfinished / Shift-left element (Smart Contract):
get alertError() { return this.contract('login-error-alert'); }
get btnGoogleAuth() { return this.contract('login-google-btn'); }
```

## Universal Test Data Hub (`shared/data`)

Use a single facade to access credentials, static fixtures, and dynamic factory data across Web, Android, and iOS:

```typescript
import { testData } from '../../../shared/data';

// 1. Secrets & Credentials (from .env via shared/config/env.config.ts)
const user = testData.env.credentials.standardUser;

// 2. Static Master Data (from shared/data/fixtures/<name>.json)
const catalog = testData.fixture('product-catalog');

// 3. Dynamic Conflict-Free Data (bulk users, unique phone/email, addresses)
const newUser = testData.factory.user();
const newAddress = testData.factory.address();
```

## i18n architecture

1. Single source of truth: `shared/constants/i18n.ts`, typed `as const`. No hard-coded UI strings in steps.
2. Use `this.getByI18n(variants)` (checks `@content-desc` and `@text`).
3. React Native inputs: chain `click()`, `clearValue()`, `setValue('')` when resetting.
4. Handle native `AlertDialog` (e.g. "Name required") before asserting form state.

## Assertion Strategy: Outcome Verification vs Mere Presence

Always assert actual business outcome, state changes, or exact copy. Never write weak assertions that pass on empty/wrong states:

```typescript
// ❌ WEAK (Checks existence only - passes even if message is blank or displays an error!)
await expect(paymentScreen.alertNotice).toBeDisplayed();

// ✅ ROBUST (Verifies specific business outcome, content, and state)
await expect(paymentScreen.alertNotice).toBeDisplayed();
await expect(paymentScreen.alertNotice).toHaveText(expect.stringContaining('Transfer Berhasil'));
await expect(paymentScreen.txtRemainingBalance).toHaveText(expect.stringContaining('Rp 40.000'));
```

## Mobile coverage notes (map to the quality checklist)

- Idempotency: double tap on submit/pay -> processed once (`@p2 @automated`).
- Network: airplane mode / reconnect mid-request (`@p2 @automated` if the runner controls network, else `@manual`).
- Backgrounding: minimize mid-operation, restore, state kept (`@lifecycle`).
- Physical hardware (camera scan, biometrics, SMS OTP): `@manual`.

## Few-shot example

`generated/box/box.feature`:
```gherkin
@feature-box @JIRA-KTK-101
Feature: Box Management
  As a Kotakin user
  I want to create and organize storage boxes
  So that I can keep track of my belongings

  @AC-01 @p0 @smoke @automated @android @functional
  Scenario: Create a box with valid details
    Given the user is on the "My Stash" dashboard
    When the user opens the New Box form
    And the user fills the box name with "Kitchen Box" and description "Utensils"
    And the user submits the box creation form
    Then the box "Kitchen Box" should be displayed on the dashboard

  @AC-02 @p1 @regression @automated @android @negative @bva
  Scenario Outline: Reject an invalid box name
    Given the user is on the "My Stash" dashboard
    When the user opens the New Box form
    And the user fills the box name with "<name>" and description "Invalid Test"
    And the user submits the box creation form
    Then the user should remain on the New Box form

    Examples:
      | name                                               |
      |                                                    |
      | (3 spaces)                                         |
      | (51 characters, generate at runtime from a helper) |
```
Replace the placeholder rows with real values or a data helper; never leave empty Examples rows that look like data.

`generated/box/box.screen.ts`:
```typescript
import { BaseScreen } from '../../shared/pages/base.screen';
import { i18n } from '../../shared/constants/i18n';

class BoxScreen extends BaseScreen {
  get btnNewBox() { return this.getByI18n(i18n.dashboard.btnNewBox); }
  get inputBoxName() { return $('~Box name'); } // verified from UI dump

  async openNewBoxForm(): Promise<void> { await this.click(this.btnNewBox); }
  async fillBoxForm(name: string, description: string): Promise<void> {
    await this.setValue(this.inputBoxName, name);
    if (description) await this.setValue(this.inputDescription, description);
  }
}
export default new BoxScreen();
```

`generated/box/box.steps.ts`: only new steps (reuse existing ones first):
```typescript
import { When } from '@cucumber/cucumber';
import boxScreen from './box.screen';

When('the user opens the New Box form', async () => { await boxScreen.openNewBoxForm(); });
```
Adjust import paths to the promoted location (`features/<feature>/pages/`) during promotion.

## Validation commands

```bash
npx tsc --noEmit                 # must exit 0
npm run test:smoke               # @smoke and not @manual
npm run test:regression          # @regression and not @manual
npm run test:feature:<name>      # @feature-<name> and @automated
npm run report:open              # Allure
```
