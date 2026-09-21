import { useState, useRef } from 'react';
import { getPatientById, getPatientFullName } from '../../data/patients';
import { getDischargeByPatientId } from '../../data/discharges';
import { getReportsByPatientId } from '../../data/reports';
import { getMedicationsByPatientId } from '../../data/medications';
import { getCheckinsByPatientId } from '../../data/checkins';
import { getTimelineByPatientId, getAppointmentsByPatientId } from '../../data/timeline';
import { formatDate, formatDateShort, getRecoveryPercentage, calculateDynamicRecovery, getPainColor, getSymptomLabel, getConditionLabel, getActivityLabel } from '../../utils/helpers';
import { useApp } from '../../context/AppContext';
import { SAMPLE_WOUND_PHOTOS } from '../../utils/woundAssets';
import Modal from '../../components/common/Modal';
import {
  Heart, ClipboardList, CheckCircle, Calendar,
  Pill, FileText, Clock, User, Camera, Upload,
  Activity, Thermometer, MessageSquare, AlertTriangle, MapPin,
  Send, HelpCircle
} from 'lucide-react';

export default function PatientDashboard() {
  const {
    selectedPatientId,
    addToast,
    getTasksForPatient,
    toggleTask,
    markTaskDone,
    getGuidanceForPatient,
    getCheckinsForPatient,
    getAppointmentsForPatient,
    addCheckin,
    sendWoundPhoto,
    getQuestionsForPatient,
    askPatientQuestion,
  } = useApp();
  const patient = getPatientById(selectedPatientId);
  const checkins = getCheckinsForPatient ? getCheckinsForPatient(selectedPatientId) : getCheckinsByPatientId(selectedPatientId);
  const guidance = getGuidanceForPatient(selectedPatientId);
  const medications = getMedicationsByPatientId(selectedPatientId);
  const followUps = getAppointmentsForPatient ? getAppointmentsForPatient(selectedPatientId) : getAppointmentsByPatientId(selectedPatientId);
  const discharge = getDischargeByPatientId(selectedPatientId);
  const tasks = getTasksForPatient(selectedPatientId);
  const completedTasksCount = tasks.filter(t => t.done).length;
  const recoveryData = patient ? calculateDynamicRecovery(patient, tasks, checkins) : { percentage: 0, breakdown: [] };
  const recoveryPct = recoveryData.percentage;
  const [showRecoveryBreakdown, setShowRecoveryBreakdown] = useState(false);
  const latestCheckin = checkins[0];

  // Direct Ask state
  const [directQuestionText, setDirectQuestionText] = useState('');
  const [directQuestionCategory, setDirectQuestionCategory] = useState('Incision & Healing');
  const [directQuestionUrgency, setDirectQuestionUrgency] = useState('routine');
  const [showAllInquiries, setShowAllInquiries] = useState(false);
  const questions = getQuestionsForPatient ? getQuestionsForPatient(selectedPatientId) : [];
  const pendingQuestionsCount = questions.filter(q => q.status === 'pending').length;

  const handleSendQuestion = (e) => {
    e?.preventDefault();
    if (!directQuestionText.trim()) return;
    if (askPatientQuestion) {
      askPatientQuestion(selectedPatientId, {
        question: directQuestionText.trim(),
        category: directQuestionCategory,
        urgency: directQuestionUrgency
      });
    }
    setDirectQuestionText('');
  };

  // Check-in form state
  const [showCheckin, setShowCheckin] = useState(false);
  const [pain, setPain] = useState(3);
  const [symptoms, setSymptoms] = useState([]);
  const [condition, setCondition] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [appetite, setAppetite] = useState('');
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');

  // Wound photo inside Check-in
  const [checkinPhotoUrl, setCheckinPhotoUrl] = useState(null);
  const [checkinPhotoName, setCheckinPhotoName] = useState('');
  const [checkinPhotoDesc, setCheckinPhotoDesc] = useState('');
  const checkinFileRef = useRef(null);
  const checkinCameraRef = useRef(null);

  if (!patient) return null;

  const toggleSymptom = (sym) => {
    setSymptoms(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (JPG, PNG, WebP).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      setCheckinPhotoUrl(dataUrl);
      setCheckinPhotoName(file.name);
      addToast(`Attached photo "${file.name}"`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUseSample = (idx = 0) => {
    const sample = SAMPLE_WOUND_PHOTOS[idx] || SAMPLE_WOUND_PHOTOS[0];
    setCheckinPhotoUrl(sample.dataUrl);
    setCheckinPhotoName(sample.label);
    if (!checkinPhotoDesc) setCheckinPhotoDesc(sample.description);
    addToast(`Attached sample clinical photo: "${sample.label}"`);
  };

  const handleSubmitCheckin = () => {
    if (addCheckin) {
      addCheckin(selectedPatientId, {
        recoveryDay: patient.recoveryDay,
        pain,
        symptoms,
        condition,
        activityLevel,
        appetite,
        temperature,
        notes,
        photoUrl: checkinPhotoUrl,
        photoDescription: checkinPhotoDesc || (checkinPhotoUrl ? 'Patient submitted wound photo with daily check-in.' : ''),
      });
    }

    addToast(
      checkinPhotoUrl
        ? 'Daily check-in and wound photo submitted successfully! Care team notified.'
        : 'Check-in submitted successfully! Thank you for updating your recovery status.'
    );
    setShowCheckin(false);
    markTaskDone(selectedPatientId, 'task-1', true);
    const cameraTask = tasks.find(t => t.icon === 'camera');
    if (cameraTask && checkinPhotoUrl) {
      markTaskDone(selectedPatientId, cameraTask.id, true);
    }
    setPain(3); setSymptoms([]); setCondition(''); setActivityLevel(''); setAppetite(''); setTemperature(''); setNotes('');
    setCheckinPhotoUrl(null); setCheckinPhotoName(''); setCheckinPhotoDesc('');
  };

  const painLabels = ['No pain', 'Minimal', 'Mild', 'Moderate', 'Moderate', 'Significant', 'Significant', 'Severe', 'Severe', 'Very severe', 'Worst pain'];
  const activeMeds = medications.filter(m => m.status === 'active');

  return (
    <div className="page-content">
      {/* Recovery Header */}
      <div className="card" style={{ marginBottom: 24, overflow: 'hidden' }}>
        <div className="card-pad" style={{ background: 'linear-gradient(135deg, var(--teal-deep) 0%, var(--teal) 100%)', color: '#fff' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.8, marginBottom: 8 }}>Your Recovery</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <h1 style={{ color: '#fff', margin: '0 0 4px', fontSize: 32 }}>Day {patient.recoveryDay} of {patient.surgery.expectedRecoveryDays}</h1>
              <p style={{ opacity: 0.85, margin: 0, fontSize: 15 }}>{patient.surgery.procedure}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{ position: 'relative', cursor: 'pointer', display: 'inline-block' }}
                onClick={() => setShowRecoveryBreakdown(true)}
                title="Click to view dynamic recovery score breakdown"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowRecoveryBreakdown(true)}
              >
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#fff" strokeWidth="6"
                    strokeDasharray={`${recoveryPct * 2.64} 264`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />
                  <text x="50" y="50" textAnchor="middle" dy="7" fill="#fff" fontSize="22" fontFamily="var(--font-serif)">{recoveryPct}%</text>
                </svg>
              </div>
              <div style={{ marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowRecoveryBreakdown(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.18)',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    color: '#fff',
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(4px)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'}
                >
                  <Activity size={12} />
                  <span>Recovery Factors</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className={`attention-card ${patient.status === 'on-track' ? 'on-track' : patient.status === 'monitor' ? 'monitor' : 'needs-review'}`} style={{ marginBottom: 24 }}>
        <div className="attention-card-icon" style={{ color: patient.status === 'on-track' ? 'var(--status-on-track)' : 'var(--status-monitor)' }}>
          {patient.status === 'on-track' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
        </div>
        <div className="attention-card-content">
          <h4 style={{ color: patient.status === 'on-track' ? 'var(--status-on-track)' : 'var(--status-monitor)', fontFamily: 'var(--font-sans)' }}>
            {patient.status === 'on-track' ? 'Recovery Appears On Track' : 'Monitor Your Recovery'}
          </h4>
          <p style={{ color: 'var(--ink-soft)' }}>
            {patient.status === 'on-track'
              ? 'Based on your recent check-ins, your recovery is progressing well. Continue following your care instructions.'
              : 'Some symptoms require attention. Please continue your daily check-ins and follow your care team\'s instructions.'}
          </p>
        </div>
      </div>

      <div className="grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Today's Check-in CTA */}
          <div className="card card-pad" style={{ borderColor: 'var(--teal)', borderWidth: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--teal-pale)', display: 'grid', placeItems: 'center' }}>
                <ClipboardList size={24} style={{ color: 'var(--teal-deep)' }} />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Today's Check-in</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)' }}>Complete your 2-minute recovery update</p>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowCheckin(true)}>
              Start Check-in
            </button>
          </div>

          {/* Today's Tasks */}
          <div className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Today's Tasks</h3>
              <span className="status-badge" style={{
                background: completedTasksCount === tasks.length ? 'var(--status-on-track-bg)' : 'var(--teal-pale)',
                color: completedTasksCount === tasks.length ? 'var(--status-on-track)' : 'var(--teal-deep)',
                fontWeight: 600,
                fontSize: 12
              }}>
                {completedTasksCount} of {tasks.length} done
              </span>
            </div>

            {/* Task completion progress bar */}
            <div style={{ height: 5, background: 'var(--line)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{
                height: '100%',
                width: `${Math.round((completedTasksCount / (tasks.length || 1)) * 100)}%`,
                background: 'var(--teal)',
                borderRadius: 3,
                transition: 'width 0.3s ease'
              }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tasks.map((task) => {
                const IconComponent = task.icon === 'clipboard' ? ClipboardList
                  : task.icon === 'pill' ? Pill
                  : task.icon === 'camera' ? Camera
                  : task.icon === 'file' ? FileText
                  : Activity;

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      if (task.icon === 'camera' && !task.done) {
                        setShowCheckin(true);
                      } else {
                        toggleTask(selectedPatientId, task.id);
                        if (!task.done) {
                          addToast(`Completed: ${task.text} · Recovery progress updated!`);
                        }
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (task.icon === 'camera' && !task.done) {
                          setShowCheckin(true);
                        } else {
                          toggleTask(selectedPatientId, task.id);
                        }
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'all 0.15s ease',
                      background: task.done ? 'var(--surface-hover)' : 'var(--surface)',
                      border: '1px solid var(--line-soft)',
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        border: task.done ? 'none' : '2px solid var(--line)',
                        background: task.done ? 'var(--teal)' : 'var(--surface)',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                        boxShadow: task.done ? '0 2px 4px rgba(20, 184, 166, 0.25)' : 'none',
                      }}
                    >
                      {task.done && <CheckCircle size={14} style={{ color: '#fff' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: task.done ? 400 : 500,
                          color: task.done ? 'var(--ink-muted)' : 'var(--ink)',
                          textDecoration: task.done ? 'line-through' : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {task.text}
                      </div>
                      {task.time && (
                        <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>
                          {task.time}
                        </div>
                      )}
                    </div>
                    <IconComponent
                      size={16}
                      style={{
                        color: task.done ? 'var(--ink-muted)' : 'var(--teal)',
                        opacity: task.done ? 0.35 : 0.8,
                        flexShrink: 0,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Direct Ask Anything to Care Team */}
          <div className="card card-pad" style={{ border: '1.5px solid var(--teal)', boxShadow: '0 4px 16px rgba(20, 184, 166, 0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--teal-pale)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <HelpCircle size={22} style={{ color: 'var(--teal-deep)' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18 }}>Direct Ask — Ask Anything</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--ink-soft)' }}>
                    Direct line to Dr. Ananya Sen & your clinical team
                  </p>
                </div>
              </div>
              {pendingQuestionsCount > 0 && (
                <span className="status-badge monitor" style={{ fontSize: 12 }}>
                  <Clock size={12} style={{ marginRight: 4 }} />
                  {pendingQuestionsCount} Pending Response
                </span>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 6 }}>
                Common questions (tap to auto-fill):
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  'Is slight pulling around the incision normal?',
                  'Can I shower with the waterproof dressing today?',
                  'When can I resume light walking or stretching?',
                  'Question about pain medication timing'
                ].map((sugg, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDirectQuestionText(sugg)}
                    style={{
                      background: 'var(--surface-hover)',
                      border: '1px solid var(--line)',
                      borderRadius: 16,
                      padding: '4px 10px',
                      fontSize: 12,
                      color: 'var(--ink)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.background = 'var(--teal-pale)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'var(--surface-hover)'; }}
                  >
                    + {sugg}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Input Form */}
            <form onSubmit={handleSendQuestion} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Ask any question about your symptoms, medications, wound dressing, or mobility..."
                value={directQuestionText}
                onChange={e => setDirectQuestionText(e.target.value)}
                style={{ resize: 'vertical', fontSize: 14, lineHeight: 1.5, background: 'var(--surface)' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    className="form-input"
                    value={directQuestionCategory}
                    onChange={e => setDirectQuestionCategory(e.target.value)}
                    style={{ fontSize: 12, padding: '6px 10px', height: 34, width: 'auto' }}
                  >
                    <option value="Incision & Healing">Incision & Healing</option>
                    <option value="Medication & Pain">Medication & Pain</option>
                    <option value="Activity & Mobility">Activity & Mobility</option>
                    <option value="Bathing & Wound Care">Bathing & Wound Care</option>
                    <option value="General Recovery">General Recovery</option>
                  </select>

                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => setDirectQuestionUrgency('routine')}
                      style={{
                        padding: '4px 8px',
                        fontSize: 11,
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 600,
                        border: directQuestionUrgency === 'routine' ? '1.5px solid var(--teal)' : '1px solid var(--line)',
                        background: directQuestionUrgency === 'routine' ? 'var(--teal-pale)' : 'transparent',
                        color: directQuestionUrgency === 'routine' ? 'var(--teal-deep)' : 'var(--ink-soft)'
                      }}
                    >
                      Routine
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirectQuestionUrgency('urgent')}
                      style={{
                        padding: '4px 8px',
                        fontSize: 11,
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 600,
                        border: directQuestionUrgency === 'urgent' ? '1.5px solid var(--alert)' : '1px solid var(--line)',
                        background: directQuestionUrgency === 'urgent' ? 'var(--status-monitor-bg)' : 'transparent',
                        color: directQuestionUrgency === 'urgent' ? 'var(--alert)' : 'var(--ink-soft)'
                      }}
                    >
                      Priority
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!directQuestionText.trim()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}
                >
                  <Send size={14} /> Send to Care Team
                </button>
              </div>
            </form>

            {/* Inquiries Thread / History */}
            {questions.length > 0 && (
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line-soft)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: 14, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquare size={15} style={{ color: 'var(--teal)' }} />
                    Inquiry History ({questions.length})
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {questions.slice(0, showAllInquiries ? undefined : 2).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: 14,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface-hover)',
                        border: '1px solid var(--line-soft)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4, background: 'var(--paper)', border: '1px solid var(--line)' }}>
                            {item.category}
                          </span>
                          {item.urgency === 'urgent' && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--alert)', background: 'var(--status-monitor-bg)', padding: '2px 6px', borderRadius: 4 }}>
                              Priority
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                          {item.timeFormatted || formatDateShort(item.askedAt)}
                        </span>
                      </div>

                      <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500, marginBottom: 8, lineHeight: 1.4 }}>
                        "{item.question}"
                      </div>

                      {/* Status / Response */}
                      {item.status === 'answered' && item.response ? (
                        <div style={{
                          marginTop: 8,
                          padding: 12,
                          borderRadius: 8,
                          background: 'var(--teal-pale)',
                          border: '1px solid var(--teal-border)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <CheckCircle size={14} style={{ color: 'var(--status-on-track)' }} />
                              <strong style={{ fontSize: 13, color: 'var(--teal-deep)' }}>{item.response.answeredBy}</strong>
                              <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>· {item.response.role}</span>
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{item.response.timeFormatted}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink)', lineHeight: 1.45 }}>
                            {item.response.text}
                          </p>
                        </div>
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          color: 'var(--status-monitor)',
                          background: 'var(--status-monitor-bg)',
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: '1px solid var(--status-monitor-border)'
                        }}>
                          <Clock size={13} />
                          <span>Sent to care team · Awaiting review by Dr. Ananya Sen</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {questions.length > 2 && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowAllInquiries(prev => !prev)}
                      style={{ alignSelf: 'center', marginTop: 4 }}
                    >
                      {showAllInquiries ? 'Show fewer inquiries' : `View all ${questions.length} inquiries`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Medications */}
          <div className="card card-pad">
            <h3 style={{ marginBottom: 16 }}>Today's Medications</h3>
            {activeMeds.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>No active medications.</p>
            ) : (
              activeMeds.slice(0, 4).map(med => (
                <div key={med.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line-soft)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{med.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{med.dosage} · {med.frequency}</div>
                  </div>
                  <Pill size={16} style={{ color: 'var(--teal)' }} />
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Follow-up Appointments */}
          {followUps.length > 0 && (
            <div className="card card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={18} style={{ color: 'var(--teal)' }} />
                  Follow-up Appointments ({followUps.length})
                </h3>
                <span className="status-badge on-track" style={{ fontSize: 11 }}>
                  Confirmed
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {followUps.map((apt, idx) => (
                  <div
                    key={apt.id}
                    style={{
                      padding: 14,
                      background: idx === 0 ? 'var(--teal-pale)' : 'var(--paper)',
                      borderRadius: 'var(--radius-md)',
                      border: idx === 0 ? '1.5px solid var(--teal)' : '1px solid var(--line)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--ink)' }}>
                        {formatDate(apt.date)}
                      </div>
                      {idx === 0 ? (
                        <span className="status-badge" style={{ background: 'var(--teal-deep)', color: '#fff', fontSize: 10, fontWeight: 700 }}>
                          NEXT VISIT
                        </span>
                      ) : (
                        <span className="status-badge" style={{ fontSize: 10 }}>
                          UPCOMING
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>
                      {apt.time} · {apt.type || 'Clinic In-Person'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 3 }}>
                      {apt.physician} ({apt.department})
                    </div>
                    {apt.location && (
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} style={{ color: 'var(--teal)' }} /> {apt.location}
                      </div>
                    )}
                    <div style={{ fontSize: 13, color: 'var(--ink)', marginTop: 6 }}>
                      <strong>Purpose:</strong> {apt.reason}
                    </div>
                    {apt.notes && (
                      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 6, padding: '6px 10px', background: 'rgba(255,255,255,0.85)', borderRadius: 4, border: '1px solid var(--line-soft)' }}>
                        <strong>Instructions:</strong> {apt.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Care Team Guidance */}
          {guidance && (
            <div className="card card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageSquare size={18} style={{ color: 'var(--teal)' }} />
                  Care Team Guidance
                </h3>
                <span className="status-badge on-track" style={{ fontSize: 11 }}>
                  {guidance.items.length} Directives
                </span>
              </div>

              {/* Priority Indicator Guide */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '8px 12px',
                background: 'var(--paper)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--line-soft)',
                marginBottom: 14,
                fontSize: 12,
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--alert)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--ink)' }}><strong>Red:</strong> High Priority / Warning</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--ink)' }}><strong>Green:</strong> Standard Routine Care</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {guidance.items.map((item, i) => {
                  const isHigh = item.priority === 'high';
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        background: 'transparent'
                      }}
                    >
                      <CheckCircle
                        size={18}
                        style={{
                          color: isHigh ? 'var(--alert)' : 'var(--teal)',
                          flexShrink: 0,
                          marginTop: 2
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{
                          fontSize: 14,
                          fontWeight: 400,
                          color: 'var(--ink)',
                          lineHeight: 1.5
                        }}>
                          {item.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line-soft)' }}>
                Directly prescribed by {guidance.updatedBy} · {formatDateShort(guidance.lastUpdated)}
              </div>
            </div>
          )}

          {/* Care Team */}
          <div className="card card-pad">
            <h3 style={{ marginBottom: 16 }}>
              <User size={18} style={{ display: 'inline', verticalAlign: '-3px', marginRight: 8 }} />
              Your Care Team
            </h3>
            {patient.careTeam.map((member, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < patient.careTeam.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                <div className="avatar-circle">{member.split(' ').map(w => w[0]).slice(0, 2).join('')}</div>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{member}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Check-in Modal */}
      <Modal isOpen={showCheckin} onClose={() => setShowCheckin(false)} title="Daily Recovery Check-in" size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Pain */}
          <div>
            <label className="form-label">Pain Level</label>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 56, lineHeight: 0.9, color: getPainColor(pain) }}>{pain}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{painLabels[pain]}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>on a scale of 0–10</div>
              </div>
            </div>
            <input type="range" min="0" max="10" value={pain} onChange={e => setPain(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--teal)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-muted)', marginTop: 4 }}>
              <span>No pain</span><span>Worst pain</span>
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label className="form-label">Symptoms <small>Select all that apply</small></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {['redness', 'mild-swelling', 'discharge', 'bleeding', 'fever-chills', 'increased-pain', 'wound-reopening', 'unusual-smell'].map(sym => (
                <button key={sym} onClick={() => toggleSymptom(sym)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                    border: `1px solid ${symptoms.includes(sym) ? 'var(--sage)' : 'var(--line)'}`,
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
                    background: symptoms.includes(sym) ? 'var(--teal-pale)' : 'var(--surface)',
                    color: symptoms.includes(sym) ? 'var(--teal-deep)' : 'var(--ink-soft)',
                    fontWeight: symptoms.includes(sym) ? 600 : 400, fontSize: 14,
                    transition: 'all 0.15s ease',
                  }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: symptoms.includes(sym) ? 'none' : '2px solid var(--line)',
                    background: symptoms.includes(sym) ? 'var(--teal)' : 'var(--surface)',
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    {symptoms.includes(sym) && <CheckCircle size={12} style={{ color: '#fff' }} />}
                  </div>
                  {getSymptomLabel(sym)}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="form-label">How are you feeling?</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ value: 'feeling-better', label: '😊 Feeling Better' }, { value: 'about-the-same', label: '😐 About the Same' }, { value: 'feeling-worse', label: '😟 Feeling Worse' }].map(opt => (
                <button key={opt.value} onClick={() => setCondition(opt.value)}
                  className={`filter-chip ${condition === opt.value ? 'active' : ''}`}
                  style={{ padding: '10px 16px', fontSize: 14 }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div>
            <label className="form-label">Activity Level</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[{ value: 'walking-normally', label: 'Walking Normally' }, { value: 'limited-movement', label: 'Limited Movement' }, { value: 'mostly-resting', label: 'Mostly Resting' }].map(opt => (
                <button key={opt.value} onClick={() => setActivityLevel(opt.value)}
                  className={`filter-chip ${activityLevel === opt.value ? 'active' : ''}`}
                  style={{ padding: '10px 16px', fontSize: 14 }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Temperature */}
          <div>
            <label className="form-label">Temperature (°F) <small>Optional</small></label>
            <input type="text" className="form-input" placeholder="e.g., 98.6" value={temperature} onChange={e => setTemperature(e.target.value)} style={{ maxWidth: 200 }} />
          </div>

          {/* Notes */}
          <div>
            <label className="form-label">Additional Notes <small>Optional</small></label>
            <textarea className="form-textarea" placeholder="How are you feeling today? Any concerns?" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          {/* Working Photo Upload */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="form-label" style={{ margin: 0 }}>
                Wound Photo <small>Optional — Sent directly to Care Team</small>
              </label>
              {!checkinPhotoUrl && (
                <button
                  type="button"
                  onClick={() => handleUseSample(0, false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--teal)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  Use Sample Wound Photo
                </button>
              )}
            </div>

            {/* Hidden file inputs */}
            <input
              type="file"
              accept="image/*"
              ref={checkinFileRef}
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e, false)}
            />
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={checkinCameraRef}
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e, false)}
            />

            {!checkinPhotoUrl ? (
              <div
                style={{
                  border: '2px dashed var(--line)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px 16px',
                  textAlign: 'center',
                  background: 'var(--surface-hover)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--teal-pale)', display: 'grid', placeItems: 'center' }}>
                  <Camera size={22} style={{ color: 'var(--teal)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>Attach a photo of your surgical wound</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
                    Helps Dr. Ananya Sen monitor healing, redness, and suture integrity
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => checkinFileRef.current?.click()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Upload size={14} /> Choose Photo
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => checkinCameraRef.current?.click()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Camera size={14} /> Take Photo
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  border: '1px solid var(--teal)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 14,
                  background: 'var(--teal-pale)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <img
                    src={checkinPhotoUrl}
                    alt="Wound preview"
                    style={{
                      width: 90,
                      height: 70,
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--teal)'
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <CheckCircle size={14} style={{ color: 'var(--teal)' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal-deep)' }}>Photo Attached</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {checkinPhotoName || 'Wound photo'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>
                      Will be sent to Dr. Ananya Sen with check-in
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px', fontSize: 11 }}
                      onClick={() => checkinFileRef.current?.click()}
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px', fontSize: 11, color: 'var(--alert)' }}
                      onClick={() => {
                        setCheckinPhotoUrl(null);
                        setCheckinPhotoName('');
                        setCheckinPhotoDesc('');
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Optional observation about this photo (e.g. slight redness, clean dressing)"
                  value={checkinPhotoDesc}
                  onChange={(e) => setCheckinPhotoDesc(e.target.value)}
                  style={{ fontSize: 13, background: '#fff' }}
                />
              </div>
            )}
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '14px 20px', fontSize: 16 }} onClick={handleSubmitCheckin}>
            Submit Check-in
          </button>
        </div>
      </Modal>

      {/* Recovery Breakdown Modal */}
      {showRecoveryBreakdown && (
        <Modal
          title="Recovery Score Breakdown"
          onClose={() => setShowRecoveryBreakdown(false)}
          maxWidth={580}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header highlight card */}
            <div style={{
              background: 'linear-gradient(135deg, var(--teal-deep) 0%, var(--teal) 100%)',
              borderRadius: 'var(--radius-md)',
              padding: '20px 24px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85 }}>
                  Live Recovery Progress
                </span>
                <h2 style={{ margin: '4px 0', fontSize: 34, color: '#fff', fontFamily: 'var(--font-serif)' }}>
                  {recoveryPct}% Recovery Score
                </h2>
                <p style={{ margin: 0, fontSize: 13, opacity: 0.92, lineHeight: 1.4 }}>
                  Calculated from daily adherence, pain reports, vitals stability, and healing duration.
                </p>
              </div>
              <div style={{
                width: 74,
                height: 74,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.16)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                border: '2px solid rgba(255,255,255,0.35)'
              }}>
                <Activity size={36} color="#fff" />
              </div>
            </div>

            {/* Explanatory note */}
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>
              Your recovery progress updates live as you complete your daily care tasks, record daily check-ins, and maintain healthy healing indicators.
            </p>

            {/* Factors breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recoveryData.breakdown.map(factor => (
                <div key={factor.id} style={{
                  padding: 14,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--line)',
                  background: 'var(--surface-hover)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{factor.label}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--teal-deep)' }}>
                      +{factor.score} pts <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 400 }}>/ {factor.max} max</span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--line)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{
                      height: '100%',
                      width: `${factor.pct}%`,
                      background: factor.pct >= 70 ? 'var(--teal)' : 'var(--teal-deep)',
                      borderRadius: 3,
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                    {factor.detail}
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive boost tip */}
            <div style={{
              background: 'var(--teal-pale)',
              border: '1px solid var(--teal-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <CheckCircle size={20} color="var(--teal-deep)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--teal-deep)', lineHeight: 1.4 }}>
                <strong>Tip:</strong> Checking off remaining tasks in <em>Today's Tasks</em> or submitting your daily check-in boosts your recovery score in real-time!
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-primary" onClick={() => setShowRecoveryBreakdown(false)}>
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
