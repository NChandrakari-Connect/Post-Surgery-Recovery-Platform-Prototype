import { useState } from 'react';
import { getPatientById, getPatientFullName } from '../../data/patients';
import { getDischargeByPatientId } from '../../data/discharges';
import { formatDate, formatDateShort } from '../../utils/helpers';
import { useApp } from '../../context/AppContext';
import Modal from '../../components/common/Modal';
import {
  FileText, CheckCircle, AlertTriangle, Stethoscope,
  Building, Calendar, Clock, Eye, Download, Printer, Shield
} from 'lucide-react';

export default function PatientSurgeryDischarge() {
  const { selectedPatientId, addToast, getAppointmentsForPatient } = useApp();
  const [dischargeModal, setDischargeModal] = useState(false);

  const patient = getPatientById(selectedPatientId);
  const discharge = getDischargeByPatientId(selectedPatientId);
  const followUps = getAppointmentsForPatient ? getAppointmentsForPatient(selectedPatientId) : [];
  const nextApt = followUps.length > 0 ? followUps[0] : discharge?.followUp;

  if (!patient) return null;

  const steps = [
    { label: 'Pre-operative', date: discharge ? formatDateShort(discharge.admissionDate) : '', done: true },
    { label: 'Surgery', date: formatDateShort(patient.surgery.date), done: true },
    { label: 'Discharge', date: discharge ? formatDateShort(discharge.dischargeDate) : '', done: true },
    { label: 'Early Recovery', date: 'Days 1–5', done: patient.recoveryDay > 5 },
    { label: `Day ${patient.recoveryDay}`, date: 'Current', current: true, done: false },
    { label: 'Follow-up', date: nextApt ? formatDateShort(nextApt.date) : formatDateShort(patient.nextFollowUp), done: false },
    { label: 'Full Recovery', date: `Day ${patient.surgery.expectedRecoveryDays}`, done: false },
  ];

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 28 }}>Surgery & Discharge Summary</h1>
        <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 15 }}>
          Official clinical documentation, operative details, and discharge instructions for {patient.surgery.procedure}.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Surgery Details Card */}
        <div className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Stethoscope size={20} style={{ color: 'var(--teal)' }} />
              Operative Details
            </h3>
            <span className="status-badge completed" style={{ fontSize: 12 }}>
              Successfully Completed
            </span>
          </div>

          <div className="info-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className="info-item"><span className="info-label">Procedure</span><span className="info-value">{patient.surgery.procedure}</span></div>
            <div className="info-item"><span className="info-label">Surgery Date</span><span className="info-value">{formatDate(patient.surgery.date)}</span></div>
            <div className="info-item"><span className="info-label">Lead Surgeon</span><span className="info-value">{patient.surgery.surgeon}</span></div>
            <div className="info-item"><span className="info-label">Hospital</span><span className="info-value">{patient.surgery.hospital}</span></div>
            <div className="info-item"><span className="info-label">Procedure Type</span><span className="info-value">{patient.surgery.procedureType}</span></div>
            <div className="info-item"><span className="info-label">Anesthesia</span><span className="info-value">{patient.surgery.anesthesia}</span></div>
            <div className="info-item"><span className="info-label">Duration</span><span className="info-value">{patient.surgery.duration}</span></div>
            <div className="info-item"><span className="info-label">Recovery Timeline</span><span className="info-value">Day {patient.recoveryDay} of {patient.surgery.expectedRecoveryDays}</span></div>
            <div className="info-item"><span className="info-label">Surgical Department</span><span className="info-value">{patient.surgery.department}</span></div>
          </div>

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--line-soft)' }}>
            <span className="info-label" style={{ display: 'block', marginBottom: 8 }}>Operative Notes from Dr. Sen</span>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)', margin: 0 }}>
              {patient.surgery.notes}
            </p>
          </div>
        </div>

        {/* Surgical Timeline */}
        <div className="card card-pad">
          <h3 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={20} style={{ color: 'var(--teal)' }} />
            Recovery Milestone Progression
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, overflowX: 'auto', padding: '10px 8px 16px' }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 100 }}>
                  <div style={{
                    width: step.current ? 34 : 26,
                    height: step.current ? 34 : 26,
                    borderRadius: '50%',
                    background: step.done ? 'var(--teal)' : step.current ? 'var(--surface)' : 'var(--line)',
                    border: step.current ? '3px solid var(--teal)' : 'none',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: step.current ? '0 0 0 4px var(--teal-pale)' : 'none',
                  }}>
                    {step.done && <CheckCircle size={14} style={{ color: '#fff' }} />}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: step.current ? 700 : 500, color: step.current ? 'var(--teal-deep)' : step.done ? 'var(--ink)' : 'var(--ink-muted)' }}>{step.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>{step.date}</div>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: step.done ? 'var(--teal)' : 'var(--line)', marginBottom: 36, minWidth: 24 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Discharge Summary */}
        {discharge ? (
          <div className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} style={{ color: 'var(--teal)' }} />
                Hospital Discharge Summary
              </h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => addToast('Printing discharge summary...')}>
                  <Printer size={14} /> Print
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setDischargeModal(true)}>
                  <Eye size={14} /> View Document
                </button>
              </div>
            </div>

            <div className="info-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 20 }}>
              <div className="info-item"><span className="info-label">Admission Date</span><span className="info-value">{formatDate(discharge.admissionDate)}</span></div>
              <div className="info-item"><span className="info-label">Discharge Date</span><span className="info-value">{formatDate(discharge.dischargeDate)}</span></div>
              <div className="info-item"><span className="info-label">Condition at Discharge</span><span className="info-value" style={{ fontSize: 13 }}>{discharge.conditionAtDischarge.split('.')[0]}</span></div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <span className="info-label" style={{ display: 'block', marginBottom: 8 }}>Diagnoses</span>
              <p style={{ fontSize: 14, margin: 0 }}><strong>Primary:</strong> {discharge.diagnosis.primary}</p>
              {discharge.diagnosis.secondary && <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '4px 0 0' }}>Secondary: {discharge.diagnosis.secondary}</p>}
            </div>

            <div className="grid-2" style={{ marginTop: 20 }}>
              <div style={{ background: 'var(--surface-hover)', padding: 16, borderRadius: 'var(--radius-md)' }}>
                <span className="info-label" style={{ display: 'block', marginBottom: 10, color: 'var(--teal-deep)', fontWeight: 600 }}>
                  Wound Care & Incision Instructions
                </span>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: 'var(--ink)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {discharge.instructions.woundCare.map((inst, i) => (
                    <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <CheckCircle size={15} style={{ color: 'var(--teal)', flexShrink: 0, marginTop: 2 }} />
                      <span>{inst}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ background: 'var(--status-needs-review-bg)', border: '1px solid var(--status-needs-review-border)', padding: 16, borderRadius: 'var(--radius-md)' }}>
                <span className="info-label" style={{ display: 'block', marginBottom: 10, color: 'var(--alert)', fontWeight: 600 }}>
                  Red Flag Warning Signs — Call Clinic Immediately
                </span>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: 'var(--ink)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {discharge.instructions.warningSigns.map((sign, i) => (
                    <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <AlertTriangle size={15} style={{ color: 'var(--alert)', flexShrink: 0, marginTop: 2 }} />
                      <span>{sign}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <span className="info-label" style={{ display: 'block', marginBottom: 4 }}>
                  {followUps.length > 1 ? `Scheduled Follow-up Appointments (${followUps.length})` : 'Next Follow-up Appointment'}
                </span>
                {followUps.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                    {followUps.map(apt => (
                      <div key={apt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                          {formatDate(apt.date)}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                          · {apt.time} · {apt.department} · {apt.physician}
                        </span>
                        {apt.type && (
                          <span className="status-badge on-track" style={{ fontSize: 11, padding: '1px 8px' }}>
                            {apt.type}
                          </span>
                        )}
                        {apt.reason && (
                          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                            — {apt.reason}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : nextApt ? (
                  <p style={{ fontSize: 14, margin: 0, fontWeight: 500 }}>
                    {formatDate(nextApt.date)} · {nextApt.department} · {nextApt.physician}
                  </p>
                ) : (
                  <p style={{ fontSize: 14, margin: 0, color: 'var(--ink-soft)' }}>
                    No follow-up appointments scheduled yet.
                  </p>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', textAlign: 'right' }}>
                Signed by {discharge.dischargedBy || discharge.physicianSignature || patient.careTeam?.[0]?.name || 'Dr. Ananya Sen, MD, FACS'}
              </div>
            </div>
          </div>
        ) : (
          <div className="card card-pad">
            <div className="empty-state">
              <FileText size={32} style={{ color: 'var(--teal)' }} />
              <h3>Discharge summary pending</h3>
              <p>Your discharge instructions will appear here as soon as finalized by your medical team.</p>
            </div>
          </div>
        )}
      </div>

      {/* Discharge Summary Document Modal */}
      {dischargeModal && discharge && (
        <Modal isOpen={dischargeModal} onClose={() => setDischargeModal(false)} title="Clinical Discharge Summary" size="lg">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: 16, background: 'var(--paper)', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid var(--line-soft)', paddingBottom: 10 }}>
                <div>
                  <h4 style={{ margin: 0 }}>St. Jude Memorial Hospital</h4>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Department of Surgical Services</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--ink-soft)' }}>
                  <div><strong>MRN:</strong> {patient.id}</div>
                  <div><strong>Date:</strong> {formatDate(discharge.dischargeDate)}</div>
                </div>
              </div>

              <div className="info-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 13 }}>
                <div><strong>Patient:</strong> {getPatientFullName(patient)}</div>
                <div><strong>DOB:</strong> {patient.dateOfBirth}</div>
                <div><strong>Attending Surgeon:</strong> {discharge.dischargedBy || discharge.physicianSignature || patient.careTeam?.[0]?.name || 'Dr. Ananya Sen, MD, FACS'}</div>
                <div><strong>Procedure:</strong> {patient.surgery.procedure}</div>
                <div><strong>Admission Date:</strong> {formatDate(discharge.admissionDate)}</div>
                <div><strong>Discharge Date:</strong> {formatDate(discharge.dischargeDate)}</div>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 6px' }}>Hospital Course & Recovery</h4>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-soft)', margin: 0 }}>
                {discharge.hospitalCourse}
              </p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 6px' }}>Activity & Dietary Restrictions</h4>
              <ul style={{ paddingLeft: 18, fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}>
                {discharge.instructions.activity.map((a, i) => <li key={i} style={{ marginBottom: 4 }}>{a}</li>)}
                {discharge.instructions.diet.map((d, i) => <li key={i} style={{ marginBottom: 4 }}>{d}</li>)}
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => addToast('Discharge document download simulated.')}>
                <Download size={14} /> Download PDF
              </button>
              <button className="btn btn-primary" onClick={() => setDischargeModal(false)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
