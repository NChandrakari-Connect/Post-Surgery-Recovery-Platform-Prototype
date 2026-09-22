import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPatientById, getPatientFullName, getPatientInitials } from '../../data/patients';
import { getDischargeByPatientId } from '../../data/discharges';
import { getReportsByPatientId } from '../../data/reports';
import { getMedicationsByPatientId } from '../../data/medications';
import { getCheckinsByPatientId } from '../../data/checkins';
import { getTimelineByPatientId, getNotesByPatientId, getGuidanceByPatientId, getAppointmentsByPatientId } from '../../data/timeline';
import { formatDate, formatDateShort, getStatusConfig, getPainLabel, getPainColor, getRecoveryPercentage, calculateDynamicRecovery, getSymptomLabel, getConditionLabel, getActivityLabel } from '../../utils/helpers';
import { useApp } from '../../context/AppContext';
import Modal from '../../components/common/Modal';
import {
  ArrowLeft, Heart, FileText, Pill, Activity, Camera,
  Clock, CalendarCheck, AlertTriangle, User, Stethoscope,
  Download, Eye, ChevronDown, ChevronUp, Plus, Send,
  ClipboardList, AlertCircle, CheckCircle, Thermometer,
  MessageSquare, Shield, Building, MapPin, Phone, Mail
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'inquiries', label: 'Patient Inquiries', icon: MessageSquare },
  { id: 'medical', label: 'Medical Info', icon: Heart },
  { id: 'surgery', label: 'Surgery & Discharge', icon: Stethoscope },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'medications', label: 'Medications', icon: Pill },
  { id: 'recovery', label: 'Recovery', icon: Activity },
  { id: 'wound', label: 'Wound', icon: Camera },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'followup', label: 'Follow-up', icon: CalendarCheck },
];

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    addToast,
    getTasksForPatient,
    addTask,
    getGuidanceForPatient,
    addGuidanceItem,
    getCheckinsForPatient,
    getAppointmentsForPatient,
    addAppointment,
    getQuestionsForPatient,
    replyToPatientQuestion,
  } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [reportModal, setReportModal] = useState(null);
  const [dischargeModal, setDischargeModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddGuidanceModal, setShowAddGuidanceModal] = useState(false);
  const [showAddAppointmentModal, setShowAddAppointmentModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ text: '', time: 'Morning' });
  const [guidanceForm, setGuidanceForm] = useState({ text: '', priority: 'normal' });
  const [aptForm, setAptForm] = useState({
    date: '',
    time: '10:00 AM',
    type: 'In-Person Clinic Visit',
    department: 'General Surgery',
    physician: 'Dr. Ananya Sen',
    location: 'Surgical Outpatient Pavilion, Suite 402',
    reason: 'Post-operative follow-up and incision evaluation',
    notes: ''
  });
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState([]);
  const [expandedCheckin, setExpandedCheckin] = useState(null);

  const tasks = getTasksForPatient(id);
  const guidance = getGuidanceForPatient(id);

  const patient = getPatientById(id);
  if (!patient) {
    return (
      <div className="page-content">
        <div className="card"><div className="empty-state">
          <div className="empty-state-icon"><User size={28} /></div>
          <h3>Patient not found</h3>
          <p>The patient record you're looking for doesn't exist.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/patients')}>
            Back to Patients
          </button>
        </div></div>
      </div>
    );
  }

  const discharge = getDischargeByPatientId(id);
  const reports = getReportsByPatientId(id);
  const medications = getMedicationsByPatientId(id);
  const checkins = getCheckinsForPatient ? getCheckinsForPatient(id) : getCheckinsByPatientId(id);
  const timeline = getTimelineByPatientId(id);
  const careNotes = [...getNotesByPatientId(id), ...notes];
  const followUps = getAppointmentsForPatient ? getAppointmentsForPatient(id) : getAppointmentsByPatientId(id);
  const questions = getQuestionsForPatient ? getQuestionsForPatient(id) : [];
  const statusConfig = getStatusConfig(patient.status);
  const recoveryData = calculateDynamicRecovery(patient, tasks, checkins);
  const recoveryPct = recoveryData.percentage;

  const handleCreateAppointment = (e) => {
    e?.preventDefault();
    if (!aptForm.date) {
      addToast('Please select an appointment date', 'warning');
      return;
    }
    addAppointment(id, {
      ...aptForm,
      patientName: getPatientFullName(patient),
      department: aptForm.department || patient?.surgery?.department || 'General Surgery',
      physician: aptForm.physician || patient?.careTeam?.[0]?.name || 'Dr. Ananya Sen',
    });
    setAptForm({
      date: '',
      time: '10:00 AM',
      type: 'In-Person Clinic Visit',
      department: patient?.surgery?.department || 'General Surgery',
      physician: patient?.careTeam?.[0]?.name || 'Dr. Ananya Sen',
      location: 'Surgical Outpatient Pavilion, Suite 402',
      reason: 'Post-operative follow-up and incision evaluation',
      notes: ''
    });
    setShowAddAppointmentModal(false);
  };

  const handleCreateTask = (e) => {
    e?.preventDefault();
    if (!taskForm.text.trim()) {
      addToast('Please enter task description', 'warning');
      return;
    }
    addTask(id, taskForm);
    setTaskForm({ text: '', time: 'Morning' });
    setShowAddTaskModal(false);
  };

  const handleCreateGuidance = (e) => {
    e?.preventDefault();
    if (!guidanceForm.text.trim()) {
      addToast('Please enter guidance instruction', 'warning');
      return;
    }
    addGuidanceItem(id, guidanceForm);
    setGuidanceForm({ text: '', priority: 'normal' });
    setShowAddGuidanceModal(false);
  };

  const painChartData = useMemo(() =>
    [...checkins].reverse().map(c => ({
      day: `Day ${c.recoveryDay}`,
      pain: c.pain,
    })), [checkins]);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    setNotes(prev => [{
      id: `NOTE-NEW-${Date.now()}`,
      patientId: id,
      author: 'Dr. Ananya Sen',
      role: 'Surgeon',
      date: '2024-09-22',
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      content: noteText,
      type: 'internal',
    }, ...prev]);
    setNoteText('');
    addToast('Note added successfully');
  };

  return (
    <div className="page-content">
      {/* Back Navigation */}
      <button className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={() => navigate('/patients')}>
        <ArrowLeft size={16} /> Back to Patients
      </button>

      {/* Profile Header */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-pad">
          <div className="patient-profile-header-layout">
            <div className="patient-profile-main-info">
              <div className="avatar-circle xl profile-avatar" style={{ fontSize: 22, flexShrink: 0 }}>
                {getPatientInitials(patient)}
              </div>
              <div className="patient-profile-details">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h1 className="patient-profile-name" style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
                    {getPatientFullName(patient)}
                  </h1>
                  <span className={`status-badge ${patient.status}`} style={{ fontSize: 11 }}>
                    <span className="status-dot" />
                    {statusConfig.label}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
                  <span>ID: {patient.id}</span>
                  <span>{patient.age}y · {patient.gender}</span>
                  <span>{patient.surgery.procedure}</span>
                  <span>Day {patient.recoveryDay} of {patient.surgery.expectedRecoveryDays}</span>
                </div>
              </div>
            </div>

            <div className="patient-profile-score-box">
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Recovery Progress</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--teal-deep)', fontWeight: 600 }}>{recoveryPct}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in" key={activeTab}>
        {activeTab === 'overview' && (
          <OverviewTab
            patient={patient}
            checkins={checkins}
            statusConfig={statusConfig}
            recoveryPct={recoveryPct}
            guidance={guidance}
            followUps={followUps}
            tasks={tasks}
            questions={questions}
            onReplyToQuestion={replyToPatientQuestion}
            onOpenAddTask={() => setShowAddTaskModal(true)}
            onOpenAddGuidance={() => setShowAddGuidanceModal(true)}
          />
        )}
        {activeTab === 'inquiries' && (
          <InquiriesTab
            patient={patient}
            questions={questions}
            onReplyToQuestion={replyToPatientQuestion}
          />
        )}
        {activeTab === 'medical' && (
          <MedicalTab patient={patient} />
        )}
        {activeTab === 'surgery' && (
          <SurgeryTab patient={patient} discharge={discharge} dischargeModal={dischargeModal} setDischargeModal={setDischargeModal} />
        )}
        {activeTab === 'reports' && (
          <ReportsTab reports={reports} patient={patient} reportModal={reportModal} setReportModal={setReportModal} addToast={addToast} />
        )}
        {activeTab === 'medications' && (
          <MedicationsTab medications={medications} />
        )}
        {activeTab === 'recovery' && (
          <RecoveryTab
            checkins={checkins}
            painChartData={painChartData}
            expandedCheckin={expandedCheckin}
            setExpandedCheckin={setExpandedCheckin}
            tasks={tasks}
          />
        )}
        {activeTab === 'wound' && (
          <WoundTab checkins={checkins} />
        )}
        {activeTab === 'timeline' && (
          <TimelineTab timeline={timeline} />
        )}
        {activeTab === 'followup' && (
          <FollowUpTab
            followUps={followUps}
            careNotes={careNotes}
            noteText={noteText}
            setNoteText={setNoteText}
            handleAddNote={handleAddNote}
            onOpenAddAppointment={() => setShowAddAppointmentModal(true)}
          />
        )}
      </div>

      {/* Modals */}
      {discharge && (
        <Modal isOpen={dischargeModal} onClose={() => setDischargeModal(false)} title="Discharge Summary" size="lg"
          footer={<button className="btn btn-secondary" onClick={() => { addToast('Document download simulated'); setDischargeModal(false); }}><Download size={16} /> Download PDF</button>}>
          <DischargeDocument patient={patient} discharge={discharge} />
        </Modal>
      )}

      {reportModal && (
        <Modal isOpen={!!reportModal} onClose={() => setReportModal(null)} title={reportModal.name} size="lg"
          footer={<button className="btn btn-secondary" onClick={() => { addToast('Report download simulated'); }}><Download size={16} /> Download Report</button>}>
          <ReportDocument report={reportModal} patient={patient} />
        </Modal>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <Modal
          isOpen={showAddTaskModal}
          onClose={() => setShowAddTaskModal(false)}
          title={`Prescribe Recovery Task — ${patient.firstName} ${patient.lastName}`}
          footer={
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddTaskModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleCreateTask}>Save & Assign Task</button>
            </div>
          }
        >
          <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Task Description *
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Measure oral temperature, 10-min light walk"
                value={taskForm.text}
                onChange={e => setTaskForm(prev => ({ ...prev, text: e.target.value }))}
                autoFocus
                required
                style={{ fontSize: 14, padding: '10px 14px' }}
              />

              {/* Quick Preset Suggestions */}
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick Suggestions:</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 5 }}>
                  {[
                    'Measure oral temperature',
                    '10-min light walking',
                    'Ankle pump exercises (20 reps)',
                    'Inspect incision for drainage',
                    'Hydration reminder (8oz water)'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTaskForm(prev => ({ ...prev, text: preset }))}
                      style={{
                        padding: '3px 9px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--line)',
                        background: taskForm.text === preset ? 'var(--teal-pale)' : 'var(--paper)',
                        color: taskForm.text === preset ? 'var(--teal-deep)' : 'var(--ink-soft)',
                        fontSize: 11,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Schedule / Time
              </label>

              {/* Quick Time Preset Buttons */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {['Morning', '8:00 AM', 'Afternoon', '2:00 PM', 'Evening', '8:00 PM', 'Night', 'As Needed'].map(timeSlot => (
                  <button
                    key={timeSlot}
                    type="button"
                    onClick={() => setTaskForm(prev => ({ ...prev, time: timeSlot }))}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: taskForm.time === timeSlot ? '2px solid var(--teal)' : '1px solid var(--line)',
                      background: taskForm.time === timeSlot ? 'var(--teal-pale)' : 'var(--surface)',
                      color: taskForm.time === timeSlot ? 'var(--teal-deep)' : 'var(--ink)',
                      fontWeight: taskForm.time === timeSlot ? 600 : 400,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {timeSlot}
                  </button>
                ))}
              </div>

              <input
                type="text"
                className="input"
                placeholder="Or type custom schedule (e.g. Twice daily with meals)"
                value={taskForm.time}
                onChange={e => setTaskForm(prev => ({ ...prev, time: e.target.value }))}
                style={{ fontSize: 13 }}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Add Guidance Modal */}
      {showAddGuidanceModal && (
        <Modal
          isOpen={showAddGuidanceModal}
          onClose={() => setShowAddGuidanceModal(false)}
          title={`Prescribe Clinical Guidance — ${patient.firstName} ${patient.lastName}`}
          footer={
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddGuidanceModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleCreateGuidance}>Save & Publish Guidance</button>
            </div>
          }
        >
          <form onSubmit={handleCreateGuidance} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Visual Priority Selector */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Instruction Type & Priority Level *
              </label>
              <div className="grid-2" style={{ gap: 12 }}>
                <div
                  onClick={() => setGuidanceForm(prev => ({ ...prev, priority: 'normal' }))}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: guidanceForm.priority === 'normal' ? '2px solid var(--teal)' : '1px solid var(--line)',
                    background: guidanceForm.priority === 'normal' ? 'var(--teal-pale)' : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <CheckCircle size={18} style={{ color: 'var(--teal)' }} />
                    <strong style={{ fontSize: 13, color: 'var(--ink)' }}>Standard Routine Care</strong>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                    Green indicator. Standard daily hygiene, diet, and expected mobility advice.
                  </div>
                </div>

                <div
                  onClick={() => setGuidanceForm(prev => ({ ...prev, priority: 'high' }))}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: guidanceForm.priority === 'high' ? '2px solid var(--alert)' : '1px solid var(--line)',
                    background: guidanceForm.priority === 'high' ? 'var(--status-needs-review-bg)' : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <AlertTriangle size={18} style={{ color: 'var(--alert)' }} />
                    <strong style={{ fontSize: 13, color: 'var(--alert)' }}>High Priority / Warning</strong>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                    Red alert indicator. Critical precaution, red-flag warning, or strict surgical restriction.
                  </div>
                </div>
              </div>
            </div>

            {/* Instruction Textarea */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Clinical Instruction *
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="e.g. Keep incision clean and dry; avoid submerging in baths or swimming for 10 days."
                value={guidanceForm.text}
                onChange={e => setGuidanceForm(prev => ({ ...prev, text: e.target.value }))}
                autoFocus
                required
                style={{ resize: 'vertical', fontSize: 14, lineHeight: 1.5, padding: '10px 14px' }}
              />

              {/* Quick Guidance Presets */}
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick Clinical Templates:</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 5 }}>
                  {[
                    'Keep incision area clean and dry at all times',
                    'Avoid heavy lifting (>10 lbs) for the next 2 weeks',
                    'Call clinic immediately if fever exceeds 100.4°F or chills occur',
                    'Elevate surgical limb above heart level when resting'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGuidanceForm(prev => ({ ...prev, text: preset }))}
                      style={{
                        padding: '3px 9px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--line)',
                        background: guidanceForm.text === preset ? 'var(--teal-pale)' : 'var(--paper)',
                        color: guidanceForm.text === preset ? 'var(--teal-deep)' : 'var(--ink-soft)',
                        fontSize: 11,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Schedule Follow-up Appointment Modal */}
      {showAddAppointmentModal && (
        <Modal
          isOpen={showAddAppointmentModal}
          onClose={() => setShowAddAppointmentModal(false)}
          title={`Schedule Follow-up Appointment — ${patient.firstName} ${patient.lastName}`}
          size="md"
          footer={
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddAppointmentModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleCreateAppointment}>
                <CalendarCheck size={16} /> Confirm & Schedule
              </button>
            </div>
          }
        >
          <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Date and Time */}
            <div className="grid-2" style={{ gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>Appointment Date *</label>
                <input
                  type="date"
                  className="form-input input"
                  required
                  value={aptForm.date}
                  onChange={e => setAptForm({ ...aptForm, date: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px' }}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>Time Slot *</label>
                <select
                  className="form-select input"
                  value={aptForm.time}
                  onChange={e => setAptForm({ ...aptForm, time: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px' }}
                >
                  <option value="08:30 AM">08:30 AM (Early Morning)</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="10:00 AM">10:00 AM (Recommended)</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="01:30 PM">01:30 PM (Afternoon)</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>
            </div>

            {/* Appointment Type */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>Appointment Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {[
                  'In-Person Clinic Visit',
                  'Telehealth Video Visit',
                  'Wound & Suture Removal',
                  'Post-Op Surgical Evaluation'
                ].map(typeOpt => (
                  <button
                    key={typeOpt}
                    type="button"
                    onClick={() => setAptForm({ ...aptForm, type: typeOpt })}
                    style={{
                      padding: '8px 12px',
                      fontSize: 12,
                      fontWeight: aptForm.type === typeOpt ? 600 : 400,
                      borderRadius: 'var(--radius-sm)',
                      border: aptForm.type === typeOpt ? '2px solid var(--teal)' : '1px solid var(--line)',
                      background: aptForm.type === typeOpt ? 'var(--teal-pale)' : 'var(--surface)',
                      color: aptForm.type === typeOpt ? 'var(--teal-deep)' : 'var(--ink)',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    {typeOpt}
                  </button>
                ))}
              </div>
            </div>

            {/* Department & Physician */}
            <div className="grid-2" style={{ gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>Department</label>
                <select
                  className="form-select input"
                  value={aptForm.department}
                  onChange={e => setAptForm({ ...aptForm, department: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px' }}
                >
                  <option value="General Surgery">General Surgery</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Wound Care Specialty">Wound Care Specialty</option>
                  <option value="Head & Neck Surgery">Head & Neck Surgery</option>
                  <option value="Physical Therapy">Physical Therapy</option>
                </select>
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>Attending Clinician</label>
                <input
                  type="text"
                  className="form-input input"
                  value={aptForm.physician}
                  onChange={e => setAptForm({ ...aptForm, physician: e.target.value })}
                  placeholder="e.g. Dr. Ananya Sen"
                  style={{ width: '100%', padding: '10px 12px' }}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>Location / Facility</label>
              <input
                type="text"
                className="form-input input"
                value={aptForm.location}
                onChange={e => setAptForm({ ...aptForm, location: e.target.value })}
                placeholder="e.g. Surgical Outpatient Pavilion, Suite 402"
                style={{ width: '100%', padding: '10px 12px' }}
              />
            </div>

            {/* Reason / Clinical Purpose with quick pills */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>Clinical Purpose / Reason *</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {[
                  'Incision healing & suture check',
                  'Post-op recovery progress check',
                  'Pathology & lab review',
                  'Activity & mobility clearance'
                ].map(r => (
                  <span
                    key={r}
                    onClick={() => setAptForm({ ...aptForm, reason: r })}
                    style={{
                      fontSize: 11,
                      padding: '3px 9px',
                      borderRadius: 12,
                      background: aptForm.reason === r ? 'var(--teal-pale)' : 'var(--paper)',
                      border: aptForm.reason === r ? '1px solid var(--teal)' : '1px solid var(--line)',
                      cursor: 'pointer',
                      color: aptForm.reason === r ? 'var(--teal-deep)' : 'var(--ink-soft)'
                    }}
                  >
                    + {r}
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="form-input input"
                required
                value={aptForm.reason}
                onChange={e => setAptForm({ ...aptForm, reason: e.target.value })}
                placeholder="e.g. Post-operative wound assessment and progress review"
                style={{ width: '100%', padding: '10px 12px' }}
              />
            </div>

            {/* Patient Instructions */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>
                Patient Instructions & Preparation <small style={{ color: 'var(--ink-muted)' }}>(Reflects in Patient portal)</small>
              </label>
              <textarea
                className="form-textarea input"
                rows={2}
                value={aptForm.notes}
                onChange={e => setAptForm({ ...aptForm, notes: e.target.value })}
                placeholder="e.g. Please bring your medications. Wear loose comfortable clothing. Arrive 15 mins prior."
                style={{ width: '100%', padding: '10px 12px', resize: 'vertical' }}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB COMPONENTS
// ═══════════════════════════════════════════════

function OverviewTab({ patient, checkins, statusConfig, recoveryPct, guidance, followUps, tasks = [], questions = [], onReplyToQuestion, onOpenAddTask, onOpenAddGuidance }) {
  const latestCheckin = checkins[0];
  const completedTasksCount = tasks.filter(t => t.done).length;
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  return (
    <div className="grid-2">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Patient Snapshot */}
        <div className="card card-pad">
          <h3 style={{ marginBottom: 16 }}>Patient Snapshot</h3>
          <div className="info-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="info-item"><span className="info-label">Full Name</span><span className="info-value">{getPatientFullName(patient)}</span></div>
            <div className="info-item"><span className="info-label">Patient ID</span><span className="info-value">{patient.id}</span></div>
            <div className="info-item"><span className="info-label">Age / Gender</span><span className="info-value">{patient.age}y · {patient.gender}</span></div>
            <div className="info-item"><span className="info-label">Contact</span><span className="info-value" style={{ fontSize: 13 }}>{patient.phone}</span></div>
            <div className="info-item"><span className="info-label">Emergency</span><span className="info-value" style={{ fontSize: 13 }}>{patient.emergencyContact.name} ({patient.emergencyContact.relation})</span></div>
            <div className="info-item"><span className="info-label">Insurance</span><span className="info-value" style={{ fontSize: 13 }}>{patient.insurance.provider}</span></div>
          </div>
          {patient.allergies.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line-soft)' }}>
              <span className="info-label" style={{ marginBottom: 8, display: 'block' }}>Allergies</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {patient.allergies.map((a, i) => (
                  <span key={i} className="status-badge needs-review" style={{ fontSize: 12 }}>
                    <AlertTriangle size={12} /> {a.name} — {a.reaction}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Surgery Summary */}
        <div className="card card-pad">
          <h3 style={{ marginBottom: 16 }}>Surgery Summary</h3>
          <div className="info-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="info-item"><span className="info-label">Procedure</span><span className="info-value">{patient.surgery.procedure}</span></div>
            <div className="info-item"><span className="info-label">Date</span><span className="info-value">{formatDate(patient.surgery.date)}</span></div>
            <div className="info-item"><span className="info-label">Surgeon</span><span className="info-value">{patient.surgery.surgeon}</span></div>
            <div className="info-item"><span className="info-label">Hospital</span><span className="info-value" style={{ fontSize: 13 }}>{patient.surgery.hospital}</span></div>
            <div className="info-item"><span className="info-label">Type</span><span className="info-value">{patient.surgery.procedureType}</span></div>
            <div className="info-item"><span className="info-label">Recovery Day</span><span className="info-value">Day {patient.recoveryDay} of {patient.surgery.expectedRecoveryDays}</span></div>
          </div>
        </div>

        {/* Direct Patient Inquiries Card */}
        <div className="card card-pad" style={{ border: questions.some(q => q.status === 'pending') ? '1.5px solid var(--status-monitor)' : '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--teal-pale)', display: 'grid', placeItems: 'center' }}>
                <MessageSquare size={18} style={{ color: 'var(--teal-deep)' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>Direct Patient Inquiries</h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-soft)' }}>
                  Questions submitted by {patient.firstName}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {questions.filter(q => q.status === 'pending').length > 0 ? (
                <span className="status-badge monitor" style={{ fontSize: 11, fontWeight: 600 }}>
                  <Clock size={12} style={{ marginRight: 4 }} />
                  {questions.filter(q => q.status === 'pending').length} Awaiting Response
                </span>
              ) : (
                <span className="status-badge on-track" style={{ fontSize: 11, fontWeight: 600 }}>
                  <CheckCircle size={12} style={{ marginRight: 4 }} /> All Answered
                </span>
              )}
            </div>
          </div>

          {questions.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}>No questions asked by this patient yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {questions.map((q) => (
                <div
                  key={q.id}
                  style={{
                    padding: 12,
                    borderRadius: 'var(--radius-md)',
                    background: q.status === 'pending' ? 'var(--status-monitor-bg)' : 'var(--surface-hover)',
                    border: q.status === 'pending' ? '1px solid var(--status-monitor-border)' : '1px solid var(--line-soft)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4, background: '#fff', border: '1px solid var(--line)' }}>
                        {q.category}
                      </span>
                      {q.urgency === 'urgent' && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--alert)', background: '#fff', border: '1px solid var(--alert)', padding: '2px 6px', borderRadius: 4 }}>
                          Priority
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                      {q.timeFormatted || formatDateShort(q.askedAt)}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 8, lineHeight: 1.4 }}>
                    "{q.question}"
                  </div>

                  {q.status === 'answered' && q.response ? (
                    <div style={{
                      padding: 10,
                      background: 'rgba(255,255,255,0.9)',
                      borderRadius: 6,
                      border: '1px solid var(--teal-border)',
                      fontSize: 12
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <strong style={{ color: 'var(--teal-deep)' }}>✓ {q.response.answeredBy} ({q.response.role}):</strong>
                        <span style={{ color: 'var(--ink-muted)', fontSize: 11 }}>{q.response.timeFormatted}</span>
                      </div>
                      <div style={{ color: 'var(--ink)', lineHeight: 1.45 }}>{q.response.text}</div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 8 }}>
                      {replyingToId === q.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#fff', padding: 10, borderRadius: 6, border: '1px solid var(--line)' }}>
                          <textarea
                            className="form-input"
                            rows={2}
                            placeholder="Type clinical advice or instructions for the patient..."
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            style={{ fontSize: 12 }}
                          />
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {[
                              'Expected post-op healing response. Continue current care.',
                              'Brief lukewarm showers permitted. Gently pat incision dry.',
                              'Take pain medication with meals as prescribed.'
                            ].map((preset, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'var(--teal-pale)', border: '1px solid var(--teal-border)', color: 'var(--teal-deep)', cursor: 'pointer' }}
                                onClick={() => setReplyText(preset)}
                              >
                                + {preset}
                              </button>
                            ))}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: 11 }}
                              onClick={() => { setReplyingToId(null); setReplyText(''); }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              style={{ padding: '4px 12px', fontSize: 11 }}
                              disabled={!replyText.trim()}
                              onClick={() => {
                                onReplyToQuestion(patient.id, q.id, replyText.trim(), 'Dr. Ananya Sen', 'Attending Surgeon');
                                setReplyingToId(null);
                                setReplyText('');
                              }}
                            >
                              Send Reply to Patient
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 11, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          onClick={() => { setReplyingToId(q.id); setReplyText(''); }}
                        >
                          <Send size={11} /> Reply to Patient
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Current Recovery */}
        <div className="card card-pad">
          <h3 style={{ marginBottom: 16 }}>Current Recovery</h3>
          <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 48, color: getPainColor(patient.currentPain), lineHeight: 1 }}>{patient.currentPain}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>Pain / 10</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 48, color: 'var(--teal-deep)', lineHeight: 1 }}>{recoveryPct}%</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>Recovery</div>
            </div>
          </div>
          {latestCheckin && (
            <div className="info-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="info-item"><span className="info-label">Wound Status</span><span className="info-value">{patient.woundStatus}</span></div>
              <div className="info-item"><span className="info-label">Last Check-in</span><span className="info-value">{formatDateShort(patient.lastCheckIn)}</span></div>
              <div className="info-item"><span className="info-label">Condition</span><span className="info-value">{getConditionLabel(latestCheckin.generalCondition)}</span></div>
              <div className="info-item"><span className="info-label">Next Follow-up</span><span className="info-value">{formatDateShort(patient.nextFollowUp)}</span></div>
            </div>
          )}
          {latestCheckin && latestCheckin.symptoms.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line-soft)' }}>
              <span className="info-label" style={{ marginBottom: 8, display: 'block' }}>Reported Symptoms</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {latestCheckin.symptoms.map(s => (
                  <span key={s} className="status-badge monitor" style={{ fontSize: 12 }}>{getSymptomLabel(s)}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Attention / Guidance */}
        {patient.status !== 'on-track' && (
          <div className={`attention-card ${patient.status}`}>
            <div className="attention-card-icon" style={{ color: getStatusConfig(patient.status).color }}>
              <AlertTriangle size={18} />
            </div>
            <div className="attention-card-content">
              <h4 style={{ color: getStatusConfig(patient.status).color }}>{getStatusConfig(patient.status).label}</h4>
              <p style={{ color: 'var(--ink-soft)' }}>
                Patient reported {patient.status === 'needs-review' ? 'concerning symptoms requiring clinical review' : 'changes worth monitoring'}. Review the latest check-in and wound photos for details.
              </p>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, padding: '4px 0' }}>
                Review Details →
              </button>
            </div>
          </div>
        )}

        {patient.status === 'on-track' && (
          <div className="attention-card on-track">
            <div className="attention-card-icon" style={{ color: 'var(--status-on-track)' }}>
              <CheckCircle size={18} />
            </div>
            <div className="attention-card-content">
              <h4 style={{ color: 'var(--status-on-track)' }}>Recovery On Track</h4>
              <p style={{ color: 'var(--ink-soft)' }}>
                Pain is trending down and symptoms are improving. Recovery progressing as expected for this stage.
              </p>
            </div>
          </div>
        )}

        {/* Today's Patient Tasks & Adherence */}
        {tasks && tasks.length > 0 && (
          <div className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={18} style={{ color: 'var(--teal)' }} />
                Today's Patient Tasks & Adherence
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`status-badge ${completedTasksCount === tasks.length ? 'on-track' : 'monitor'}`} style={{ fontSize: 11 }}>
                  {completedTasksCount} / {tasks.length} Completed
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  onClick={onOpenAddTask}
                >
                  <Plus size={14} /> Add Task
                </button>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 12px 0' }}>
              Real-time daily adherence reported by {patient.firstName}
            </p>

            <div style={{ height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{
                height: '100%',
                width: `${Math.round((completedTasksCount / (tasks.length || 1)) * 100)}%`,
                background: 'var(--teal)',
                borderRadius: 2,
                transition: 'width 0.3s ease'
              }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.map(task => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: task.done ? 'var(--surface-hover)' : 'var(--surface)',
                    border: '1px solid var(--line-soft)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: task.done ? 'var(--teal)' : 'var(--ink-muted)',
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 13,
                      fontWeight: task.done ? 500 : 400,
                      color: task.done ? 'var(--ink)' : 'var(--ink-soft)',
                    }}>
                      {task.text}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {task.time && (
                      <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                        {task.time}
                      </span>
                    )}
                    <span
                      className={`status-badge ${task.done ? 'on-track' : 'monitor'}`}
                      style={{ fontSize: 11, padding: '2px 8px' }}
                    >
                      {task.done ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Guidance */}
        {guidance && (
          <div className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={18} style={{ color: 'var(--teal)' }} />
                Patient Guidance
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onClick={onOpenAddGuidance}
              >
                <Plus size={14} /> Add Guidance
              </button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 12 }}>
              Updated by {guidance.updatedBy} · {formatDateShort(guidance.lastUpdated)}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {guidance.items.map((item, i) => {
                const isHigh = item.priority === 'high';
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      background: 'transparent'
                    }}
                  >
                    <CheckCircle
                      size={16}
                      style={{
                        color: isHigh ? 'var(--alert)' : 'var(--teal)',
                        flexShrink: 0,
                        marginTop: 2
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--ink)', fontWeight: 400, lineHeight: 1.5 }}>
                      {item.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InquiriesTab({ patient, questions = [], onReplyToQuestion }) {
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = questions.filter(q => {
    if (filter === 'pending') return q.status === 'pending';
    if (filter === 'answered') return q.status === 'answered';
    return true;
  });

  const pendingCount = questions.filter(q => q.status === 'pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header card */}
      <div className="card card-pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={20} style={{ color: 'var(--teal)' }} />
              Direct Patient Inquiries — {getPatientFullName(patient)}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-soft)' }}>
              Direct questions submitted by patient through their recovery dashboard and care team portal.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('all')}
            >
              All ({questions.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filter === 'answered' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('answered')}
            >
              Answered ({questions.length - pendingCount})
            </button>
          </div>
        </div>
      </div>

      {/* Questions list */}
      {filtered.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <MessageSquare size={36} style={{ color: 'var(--ink-muted)', marginBottom: 8 }} />
          <h4 style={{ margin: 0, color: 'var(--ink)' }}>No inquiries matching this filter</h4>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Any new questions asked by the patient will appear here instantly.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(q => (
            <div
              key={q.id}
              className="card card-pad"
              style={{
                border: q.status === 'pending' ? '1.5px solid var(--status-monitor)' : '1px solid var(--line)',
                boxShadow: q.status === 'pending' ? '0 4px 14px rgba(245, 158, 11, 0.12)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, background: 'var(--surface-hover)', border: '1px solid var(--line)' }}>
                    {q.category}
                  </span>
                  {q.urgency === 'urgent' ? (
                    <span className="status-badge needs-review" style={{ fontSize: 11, fontWeight: 700 }}>
                      <AlertTriangle size={11} style={{ marginRight: 3 }} /> Priority Urgent
                    </span>
                  ) : (
                    <span className="status-badge" style={{ fontSize: 11, background: 'var(--teal-pale)', color: 'var(--teal-deep)' }}>
                      Routine
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                    Asked: {q.timeFormatted || formatDateShort(q.askedAt)}
                  </span>
                  {q.status === 'pending' ? (
                    <span className="status-badge monitor" style={{ fontSize: 11, fontWeight: 600 }}>
                      <Clock size={11} style={{ marginRight: 3 }} /> Awaiting Response
                    </span>
                  ) : (
                    <span className="status-badge on-track" style={{ fontSize: 11, fontWeight: 600 }}>
                      <CheckCircle size={11} style={{ marginRight: 3 }} /> Answered
                    </span>
                  )}
                </div>
              </div>

              {/* Question bubble */}
              <div style={{
                padding: '14px 18px',
                background: 'var(--paper)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--line)',
                marginBottom: 14
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 4 }}>
                  Patient Question:
                </div>
                <div style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 500, lineHeight: 1.5 }}>
                  "{q.question}"
                </div>
              </div>

              {/* Response or Reply Form */}
              {q.status === 'answered' && q.response ? (
                <div style={{
                  padding: 14,
                  background: 'var(--teal-pale)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--teal-border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={15} style={{ color: 'var(--status-on-track)' }} />
                      <strong style={{ fontSize: 13, color: 'var(--teal-deep)' }}>{q.response.answeredBy}</strong>
                      <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>· {q.response.role}</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{q.response.timeFormatted}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>
                    {q.response.text}
                  </p>
                </div>
              ) : (
                <div style={{ background: '#fff', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--teal-deep)', marginBottom: 6 }}>
                    Provide Clinical Response to {patient.firstName}:
                  </div>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder={`Type instructions or advice for ${patient.firstName}...`}
                    value={replyingId === q.id ? replyText : ''}
                    onFocus={() => { if (replyingId !== q.id) { setReplyingId(q.id); setReplyText(''); } }}
                    onChange={e => { setReplyingId(q.id); setReplyText(e.target.value); }}
                    style={{ fontSize: 13, marginBottom: 8 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[
                        'Expected healing response — continue routine recovery care.',
                        'Brief lukewarm showers permitted. Keep wound clean and dry.',
                        'Mild pulling is typical collagen remodeling. Rest if aching increases.'
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          style={{
                            fontSize: 11,
                            padding: '3px 8px',
                            borderRadius: 12,
                            background: 'var(--teal-pale)',
                            border: '1px solid var(--teal-border)',
                            color: 'var(--teal-deep)',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setReplyingId(q.id);
                            setReplyText(preset);
                          }}
                        >
                          + {preset.slice(0, 32)}...
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={replyingId !== q.id || !replyText.trim()}
                      onClick={() => {
                        onReplyToQuestion(patient.id, q.id, replyText.trim(), 'Dr. Ananya Sen', 'Attending Surgeon');
                        setReplyingId(null);
                        setReplyText('');
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Send size={13} /> Send Response to Patient
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MedicalTab({ patient }) {
  return (
    <div className="grid-2">
      <div className="card card-pad">
        <h3 style={{ marginBottom: 16 }}>
          <AlertTriangle size={18} style={{ display: 'inline', verticalAlign: '-3px', marginRight: 8, color: 'var(--status-needs-review)' }} />
          Allergies
        </h3>
        {patient.allergies.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>No known allergies recorded.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {patient.allergies.map((a, i) => (
              <div key={i} style={{ padding: 14, border: '1px solid var(--status-needs-review-border)', borderRadius: 'var(--radius-md)', background: 'var(--status-needs-review-bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</span>
                  <span className={`status-badge ${a.severity === 'Severe' ? 'needs-review' : 'monitor'}`} style={{ fontSize: 11 }}>{a.severity}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                  <strong>Type:</strong> {a.type} · <strong>Reaction:</strong> {a.reaction}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card card-pad">
          <h3 style={{ marginBottom: 16 }}>Medical History</h3>
          {patient.medicalHistory.length === 0 ? (
            <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>No relevant medical history recorded.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {patient.medicalHistory.map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < patient.medicalHistory.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{h.condition}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Diagnosed: {formatDate(h.diagnosed)}</div>
                  </div>
                  <span className={`status-badge ${h.status === 'Resolved' ? 'completed' : 'monitor'}`} style={{ fontSize: 11 }}>{h.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad">
          <h3 style={{ marginBottom: 16 }}>Previous Procedures</h3>
          {patient.previousProcedures.length === 0 ? (
            <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>No previous procedures recorded.</p>
          ) : (
            patient.previousProcedures.map((p, i) => (
              <div key={i} style={{ padding: '10px 0' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{formatDate(p.date)} · {p.hospital}</div>
              </div>
            ))
          )}
        </div>

        <div className="card card-pad">
          <h3 style={{ marginBottom: 16 }}>Contact Information</h3>
          <div className="info-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="info-item" style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Phone size={16} style={{ color: 'var(--ink-soft)' }} /><span className="info-value" style={{ fontSize: 14 }}>{patient.phone}</span>
            </div>
            <div className="info-item" style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Mail size={16} style={{ color: 'var(--ink-soft)' }} /><span className="info-value" style={{ fontSize: 14 }}>{patient.email}</span>
            </div>
            <div className="info-item" style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <MapPin size={16} style={{ color: 'var(--ink-soft)' }} /><span className="info-value" style={{ fontSize: 14 }}>{patient.address}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SurgeryTab({ patient, discharge, dischargeModal, setDischargeModal }) {
  const steps = [
    { label: 'Pre-operative', date: discharge ? formatDateShort(discharge.admissionDate) : '', done: true },
    { label: 'Surgery', date: formatDateShort(patient.surgery.date), done: true },
    { label: 'Discharge', date: discharge ? formatDateShort(discharge.dischargeDate) : '', done: true },
    { label: 'Early Recovery', date: 'Days 1–5', done: patient.recoveryDay > 5 },
    { label: `Day ${patient.recoveryDay}`, date: 'Current', current: true, done: false },
    { label: 'Follow-up', date: formatDateShort(patient.nextFollowUp), done: false },
    { label: 'Expected Completion', date: `Day ${patient.surgery.expectedRecoveryDays}`, done: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Surgery Details */}
      <div className="card card-pad">
        <h3 style={{ marginBottom: 20 }}>Surgery Details</h3>
        <div className="info-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="info-item"><span className="info-label">Procedure</span><span className="info-value">{patient.surgery.procedure}</span></div>
          <div className="info-item"><span className="info-label">Date</span><span className="info-value">{formatDate(patient.surgery.date)}</span></div>
          <div className="info-item"><span className="info-label">Surgeon</span><span className="info-value">{patient.surgery.surgeon}</span></div>
          <div className="info-item"><span className="info-label">Hospital</span><span className="info-value">{patient.surgery.hospital}</span></div>
          <div className="info-item"><span className="info-label">Type</span><span className="info-value">{patient.surgery.procedureType}</span></div>
          <div className="info-item"><span className="info-label">Anesthesia</span><span className="info-value">{patient.surgery.anesthesia}</span></div>
          <div className="info-item"><span className="info-label">Duration</span><span className="info-value">{patient.surgery.duration}</span></div>
          <div className="info-item"><span className="info-label">Recovery Day</span><span className="info-value">Day {patient.recoveryDay} of {patient.surgery.expectedRecoveryDays}</span></div>
          <div className="info-item"><span className="info-label">Department</span><span className="info-value">{patient.surgery.department}</span></div>
        </div>
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--line-soft)' }}>
          <span className="info-label" style={{ display: 'block', marginBottom: 8 }}>Surgery Notes</span>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)' }}>{patient.surgery.notes}</p>
        </div>
      </div>

      {/* Recovery Timeline */}
      <div className="card card-pad">
        <h3 style={{ marginBottom: 24 }}>Recovery Timeline</h3>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, overflowX: 'auto', padding: '0 8px' }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 90 }}>
                <div style={{
                  width: step.current ? 32 : 24,
                  height: step.current ? 32 : 24,
                  borderRadius: '50%',
                  background: step.done ? 'var(--teal)' : step.current ? 'var(--surface)' : 'var(--line)',
                  border: step.current ? '3px solid var(--teal)' : 'none',
                  display: 'grid',
                  placeItems: 'center',
                  transition: 'all 0.3s ease',
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>Discharge Summary</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setDischargeModal(true)}>
              <Eye size={14} /> View Full Document
            </button>
          </div>
          <div className="info-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
            <div className="info-item"><span className="info-label">Admission</span><span className="info-value">{formatDate(discharge.admissionDate)}</span></div>
            <div className="info-item"><span className="info-label">Discharge</span><span className="info-value">{formatDate(discharge.dischargeDate)}</span></div>
            <div className="info-item"><span className="info-label">Condition</span><span className="info-value" style={{ fontSize: 13 }}>{discharge.conditionAtDischarge.split('.')[0]}</span></div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <span className="info-label" style={{ display: 'block', marginBottom: 8 }}>Diagnosis</span>
            <p style={{ fontSize: 14, margin: 0 }}><strong>Primary:</strong> {discharge.diagnosis.primary}</p>
            {discharge.diagnosis.secondary && <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '4px 0 0' }}>Secondary: {discharge.diagnosis.secondary}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div>
              <span className="info-label" style={{ display: 'block', marginBottom: 8 }}>Wound Care Instructions</span>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: 13, color: 'var(--ink-soft)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {discharge.instructions.woundCare.slice(0, 3).map((inst, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8 }}>
                    <CheckCircle size={14} style={{ color: 'var(--teal)', flexShrink: 0, marginTop: 2 }} />
                    <span>{inst}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="info-label" style={{ display: 'block', marginBottom: 8 }}>Warning Signs</span>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: 13, color: 'var(--ink-soft)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {discharge.instructions.warningSigns.slice(0, 3).map((sign, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8 }}>
                    <AlertTriangle size={14} style={{ color: 'var(--alert)', flexShrink: 0, marginTop: 2 }} />
                    <span>{sign}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line-soft)' }}>
            <span className="info-label" style={{ display: 'block', marginBottom: 8 }}>Follow-up</span>
            <p style={{ fontSize: 14, margin: 0 }}>{formatDate(discharge.followUp.date)} · {discharge.followUp.department} · {discharge.followUp.physician}</p>
          </div>
        </div>
      ) : (
        <div className="card"><div className="empty-state">
          <div className="empty-state-icon"><FileText size={28} /></div>
          <h3>No discharge information</h3>
          <p>Discharge summary will appear here once the patient is discharged.</p>
        </div></div>
      )}
    </div>
  );
}

function ReportsTab({ reports, patient, reportModal, setReportModal, addToast }) {
  const typeColors = {
    'Blood Test': 'teal', 'Imaging': 'blue', 'Pre-operative': 'teal',
    'Pathology': 'amber', 'Microbiology': 'amber',
  };

  return reports.length === 0 ? (
    <div className="card"><div className="empty-state">
      <div className="empty-state-icon"><FileText size={28} /></div>
      <h3>No reports available yet</h3>
      <p>Reports uploaded by the care team will appear here.</p>
    </div></div>
  ) : (
    <div className="responsive-card-grid">
      {reports.map(report => (
        <div key={report.id} className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{report.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{formatDate(report.date)} · {report.department}</div>
            </div>
            <span className={`status-badge ${report.status === 'completed' ? 'completed' : 'monitor'}`} style={{ fontSize: 11 }}>
              <span className="status-dot" />
              {report.status === 'completed' ? 'Completed' : report.status}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 4 }}>
            <span className={`status-badge on-track`} style={{ fontSize: 11, marginBottom: 8, display: 'inline-flex' }}>{report.type}</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: 16 }}>{report.summary}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setReportModal(report)}>
              <Eye size={14} /> View Report
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => addToast('Report download simulated')}>
              <Download size={14} /> Download
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MedicationsTab({ medications }) {
  const active = medications.filter(m => m.status === 'active');
  const completed = medications.filter(m => m.status === 'completed');

  const timeSlotLabels = { morning: '☀️ Morning', afternoon: '🌤️ Afternoon', evening: '🌅 Evening', night: '🌙 Night' };

  return medications.length === 0 ? (
    <div className="card"><div className="empty-state">
      <div className="empty-state-icon"><Pill size={28} /></div>
      <h3>No medications prescribed</h3>
      <p>Prescribed medications will appear here.</p>
    </div></div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Daily Schedule */}
      <div className="card card-pad">
        <h3 style={{ marginBottom: 16 }}>Daily Medication Schedule</h3>
        <div className="responsive-card-grid">
          {['morning', 'afternoon', 'evening', 'night'].map(slot => {
            const slotMeds = active.filter(m => m.timeSlots.includes(slot));
            return (
              <div key={slot} style={{ padding: 16, background: 'var(--paper)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line-soft)' }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>{timeSlotLabels[slot]}</div>
                {slotMeds.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>No medications</div>
                ) : slotMeds.map(m => (
                  <div key={m.id} style={{ fontSize: 13, padding: '6px 0', borderTop: '1px solid var(--line-soft)' }}>
                    <div style={{ fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{m.dosage}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Medications */}
      <div className="card card-pad">
        <h3 style={{ marginBottom: 16 }}>Active Medications ({active.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {active.map(med => (
            <div key={med.id} style={{ padding: 16, border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', background: 'var(--surface-hover)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{med.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>{med.dosage} · {med.frequency}</div>
                </div>
                <span className="status-badge on-track" style={{ fontSize: 11 }}>Active</span>
              </div>
              <div className="info-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                <div className="info-item"><span className="info-label">Purpose</span><span className="info-value" style={{ fontSize: 13 }}>{med.purpose}</span></div>
                <div className="info-item"><span className="info-label">Started</span><span className="info-value" style={{ fontSize: 13 }}>{formatDateShort(med.startDate)}</span></div>
                <div className="info-item"><span className="info-label">Until</span><span className="info-value" style={{ fontSize: 13 }}>{med.endDate ? formatDateShort(med.endDate) : 'Ongoing'}</span></div>
              </div>
              {med.instructions && (
                <div style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-soft)', fontStyle: 'italic' }}>
                  ℹ️ {med.instructions}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {completed.length > 0 && (
        <div className="card card-pad">
          <h3 style={{ marginBottom: 16 }}>Completed Medications ({completed.length})</h3>
          {completed.map(med => (
            <div key={med.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--line-soft)', opacity: 0.7 }}>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{med.name} — {med.dosage}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{med.purpose} · {formatDateShort(med.startDate)} – {formatDateShort(med.endDate)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecoveryTab({ checkins, painChartData, expandedCheckin, setExpandedCheckin, tasks = [] }) {
  const completionRate = Math.round((checkins.length / (checkins.length > 0 ? checkins[0].recoveryDay : 1)) * 100);
  const tasksDone = tasks.filter(t => t.done).length;

  return checkins.length === 0 ? (
    <div className="card"><div className="empty-state">
      <div className="empty-state-icon"><ClipboardList size={28} /></div>
      <h3>No check-ins yet</h3>
      <p>Patient check-in history will appear here once they submit their first recovery check-in.</p>
    </div></div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Charts */}
      <div className="grid-2">
        <div className="card card-pad">
          <h3 style={{ marginBottom: 20 }}>Pain Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={painChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--ink-muted)' }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: 'var(--ink-muted)' }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--line)', boxShadow: 'var(--shadow-md)' }} />
              <Line type="monotone" dataKey="pain" stroke="var(--teal-deep)" strokeWidth={2.5} dot={{ fill: 'var(--teal-deep)', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card card-pad">
          <h3 style={{ marginBottom: 16 }}>Recovery Summary</h3>
          <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ textAlign: 'center', padding: 16, background: 'var(--teal-pale)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, color: 'var(--teal-deep)' }}>{checkins.length}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>Check-ins Completed</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: 'var(--paper)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, color: 'var(--teal-deep)' }}>{tasksDone}/{tasks.length}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>Today's Tasks Done</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: 'var(--paper)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, color: getPainColor(checkins[0].pain) }}>{checkins[0].pain}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>Current Pain</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: 'var(--paper)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, color: 'var(--ink)' }}>{checkins[checkins.length - 1].pain}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>Highest Pain</div>
            </div>
          </div>
        </div>
      </div>

      {/* Check-in History */}
      <div className="card card-pad">
        <h3 style={{ marginBottom: 16 }}>Check-in History</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {checkins.map(checkin => (
            <div key={checkin.id} style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <button
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, width: '100%', padding: '14px 16px', background: expandedCheckin === checkin.id ? 'var(--surface-hover)' : 'var(--surface)', cursor: 'pointer', border: 'none', textAlign: 'left' }}
                onClick={() => setExpandedCheckin(expandedCheckin === checkin.id ? null : checkin.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, minWidth: 70 }}>Day {checkin.recoveryDay}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{formatDateShort(checkin.date)}</div>
                  <div style={{ fontWeight: 600, color: getPainColor(checkin.pain), fontSize: 13 }}>Pain: {checkin.pain}/10</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {checkin.symptoms.slice(0, 2).map(s => (
                      <span key={s} className="status-badge monitor" style={{ fontSize: 11, padding: '2px 8px' }}>{getSymptomLabel(s)}</span>
                    ))}
                  </div>
                  {checkin.hasPhoto && <Camera size={14} style={{ color: 'var(--teal)' }} />}
                </div>
                {expandedCheckin === checkin.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {expandedCheckin === checkin.id && (
                <div style={{ padding: '16px', borderTop: '1px solid var(--line-soft)', animation: 'slideDown 0.2s ease' }}>
                  <div className="info-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div className="info-item"><span className="info-label">Condition</span><span className="info-value" style={{ fontSize: 13 }}>{getConditionLabel(checkin.generalCondition)}</span></div>
                    <div className="info-item"><span className="info-label">Activity</span><span className="info-value" style={{ fontSize: 13 }}>{getActivityLabel(checkin.activityLevel)}</span></div>
                    <div className="info-item"><span className="info-label">Temperature</span><span className="info-value" style={{ fontSize: 13 }}>{checkin.temperature}°F</span></div>
                  </div>
                  {checkin.symptoms.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <span className="info-label" style={{ display: 'block', marginBottom: 6 }}>Symptoms</span>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {checkin.symptoms.map(s => <span key={s} className="status-badge monitor" style={{ fontSize: 11 }}>{getSymptomLabel(s)}</span>)}
                      </div>
                    </div>
                  )}
                  {checkin.notes && (
                    <div style={{ marginTop: 12 }}>
                      <span className="info-label" style={{ display: 'block', marginBottom: 6 }}>Notes</span>
                      <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0, lineHeight: 1.6 }}>{checkin.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WoundTab({ checkins }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [compareMode, setCompareMode] = useState('first');
  const photosCheckins = checkins.filter(c => c.hasPhoto);

  const latestPhoto = photosCheckins[0];
  const earliestPhoto = photosCheckins.length > 0 ? photosCheckins[photosCheckins.length - 1] : null;
  const beforeLatestPhoto = photosCheckins.length > 1 ? photosCheckins[1] : earliestPhoto;

  let leftPhoto = earliestPhoto;
  let leftLabel = `First Pic (Day ${earliestPhoto?.recoveryDay})`;
  let leftSubtitle = 'Initial post-op baseline';

  if (compareMode === 'before-latest') {
    leftPhoto = beforeLatestPhoto;
    leftLabel = `Before Latest (Day ${beforeLatestPhoto?.recoveryDay})`;
    leftSubtitle = 'Prior day check-in';
  } else if (compareMode.startsWith('day-')) {
    const targetId = compareMode.replace('day-', '');
    const found = photosCheckins.find(c => c.id === targetId);
    if (found) {
      leftPhoto = found;
      leftLabel = `Day ${found.recoveryDay} Pic`;
      leftSubtitle = `Check-in on ${formatDateShort(found.date)}`;
    }
  }

  const painDelta = (leftPhoto && latestPhoto) ? (latestPhoto.pain - leftPhoto.pain) : 0;
  const daysHealed = (leftPhoto && latestPhoto) ? (latestPhoto.recoveryDay - leftPhoto.recoveryDay) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {photosCheckins.length > 0 && (
        <div className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Wound Photo History</h3>
            <span className="status-badge on-track" style={{ fontSize: 12 }}>
              {photosCheckins.length} Clinical Images Logged
            </span>
          </div>
          <div className="responsive-card-grid">
            {photosCheckins.map(checkin => (
              <div key={checkin.id} style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <div
                  style={{ height: 180, background: 'var(--teal-pale)', overflow: 'hidden', display: 'grid', placeItems: 'center', cursor: 'pointer', position: 'relative' }}
                  onClick={() => setSelectedPhoto(checkin)}
                >
                  {checkin.photoUrl ? (
                    <img
                      src={checkin.photoUrl}
                      alt={`Day ${checkin.recoveryDay} wound photo`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--teal)' }}>
                      <Camera size={32} />
                      <div style={{ fontSize: 12, marginTop: 8 }}>Wound Photo</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Day {checkin.recoveryDay}</div>
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>
                    Click to inspect
                  </div>
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Recovery Day {checkin.recoveryDay}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>{formatDateShort(checkin.date)} · Pain: {checkin.pain}/10</div>
                  <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>{checkin.photoDescription}</p>
                  {checkin.symptoms.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                      {checkin.symptoms.map(s => <span key={s} className="status-badge monitor" style={{ fontSize: 11, padding: '2px 8px' }}>{getSymptomLabel(s)}</span>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison View */}
      {photosCheckins.length >= 2 && (
        <div className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0 }}>Wound Comparison</h3>
                <span className="status-badge" style={{ background: 'var(--teal-pale)', color: 'var(--teal-deep)', fontSize: 11, fontWeight: 600 }}>
                  Side-by-Side Progression
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-soft)' }}>
                Compare wound recovery against the latest photo (Day {latestPhoto?.recoveryDay})
              </p>
            </div>

            {/* Single Dropdown with all options: First Pic, Before Latest, and other days */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--paper)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', flexWrap: 'wrap' }}>
              <label htmlFor="compare-from-select" style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                Compare From:
              </label>
              <select
                id="compare-from-select"
                value={compareMode}
                onChange={(e) => setCompareMode(e.target.value)}
                style={{
                  padding: '7px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--teal)',
                  background: '#fff',
                  color: 'var(--teal-deep)',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: 220
                }}
              >
                <option value="first">
                  First Pic (Day {earliestPhoto?.recoveryDay} - Earliest Baseline)
                </option>
                <option value="before-latest">
                  Before Latest (Day {beforeLatestPhoto?.recoveryDay} - Prior Check-in)
                </option>
                {photosCheckins
                  .filter(c => c.id !== latestPhoto?.id && c.id !== earliestPhoto?.id && c.id !== beforeLatestPhoto?.id)
                  .map(c => (
                    <option key={c.id} value={`day-${c.id}`}>
                      Day {c.recoveryDay} ({formatDateShort(c.date)}) — Pain: {c.pain}/10
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Comparison Cards: Left (First / Before-latest) vs Right (Latest) */}
          <div className="wound-compare-grid">
            {/* Left Card */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              padding: 16,
              background: 'var(--paper)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--line)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                    {leftLabel}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                    {leftSubtitle} · {leftPhoto ? formatDateShort(leftPhoto.date) : ''}
                  </div>
                </div>
                <span className="status-badge" style={{ background: '#fff', border: '1px solid var(--line)', fontSize: 11, fontWeight: 600 }}>
                  Pain: {leftPhoto?.pain}/10
                </span>
              </div>

              <div
                style={{
                  height: 180,
                  background: 'var(--teal-pale)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  border: '1px solid var(--line)'
                }}
                onClick={() => leftPhoto && setSelectedPhoto(leftPhoto)}
              >
                {leftPhoto?.photoUrl ? (
                  <img
                    src={leftPhoto.photoUrl}
                    alt={leftLabel}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--teal)' }}>
                    <Camera size={28} />
                    <div style={{ fontSize: 12, marginTop: 6 }}>No photo image</div>
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>
                  Click to inspect
                </div>
              </div>

              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.5, flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>Notes:</div>
                <div>{leftPhoto?.photoDescription || leftPhoto?.notes || 'No description provided.'}</div>
                {leftPhoto?.symptoms?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                    {leftPhoto.symptoms.map(s => <span key={s} className="status-badge monitor" style={{ fontSize: 10, padding: '1px 6px' }}>{getSymptomLabel(s)}</span>)}
                  </div>
                )}
              </div>
            </div>

            {/* Middle Divider */}
            <div className="wound-compare-divider" style={{ gap: 10 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'var(--teal-deep)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                fontSize: 12,
                boxShadow: 'var(--shadow-sm)'
              }}>
                VS
              </div>
              <div style={{
                background: painDelta <= 0 ? 'rgba(46, 125, 50, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                color: painDelta <= 0 ? '#2e7d32' : '#d32f2f',
                border: `1px solid ${painDelta <= 0 ? '#a5d6a7' : '#ffcdd2'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '4px 8px',
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                textAlign: 'center'
              }}>
                {painDelta < 0 ? `Pain: ${painDelta} pts` : painDelta === 0 ? 'Pain: Unchanged' : `Pain: +${painDelta} pts`}
              </div>
              {daysHealed > 0 && (
                <div style={{ fontSize: 11, color: 'var(--ink-muted)', textAlign: 'center', fontWeight: 600 }}>
                  +{daysHealed} Days<br/>Healing
                </div>
              )}
            </div>

            {/* Right Card: Latest */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              padding: 16,
              background: 'var(--paper)',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid var(--teal)',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                    Latest (Day {latestPhoto?.recoveryDay})
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                    Most recent check-in · {latestPhoto ? formatDateShort(latestPhoto.date) : ''}
                  </div>
                </div>
                <span className="status-badge on-track" style={{ fontSize: 11, fontWeight: 600 }}>
                  Pain: {latestPhoto?.pain}/10
                </span>
              </div>

              <div
                style={{
                  height: 180,
                  background: 'var(--teal-pale)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  border: '1px solid var(--line)'
                }}
                onClick={() => latestPhoto && setSelectedPhoto(latestPhoto)}
              >
                {latestPhoto?.photoUrl ? (
                  <img
                    src={latestPhoto.photoUrl}
                    alt={`Latest photo Day ${latestPhoto.recoveryDay}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--teal)' }}>
                    <Camera size={28} />
                    <div style={{ fontSize: 12, marginTop: 6 }}>No photo image</div>
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>
                  Click to inspect
                </div>
              </div>

              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.5, flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>Notes:</div>
                <div>{latestPhoto?.photoDescription || latestPhoto?.notes || 'No description provided.'}</div>
                {latestPhoto?.symptoms?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                    {latestPhoto.symptoms.map(s => <span key={s} className="status-badge monitor" style={{ fontSize: 10, padding: '1px 6px' }}>{getSymptomLabel(s)}</span>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for inspecting wound photos */}
      {selectedPhoto && (
        <Modal
          isOpen={Boolean(selectedPhoto)}
          onClose={() => setSelectedPhoto(null)}
          title={`Clinical Wound Inspection — Day ${selectedPhoto.recoveryDay}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: 420, background: '#0f172a' }}>
              <img
                src={selectedPhoto.photoUrl}
                alt="Wound inspection full view"
                style={{ width: '100%', maxHeight: 420, objectFit: 'contain' }}
              />
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              <div><strong>Recorded:</strong> {formatDate(selectedPhoto.date)} (Recovery Day {selectedPhoto.recoveryDay})</div>
              <div><strong>Reported Pain:</strong> {selectedPhoto.pain}/10</div>
              {selectedPhoto.symptoms?.length > 0 && (
                <div><strong>Reported Symptoms:</strong> {selectedPhoto.symptoms.map(s => getSymptomLabel(s)).join(', ')}</div>
              )}
              {selectedPhoto.photoDescription && (
                <div style={{ marginTop: 6 }}>
                  <strong>Notes / Clinical Observations:</strong> {selectedPhoto.photoDescription}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedPhoto(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* AI Placeholder */}
      <div className="attention-card info">
        <div className="attention-card-icon" style={{ color: 'var(--info)' }}>
          <Activity size={18} />
        </div>
        <div className="attention-card-content">
          <h4 style={{ color: 'var(--info)', fontFamily: 'var(--font-sans)' }}>Future AI Assistance</h4>
          <p style={{ color: 'var(--ink-soft)' }}>
            AI-assisted wound image analysis could be integrated here to help identify visual changes for clinician review. This feature would compare wound images over time and highlight areas of change.
          </p>
        </div>
      </div>
    </div>
  );
}

function TimelineTab({ timeline }) {
  const typeIcons = {
    'checkin': ClipboardList, 'photo': Camera, 'report': FileText,
    'note': MessageSquare, 'discharge': Building, 'surgery': Activity,
    'admission': Building, 'follow-up': CalendarCheck,
  };
  const typeColors = {
    'checkin': 'var(--teal)', 'photo': 'var(--info)', 'report': 'var(--status-monitor)',
    'note': 'var(--ink-soft)', 'discharge': 'var(--status-on-track)', 'surgery': 'var(--teal-deep)',
    'admission': 'var(--ink-soft)', 'follow-up': 'var(--info)',
  };

  return timeline.length === 0 ? (
    <div className="card"><div className="empty-state">
      <div className="empty-state-icon"><Clock size={28} /></div>
      <h3>No timeline events</h3>
      <p>Patient journey events will appear here.</p>
    </div></div>
  ) : (
    <div className="card card-pad">
      <h3 style={{ marginBottom: 24 }}>Patient Journey</h3>
      <div style={{ position: 'relative', paddingLeft: 32 }}>
        <div style={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 2, background: 'var(--line)' }} />
        {timeline.map((event, i) => {
          const Icon = typeIcons[event.type] || Clock;
          const color = typeColors[event.type] || 'var(--ink-soft)';
          return (
            <div key={event.id} style={{ position: 'relative', paddingBottom: i < timeline.length - 1 ? 24 : 0 }}>
              <div style={{
                position: 'absolute', left: -32, width: 24, height: 24,
                borderRadius: '50%', background: 'var(--surface)', border: `2px solid ${color}`,
                display: 'grid', placeItems: 'center', zIndex: 1,
              }}>
                <Icon size={12} style={{ color }} />
              </div>
              <div style={{ paddingLeft: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{event.title}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 4 }}>{formatDate(event.date)}</div>
                <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>{event.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FollowUpTab({ followUps, careNotes, noteText, setNoteText, handleAddNote, onOpenAddAppointment }) {
  return (
    <div className="grid-2">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ margin: 0 }}>Follow-up Appointments</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-soft)' }}>
                Scheduled clinical consultations and post-op evaluations
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onOpenAddAppointment}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={15} /> Schedule Appointment
            </button>
          </div>

          {followUps.length === 0 ? (
            <div className="empty-state" style={{ padding: 24, textAlign: 'center' }}>
              <CalendarCheck size={32} style={{ color: 'var(--teal)', margin: '0 auto 8px' }} />
              <p style={{ color: 'var(--ink-soft)', fontSize: 14, margin: '0 0 12px' }}>No follow-up appointments currently scheduled.</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onOpenAddAppointment}
              >
                <Plus size={14} /> Schedule First Appointment
              </button>
            </div>
          ) : (
            followUps.map(apt => (
              <div key={apt.id} style={{ padding: 16, border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', marginBottom: 12, background: 'var(--surface-hover)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{formatDate(apt.date)}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>
                      {apt.time} · {apt.type || 'Clinic In-Person Visit'}
                    </div>
                  </div>
                  <span className={`status-badge ${apt.status === 'upcoming' ? 'monitor' : 'completed'}`} style={{ fontSize: 11 }}>
                    <span className="status-dot" />
                    {apt.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 4 }}>
                  <strong>Provider:</strong> {apt.physician} ({apt.department})
                </div>
                {apt.location && (
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={13} style={{ color: 'var(--teal)' }} /> {apt.location}
                  </div>
                )}
                <div style={{ fontSize: 13, color: 'var(--ink)', marginTop: 8 }}>
                  <strong>Reason:</strong> {apt.reason}
                </div>
                {apt.notes && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--paper)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line-soft)', fontSize: 12, color: 'var(--ink-soft)' }}>
                    <strong>Patient Instructions:</strong> {apt.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Add Note */}
        <div className="card card-pad">
          <h3 style={{ marginBottom: 16 }}>
            <MessageSquare size={18} style={{ display: 'inline', verticalAlign: '-3px', marginRight: 8 }} />
            Care Team Notes
          </h3>
          <div style={{ marginBottom: 16 }}>
            <textarea
              className="form-textarea"
              placeholder="Add an internal note about this patient's recovery..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              style={{ minHeight: 80 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>🔒 Internal note — not visible to patient</span>
              <button className="btn btn-primary btn-sm" onClick={handleAddNote} disabled={!noteText.trim()}>
                <Send size={14} /> Add Note
              </button>
            </div>
          </div>

          {careNotes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--line-soft)', paddingTop: 16 }}>
              {careNotes.map(note => (
                <div key={note.id} style={{ padding: 14, background: 'var(--paper)', borderRadius: 'var(--radius-md)', border: '1px solid var(--line-soft)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{note.author}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{formatDateShort(note.date)} {note.time}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 6 }}>{note.role} · Internal Note</div>
                  <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0, lineHeight: 1.6 }}>{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MODAL CONTENT COMPONENTS
// ═══════════════════════════════════════════════

function DischargeDocument({ patient, discharge }) {
  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Document Header */}
      <div style={{ textAlign: 'center', paddingBottom: 20, borderBottom: '2px solid var(--teal)', marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--teal-deep)', letterSpacing: '-0.02em' }}>
          {discharge.hospital}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>Department of {discharge.department}</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginTop: 12, color: 'var(--ink)' }}>Discharge Summary</div>
      </div>

      {/* Patient Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20, padding: 16, background: 'var(--paper)', borderRadius: 'var(--radius-md)' }}>
        <div><strong style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Patient:</strong> <span style={{ fontSize: 14 }}>{getPatientFullName(patient)}</span></div>
        <div><strong style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Patient ID:</strong> <span style={{ fontSize: 14 }}>{patient.id}</span></div>
        <div><strong style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Age/Gender:</strong> <span style={{ fontSize: 14 }}>{patient.age}y / {patient.gender}</span></div>
        <div><strong style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Physician:</strong> <span style={{ fontSize: 14 }}>{discharge.admittingPhysician}</span></div>
        <div><strong style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Admission:</strong> <span style={{ fontSize: 14 }}>{formatDate(discharge.admissionDate)}</span></div>
        <div><strong style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Discharge:</strong> <span style={{ fontSize: 14 }}>{formatDate(discharge.dischargeDate)}</span></div>
      </div>

      <Section title="Diagnosis">
        <p><strong>Primary:</strong> {discharge.diagnosis.primary}</p>
        {discharge.diagnosis.secondary && <p><strong>Secondary:</strong> {discharge.diagnosis.secondary}</p>}
      </Section>

      <Section title="Procedure">
        <p>{discharge.procedure.name} — {formatDate(discharge.procedure.date)} — {discharge.procedure.surgeon}</p>
      </Section>

      <Section title="Hospital Course">
        <p style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>{discharge.hospitalCourse}</p>
      </Section>

      <Section title="Condition at Discharge">
        <p>{discharge.conditionAtDischarge}</p>
      </Section>

      <Section title="Discharge Instructions">
        <InstructionBlock label="Wound Care" items={discharge.instructions.woundCare} />
        <InstructionBlock label="Activity Restrictions" items={discharge.instructions.activityRestrictions} />
        <InstructionBlock label="Diet" items={discharge.instructions.diet} />
        <InstructionBlock label="Hygiene" items={discharge.instructions.hygiene} />
        <InstructionBlock label="Warning Signs — Seek Immediate Medical Attention" items={discharge.instructions.warningSigns} isWarning />
        <InstructionBlock label="Follow-up" items={discharge.instructions.followUpInstructions} />
      </Section>

      <Section title="Follow-up Appointment">
        <p><strong>Date:</strong> {formatDate(discharge.followUp.date)}<br />
        <strong>Department:</strong> {discharge.followUp.department}<br />
        <strong>Physician:</strong> {discharge.followUp.physician}<br />
        <strong>Purpose:</strong> {discharge.followUp.notes}</p>
      </Section>

      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--line)', fontSize: 12, color: 'var(--ink-muted)', textAlign: 'center' }}>
        Discharged by {discharge.dischargedBy} · {discharge.hospital} · {formatDate(discharge.dischargeDate)}
      </div>
    </div>
  );
}

function ReportDocument({ report, patient }) {
  return (
    <div>
      <div style={{ padding: 16, background: 'var(--paper)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
        <div className="info-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <div><strong style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Patient:</strong> <span style={{ fontSize: 14 }}>{getPatientFullName(patient)}</span></div>
          <div><strong style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Patient ID:</strong> <span style={{ fontSize: 14 }}>{patient.id}</span></div>
          <div><strong style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Date:</strong> <span style={{ fontSize: 14 }}>{formatDate(report.date)}</span></div>
          <div><strong style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Department:</strong> <span style={{ fontSize: 14 }}>{report.department}</span></div>
          <div><strong style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Ordered by:</strong> <span style={{ fontSize: 14 }}>{report.orderedBy}</span></div>
          <div><strong style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Type:</strong> <span style={{ fontSize: 14 }}>{report.type}</span></div>
        </div>
      </div>

      {report.results && report.results.length > 0 && (
        <>
          <h4 style={{ marginBottom: 12 }}>Results</h4>
          <div className="table-responsive">
            <table className="data-table" style={{ marginBottom: 20 }}>
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Result</th>
                  <th>Unit</th>
                  <th>Reference Range</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.results.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{r.test}</td>
                    <td style={{ fontWeight: 600 }}>{r.value}</td>
                    <td style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{r.unit}</td>
                    <td style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{r.range || '—'}</td>
                    <td>
                      <span className={`status-badge ${r.status === 'normal' ? 'on-track' : r.status === 'high' ? 'needs-review' : 'monitor'}`} style={{ fontSize: 11 }}>
                        {r.status === 'normal' ? 'Normal' : r.status === 'high' ? 'High' : r.status === 'abnormal' ? 'Abnormal' : r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {report.interpretation && (
        <>
          <h4 style={{ marginBottom: 8 }}>Interpretation</h4>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--ink-soft)', padding: 16, background: 'var(--paper)', borderRadius: 'var(--radius-md)', border: '1px solid var(--line-soft)' }}>
            {report.interpretation}
          </p>
        </>
      )}

      <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid var(--line-soft)', fontSize: 13, color: 'var(--ink-muted)' }}>
        {report.clinician}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h4 style={{ borderBottom: '1px solid var(--line-soft)', paddingBottom: 8, marginBottom: 12 }}>{title}</h4>
      <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)' }}>{children}</div>
    </div>
  );
}

function InstructionBlock({ label, items, isWarning = false }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: isWarning ? 'var(--status-needs-review)' : 'var(--ink)', marginBottom: 6 }}>{label}</div>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13 }}>
            {isWarning ? <AlertTriangle size={14} style={{ color: 'var(--alert)', flexShrink: 0, marginTop: 2 }} /> : <CheckCircle size={14} style={{ color: 'var(--teal)', flexShrink: 0, marginTop: 2 }} />}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
