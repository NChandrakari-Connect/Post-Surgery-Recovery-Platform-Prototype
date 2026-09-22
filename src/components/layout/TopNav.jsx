import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getPatientById, getPatientFullName } from '../../data/patients';
import { Bell, Menu, Search, RotateCcw } from 'lucide-react';

export default function TopNav({ title }) {
  const { role, setRole, setSidebarOpen, resetDemoData, selectedPatientId } = useApp();
  const location = useLocation();

  let displayTitle = title;
  if (!displayTitle) {
    if (location.pathname.startsWith('/patients/')) {
      const match = location.pathname.match(/\/patients\/([^/]+)/);
      const patient = match ? getPatientById(match[1]) : null;
      displayTitle = patient ? getPatientFullName(patient) : 'Patient Profile';
    } else if (role === 'patient') {
      const patient = getPatientById(selectedPatientId);
      displayTitle = patient ? getPatientFullName(patient) : 'IncisionCare';
    } else {
      const titleMap = {
        '/': 'Overview',
        '/patients': 'Patients',
        '/monitoring': 'Monitoring',
        '/alerts': 'Alerts',
        '/reports-overview': 'Reports',
        '/followups': 'Follow-ups',
      };
      displayTitle = titleMap[location.pathname] || 'IncisionCare';
    }
  }

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
        {displayTitle && <h1 className="topnav-title" title={displayTitle}>{displayTitle}</h1>}
      </div>

      <div className="topnav-right">
        {/* Refresh Demo Data Button */}
        <button
          type="button"
          onClick={resetDemoData}
          title="Reset all demo data (appointments, tasks, guidance, check-ins) added in this session"
          className="topnav-refresh-btn"
        >
          <RotateCcw size={13} style={{ color: 'var(--teal)' }} />
          <span className="topnav-refresh-text">Refresh Demo Data</span>
        </button>

        <div className="role-switcher" role="group" aria-label="Portal Switcher">
          <button
            type="button"
            className={`role-btn ${role === 'care-team' ? 'active' : ''}`}
            onClick={() => setRole('care-team')}
            title="Switch to Doctor / Care Team Portal"
          >
            <span className="role-btn-full">Care Team</span>
            <span className="role-btn-short">Doctor</span>
          </button>
          <button
            type="button"
            className={`role-btn ${role === 'patient' ? 'active' : ''}`}
            onClick={() => setRole('patient')}
            title="Switch to Patient Portal"
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
