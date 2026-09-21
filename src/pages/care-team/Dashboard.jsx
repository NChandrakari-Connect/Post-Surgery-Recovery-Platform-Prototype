import { useNavigate } from 'react-router-dom';
import { patients, getPatientFullName, getPatientInitials } from '../../data/patients';
import { appointments, alerts } from '../../data/timeline';
import { getCheckinsByPatientId } from '../../data/checkins';
import { formatDateShort, getStatusConfig, getPainLabel } from '../../utils/helpers';
import {
  Users, ClipboardCheck, AlertTriangle, CalendarCheck,
  TrendingUp, ArrowRight, Eye
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  const activePatients = patients.length;
  const checkinsToday = patients.filter(p => p.lastCheckIn === '2024-09-21').length;
  const needsAttention = patients.filter(p => p.status === 'needs-review').length;
  const upcomingFollowups = appointments.filter(a => a.status === 'upcoming').length;
  const avgRecovery = Math.round(
    patients.reduce((sum, p) => sum + (p.recoveryDay / p.surgery.expectedRecoveryDays) * 100, 0) / patients.length
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>Recovery Overview</h1>
          </div>
          <p className="page-subtitle" style={{ paddingBottom: 8 }}>
            Sept 22, 2024 · {activePatients} active patients
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards">
        <div className="card stat-card">
          <div className="stat-card-icon teal"><Users size={20} /></div>
          <div className="stat-card-label">Active Recoveries</div>
          <div className="stat-card-value">{activePatients}</div>
          <div className="stat-card-meta">Across all departments</div>
        </div>
        <div className="card stat-card">
          <div className="stat-card-icon teal"><ClipboardCheck size={20} /></div>
          <div className="stat-card-label">Check-ins Today</div>
          <div className="stat-card-value">{checkinsToday} / {activePatients}</div>
          <div className="stat-card-meta">{Math.round((checkinsToday / activePatients) * 100)}% completion rate</div>
        </div>
        <div className="card stat-card">
          <div className="stat-card-icon red"><AlertTriangle size={20} /></div>
          <div className="stat-card-label">Needs Attention</div>
          <div className="stat-card-value">{needsAttention}</div>
          <div className="stat-card-meta">Requires clinical review</div>
        </div>
        <div className="card stat-card">
          <div className="stat-card-icon blue"><CalendarCheck size={20} /></div>
          <div className="stat-card-label">Upcoming Follow-ups</div>
          <div className="stat-card-value">{upcomingFollowups}</div>
          <div className="stat-card-meta">Next 14 days</div>
        </div>
        <div className="card stat-card">
          <div className="stat-card-icon teal"><TrendingUp size={20} /></div>
          <div className="stat-card-label">Avg. Recovery Progress</div>
          <div className="stat-card-value">{avgRecovery}%</div>
          <div className="stat-card-meta">Across all patients</div>
        </div>
      </div>

      {/* Patient Monitoring Table */}
      <div className="card">
        <div className="card-header">
          <h3>Patient Monitoring</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/patients')}>
            View all <ArrowRight size={14} />
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Surgery</th>
                <th>Recovery Day</th>
                <th>Pain</th>
                <th>Wound Status</th>
                <th>Last Check-in</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(patient => {
                const statusConfig = getStatusConfig(patient.status);
                return (
                  <tr key={patient.id}>
                    <td>
                      <div className="table-patient">
                        <div className="avatar-circle">{getPatientInitials(patient)}</div>
                        <div className="table-patient-info">
                          <span className="table-patient-name">{getPatientFullName(patient)}</span>
                          <span className="table-patient-id">{patient.id}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ maxWidth: 200, fontSize: 13 }}>{patient.surgery.procedure}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>Day {patient.recoveryDay}</span>
                      <span style={{ color: 'var(--ink-soft)', fontSize: 12 }}> / {patient.surgery.expectedRecoveryDays}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: patient.currentPain >= 5 ? 'var(--status-needs-review)' : 'var(--ink)' }}>
                        {patient.currentPain}/10
                      </span>
                      <span style={{ color: 'var(--ink-muted)', fontSize: 12, marginLeft: 4 }}>
                        {getPainLabel(patient.currentPain)}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{patient.woundStatus}</td>
                    <td style={{ fontSize: 13 }}>{formatDateShort(patient.lastCheckIn)}</td>
                    <td>
                      <span className={`status-badge ${patient.status}`}>
                        <span className="status-dot" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td>
                      <button
                        className="table-action"
                        onClick={() => navigate(`/patients/${patient.id}`)}
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
