# Standards and heuristics mapping

Contents: how to cite, Nielsen heuristics, ISO usability, WCAG, platform guidelines, severity rating, pillar-to-standard table.

Cite the specific item (for example "WCAG 2.2 SC 1.4.3 Contrast (Minimum)"), never the standard in general. If unsure of an exact number, cite the heuristic or principle by name and mark the finding `Likely` or `Needs verification`.

## Nielsen's 10 usability heuristics (NN/g)

1. Visibility of system status
2. Match between system and the real world
3. User control and freedom
4. Consistency and standards
5. Error prevention
6. Recognition rather than recall
7. Flexibility and efficiency of use
8. Aesthetic and minimalist design
9. Help users recognize, diagnose and recover from errors
10. Help and documentation

## ISO usability and quality models

- **ISO 9241-11**: usability = effectiveness, efficiency and satisfaction in a specified context of use. Use it to frame impact: can the user finish the task, how much effort, how do they feel.
- **ISO 9241-210**: human-centred design process (understand context, user needs, evaluate against requirements).
- **ISO 9241-110**: interaction principles (suitability for the task, self-descriptiveness, controllability, conformity with user expectations, error tolerance, suitability for individualization, learnability).
- **ISO/IEC 25010**: product quality model. Relevant characteristics: Usability (learnability, operability, user error protection, accessibility, user interface aesthetics), Reliability (recoverability, fault tolerance), Security (confidentiality), Compatibility, Portability.

## Accessibility: WCAG 2.2 (W3C), commonly relevant success criteria

> Optional reference. The project does not currently test WCAG conformance. Criterion numbers were written from memory and not checked against the W3C text; verify before citing them in an official ticket.

| SC | Topic | Check |
| :--- | :--- | :--- |
| 1.1.1 | Non-text content | Images/icons have text alternatives |
| 1.3.1 | Info and relationships | Structure and labels are programmatically exposed |
| 1.4.1 | Use of color | Color is not the only signal (e.g. errors) |
| 1.4.3 | Contrast (minimum) | Text 4.5:1 (3:1 for large text) |
| 1.4.4 | Resize text | Usable at 200% text size without loss |
| 1.4.11 | Non-text contrast | Controls and icons 3:1 |
| 2.4.3 | Focus order | Logical order for keyboard / screen reader |
| 2.5.8 | Target size (minimum) | At least 24x24 CSS px (AA); 2.5.5 Target size (enhanced) 44x44 (AAA) |
| 3.3.1 | Error identification | Error described in text |
| 3.3.2 | Labels or instructions | Fields have visible labels |
| 3.3.3 | Error suggestion | Tells the user how to fix it |
| 3.3.4 | Error prevention (legal, financial, data) | Reversible, checked or confirmed |
| 4.1.2 | Name, role, value | Custom controls expose them to assistive technology |
| 4.1.3 | Status messages | Toasts/snackbars are announced without taking focus |

For mobile, WCAG is applied through its mobile guidance (W3C "WCAG2Mobile"). EN 301 549 is the European public-sector equivalent.

## Platform guidelines

- **Android**: Material Design 3 and Android accessibility guidance: touch targets at least 48x48 dp; snackbars with an action for undo.
- **iOS**: Apple Human Interface Guidelines: minimum control size 44x44 pt; use system patterns for back navigation and alerts.
- **Web**: WAI-ARIA Authoring Practices for custom widgets.

## Severity rating (adapted from Nielsen's 0-4 scale)

Rate by three factors: frequency (how many users hit it), impact (how bad when hit), persistence (does it recur or can users learn to avoid it). Map the result to this project's labels: Critical, Major, Minor. Do not use `P0/P1/P2`: those are reserved for test priority in this project.

## Pillar to standard cross-reference

| Pillar | Heuristics | Other standards |
| :--- | :--- | :--- |
| 1. Form validation and error prevention | 5, 9 | WCAG 3.3.1, 3.3.2, 3.3.3, 4.1.3; ISO 25010 user error protection |
| 2. Data integrity and destructive actions | 3, 5 | WCAG 3.3.4; ISO 25010 recoverability |
| 3. Empty, loading, error states and first-time use | 1, 9, 10 | ISO 9241-110 self-descriptiveness |
| 4. Navigation consistency and recovery | 3, 4 | ISO 9241-110 controllability; Android/iOS back conventions |
| 5. Localization and adaptability | 2, 4 | WCAG 1.4.4; Unicode CLDR for date/number formats |
| 6. Visual ergonomics, touch targets, accessibility | 8 | WCAG 1.1.1, 1.4.1, 1.4.3, 1.4.11, 2.4.3, 2.5.8, 4.1.2; MD3 / HIG |
| 7. Privacy and sensitive data (optional) | none | OWASP MASVS (mobile app security), ISO 25010 confidentiality |

## Sources

- Nielsen Norman Group: 10 Usability Heuristics for User Interface Design, Severity Ratings for Usability Problems.
- ISO 9241-11:2018, ISO 9241-110:2020, ISO 9241-210:2019, ISO/IEC 25010:2011.
- W3C WCAG 2.2; W3C WCAG2Mobile; EN 301 549.
- Material Design 3 accessibility; Apple Human Interface Guidelines (Accessibility).
- OWASP MASVS.
