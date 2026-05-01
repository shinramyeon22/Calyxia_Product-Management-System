# Sprint 1 Official Log: Foundation & Authentication

**Dates:** April 4, 2026 – April 13, 2026
**Project:** Calyxia Product Management System <br>
**Sprint Goal:** Establish the technical foundation, project architecture, core authentication flow, and finish the Landing Page with Google Authentication. <br>
**Prepared by:** ThezzaSalcedo 

**Status:** Completed

## 1. Sprint Overview
The goal of Sprint 1 was to initialize the repository, set up the project structure, and implement core authentication (Email/Password and Google Sign-in).

## 2. Team Contributions
| Member | Role | Primary Deliverables (Based on Standups) |
| :--- | :--- | :--- |
| **Claryss** | M1 (Lead) | Initial project structure, Tailwind/Vite config, and PR management. |
| **Eunice** | M2 (Frontend) | Login/Register UI. |
| **Josh** | M3 (Backend) | Seeded 5 HopeDB tables and enabled RLS policies. |
| **Alexza** | M4 (Auth) | Enabled Google Sign-in, set up Test accounts, and Auth input fields. |
| **Thezza** | M5 (QA) | Set up Vitest, and created test cases for Sprints 1. |

## 3. Tasks Completed (Summary)
- **Infrastructure:** Configured Vite 18 and Tailwind CSS; established branch and PR rules.
- **UI/UX:** Completed Login and Registration pages with wireframes.
- **Database:** All 5 seeded tables now have active Row Level Security (RLS) policies.
- **Authentication:** Google OAuth enabled.
- **Quality Assurance:** Manual test suites for Sprint 1 authentication flows and redirect skeleton for login.

## 4. Blockers & Resolutions
- **Blocker:** Mismatched `package.json` at the project root.
- **Resolution:** Fixed root-level package configuration to ensure consistency.
- **Blocker:** Authentication error on Supabase initial SQL script.
- **Resolution:** M4 fixed the RLS and table.
- **Blocker:** Failed redirect after registering new accounts.
- **Resolution:** Team checks the code callbacks verification codes manually.

## 5. Next Sprint Goals (Sprint 2)
- Finalize User Roles and custom rights mapping.
- Implement test cases for the 27-case Rights Matrix.
- Begin work on Soft-Delete visibility and recovery.
