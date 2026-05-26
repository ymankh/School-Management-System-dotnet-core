# School Foundation Feature Documentation

## Role Foundation

The school foundation now defines five account roles:

- `admin`
- `principal`
- `teacher`
- `student`
- `parent`

## Public Registration

Public registration creates student accounts only. This avoids letting a public user self-select privileged roles such as `admin`, `principal`, or `teacher`.

Admin-managed role assignment will be added with the users management API and admin UI.

## Current Portal Routing

- `admin` users open the admin portal area.
- `principal` users open the principal portal area.
- `teacher` users open the teacher portal.
- `student` users open the student portal.
- `parent` users open the parent portal area.

Each role is routed to its own portal identity. Placeholder portals remain for roles whose full features are not connected yet.

The frontend route tree is handled by TanStack Router. Manual `window.location`, `pushState`, and `popstate` routing has been removed from `App`.

Role permissions are enforced with TanStack Router `beforeLoad` route guards. Unauthenticated users are redirected to `/login`; authenticated users with the wrong role are redirected to `/unauthorized`.

Canonical portal routes:

- `/admin`
- `/principal`
- `/teacher`
- `/student`
- `/parent`
- `/unauthorized`

The legacy `/exam` route remains only as a compatibility route. It redirects the authenticated user to their own role-specific portal route.

Dashboard tabs are real pages, not local-only UI state.

Teacher pages:

- `/teacher/dashboard`
- `/teacher/builder`
- `/teacher/bank`
- `/teacher/grading`

Student pages:

- `/student/dashboard`
- `/student/schedule`
- `/student/homework`
- `/student/exams`
- `/student/messages`
- `/student/profile`
- `/student/settings`

The parent `/teacher` and `/student` routes redirect to their default dashboard pages.

Frontend user-type module folders:

- `client/src/modules/admin/`
- `client/src/modules/principal/`
- `client/src/modules/teacher/`
- `client/src/modules/student/`
- `client/src/modules/parent/`

Exam pages remain under `client/src/modules/exam-engine/` and are consumed by the teacher and student user-type pages. The exam module no longer owns admin, principal, or parent portal placeholders.

Error pages live under `client/src/modules/errors/`:

- `UnauthorizedPage`
- `NotFoundPage`

## Backend Role Constants

Backend role names are centralized in `AuthRoles` so future controllers and validation logic can use one source of truth.

## Verification

Completed checks for the role foundation:

- `dotnet test SchoolSystemTask.slnx`
- `npm run test`
- `npm run build`

## Backend School Domain Foundation

The backend now includes the core domain model for school management.

Entities added:

- `Subject`
- `SchoolClass`
- `ClassSubject`
- `StudentProfile`
- `TeacherProfile`
- `ParentProfile`
- `StudentClassEnrollment`
- `TeacherClassAssignment`
- `ParentStudentLink`

The model supports these foundation rules:

- Subject names and codes are unique.
- Class names are unique within an academic year.
- A class can include a subject only once.
- A user can have one student, teacher, or parent profile of each profile type.
- Student numbers are unique.
- Teacher employee numbers are unique.
- A student can be enrolled in only one class per academic year.
- A teacher can be assigned to a class-subject only once.
- A parent can be linked to a student only once.

The migration `20260526010500_AddSchoolFoundationTables` creates the new school foundation tables.

Completed checks for the backend school domain foundation:

- `dotnet test SchoolSystemTask.slnx`

## Users Management API

The backend now exposes user management endpoints for the future admin UI.

Endpoints added:

- `GET /api/users`
- `GET /api/users/{id}`
- `POST /api/users`
- `PUT /api/users/{id}`
- `PUT /api/users/{id}/role`
- `DELETE /api/users/{id}`

Supported query filters for `GET /api/users`:

- `role`
- `search`

User management behavior:

- Created users must have a valid foundation role.
- Created users must have a unique email.
- Created users must have a password of at least 8 characters.
- Updating a user's role to `student` assigns a student ID if the user does not already have one.
- Updating a user's role away from `student` clears the student ID.

Completed checks for the users management API:

- `dotnet test SchoolSystemTask.slnx`

## Subjects API

The backend now exposes subject management endpoints for the future admin UI.

Endpoints added:

- `GET /api/subjects`
- `GET /api/subjects/{id}`
- `POST /api/subjects`
- `PUT /api/subjects/{id}`
- `DELETE /api/subjects/{id}`

Supported query options for `GET /api/subjects`:

- `search`
- `includeInactive`

Subject management behavior:

- Subject names must be at least 2 characters.
- Subject codes must be at least 2 characters.
- Subject codes are normalized to uppercase.
- Subject names and codes must be unique.
- Deleting a subject marks it inactive instead of removing the row.

Completed checks for the subjects API:

- `dotnet test SchoolSystemTask.slnx`
