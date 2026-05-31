# Website Review Fix Tracker

Status values: `Not started`, `In progress`, `Done`, `Blocked`.

| ID | Status | Severity | Area | Issue | Fix type |
|---:|---|---|---|---|---|
| 1 | Done | Critical | Backend | Backend cannot start because EF Core detects pending model changes during startup migration. | Backend/data fix |
| 2 | Done | Critical | Landing | Landing and pricing CTAs look actionable but have no navigation or handler. | Interaction-state fix |
| 3 | Done | Critical | Landing | Demo request form is cosmetic: no submit path, no field names, no required validation. | Component fix |
| 4 | Done | Important | Footer | Footer links use `href=\"#\"` dead links. | Content fix |
| 5 | Done | Important | Auth | Login/register pages expose multiple visible `h1` headings. | Accessibility fix |
| 6 | Done | Important | Admin | Destructive admin actions execute immediately without confirmation. | Interaction-state fix |
| 7 | Done | Important | Teacher portal | Publish/archive/publish-marks actions lack safety confirmation. | Interaction-state fix |
| 8 | Done | Important | Shared controls | Icon-only buttons rely on `title` instead of explicit accessible names. | Accessibility fix |
| 9 | Done | Important | Design system | Common button/tab touch targets are below the recommended 44px target. | Design-token fix |
| 10 | Done | Important | Student exam | Student answer controls use pressed buttons where radio/form semantics are expected. | Accessibility fix |
| 11 | Done | Important | Forms | Student ID, answer, and grading inputs rely on placeholders instead of labels. | Accessibility fix |
| 12 | In progress | Important | Student exam | Timer, autosave, and upload status changes are not announced to assistive technology. | Accessibility fix |
| 13 | Not started | Important | Role portals | Principal and parent portals show visible “not connected yet” placeholders. | Product/content fix |
| 14 | Not started | Important | Performance | Production app ships as one large JS chunk. | Architecture fix |
| 15 | Not started | Important | Performance | Landing hero image asset is heavy. | Asset/performance fix |
| 16 | Not started | Nice to improve | Maintainability | Portal files are oversized and hard to maintain. | Component fix |
| 17 | Not started | Nice to improve | Content | Marketing copy is generic and includes unverifiable claims. | Content fix |

## Update log

- 2026-05-31: Created tracker and started ID 1.

- 2026-05-31: Completed ID 1. SQLite development startup now uses `EnsureCreated`, PostgreSQL keeps migrations, and default admin seeding runs after database initialization. Started ID 2.
- 2026-05-31: Completed ID 2. Landing and pricing CTAs now use real links to registration or the contact/demo section. Started ID 3.
- 2026-05-31: Completed ID 3. Demo request fields now have names, required validation, autocomplete hints, a submit button, and a mail handoff action. Started ID 4.
- 2026-05-31: Completed ID 4. Footer brand, section links, support links, and email now point to real anchors or mail actions. Started ID 5.
- 2026-05-31: Completed ID 5. Auth page marketing panel no longer creates a second visible page-level heading. Started ID 6.
- 2026-05-31: Completed ID 6. Admin user deletion and subject deactivation now require explicit confirmation. Started ID 7.
- 2026-05-31: Completed ID 7. Teacher exam publish, archive, builder publish, and mark publishing actions now require confirmation. Started ID 8.
- 2026-05-31: Completed ID 8. Shared and admin icon-only controls now expose explicit accessible names. Started ID 9.
- 2026-05-31: Completed ID 9. Common button and tab sizing now uses larger interaction targets. Started ID 10.
- 2026-05-31: Completed ID 10. Multiple-choice and true/false answer groups now use radio semantics instead of pressed-button semantics. Started ID 11.
- 2026-05-31: Completed ID 11. Student ID, written answers, fill-in answers, and grading fields now expose labels or accessible names. Started ID 12.