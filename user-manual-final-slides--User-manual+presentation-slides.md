# Calyxia Product Management System

End-to-End Product Management with Role-Based Access Control

---

## Agenda

Presentation Overview

1. System Overview
2. Demo Flow
3. Rights Matrix
4. Architecture
5. Lessons Learned
6. Q&A

---

## System Overview - High-Level

What is Calyxia Product Management System?

A web-based product management application built for Hope, Inc. that enables:

- Product CRUD Operations: Create, Read, Update, Delete products
- Price History Tracking: Maintain historical pricing data
- Role-Based Access Control: Three-tier user permission system
- Soft Delete Functionality: Recover deleted items
- Authentication: Email/Password and Google Sign-in support

Problem Solved: Centralized product management with secure, role-based access for different organizational levels

---

## System Overview - Key Features

Core Functionalities

- User Authentication
  - Email/Password login
  - Google OAuth integration
  - Session management with Supabase

- Product Management
  - Add new products (prodCode max 6 chars)
  - Edit existing products
  - Soft delete with recovery capability
  - Price history tracking per product

- Role-Based Security
  - USER: Basic product access
  - ADMIN: Extended rights with deleted items view
  - SUPERADMIN: Full system access including hard delete

- Responsive Design
  - Mobile-friendly interface
  - Collapsible sidebar navigation
  - Modal-based forms with auto-fit

---

## Demo Flow - Scenario 1: User Login & Product Management

Step-by-Step Walkthrough

1. Landing Page
   - User sees login/register options
   - Google Sign-in button available
   - Email/Password form for traditional login

2. Authentication
   - User enters credentials or clicks Google Sign-in
   - System validates with Supabase Auth
   - Redirect to Dashboard upon success

3. Dashboard Navigation
   - User accesses Products page via sidebar
   - Product list displays with role-appropriate buttons
   - USER sees: Add, Edit buttons (Delete hidden)

4. Add Product
   - Click "Add Product" button
   - Modal opens with form fields
   - Enter prodCode (max 6 chars), description, unit
   - Save creates new record in database

5. Edit Product
   - Click Edit button on any product
   - Modal pre-fills with existing data
   - Modify fields and save changes
   - Updates reflect immediately in list

---

## Demo Flow - Scenario 2: Admin Rights & Soft Delete

Admin-Specific Features

1. Admin Login
   - Admin authenticates with elevated credentials
   - Dashboard shows additional "Deleted Items" link in sidebar

2. Soft Delete Product
   - Admin clicks Delete button (only SUPERADMIN sees this)
   - Product disappears from USER view immediately
   - Record status changes to 'INACTIVE' in database
   - No DELETE SQL statement fired (soft delete)

3. View Deleted Items
   - Admin navigates to "Deleted Items" page
   - List shows all INACTIVE products
   - Stamp column visible (shows who/when modified)

4. Recover Product
   - Admin clicks "Recover" on deleted item
   - Record status changes back to 'ACTIVE'
   - Product reappears in all users' product lists

5. Price History
   - Click product to view price history panel
   - Add price entries with effDate and unitPrice
   - Validation: negative or zero prices rejected
   - Most recent price shows at top

---

## Rights Matrix - Overview

Three-Tier Permission System

The system implements a hierarchical role-based access control (RBAC) with three distinct user types:

- USER: Standard employee with basic product access
- ADMIN: Manager with extended rights and audit capabilities
- SUPERADMIN: System administrator with full control

Rights Enforcement Strategy
- Database-level: Row Level Security (RLS) policies in Supabase
- Application-level: Conditional rendering based on user role
- UI-level: Button visibility and navigation access control

---

## Rights Matrix - Details & Examples

Permission Breakdown by Role

| Feature | USER | ADMIN | SUPERADMIN |
|---------|------|-------|------------|
| View Products | Yes | Yes | Yes |
| Add Product | Yes | Yes | Yes |
| Edit Product | Yes | Yes | Yes |
| Delete Button | Hidden | Hidden | Visible |
| Deleted Items Page | Redirected | Visible | Visible |
| Stamp Column | Hidden | Visible | Visible |
| Price History | Yes | Yes | Yes |
| Hard Delete | No | No | Yes |

RLS Policy Examples
- USER: SELECT * FROM product WHERE record_status='ACTIVE'
- ADMIN: SELECT * FROM product (includes INACTIVE rows)
- SUPERADMIN: Full access with DELETE permissions

---

## Architecture - High-Level Diagram

System Architecture Overview

### Frontend Layer
- *React 19 + Vite 8*
- *React Router* — Navigation
- *Tailwind CSS* — Styling

### Service Layer
- *Supabase JS Client*
- *Auth Context* — Management
- *Product Service* — API Calls

### Backend Layer
- *Supabase Platform*
- *PostgreSQL* — Database
- *RLS Policies & Security*

---

## Architecture - Key Technologies

Technology Stack

Frontend
- React 19.2.4: UI framework with modern hooks
- Vite 8.0.4: Fast build tool and dev server
- React Router 7.14.2: Client-side routing
- Tailwind CSS 4.2.4: Utility-first CSS framework
- React Compiler: Performance optimization (optional)

Backend & Database
- Supabase: Backend-as-a-Service platform
  - Authentication (Email/Password + Google OAuth)
  - PostgreSQL database
  - Row Level Security (RLS)
  - Real-time subscriptions

Development Tools
- Vitest 4.1.4: Unit testing framework
- ESLint 9.39.4: Code linting
- Git: Version control with branch rules

---

## Architecture - Database Schema

Core Tables

Product Table
- prodCode (VARCHAR 6, PK)
- description (VARCHAR 30)
- unit (VARCHAR 3, CHECK: pc/ea/mtr/pkg/ltr)
- record_status (CHAR 1, A/I)
- stamp (TIMESTAMP)

Price History Table
- prodCode (FK to product)
- effDate (DATE)
- unitPrice (DECIMAL 10,2, CHECK: >= 0)
- record_status (CHAR 1)
- stamp (TIMESTAMP)

User Table
- user_id (VARCHAR 50, PK)
- password (VARCHAR 255, hashed)
- user_type (VARCHAR 20: USER/ADMIN/SUPERADMIN)
- email, firstname, lastname
- record_status, stamp

Rights Tables
- module: System features/screens
- rights: Permission types (VIEW, CREATE, EDIT, DELETE, APPROVE)
- user_module: User-module mapping
- UserModule_Rights: Granular permissions per user-module-right combination

---

## Lessons Learned - Technical

Technical Challenges & Solutions

Challenge 1: Modal Layout Issues
- Problem: Modals were too tall, cut off at bottom, z-index conflicts
- Solution: 
  - Applied max-h-[90vh] for height constraint
  - Added overflow-y-auto for internal scrolling
  - Fixed z-index hierarchy (Modal: 300, Navbar: 200, Sidebar: 100)
  - Changed to center alignment with backdrop blur

Challenge 2: Authentication Redirect Failures
- Problem: Failed redirect after registering new accounts
- Solution: Manual verification of callback codes and Supabase Auth configuration

Challenge 3: RLS Policy Implementation
- Problem: Users could see INACTIVE records despite role restrictions
- Solution: 
  - Implemented database-level RLS policies
  - Added record_status checks in policies
  - Verified via Supabase SQL Editor

Challenge 4: Package Configuration
- Problem: Mismatched package.json at project root
- Solution: Standardized root-level package configuration

---

## Lessons Learned - Process & Team

Development Process Insights

Sprint Methodology
- Sprint 1 (April 4-13, 2026): Foundation & Authentication
  - Established project structure
  - Implemented core authentication
  - Configured Vite and Tailwind
  - Set up testing framework (Vitest)

- Sprint 2: Product CRUD & Rights Enforcement
  - Implemented product management
  - Added soft delete functionality
  - Configured RLS policies
  - Created manual test suites

Team Collaboration
- Role-Based Development: M1 (Lead), M2 (Frontend), M3 (Backend), M4 (Auth), M5 (QA)
- Daily Standups: Tracked progress and blockers
- PR Management: Branch rules and code review process
- Documentation: Sprint logs and technical documentation

Quality Assurance
- Manual test checklists for each feature
- RLS verification via Supabase SQL Editor
- Cross-browser testing for modal responsiveness
- Mobile responsiveness validation

---

## User Manual

Getting Started Guide

Login Process
1. Navigate to the application URL
2. Choose login method:
   - Email/Password: Enter credentials and click Login
   - Google Sign-in: Click Google button to authenticate
3. Upon successful authentication, redirect to Dashboard

Product Management

Add Product
1. Click "Add Product" button
2. Fill in required fields:
   - Product Code (max 6 characters)
   - Description
   - Unit (pc, ea, mtr, pkg, ltr)
3. Click Save to create record

Edit Product
1. Click Edit button on product row
2. Modify fields as needed
3. Click Save to update record

View Price History
1. Click on product to open price history panel
2. View existing price entries
3. Add new price entry:
   - Effective Date
   - Unit Price (must be positive)

Role-Specific Features

USER Role
- View and add products
- Edit existing products
- View price history
- Cannot delete products
- Cannot see deleted items

ADMIN Role
- All USER permissions
- View deleted items page
- See stamp column (who/when modified)
- Recover deleted products

SUPERADMIN Role
- All ADMIN permissions
- Delete products (hard delete)
- Full system access

Troubleshooting
- Login issues: Verify credentials with Supabase
- Modal not displaying: Check browser compatibility
- Permission denied: Contact administrator for role assignment