import { useState } from 'react';
import { getPatientById } from '../../data/patients';
import { getMedicationsByPatientId } from '../../data/medications';
import { formatDateShort } from '../../utils/helpers';
import { useApp } from '../../context/AppContext';
import { Pill, Clock, CheckCircle, AlertCircle, Phone, Info } from 'lucide-react';

export default function PatientMedications() {
  const { selectedPatientId, addToast } = useApp();
  const patient = getPatientById(selectedPatientId);
  const medications = getMedicationsByPatientId(selectedPatientId);

  const active = medications.filter(m => m.status === 'active');
  const completed = medications.filter(m => m.status === 'completed');

  const timeSlotLabels = {
    morning: '☀️ Morning (8:00 AM)',
    afternoon: '🌤️ Afternoon (1:00 PM)',
    evening: '🌅 Evening (6:00 PM)',
    night: '🌙 Bedtime (10:00 PM)'
  };

  if (!patient) return null;

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 28 }}>Prescribed Medications</h1>
        <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 15 }}>
          Your daily post-surgery medication schedule, dosages, purpose, and special instructions.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Daily Schedule */}
        <div className="card card-pad">
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} style={{ color: 'var(--teal)' }} />
            Daily Medication Schedule
          </h3>
          <div className="responsive-card-grid">
            {['morning', 'afternoon', 'evening', 'night'].map(slot => {
              const slotMeds = active.filter(m => m.timeSlots && m.timeSlots.includes(slot));
              return (
                <div key={slot} style={{ padding: 16, background: 'var(--paper)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line-soft)' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', marginBottom: 12 }}>
                    {timeSlotLabels[slot]}
                  </div>
                  {slotMeds.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>No medications scheduled</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {slotMeds.map(m => (
                        <div key={m.id} style={{ padding: '8px 10px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--line-soft)' }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--teal-deep)' }}>{m.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{m.dosage}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Medications List */}
        <div className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Pill size={18} style={{ color: 'var(--teal)' }} />
              Active Prescriptions ({active.length})
            </h3>
            <span className="status-badge on-track" style={{ fontSize: 12 }}>
              Current Regimen
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {active.map(med => (
              <div key={med.id} style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 16, background: 'var(--surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h4 style={{ margin: '0 0 2px', fontSize: 16, color: 'var(--ink)' }}>{med.name}</h4>
                    <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{med.dosage} · {med.frequency}</div>
                  </div>
                  <span className="status-badge on-track" style={{ fontSize: 11 }}>Active</span>
                </div>

                <div className="info-grid" style={{ gap: 10, marginTop: 10 }}>
                  <div className="info-item"><span className="info-label">Purpose</span><span className="info-value" style={{ fontSize: 13 }}>{med.purpose}</span></div>
                  <div className="info-item"><span className="info-label">Prescribed On</span><span className="info-value" style={{ fontSize: 13 }}>{formatDateShort(med.startDate)}</span></div>
                  <div className="info-item"><span className="info-label">Duration</span><span className="info-value" style={{ fontSize: 13 }}>{med.endDate ? `Until ${formatDateShort(med.endDate)}` : 'As directed'}</span></div>
                </div>

                {med.instructions && (
                  <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--teal-pale)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--teal-deep)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Info size={16} style={{ flexShrink: 0 }} />
                    <span><strong>Instructions:</strong> {med.instructions}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Completed Medications */}
        {completed.length > 0 && (
          <div className="card card-pad">
            <h3 style={{ marginBottom: 14, color: 'var(--ink-soft)' }}>Completed Prescriptions ({completed.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {completed.map(med => (
                <div key={med.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line-soft)', opacity: 0.75 }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{med.name} — {med.dosage}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{med.purpose} · {formatDateShort(med.startDate)} to {formatDateShort(med.endDate)}</div>
                  </div>
                  <span className="status-badge completed" style={{ fontSize: 11 }}>Finished</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pharmacy & Refill Assistance Card */}
        <div className="card card-pad" style={{ background: 'var(--paper)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Need a Prescription Refill or Have Questions?</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)' }}>
                Contact St. Jude Hospital Outpatient Pharmacy or notify Dr. Ananya Sen's clinical team.
              </p>
            </div>
            <button className="btn btn-secondary" onClick={() => addToast('Pharmacy refill request sent to clinical team.')}>
              <Phone size={14} /> Request Refill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
