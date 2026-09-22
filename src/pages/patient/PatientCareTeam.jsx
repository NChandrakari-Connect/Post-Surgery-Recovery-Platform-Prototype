import { useState } from 'react';
import { getPatientById } from '../../data/patients';
import { formatDate } from '../../utils/helpers';
import { useApp } from '../../context/AppContext';
import Modal from '../../components/common/Modal';
import {
  User, Stethoscope, Phone, Mail, MapPin, Building,
  MessageSquare, Clock, ShieldCheck, HeartPulse, Calendar, Send
} from 'lucide-react';

export default function PatientCareTeam() {
  const { selectedPatientId, addToast, getAppointmentsForPatient, askPatientQuestion } = useApp();
  const patient = getPatientById(selectedPatientId);
  const followUps = getAppointmentsForPatient ? getAppointmentsForPatient(selectedPatientId) : [];
  const [messageRecipient, setMessageRecipient] = useState(null);
  const [msgQuestion, setMsgQuestion] = useState('');
  const [msgCategory, setMsgCategory] = useState('Incision & Healing');

  if (!patient) return null;

  const teamMembers = [
    {
      name: 'Dr. Ananya Sen, MD, FACS',
      role: 'Attending General Surgeon',
      department: 'Minimally Invasive Surgery',
      phone: '(555) 234-5678 ext. 402',
      email: 'a.sen@stjudememorial.org',
      office: 'Surgical Pavilion, Suite 410',
      initials: 'AS'
    },
    {
      name: 'Dr. Suresh Menon, MD',
      role: 'Attending Anesthesiologist',
      department: 'Department of Anesthesiology',
      phone: '(555) 234-5678 ext. 205',
      email: 's.menon@stjudememorial.org',
      office: 'Hospital Main, 2nd Floor',
      initials: 'SM'
    },
    {
      name: 'Sneha Nair, BSN, RN',
      role: 'Post-Operative Nurse Coordinator',
      department: 'Inpatient & Ambulatory Recovery',
      phone: '(555) 234-5678 ext. 118',
      email: 's.nair@stjudememorial.org',
      office: 'Recovery Coordination Office 1B',
      initials: 'SN'
    }
  ];

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 28 }}>My Surgical Care Team</h1>
        <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 15 }}>
          Your designated surgeon, clinical team, and recovery coordinators at {patient.surgery.hospital}.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Clinician Cards */}
        <div className="responsive-patient-grid">
          {teamMembers.map((member, i) => (
            <div key={i} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'var(--teal-pale)',
                    color: 'var(--teal-deep)',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 700,
                    fontSize: 18
                  }}>
                    {member.initials}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 2px', fontSize: 17, color: 'var(--ink)' }}>{member.name}</h3>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--teal)' }}>{member.role}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{member.department}</div>
                  </div>
                </div>

                <div className="info-grid" style={{ gridTemplateColumns: '1fr', gap: 10, fontSize: 13, borderTop: '1px solid var(--line-soft)', paddingTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-soft)' }}>
                    <Phone size={15} style={{ color: 'var(--teal)' }} />
                    <span>{member.phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-soft)' }}>
                    <Mail size={15} style={{ color: 'var(--teal)' }} />
                    <span>{member.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-soft)' }}>
                    <MapPin size={15} style={{ color: 'var(--teal)' }} />
                    <span>{member.office}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--line-soft)', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ flex: '1 1 120px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => addToast(`Connecting call to ${member.name}...`)}
                >
                  <Phone size={13} /> Call Office
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ flex: '1 1 120px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => {
                    setMessageRecipient(member);
                    setMsgQuestion('');
                  }}
                >
                  <MessageSquare size={13} /> Message
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Scheduled Appointments with Care Team */}
        {followUps.length > 0 && (
          <div className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} style={{ color: 'var(--teal)' }} />
                Scheduled Visits & Consultations ({followUps.length})
              </h3>
              <span className="status-badge on-track" style={{ fontSize: 11 }}>
                Confirmed with Care Team
              </span>
            </div>
            <div className="responsive-card-grid">
              {followUps.map((apt, idx) => (
                <div
                  key={apt.id}
                  style={{
                    padding: 16,
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1.5px solid var(--teal)',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span className="status-badge" style={{ background: 'var(--teal-pale)', color: 'var(--teal-deep)', fontSize: 11, fontWeight: 700 }}>
                      Upcoming Visit
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>#{idx + 1}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>
                    {formatDate(apt.date)}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--teal-deep)', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} /> {apt.time} · {apt.type || 'Clinic In-Person'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Stethoscope size={14} /> {apt.physician} ({apt.department})
                  </div>
                  {apt.location && (
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={13} /> {apt.location}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--ink)', background: 'var(--paper)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line-soft)', marginTop: 8 }}>
                    <strong>Reason:</strong> {apt.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hospital & Emergency Contacts */}
        <div className="card card-pad" style={{ background: 'var(--paper)' }}>
          <h3 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building size={18} style={{ color: 'var(--teal)' }} />
            Hospital Facility & Emergency Contact
          </h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Main Facility</span>
              <span className="info-value">{patient.surgery.hospital}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Surgical Clinic Hours</span>
              <span className="info-value">Monday – Friday, 8:00 AM – 5:00 PM</span>
            </div>
            <div className="info-item">
              <span className="info-label">24/7 Nurse Triage Line</span>
              <span className="info-value" style={{ color: 'var(--teal-deep)', fontWeight: 600 }}>(555) 234-9999</span>
            </div>
            <div className="info-item">
              <span className="info-label">Emergency Protocol</span>
              <span className="info-value" style={{ color: 'var(--alert)' }}>For severe shortness of breath or heavy bleeding, call 911</span>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Message / Ask Anything Modal */}
      {messageRecipient && (
        <Modal
          title={`Ask ${messageRecipient.name}`}
          onClose={() => setMessageRecipient(null)}
          maxWidth={540}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: 'var(--teal-pale)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--teal-border)'
            }}>
              <div className="avatar-circle" style={{ width: 44, height: 44, fontSize: 16 }}>
                {messageRecipient.initials}
              </div>
              <div>
                <strong style={{ fontSize: 14, color: 'var(--teal-deep)' }}>{messageRecipient.name}</strong>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{messageRecipient.role} · {messageRecipient.department}</div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}>
              Your question will be delivered directly to this clinician's priority triage inbox and will reflect in your recovery records.
            </p>

            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Inquiry Category</label>
              <select
                className="form-input"
                value={msgCategory}
                onChange={e => setMsgCategory(e.target.value)}
                style={{ fontSize: 13 }}
              >
                <option value="Incision & Healing">Incision & Healing</option>
                <option value="Medication & Pain">Medication & Pain</option>
                <option value="Activity & Mobility">Activity & Mobility</option>
                <option value="Bathing & Wound Care">Bathing & Wound Care</option>
                <option value="General Recovery">General Recovery</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Your Question / Message</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder={`Ask ${messageRecipient.name.split(',')[0]} anything about your healing, pain, dressing, or recovery...`}
                value={msgQuestion}
                onChange={e => setMsgQuestion(e.target.value)}
                style={{ resize: 'vertical', fontSize: 14 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setMessageRecipient(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!msgQuestion.trim()}
                onClick={() => {
                  if (askPatientQuestion) {
                    askPatientQuestion(selectedPatientId, {
                      question: msgQuestion.trim(),
                      category: msgCategory,
                      urgency: 'routine'
                    });
                  }
                  setMessageRecipient(null);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Send size={14} /> Send Question
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
