# Website Review Fix Tracker

Status values: `Not started`, `In progress`, `Done`, `Blocked`.

| ID | Status | Severity | Area | Issue | Fix type |
|---:|---|---|---|---|---|
| 1 | In progress | Critical | Backend | Backend cannot start because EF Core detects pending model changes during startup migration. | Backend/data fix |
| 2 | Not started | Critical | Landing | Landing and pricing CTAs look actionable but have no navigation or handler. | Interaction-state fix |
| 3 | Not started | Critical | Landing | Demo request form is cosmetic: no submit path, no field names, no required validation. | Component fix |
| 4 | Not started | Important | Footer | Footer links use `href="#"` dead links. | Content fix |
| 5 | Not started | Important | Auth | Login/register pages expose multiple visible `h1` headings. | Accessibility fix |
| 6 | Not started | Important | Admin | Destructive admin actions execute immediately without confirmation. | Interaction-state fix |
| 7 | Not started | Important | Teacher portal | Publish/archive/publish-marks actions lack safety confirmation. | Interaction-state fix |
| 8 | Not started | Important | Shared controls | Icon-only buttons rely on `title` instead of explicit accessible names. | Accessibility fix |
| 9 | Not started | Important | Design system | Common button/tab touch targets are below the recommended 44px target. | Design-token fix |
| 10 | Not started | Important | Student exam | Student answer controls use pressed buttons where radio/form semantics are expected. | Accessibility fix |
| 11 | Not started | Important | Forms | Student ID, answer, and grading inputs rely on placeholders instead of labels. | Accessibility fix |
| 12 | Not started | Important | Student exam | Timer, autosave, and upload status changes are not announced to assistive technology. | Accessibility fix |
| 13 | Not started | Important | Role portals | Principal and parent portals show visible “not connected yet” placeholders. | Product/content fix |
| 14 | Not started | Important | Performance | Production app ships as one large JS chunk. | Architecture fix |
| 15 | Not started | Important | Performance | Landing hero image asset is heavy. | Asset/performance fix |
| 16 | Not started | Nice to improve | Maintainability | Portal files are oversized and hard to maintain. | Component fix |
| 17 | Not started | Nice to improve | Content | Marketing copy is generic and includes unverifiable claims. | Content fix |

## Update log

- 2026-05-31: Created tracker and started ID 1.
