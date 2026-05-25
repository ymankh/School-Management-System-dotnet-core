# School Foundation Implementation Plan

This document tracks the school-management foundation work across backend, frontend, tests, verification, and feature documentation.

## Status Legend

- `Not started`
- `In progress`
- `Blocked`
- `Ready for review`
- `Done`

## Decisions

- Roles: `admin`, `principal`, `teacher`, `student`, `parent`
- Registration: public registration creates student accounts for now; admin role assignment will be introduced with user management
- Student enrollment: one class per student per academic year
- Exam availability: exams apply to enrolled class students by default
- Principal permissions: academic management without full admin user/role control

## Progress Checklist

| Step | Status | Link |
| --- | --- | --- |
| 1 | Done | [Confirm foundation decisions](#step-1-confirm-foundation-decisions) |
| 2 | Done | [Add backend school domain entities](#step-2-add-backend-school-domain-entities) |
| 3 | Done | [Configure EF Core mappings](#step-3-configure-ef-core-mappings) |
| 4 | Done | [Add database migration](#step-4-add-database-migration) |
| 5 | Done | [Extend auth roles](#step-5-extend-auth-roles) |
| 6 | Done | [Add users management API](#step-6-add-users-management-api) |
| 7 | Done | [Add subjects API](#step-7-add-subjects-api) |
| 8 | Not started | [Add classes API](#step-8-add-classes-api) |
| 9 | Not started | [Add class-subject API](#step-9-add-class-subject-api) |
| 10 | Not started | [Add student enrollment API](#step-10-add-student-enrollment-api) |
| 11 | Not started | [Add teacher assignment API](#step-11-add-teacher-assignment-api) |
| 12 | Not started | [Add parent-student link API](#step-12-add-parent-student-link-api) |
| 13 | Done | [Add backend validation tests](#step-13-add-backend-validation-tests) |
| 14 | Done | [Add backend API behavior tests](#step-14-add-backend-api-behavior-tests) |
| 15 | Not started | [Run backend verification](#step-15-run-backend-verification) |
| 16 | Not started | [Add frontend school admin types](#step-16-add-frontend-school-admin-types) |
| 17 | Not started | [Add frontend school admin API client](#step-17-add-frontend-school-admin-api-client) |
| 18 | Done | [Update frontend auth roles](#step-18-update-frontend-auth-roles) |
| 19 | Not started | [Replace admin placeholder](#step-19-replace-admin-placeholder) |
| 20 | Not started | [Build admin dashboard overview](#step-20-build-admin-dashboard-overview) |
| 21 | Not started | [Build users management screen](#step-21-build-users-management-screen) |
| 22 | Not started | [Build subjects screen](#step-22-build-subjects-screen) |
| 23 | Not started | [Build classes screen](#step-23-build-classes-screen) |
| 24 | Not started | [Build class detail screen](#step-24-build-class-detail-screen) |
| 25 | Not started | [Build student enrollment UI](#step-25-build-student-enrollment-ui) |
| 26 | Not started | [Build teacher assignment UI](#step-26-build-teacher-assignment-ui) |
| 27 | Not started | [Build parent linking UI](#step-27-build-parent-linking-ui) |
| 28 | Not started | [Update teacher portal data source](#step-28-update-teacher-portal-data-source) |
| 29 | Not started | [Update student portal data source](#step-29-update-student-portal-data-source) |
| 30 | Not started | [Add parent portal](#step-30-add-parent-portal) |
| 31 | Not started | [Add principal portal](#step-31-add-principal-portal) |
| 32 | Not started | [Connect exams to class-subject](#step-32-connect-exams-to-class-subject) |
| 33 | Not started | [Replace manual exam student assignment](#step-33-replace-manual-exam-student-assignment) |
| 34 | Not started | [Update subject skills and question bank](#step-34-update-subject-skills-and-question-bank) |
| 35 | Not started | [Run frontend tests](#step-35-run-frontend-tests) |
| 36 | Not started | [Run frontend lint](#step-36-run-frontend-lint) |
| 37 | Not started | [Run frontend build](#step-37-run-frontend-build) |
| 38 | Not started | [Admin acceptance flow](#step-38-admin-acceptance-flow) |
| 39 | Not started | [Teacher acceptance flow](#step-39-teacher-acceptance-flow) |
| 40 | Not started | [Student acceptance flow](#step-40-student-acceptance-flow) |
| 41 | Not started | [Parent acceptance flow](#step-41-parent-acceptance-flow) |
| 42 | Not started | [Principal acceptance flow](#step-42-principal-acceptance-flow) |

## Step Details

### Step 1 Confirm Foundation Decisions

Outcome: the project has explicit defaults for roles, registration, enrollment, exam availability, and principal permissions.

Verification:

- Decisions are recorded in this document.
- Role values are used consistently by backend and frontend after steps 5 and 18.

Feature documentation:

- The foundation uses five roles: `admin`, `principal`, `teacher`, `student`, and `parent`.
- Admins own user and role administration.
- Principals manage academic structure without full admin control.
- Students are limited to one class per academic year.
- Exams are intended to target enrolled students through class membership.

Completed review:

- Backend and frontend defaults were checked against the agreed decisions.
- Public registration no longer exposes privileged role selection in the UI.
- Verification passed with backend tests, frontend tests, and frontend production build.

### Step 2 Add Backend School Domain Entities

Outcome: school foundation entity classes compile.

Completed implementation:

- Added `Subject`, `SchoolClass`, `ClassSubject`, `StudentProfile`, `TeacherProfile`, `ParentProfile`, `StudentClassEnrollment`, `TeacherClassAssignment`, and `ParentStudentLink`.
- Added navigation properties needed by the academic structure, enrollment, teacher assignment, and parent-link flows.

Verification:

- `dotnet test SchoolSystemTask.slnx` passed.

### Step 3 Configure EF Core Mappings

Outcome: `ApplicationDbContext` exposes school foundation sets and relationship rules.

Completed implementation:

- Added `DbSet<>` properties for all school foundation entities.
- Added unique indexes for subject code/name, class name/year, profile user links, student numbers, employee numbers, enrollment rules, teacher assignments, and parent-student links.
- Added relationships and delete behaviors for school foundation data.

Verification:

- `dotnet test SchoolSystemTask.slnx` passed.

### Step 4 Add Database Migration

Outcome: a migration creates the school foundation tables without breaking existing tables.

Completed implementation:

- Added `20260526010500_AddSchoolFoundationTables` migration.
- The migration creates the school foundation tables and indexes while leaving existing auth and exam tables intact.

Verification:

- `dotnet test SchoolSystemTask.slnx` passed.

### Step 5 Extend Auth Roles

Outcome: backend auth accepts all foundation roles and rejects unknown roles.

Completed implementation:

- Added shared backend role constants for `admin`, `principal`, `teacher`, `student`, and `parent`.
- Added role validation tests for valid and invalid role names.
- Set public registration to create student accounts only.

Verification:

- `dotnet test SchoolSystemTask.slnx` passed.

### Step 6 Add Users Management API

Outcome: users can be listed, created, updated, deleted, and assigned roles through API endpoints.

Completed implementation:

- Added `GET /api/users` with role and search filters.
- Added `GET /api/users/{id}`.
- Added `POST /api/users`.
- Added `PUT /api/users/{id}`.
- Added `PUT /api/users/{id}/role`.
- Added `DELETE /api/users/{id}`.
- User creation and role updates validate against the shared foundation role list.

Verification:

- `dotnet test SchoolSystemTask.slnx` passed with 27 tests.

### Step 7 Add Subjects API

Outcome: subjects can be managed through API endpoints.

Completed implementation:

- Added `GET /api/subjects` with search and inactive filtering.
- Added `GET /api/subjects/{id}`.
- Added `POST /api/subjects`.
- Added `PUT /api/subjects/{id}`.
- Added `DELETE /api/subjects/{id}` as a soft delete that deactivates the subject.
- Subject creation normalizes codes to uppercase.

Verification:

- `dotnet test SchoolSystemTask.slnx` passed with 30 tests.

### Step 8 Add Classes API

Outcome: classes can be managed through API endpoints.

### Step 9 Add Class-Subject API

Outcome: subjects can be attached to and removed from classes.

### Step 10 Add Student Enrollment API

Outcome: students can be enrolled in and removed from classes.

### Step 11 Add Teacher Assignment API

Outcome: teachers can be assigned to class-subjects.

### Step 12 Add Parent-Student Link API

Outcome: parents can be linked to and unlinked from students.

### Step 13 Add Backend Validation Tests

Outcome: duplicate and invalid school foundation operations are covered by tests.

Completed implementation:

- Added SQLite-backed EF tests for subject uniqueness, class/year uniqueness, one-class-per-year enrollment, duplicate teacher assignments, and duplicate parent-student links.

Verification:

- `dotnet test SchoolSystemTask.slnx` passed with 24 tests.

### Step 14 Add Backend API Behavior Tests

Outcome: core user, subject, class, enrollment, assignment, and parent-link API flows are covered.

Completed implementation:

- Added users controller behavior tests for creating foundation-role users, rejecting invalid roles, and assigning student IDs when changing a user to the student role.

Remaining future coverage:

- Subject API tests will be added with Step 7.
  Completed with Step 7.
- Classes API tests will be added with Step 8.
- Enrollment, assignment, and parent-link API tests will be added with their API steps.

Verification:

- `dotnet test SchoolSystemTask.slnx` passed with 27 tests.

### Step 15 Run Backend Verification

Outcome: `dotnet test SchoolSystemTask.slnx` passes.

### Step 16 Add Frontend School Admin Types

Outcome: frontend has typed models for school foundation data.

### Step 17 Add Frontend School Admin API Client

Outcome: frontend has typed API functions for school foundation endpoints.

### Step 18 Update Frontend Auth Roles

Outcome: frontend auth and navigation understand all foundation roles.

Completed implementation:

- Extended frontend `AuthRole` to include `principal` and `parent`.
- Removed public role selection from registration.
- Routed parent users to a parent portal placeholder.
- Routed principal users to a principal portal placeholder.
- Each role now maps to its own portal identity without borrowing another role's portal.

Verification:

- `npm run test` passed.
- `npm run build` passed.

### Step 19 Replace Admin Placeholder

Outcome: admin users see a real admin dashboard shell instead of placeholder content.

### Step 20 Build Admin Dashboard Overview

Outcome: admin dashboard shows real counts and health indicators.

### Step 21 Build Users Management Screen

Outcome: admins can manage users from the UI.

### Step 22 Build Subjects Screen

Outcome: admins can manage subjects from the UI.

### Step 23 Build Classes Screen

Outcome: admins can manage classes from the UI.

### Step 24 Build Class Detail Screen

Outcome: admins can configure one class from a detail page.

### Step 25 Build Student Enrollment UI

Outcome: admins can add and remove students from classes in the UI.

### Step 26 Build Teacher Assignment UI

Outcome: admins can assign teachers to class-subjects in the UI.

### Step 27 Build Parent Linking UI

Outcome: admins can link parents to students in the UI.

### Step 28 Update Teacher Portal Data Source

Outcome: teachers see only assigned class-subjects.

### Step 29 Update Student Portal Data Source

Outcome: students see data from their class enrollment instead of manual IDs.

### Step 30 Add Parent Portal

Outcome: parents can view linked children and child academic data.

### Step 31 Add Principal Portal

Outcome: principals can view and manage academic structure according to permissions.

### Step 32 Connect Exams To Class-Subject

Outcome: exams use real class-subject records for class and subject context.

### Step 33 Replace Manual Exam Student Assignment

Outcome: class enrollment drives default student exam availability.

### Step 34 Update Subject Skills And Question Bank

Outcome: exam subject features use foundation subject and class-subject data.

### Step 35 Run Frontend Tests

Outcome: `npm run test` passes in `client`.

### Step 36 Run Frontend Lint

Outcome: `npm run lint` passes in `client`.

### Step 37 Run Frontend Build

Outcome: `npm run build` passes in `client`.

### Step 38 Admin Acceptance Flow

Outcome: admin can configure users, subjects, classes, enrollments, teacher assignments, and parent links end to end.

### Step 39 Teacher Acceptance Flow

Outcome: teacher can create and publish an exam for an assigned class-subject.

### Step 40 Student Acceptance Flow

Outcome: student can view, take, and submit an exam from enrollment-based access.

### Step 41 Parent Acceptance Flow

Outcome: parent can view linked child academic data.

### Step 42 Principal Acceptance Flow

Outcome: principal can use academic management views.
