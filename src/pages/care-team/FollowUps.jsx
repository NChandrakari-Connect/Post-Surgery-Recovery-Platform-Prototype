import { useNavigate } from 'react-router-dom';
import { appointments } from '../../data/timeline';
import { getPatientById, getPatientFullName } from '../../data/patients';
import { formatDate } from '../../utils/helpers';
import { CalendarCheck, Eye, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function FollowUps() {
  const navigate = useNavigate();
  const { allAppointments, completeAppointment } = useApp();
  const aptList = allAppointments || appointments;

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <p className="eyebrow">Follow-ups</p>
            <h1>Follow-up Management</h1>
          </div>
          <p className="page-subtitle" style={{ paddingBottom: 8 }}>
            {aptList.filter(a => a.status === 'upcoming').length} upcoming
          </p>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Department</th>
                <th>Physician</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {aptList.map(apt => {
                const pat = getPatientById(apt.patientId);
                const patientName = (apt.patientName && apt.patientName !== 'Patient')
                  ? apt.patientName
                  : (pat ? getPatientFullName(pat) : (apt.patientName || 'Patient'));

                return (
                  <tr key={apt.id}>
                    <td style={{ fontWeight: 600 }}>{patientName}</td>
                  <td>{formatDate(apt.date)}<br /><span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{apt.time}</span></td>
                  <td style={{ fontSize: 13 }}>{apt.department}</td>
                  <td style={{ fontSize: 13 }}>{apt.physician}</td>
                  <td style={{ fontSize: 13, maxWidth: 220 }}>{apt.reason}</td>
                  <td>
                    <span className={`status-badge ${apt.status === 'upcoming' ? 'monitor' : 'completed'}`} style={{ fontSize: 11 }}>
                      <span className="status-dot" />
                      {apt.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="table-action" onClick={() => navigate(`/patients/${apt.patientId}`)}>
                        <Eye size={14} /> View
                      </button>
                      {apt.status === 'upcoming' && (
                        <button className="table-action" onClick={() => completeAppointment(apt.id)} style={{ color: 'var(--status-on-track)' }}>
                          <CheckCircle size={14} /> Complete
                        </button>
                      )}
                    </div>
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
