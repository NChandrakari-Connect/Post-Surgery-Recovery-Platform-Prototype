import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alerts } from '../../data/timeline';
import { formatDate } from '../../utils/helpers';
import { AlertTriangle, AlertCircle, Clock, Eye, CalendarCheck, Filter } from 'lucide-react';

const severityIcons = {
  high: AlertTriangle,
  medium: AlertCircle,
  low: Clock,
};

const typeLabels = {
  'needs-review': 'Needs Review',
  'monitor': 'Monitor',
  'missed-checkin': 'Missed Check-in',
  'follow-up': 'Follow-up Due',
};

const typeClasses = {
  'needs-review': 'needs-review',
  'monitor': 'monitor',
  'missed-checkin': 'needs-review',
  'follow-up': 'on-track',
};

export default function Alerts() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.type === filter);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <p className="eyebrow">Alerts</p>
            <h1>Needs Attention</h1>
          </div>
          <p className="page-subtitle" style={{ paddingBottom: 8 }}>
            {alerts.filter(a => a.severity === 'high').length} high priority · {alerts.length} total
          </p>
        </div>
      </div>

      <div className="filter-bar" style={{ marginBottom: 24 }}>
        {['all', 'needs-review', 'monitor', 'missed-checkin', 'follow-up'].map(type => (
          <button
            key={type}
            className={`filter-chip ${filter === type ? 'active' : ''}`}
            onClick={() => setFilter(type)}
          >
            {type === 'all' ? 'All Alerts' : typeLabels[type]}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? (
          <div className="card"><div className="empty-state">
            <div className="empty-state-icon"><AlertCircle size={28} /></div>
            <h3>No alerts</h3>
            <p>No active alerts match your filter criteria.</p>
          </div></div>
        ) : (
          filtered.map(alert => {
            const Icon = severityIcons[alert.severity] || AlertCircle;
            return (
              <div key={alert.id} className="card card-pad">
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    display: 'grid', placeItems: 'center',
                    background: alert.severity === 'high' ? 'var(--status-needs-review-bg)' : alert.severity === 'medium' ? 'var(--status-monitor-bg)' : 'var(--info-bg)',
                    color: alert.severity === 'high' ? 'var(--status-needs-review)' : alert.severity === 'medium' ? 'var(--status-monitor)' : 'var(--info)',
                  }}>
                    <Icon size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{alert.title}</span>
                        <span className={`status-badge ${typeClasses[alert.type]}`} style={{ fontSize: 11 }}>
                          <span className="status-dot" />
                          {typeLabels[alert.type]}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{formatDate(alert.date)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--teal-deep)', fontWeight: 500, marginBottom: 6 }}>
                      {alert.patientName}
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 12px' }}>
                      {alert.description}
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/patients/${alert.patientId}`)}>
                        <Eye size={14} /> View Patient
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/patients/${alert.patientId}`)}>
                        <CalendarCheck size={14} /> Add Follow-up
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
