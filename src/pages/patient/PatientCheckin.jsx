import { useState, useRef } from 'react';
import { getPatientById } from '../../data/patients';
import { formatDate, formatDateShort, getPainColor, getSymptomLabel } from '../../utils/helpers';
import { useApp } from '../../context/AppContext';
import { SAMPLE_WOUND_PHOTOS } from '../../utils/woundAssets';
import Modal from '../../components/common/Modal';
import {
  ClipboardList, CheckCircle, Camera, Upload,
  Activity, Thermometer, ChevronDown, ChevronUp,
  Heart, Plus, Clock, FileText, Pill
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function PatientCheckin() {
  const { selectedPatientId, addToast, getCheckinsForPatient, addCheckin, markTaskDone } = useApp();
  const patient = getPatientById(selectedPatientId);
  const checkins = getCheckinsForPatient(selectedPatientId);

  // Check-in modal state
  const [showCheckin, setShowCheckin] = useState(false);
  const [pain, setPain] = useState(3);
  const [symptoms, setSymptoms] = useState([]);
  const [condition, setCondition] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoName, setPhotoName] = useState('');
  const [photoDesc, setPhotoDesc] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Expandable check-in item
  const [expandedId, setExpandedId] = useState(null);
  // Photo inspection lightbox
  const [inspectPhoto, setInspectPhoto] = useState(null);
  // Comparison selection
  const [compareMode, setCompareMode] = useState('first');

  if (!patient) return null;

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

  const painLabels = ['No pain', 'Minimal', 'Mild', 'Moderate', 'Moderate', 'Significant', 'Significant', 'Severe', 'Severe', 'Very severe', 'Worst pain'];

  const painChartData = [...checkins].reverse().map(c => ({
    day: `Day ${c.recoveryDay}`,
    pain: c.pain
  }));

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
      setPhotoUrl(ev.target?.result);
      setPhotoName(file.name);
      addToast(`Attached photo "${file.name}"`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUseSample = () => {
    const sample = SAMPLE_WOUND_PHOTOS[0];
    setPhotoUrl(sample.dataUrl);
    setPhotoName(sample.label);
    if (!photoDesc) setPhotoDesc(sample.description);
    addToast('Attached clinical wound photo.');
  };

  const handleSubmit = () => {
    addCheckin(selectedPatientId, {
      recoveryDay: patient.recoveryDay,
      pain,
      symptoms,
      condition,
      activityLevel,
      temperature,
      notes,
      photoUrl,
      photoDescription: photoDesc || (photoUrl ? 'Patient submitted wound photo with check-in.' : ''),
    });

    addToast('Recovery check-in submitted successfully! Your surgical care team has been updated.');
    setShowCheckin(false);
    markTaskDone(selectedPatientId, 'task-1', true);
    setPain(3); setSymptoms([]); setCondition(''); setActivityLevel(''); setTemperature(''); setNotes('');
    setPhotoUrl(null); setPhotoName(''); setPhotoDesc('');
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 6px', fontSize: 28 }}>Daily Recovery Check-ins</h1>
          <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 15 }}>
            Track daily pain levels, symptoms, and wound photos for Dr. Ananya Sen and your care team.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCheckin(true)}>
          <ClipboardList size={16} /> Complete Check-in
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Pain Trend Chart */}
        {checkins.length > 0 && (
          <div className="card card-pad">
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} style={{ color: 'var(--teal)' }} />
              Pain Recovery Trend Over Time
            </h3>
            <div style={{ height: 220, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={painChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--ink-muted)' }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: 'var(--ink-muted)' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', background: '#fff' }} />
                  <Line type="monotone" dataKey="pain" stroke="var(--teal-deep)" strokeWidth={2.5} dot={{ fill: 'var(--teal-deep)', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Wound Photo Comparison */}
        {photosCheckins.length >= 2 && (
          <div className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Camera size={18} style={{ color: 'var(--teal)' }} />
                    Wound Healing Comparison
                  </h3>
                  <span className="status-badge" style={{ background: 'var(--teal-pale)', color: 'var(--teal-deep)', fontSize: 11, fontWeight: 600 }}>
                    Visual Progress
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-soft)' }}>
                  See how your incision has improved compared to your latest photo (Day {latestPhoto?.recoveryDay})
                </p>
              </div>

              {/* Single Dropdown with all options: First Pic, Before Latest, and other days */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--paper)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', flexWrap: 'wrap' }}>
                <label htmlFor="patient-compare-from-select" style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  Compare From:
                </label>
                <select
                  id="patient-compare-from-select"
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

            {/* Comparison Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', gap: 16, alignItems: 'stretch' }}>
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
                  onClick={() => leftPhoto && setInspectPhoto(leftPhoto)}
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
                </div>
              </div>

              {/* Middle Divider */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '0 4px' }}>
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
                  onClick={() => latestPhoto && setInspectPhoto(latestPhoto)}
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
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Check-in History List */}
        <div className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} style={{ color: 'var(--teal)' }} />
              Past Check-in Submissions ({checkins.length})
            </h3>
            <span className="status-badge on-track" style={{ fontSize: 12 }}>
              Active Recovery
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {checkins.map(c => {
              const isExpanded = expandedId === c.id;
              return (
                <div
                  key={c.id}
                  style={{
                    border: '1px solid var(--line-soft)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                    padding: 16,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: 10 }}
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        background: 'var(--paper)',
                        border: '1px solid var(--line-soft)',
                        display: 'grid',
                        placeItems: 'center',
                        fontFamily: 'var(--font-serif)',
                        fontSize: 18,
                        color: getPainColor(c.pain)
                      }}>
                        {c.pain}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>
                          Recovery Day {c.recoveryDay} — Pain {c.pain}/10 ({painLabels[c.pain]})
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                          {formatDate(c.date)} · Temp: {c.temperature || '98.6'}°F
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {c.hasPhoto && (
                        <span className="status-badge on-track" style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Camera size={12} /> Photo Logged
                        </span>
                      )}
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-soft)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {c.notes && (
                        <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
                          <strong>Notes:</strong> {c.notes}
                        </div>
                      )}
                      {c.symptoms && c.symptoms.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 500 }}>Reported Symptoms:</span>
                          {c.symptoms.map(sym => (
                            <span key={sym} className="status-badge monitor" style={{ fontSize: 11 }}>
                              {getSymptomLabel(sym)}
                            </span>
                          ))}
                        </div>
                      )}
                      {c.hasPhoto && c.photoUrl && (
                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img
                            src={c.photoUrl}
                            alt="Wound check-in"
                            style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', border: '1px solid var(--line)' }}
                            onClick={() => setInspectPhoto(c)}
                          />
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: 12 }}
                            onClick={() => setInspectPhoto(c)}
                          >
                            View Wound Photo
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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

          {/* Temperature & Notes */}
          <div className="grid-2">
            <div>
              <label className="form-label">Temperature (°F) <small>Optional</small></label>
              <input type="text" className="form-input" placeholder="e.g., 98.6" value={temperature} onChange={e => setTemperature(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Additional Notes <small>Optional</small></label>
              <textarea className="form-textarea" placeholder="Any concerns or updates?" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            </div>
          </div>

          {/* Wound Photo Upload */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="form-label" style={{ margin: 0 }}>Wound Photo <small>Optional</small></label>
              {!photoUrl && (
                <button type="button" onClick={handleUseSample} style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
                  Use Sample Photo
                </button>
              )}
            </div>

            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
            <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />

            {!photoUrl ? (
              <div style={{ border: '2px dashed var(--line)', borderRadius: 'var(--radius-lg)', padding: 18, textAlign: 'center', background: 'var(--surface-hover)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <Camera size={22} style={{ color: 'var(--teal)' }} />
                <div style={{ fontSize: 13, color: 'var(--ink)' }}>Attach a photo of your incision for Dr. Sen</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={14} /> Choose File
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => cameraInputRef.current?.click()}>
                    <Camera size={14} /> Take Photo
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, background: 'var(--teal-pale)', borderRadius: 'var(--radius-md)' }}>
                <img src={photoUrl} alt="Wound preview" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }} />
                <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, color: 'var(--teal-deep)' }}>Photo Attached</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{photoName}</div>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" style={{ color: 'var(--alert)' }} onClick={() => setPhotoUrl(null)}>
                  Remove
                </button>
              </div>
            )}
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '14px 20px', fontSize: 16 }} onClick={handleSubmit}>
            Submit Check-in
          </button>
        </div>
      </Modal>

      {/* Lightbox inspection */}
      {inspectPhoto && (
        <Modal isOpen={Boolean(inspectPhoto)} onClose={() => setInspectPhoto(null)} title={`Wound Photo — Day ${inspectPhoto.recoveryDay}`} size="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: 380, background: '#000' }}>
              <img src={inspectPhoto.photoUrl} alt="Wound inspection" style={{ width: '100%', maxHeight: 380, objectFit: 'contain' }} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
              <div><strong>Date:</strong> {formatDate(inspectPhoto.date)}</div>
              <div><strong>Pain:</strong> {inspectPhoto.pain}/10</div>
              {inspectPhoto.photoDescription && <div style={{ marginTop: 4 }}><strong>Notes:</strong> {inspectPhoto.photoDescription}</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setInspectPhoto(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
