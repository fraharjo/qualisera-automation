# Feature: <name>

Copy this file to `requirements/<feature>.md` and fill it in. Quote acceptance criteria verbatim from the source; put your interpretation under Assumptions, not in the AC text.

## Metadata
- Jira: `@JIRA-<KEY>` (e.g. `@JIRA-APP-201`)
- Requirement key (if the README mapping uses one): `@REQ-<KEY>`
- Module tag: `@feature-<module>`
- Platform: Android | iOS | Web
- Sources: <Jira key and fields used, Figma file and frame names, PRD section>
- Raw inputs: `requirements/inputs/<feature>/` (Jira text, Figma screenshots, manual test cases CSV), if any

## Source Attribution Legend
- `[AC-xx]`: Verbatim acceptance criteria from source ticket / user story.
- `[FLOW-xx]`: Step described in user journey / flow description.
- `[DESIGN-xx]` / `[SCREENSHOT-xx]`: Visual element or layout observed in mockups / screenshots.
- `[ASSUMPTION]`: Unconfirmed working technical hypothesis.
- `[DERIVED]`: Unwritten high-impact business / security risk check (max 5 per feature).

## Acceptance Criteria
| ID | Acceptance criterion (verbatim) | Source (Jira field / Figma frame / PRD section) | Type (explicit / derived) |
| :-- | :-- | :-- | :-- |
| AC-01 | ... | ... | explicit |
| AC-02 | ... | ... | explicit |

## Visual Evidence Anomaly Scan (if designs / screenshots provided)
| Anomaly ID | Screen / Artifact | Observed Anomaly / Inconsistency | Risk / Impact | Action / Open Question |
| :--- | :--- | :--- | :--- | :--- |
| ANOM-01 | ... | (broken image, language mixing, sorting contradiction, missing AC limits) | High/Med/Low | ... |

## Figma frames and states
| Frame | Default | Focused | Filled | Error | Disabled | Loading | Empty |
| :-- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| <frame name> | yes/no | yes/no | yes/no | yes/no | yes/no | yes/no | yes/no |

A missing state is an open question, not something to invent.

## Known constraints & Data Seeding Needs
- Limits (min/max lengths, counts, timeouts, rolling time windows):
- Supported languages / locale formats:
- Roles and permissions:
- Required Data Fixtures (empty state, threshold/multi-page, boundary timestamps):
- Dependencies on other features / legacy OS:

## Existing manual test cases (optional)
- Location: <path or link>
- Notes: <what they already cover>

## Out of scope
- ...

## Open questions
| # | Question | Blocking? | Owner | Options (* Recommended) |
| :-- | :-- | :-: | :-- | :-- |
| Q1 | ... | yes/no | product/dev | A) ... (Recommended), B) ... |

## Assumptions
| # | Assumption | Related AC | Basis / Evidence |
| :-- | :-- | :-- | :-- |
| A1 | ... | AC-0x | Observed from screenshot / RFC standard |
