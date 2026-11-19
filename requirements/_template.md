# Feature: <name>

Copy this file to `requirements/<feature>.md` and fill it in. Quote acceptance criteria verbatim from the source; put your interpretation under Assumptions, not in the AC text.

## Metadata
- Jira: `@JIRA-<KEY>` (e.g. `@JIRA-KTK-201`)
- Requirement key (if the README mapping uses one): `@REQ-KTK-<nnn>`
- Module tag: `@feature-<module>`
- Platform: Android | iOS | Web
- Sources: <Jira key and fields used, Figma file and frame names, PRD section>
- Raw inputs: `requirements/inputs/<feature>/` (Jira text, Figma screenshots, manual test cases CSV), if any

## Acceptance Criteria
| ID | Acceptance criterion (verbatim) | Source (Jira field / Figma frame / PRD section) | Type (explicit / derived) |
| :-- | :-- | :-- | :-- |
| AC-01 | ... | ... | explicit |
| AC-02 | ... | ... | explicit |

## Figma frames and states
| Frame | Default | Focused | Filled | Error | Disabled | Loading | Empty |
| :-- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| <frame name> | yes/no | yes/no | yes/no | yes/no | yes/no | yes/no | yes/no |

A missing state is an open question, not something to invent.

## Known constraints
- Limits (min/max lengths, counts, timeouts):
- Supported languages:
- Roles and permissions:
- Dependencies on other features:

## Existing manual test cases (optional)
- Location: <path or link>
- Notes: <what they already cover>

## Out of scope
- ...

## Open questions
| # | Question | Blocking? | Owner | Answer |
| :-- | :-- | :-: | :-- | :-- |
| Q1 | ... | yes/no | product/dev | |

## Assumptions
| # | Assumption | Related AC | Confirmed by |
| :-- | :-- | :-- | :-- |
| A1 | ... | AC-0x | |
