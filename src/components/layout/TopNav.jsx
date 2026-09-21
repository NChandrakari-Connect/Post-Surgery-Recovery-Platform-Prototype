import { useApp } from '../../context/AppContext';
import { Bell, Menu, Search, RotateCcw } from 'lucide-react';

export default function TopNav({ title }) {
  const { role, setRole, setSidebarOpen, resetDemoData } = useApp();

  return (
    <header className="topnav">
      <div className="topnav-left">
        <button
          className="menu-toggle"
          onClick={() => setSidebarOpen(prev => !prev)}
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
        {title && <h1 className="topnav-title">{title}</h1>}
      </div>

      <div className="topnav-right">
        {/* Refresh Demo Data Button */}
        <button
          type="button"
          onClick={resetDemoData}
          title="Reset all demo data (appointments, tasks, guidance, check-ins) added in this session"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: '8px',
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--ink)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--teal)';
            e.currentTarget.style.background = 'var(--teal-pale)';
            e.currentTarget.style.color = 'var(--teal-deep)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--line)';
            e.currentTarget.style.background = 'var(--surface)';
            e.currentTarget.style.color = 'var(--ink)';
          }}
        >
          <RotateCcw size={13} style={{ color: 'var(--teal)' }} />
          <span>Refresh Demo Data</span>
        </button>

        <div className="role-switcher">
          <button
            className={`role-btn ${role === 'care-team' ? 'active' : ''}`}
            onClick={() => setRole('care-team')}
          >
            Care Team
          </button>
          <button
            className={`role-btn ${role === 'patient' ? 'active' : ''}`}
            onClick={() => setRole('patient')}
          >
            Patient
          </button>
        </div>

        <button className="topnav-icon-btn" aria-label="Search">
          <Search size={20} />
        </button>

        <button className="topnav-icon-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="notification-dot" />
        </button>

        <button className="topnav-avatar">
          <div className="avatar-circle">
            {role === 'care-team' ? 'AS' : 'MS'}
          </div>
          <div className="topnav-user-info">
            <span className="topnav-user-name">
              {role === 'care-team' ? 'Dr. Sen' : 'Maya Sharma'}
            </span>
            <span className="topnav-user-role">
              {role === 'care-team' ? 'Surgeon' : 'Patient'}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
