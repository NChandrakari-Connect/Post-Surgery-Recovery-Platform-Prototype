import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Users, Activity, AlertTriangle,
  FileText, CalendarCheck,
  Heart, ClipboardList, Pill, Clock, UserCircle,
  Menu, X, Stethoscope
} from 'lucide-react';

const careTeamNav = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Patients', path: '/patients', icon: Users },
  { label: 'Recovery Monitoring', path: '/monitoring', icon: Activity },
  { label: 'Alerts', path: '/alerts', icon: AlertTriangle, badge: 2 },
  { label: 'Reports', path: '/reports-overview', icon: FileText },
  { label: 'Follow-ups', path: '/followups', icon: CalendarCheck },
];

const patientNav = [
  { label: 'My Recovery', path: '/', icon: Heart },
  { label: 'Surgery & Discharge', path: '/surgery-discharge', icon: FileText },
  { label: 'Check-in', path: '/checkin', icon: ClipboardList },
  { label: 'My Reports', path: '/my-reports', icon: FileText },
  { label: 'Medications', path: '/my-medications', icon: Pill },
  { label: 'Recovery Timeline', path: '/my-timeline', icon: Clock },
  { label: 'Care Team', path: '/my-care-team', icon: UserCircle },
];

export default function Sidebar() {
  const { role, setRole, sidebarOpen, setSidebarOpen } = useApp();
  const location = useLocation();
  const navItems = role === 'care-team' ? careTeamNav : patientNav;

  const handleSwitchPortal = (targetRole) => {
    setRole(targetRole);
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Stethoscope size={20} />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">IncisionCare</span>
            <span className="sidebar-brand-tag">Recovery Platform</span>
          </div>
          <button
            type="button"
            className="sidebar-close-mobile"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Portal Switcher Card (Always accessible, especially on mobile) */}
        <div className="sidebar-portal-card">
          <div className="sidebar-portal-label">
            <span>Current Portal</span>
            <span className="sidebar-portal-badge">
              {role === 'care-team' ? 'Doctor View' : 'Patient View'}
            </span>
          </div>
          <div className="sidebar-portal-grid">
            <button
              type="button"
              className={`sidebar-portal-btn ${role === 'care-team' ? 'active' : ''}`}
              onClick={() => handleSwitchPortal('care-team')}
            >
              <Stethoscope size={14} />
              <span>Care Team</span>
            </button>
            <button
              type="button"
              className={`sidebar-portal-btn ${role === 'patient' ? 'active' : ''}`}
              onClick={() => handleSwitchPortal('patient')}
            >
              <Heart size={14} />
              <span>Patient</span>
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">
            {role === 'care-team' ? 'Clinical Workspace' : 'Patient Recovery'}
          </div>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={() => {
                if (window.innerWidth <= 1024) setSidebarOpen(false);
              }}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="sidebar-link-badge">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
