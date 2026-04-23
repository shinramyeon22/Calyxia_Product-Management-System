import React, { useState } from 'react';
import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import neuLogo from '../assets/neu-logo.png';
import {
  FiHome, FiFolder, FiCheckSquare, FiPieChart,
  FiUsers, FiSettings, FiChevronLeft, FiLogOut
} from 'react-icons/fi';
import './AppShell.css';

// ── Role-based menu config ─────────────────────────────────
const MENU_BY_ROLE = {
  ADMIN:   ['DASHBOARD', 'USERS', 'PROJECTS', 'TASKS', 'REPORTS', 'SETTINGS'],
  MANAGER: ['DASHBOARD', 'PROJECTS', 'TASKS', 'REPORTS'],
  USER:    ['DASHBOARD', 'REPORTS'],
};

const ALL_MENU_ITEMS = [
  { key: 'DASHBOARD', label: 'Dashboard', icon: <FiHome />,        path: '/dashboard' },
  { key: 'USERS',     label: 'Users',     icon: <FiUsers />,       path: '/users'     },
  { key: 'PROJECTS',  label: 'Projects',  icon: <FiFolder />,      path: '/projects'  },
  { key: 'TASKS',     label: 'Tasks',     icon: <FiCheckSquare />, path: '/tasks'     },
  { key: 'REPORTS',   label: 'Reports',   icon: <FiPieChart />,    path: '/reports'   },
  { key: 'SETTINGS',  label: 'Settings',  icon: <FiSettings />,    path: '/settings'  },
];

// ── Helpers ────────────────────────────────────────────────
function getInitials(email) {
  if (!email) return 'AU';
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function getDisplayName(email) {
  if (!email) return 'Authorized User';
  return email
    .split('@')[0]
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ── Component ──────────────────────────────────────────────
export default function AppShell() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth(); // ✅ CORRECT PLACE

  const [collapsed, setCollapsed] = useState(false);

  // fallback role (you can improve later)
  const userType = user?.user_type || 'USER';

  const allowedKeys  = MENU_BY_ROLE[userType] ?? MENU_BY_ROLE['USER'];
  const visibleItems = ALL_MENU_ITEMS.filter(item => allowedKeys.includes(item.key));

  const initials    = getInitials(user?.email);
  const displayName = getDisplayName(user?.email);

  // ✅ let ProtectedRoute handle loading — but still safe fallback
  if (loading) return <div>Loading...</div>;

  return (
    <div className="cas-shell">

      {/* NAVBAR */}
      <header className="cas-navbar">
        <div className="cas-brand">
          <img src={neuLogo} alt="NEU" className="cas-brand-logo" />
          <span className="cas-brand-name">CALYXIA</span>
        </div>

        <div className="cas-nav-right">
          <div className="cas-user-display">
            <div className="cas-avatar">{initials}</div>
            <div className="cas-user-info">
              <span className="cas-user-name">{displayName}</span>
              <span className="cas-user-email">{user?.email}</span>
            </div>
          </div>

          <div className="cas-nav-divider" />

          <button
            className="cas-logout-btn"
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
          >
            <FiLogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="cas-body">

        {/* SIDEBAR */}
        <aside className={`cas-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
          <nav className="cas-sidebar-nav">
            {visibleItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.path}
                className={({ isActive }) =>
                  `cas-sidebar-link ${isActive ? 'is-active' : ''}`
                }
              >
                <span className="cas-link-icon">{item.icon}</span>
                <span className="cas-link-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="cas-sidebar-footer">
            <button
              className="cas-collapse-btn"
              onClick={() => setCollapsed(v => !v)}
            >
              <FiChevronLeft
                size={16}
                className={`cas-collapse-icon ${collapsed ? 'is-rotated' : ''}`}
              />
              <span className="cas-link-label">Collapse</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="cas-main">
          <Outlet />
        </main>

      </div>
    </div>
  );
}