# Implementation patterns (selectors, i18n, code example)

Contents: selector conventions, BaseScreen pattern, i18n architecture, mobile-specific coverage notes, few-shot example, validation commands.

## Selector conventions

Never guess selectors. Priority of sources: (1) real UI dump (`adb shell uiautomator dump`, Appium Inspector, browser devtools), (2) agreed naming convention, (3) stub marked `// TODO: verify with dev (no UI dump available)`.

Naming convention when unverified: `<screen>-<element>-<type>`, e.g. `login-email-input`, `box-create-btn`, `dashboard-header-txt`, `settings-language-radio`.

| Platform | Matches |
| :--- | :--- |
| Android | `content-desc` (accessibility id) or `text` |
| iOS | `accessibilityIdentifier` or `label` |
| Web | `data-testid`, `id`, CSS |

UI dump (when an APK is in `apps/`):
```bash
~/Library/Android/sdk/build-tools/36.0.0/aapt dump badging apps/<app>.apk | grep -E "package: name|launchable-activity"
adb shell uiautomator dump /sdcard/window_dump.xml && adb pull /sdcard/window_dump.xml /tmp/window_dump.xml
```
Extract real `content-desc`, `resource-id`, `text` from the XML.

## BaseScreen pattern (`shared/pages/base.screen.ts`)

```typescript
get btnSubmit() { return this.getSelector('#submit-btn', 'login-submit-btn'); } // web, mobile
get headerDashboard() { return this.getByI18n(i18n.dashboard.header); }        // language-resilient
```

## i18n architecture

1. Single source of truth: `shared/constants/i18n.ts`, typed `as const`. No hard-coded UI strings in steps.
2. Use `this.getByI18n(variants)` (checks `@content-desc` and `@text`).
3. React Native inputs: chain `click()`, `clearValue()`, `setValue('')` when resetting.
4. Handle native `AlertDialog` (e.g. "Name required") before asserting form state.

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
