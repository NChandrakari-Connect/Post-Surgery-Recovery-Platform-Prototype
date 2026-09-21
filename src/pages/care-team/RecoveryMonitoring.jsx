import { Activity, TrendingUp } from 'lucide-react';
import { patients, getPatientFullName, getPatientInitials } from '../../data/patients';
import { getCheckinsByPatientId } from '../../data/checkins';
import { getStatusConfig, getPainColor } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RecoveryMonitoring() {
  const navigate = useNavigate();

  // Aggregate pain data for chart
  const aggregateData = Array.from({ length: 8 }, (_, i) => {
    const day = i + 1;
    let total = 0;
    let count = 0;
    patients.forEach(p => {
      const checkins = getCheckinsByPatientId(p.id);
      const checkin = checkins.find(c => c.recoveryDay === day);
      if (checkin) { total += checkin.pain; count++; }
    });
    return { day: `Day ${day}`, avgPain: count > 0 ? +(total / count).toFixed(1) : null };
  }).filter(d => d.avgPain !== null);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <p className="eyebrow">Recovery Monitoring</p>
            <h1>Recovery Overview</h1>
          </div>
        </div>
      </div>

      {/* Aggregate Chart */}
      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 20 }}>Average Pain Trend (All Patients)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={aggregateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--ink-muted)' }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: 'var(--ink-muted)' }} />
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--line)', boxShadow: 'var(--shadow-md)' }} />
            <Line type="monotone" dataKey="avgPain" stroke="var(--teal-deep)" strokeWidth={2.5} dot={{ fill: 'var(--teal-deep)', r: 4 }} name="Avg. Pain" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-patient recovery */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {patients.map(patient => {
          const pct = Math.round((patient.recoveryDay / patient.surgery.expectedRecoveryDays) * 100);
          const statusConfig = getStatusConfig(patient.status);
          return (
            <div key={patient.id} className="card card-pad" style={{ cursor: 'pointer' }} onClick={() => navigate(`/patients/${patient.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div className="avatar-circle">{getPatientInitials(patient)}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{getPatientFullName(patient)}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{patient.surgery.procedure}</div>
                  </div>
                </div>
                <span className={`status-badge ${patient.status}`} style={{ fontSize: 11 }}>
                  <span className="status-dot" />{statusConfig.label}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 4 }}>Pain</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: getPainColor(patient.currentPain) }}>{patient.currentPain}/10</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-soft)', marginBottom: 4 }}>
                    <span>Day {patient.recoveryDay}/{patient.surgery.expectedRecoveryDays}</span>
                    <span>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--line)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: 'var(--teal)', borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
