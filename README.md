<p align="center">
  <a href="https://calyxia-product-management-system-gamma.vercel.app/login" target="_blank">
    <img src="https://img.shields.io/badge/🚀%20Launch%20Calyxia%20PMS-View%20Live%20App-6366F1?style=for-the-badge&logo=vercel&logoColor=white" alt="Launch Calyxia PMS" height="50"/>
  </a>
</p>

<h1 align="center">Calyxia Product Management System</h1>

<p align="center">
  A comprehensive product management system built with React and Vite, featuring role-based access control, product management capabilities, and a modern user interface.
  <br/><br/>
  <strong>Live Deployment:</strong>
  <a href="calyxia-product-management-system.vercel.app">
    https://calyxia-product-management-system-gamma.vercel.app/login
  </a>
</p>

---

## Team Members

- **[Claryss Mae Pangasian](https://github.com/claryss-pangasian)** - Project Lead / Scrum Master
- **[Eunice Mabasa](https://github.com/eunice-mabasa)** - Frontend Developer (UI/UX)
- **[Josh Tomacruz](https://github.com/josh-tomacruz)** - DB Engineer
- **[Alexza Gayle Ignacio](https://github.com/alexza-ignacio)** - Rights & Authentication Specialist
- **[Thezzalia Mae Salcedo](https://github.com/thezzalia-salcedo)** - QA / Documentation Specialist

---

## Tech Stack

- **Frontend Framework:** React 18 + Vite
- **Styling:** CSS
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **State Management:** React Context API

---

## Features

- 🔐 Role-based access control (RBAC)
- 📦 Product management (CRUD operations)
- 👤 User authentication and authorization
- 📊 Admin dashboard
- 📱 Responsive UI design

---

## Setup and Installation

### 1. Clone the Repository

```bash
git clone https://github.com/shinramyeon22/Calyxia_Product-Management-System.git
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory and add the following:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note:** Coordinate with your team members to obtain the API keys.

### 4. Run the Project

```bash
npm run dev
```

### 5. Run Tests

```bash
npm run test
```

---

## Database Setup

Run the database migrations located in the `db/migrations/` directory:

- `HopeDB-2.sql` — Main database schema
- `rights.sql` — Rights and permissions setup
- `seed_superadmin_and_module_permissions.sql` — Seed data for superadmin and permissions

---

## Project Structure

```plaintext
src/
├── components/       # Reusable UI components
├── context/          # React context providers
├── pages/            # Page components
├── services/         # API services
└── App.jsx           # Main application component
```

---

## License

This project is licensed under the MIT License — see the `LICENSE` file for details.
