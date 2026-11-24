# Automation feasibility reference

Apply in Phase 4 (triage), never earlier. Verify exact commands against the project's active Appium driver version before using them.

## Platform capabilities
- **Biometrics**: `mobile: enrollBiometric` / `mobile: sendBiometricMatch` (iOS simulator) and `adb emu finger touch <id>` (Android emulator).
- **Deep linking**: `mobile: deepLink` and universal-link verification. Do not click email inboxes in native UI tests.
- **Permissions**:
  - Android 13+ (API 33+) requires runtime permission for notifications (`POST_NOTIFICATIONS`); do not assume auto-grant.
  - On iOS default to `autoAcceptAlerts: false` when testing both Allow and Don't Allow flows.
  - Legacy storage permissions (`WRITE_EXTERNAL_STORAGE` / `READ_EXTERNAL_STORAGE`) are strictly enforced only on Android $\le 9$ (API 28). Android 10+ uses Scoped Storage / MediaStore without runtime permissions. Scenarios probing storage permission denial must be gated with an environment tag (e.g. `@legacy-android-only`) and not assumed on modern devices.

## Environmental and platform dependency tagging
Never claim universal test execution if a test relies on specific operating system versions, browser engines, or device capabilities. Explicitly tag environmental dependencies:
- Platform versions: `@android-api-28`, `@ios-17`, `@chromium-only`.
- Device hardware: `@biometric-hardware`, `@camera-hardware`.
When running on incompatible environments, the test runner must skip cleanly rather than failing on false defect claims.

## Concrete data seeding fixtures
Every test suite requiring non-trivial data must specify exact data fixture profiles in Testability Requests:
1. **Empty State Fixture**: User profile with zero activity records (verifies clean empty states and hidden action buttons).
2. **Gap / Sparse Fixture**: Records with intentional chronological gaps (e.g. transacted in month M and M+2, but M+1 empty) to verify omission of empty periods.
3. **Threshold & Pagination Fixture**: Heavy dataset exceeding single-page / viewport thresholds (e.g. $\ge 35$ items) to verify pagination and document layout boundaries.
4. **Time Boundary & Clock Fixture**: User records at the boundary of rolling time windows (e.g. month 24 vs month 25), requiring a controllable backend test clock hook (`X-Test-Clock-Offset` or test API) rather than real-time waiting.
5. **Diverse Status Fixture**: Datasets containing non-standard transaction/entity statuses (e.g. Pending, Failed, Cancelled, Refunded) to verify filtering and document completeness.

## Idempotency and concurrency
Drive rapid double-submit through parallel API requests with a backend state assertion instead of unreliable sub-300 ms UI double-taps. If no test API exists, mark `@blocked` and list the API in the testability requests.

## Non-functional
Split accessibility into automated label checks (`contentDescription` / `accessibilityIdentifier`) and manual TalkBack/VoiceOver checks. For performance or latency tests choose one disposition (`@manual` or `@automated`) and account for automation overhead.

## API-level assertions
Status codes (401/403/404/422), payload shape and persisted state are asserted at the API channel (`@api`), not through UI text. Use the API client folder named in the README; if it does not exist, record it as a testability request and keep the steps as stubs.
