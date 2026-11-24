# Automation feasibility reference

Apply in Phase 4 (triage), never earlier. Verify exact commands against the project's active Appium driver version before using them.

## Platform capabilities
- **Biometrics**: `mobile: enrollBiometric` / `mobile: sendBiometricMatch` (iOS simulator) and `adb emu finger touch <id>` (Android emulator).
- **Deep linking**: `mobile: deepLink` and universal-link verification. Do not click email inboxes in native UI tests.
- **Permissions**: Android 13+ (API 33+) requires a runtime permission for notifications (`POST_NOTIFICATIONS`); do not assume auto-grant. On iOS default to `autoAcceptAlerts: false` when testing both Allow and Don't Allow flows.

## Idempotency and concurrency
Drive rapid double-submit through parallel API requests with a backend state assertion instead of unreliable sub-300 ms UI double-taps. If no test API exists, mark `@blocked` and list the API in the testability requests.

## Non-functional
Split accessibility into automated label checks (`contentDescription` / `accessibilityIdentifier`) and manual TalkBack/VoiceOver checks. For performance or latency tests choose one disposition (`@manual` or `@automated`) and account for automation overhead.

## API-level assertions
Status codes (401/403/404/422), payload shape and persisted state are asserted at the API channel (`@api`), not through UI text. Use the API client folder named in the README; if it does not exist, record it as a testability request and keep the steps as stubs.
