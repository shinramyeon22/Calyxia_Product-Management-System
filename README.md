# Calyxia Product Management System

A comprehensive product management system built with React and Vite, featuring role-based access control, product management capabilities, and a modern user interface.

## Team Members

- [Claryss Mae Pangasian](https://github.com/shinramyeon22) - Project Lead/Scrum Master
- [Eunice Mabasa](https://github.com/eunicemabasa) - Frontend Developer (UI/UX)
- [Josh Tomacruz](https://github.com/tomacruzjosh) - DB Engineer
- [Alexza Gayle Ignacio](https://github.com/alexzaignacio) - Rights & Authentication Specialist
- [Thezzalia Mae Salcedo](https://github.com/ThezzaSalcedo) - QA / Documentation Specialist

## Tech Stack

- Frontend: React 18, Vite
- Styling: CSS
- Database: PostgreSQL (via Supabase)
- Authentication: Supabase Auth
- State Management: React Context API

## Features

- Role-based access control (RBAC)
- Product management (CRUD operations)
- User authentication and authorization
- Admin dashboard
- Responsive UI design

## Installation

1. Clone the repository:
git clone https://github.com/shinramyeon22/Calyxia_Product-Management-System.git

2. Install dependencies:
npm install

3. Set up environment variables:
cp .env.example .env
Update .env with your Supabase credentials.

4. Run the development server:
npm run dev

5. Build for production:
npm run build

## Database Setup

Run the database migrations located in the db/migrations/ directory:
- HopeDB-2.sql - Main database schema
- rights.sql - Rights and permissions setup
- seed_superadmin_and_module_permissions.sql - Seed data for superadmin and permissions

## Project Structure

src/
├── components/       # Reusable UI components
├── context/         # React context providers
├── pages/           # Page components
├── services/        # API services
└── App.jsx          # Main application component

## Contributing

This is a group project for academic purposes. For questions or issues, please contact the project lead.
