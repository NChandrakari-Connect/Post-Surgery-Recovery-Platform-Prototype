import { getPatientById } from '../../data/patients';
import { getTimelineByPatientId } from '../../data/timeline';
import { formatDate } from '../../utils/helpers';
import { useApp } from '../../context/AppContext';
import {
  Clock, CheckCircle, Camera, FileText, Activity,
  Building, LogOut, MessageSquare, Calendar
} from 'lucide-react';

export default function PatientTimeline() {
  const { selectedPatientId, getAppointmentsForPatient } = useApp();
  const patient = getPatientById(selectedPatientId);
  const events = getTimelineByPatientId(selectedPatientId);
  const followUps = getAppointmentsForPatient ? getAppointmentsForPatient(selectedPatientId) : [];

  if (!patient) return null;

  const getEventIcon = (type) => {
    switch (type) {
      case 'checkin': return <CheckCircle size={16} style={{ color: 'var(--teal)' }} />;
      case 'photo': return <Camera size={16} style={{ color: 'var(--teal-deep)' }} />;
      case 'report': return <FileText size={16} style={{ color: '#2563eb' }} />;
      case 'surgery': return <Activity size={16} style={{ color: '#d97706' }} />;
      case 'discharge': return <LogOut size={16} style={{ color: '#16a34a' }} />;
      case 'admission': return <Building size={16} style={{ color: '#64748b' }} />;
      default: return <MessageSquare size={16} style={{ color: 'var(--teal)' }} />;
    }
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 28 }}>Recovery Timeline & History</h1>
        <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 15 }}>
          Chronological record of your surgical journey, recovery milestones, check-ins, and reports.
        </p>
      </div>

      {/* Scheduled Follow-up Milestones */}
      {followUps.length > 0 && (
        <div className="card card-pad" style={{ marginBottom: 24, border: '1.5px solid var(--teal)', background: 'var(--teal-pale)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--teal-deep)' }}>
              <Calendar size={18} />
              Upcoming Follow-up Appointments ({followUps.length})
            </h3>
            <span className="status-badge" style={{ background: 'var(--teal-deep)', color: '#fff', fontSize: 11 }}>
              Confirmed
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {followUps.map(apt => (
              <div key={apt.id} style={{ background: '#fff', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--line)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{formatDate(apt.date)}</div>
                <div style={{ fontSize: 13, color: 'var(--teal-deep)', fontWeight: 600, marginTop: 2 }}>{apt.time} · {apt.type || 'Clinic In-Person'}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>{apt.physician} ({apt.department})</div>
                <div style={{ fontSize: 12, color: 'var(--ink)', marginTop: 6 }}><strong>Purpose:</strong> {apt.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card card-pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} style={{ color: 'var(--teal)' }} />
            Surgical Care Trajectory ({events.length} Events)
          </h3>
          <span className="status-badge on-track" style={{ fontSize: 12 }}>
            Day {patient.recoveryDay} of {patient.surgery.expectedRecoveryDays}
          </span>
        </div>

        <div style={{ position: 'relative', paddingLeft: 24 }}>
          {/* Vertical timeline line */}
          <div style={{
            position: 'absolute',
            top: 10,
            bottom: 10,
            left: 7,
            width: 2,
            background: 'var(--line)'
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {events.map((evt, idx) => (
              <div key={evt.id || idx} style={{ position: 'relative', display: 'flex', gap: 16 }}>
                {/* Node icon */}
                <div style={{
                  position: 'absolute',
                  left: -24,
                  top: 2,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#fff',
                  border: '2px solid var(--teal)',
                  display: 'grid',
                  placeItems: 'center'
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)' }} />
                </div>

                <div style={{ flex: 1, background: 'var(--surface-hover)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--line-soft)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {getEventIcon(evt.type)}
                      {evt.title}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                      {formatDate(evt.date)}
                    </span>
                  </div>
                  {evt.description && (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                      {evt.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
