// =====================================================
// IncisionCare — Utility Functions
// =====================================================

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return '';
  const formatted = formatDate(dateStr);
  return timeStr ? `${formatted} at ${timeStr}` : formatted;
}

export function getRecoveryDay(surgeryDate) {
  const surgery = new Date(surgeryDate + 'T00:00:00');
  const today = new Date('2024-09-22T00:00:00'); // Fixed date for prototype
  const diff = Math.floor((today - surgery) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

export function calculateDynamicRecovery(patient, tasks = [], checkins = []) {
  if (!patient) {
    return {
      percentage: 0,
      baselineScore: 0,
      taskScore: 0,
      painScore: 0,
      stabilityScore: 0,
      completedTasks: 0,
      totalTasks: 0,
      currentPain: 3,
      breakdown: []
    };
  }

  const expectedDays = Math.max(1, patient.surgery?.expectedRecoveryDays || 14);
  const recoveryDay = Math.max(1, patient.recoveryDay || 1);

  // 1. Biological healing timeline baseline (up to 50% max)
  const timelineProgress = Math.min(1, Math.max(0, recoveryDay / expectedDays));
  const baselineScore = Number((timelineProgress * 50).toFixed(1));

  // 2. Today's task adherence & care plan compliance (up to 24% max)
  const taskList = Array.isArray(tasks) ? tasks : [];
  const completedTasks = taskList.filter(t => t.done).length;
  // If tasks exist, score proportionally. If no tasks defined, give neutral 12 pts (50%).
  const taskRatio = taskList.length > 0 ? (completedTasks / taskList.length) : 0.5;
  const taskScore = Number((taskRatio * 24).toFixed(1));

  // 3. Pain management & comfort index (up to 14% max)
  const latestCheckin = Array.isArray(checkins) && checkins.length > 0 ? checkins[0] : null;
  const currentPain = latestCheckin?.pain != null 
    ? Number(latestCheckin.pain) 
    : (patient.currentPain != null ? Number(patient.currentPain) : 3);
  const painRatio = Math.max(0, Math.min(1, (10 - currentPain) / 10));
  const painScore = Number((painRatio * 14).toFixed(1));

  // 4. Clinical stability & check-in compliance (up to 12% max)
  let stabilityRatio = 1.0;
  if (latestCheckin?.symptoms && Array.isArray(latestCheckin.symptoms)) {
    const hasSevere = latestCheckin.symptoms.some(s => 
      ['fever', 'fever-chills', 'discharge', 'pus-discharge', 'foul-odor', 'severe-pain', 'heavy-drainage', 'wound-reopening'].includes(s)
    );
    if (hasSevere) {
      stabilityRatio = 0.35;
    } else if (latestCheckin.symptoms.length > 2) {
      stabilityRatio = 0.7;
    }
  }
  const stabilityScore = Number((stabilityRatio * 12).toFixed(1));

  const totalRaw = baselineScore + taskScore + painScore + stabilityScore;
  const percentage = Math.min(100, Math.max(5, Math.round(totalRaw)));

  return {
    percentage,
    baselineScore,
    taskScore,
    painScore,
    stabilityScore,
    completedTasks,
    totalTasks: taskList.length,
    currentPain,
    breakdown: [
      {
        id: 'timeline',
        label: 'Timeline Progress',
        score: Math.round(baselineScore),
        max: 50,
        pct: Math.round((baselineScore / 50) * 100),
        detail: `Day ${recoveryDay} of ${expectedDays} (${Math.round(timelineProgress * 100)}% of expected healing period)`
      },
      {
        id: 'tasks',
        label: "Today's Care Plan & Tasks",
        score: Math.round(taskScore),
        max: 24,
        pct: Math.round((taskScore / 24) * 100),
        detail: `${completedTasks} of ${taskList.length} tasks completed today (${Math.round(taskRatio * 100)}%)`
      },
      {
        id: 'pain',
        label: 'Pain & Comfort Level',
        score: Math.round(painScore),
        max: 14,
        pct: Math.round((painScore / 14) * 100),
        detail: `Current pain: ${currentPain}/10 (${getPainLabel(currentPain)})`
      },
      {
        id: 'stability',
        label: 'Clinical Stability & Vitals',
        score: Math.round(stabilityScore),
        max: 12,
        pct: Math.round((stabilityScore / 12) * 100),
        detail: stabilityRatio >= 1.0 ? 'Check-in logged · No adverse complications' : 'Monitored symptoms logged'
      }
    ]
  };
}

export function getRecoveryPercentage(recoveryDay, expectedDays, tasks = null, checkins = null, patient = null) {
  if (tasks !== null || checkins !== null || patient !== null) {
    const dummyPatient = patient || { recoveryDay, surgery: { expectedRecoveryDays: expectedDays } };
    return calculateDynamicRecovery(dummyPatient, tasks || [], checkins || []).percentage;
  }
  return Math.min(100, Math.round((recoveryDay / expectedDays) * 100));
}

export function getPainLabel(pain) {
  if (pain === 0) return 'No pain';
  if (pain <= 2) return 'Mild';
  if (pain <= 4) return 'Moderate';
  if (pain <= 6) return 'Significant';
  if (pain <= 8) return 'Severe';
  return 'Very severe';
}

export function getPainColor(pain) {
  if (pain <= 2) return 'var(--status-on-track)';
  if (pain <= 4) return 'var(--teal)';
  if (pain <= 6) return 'var(--status-monitor)';
  return 'var(--status-needs-review)';
}

export function getStatusConfig(status) {
  const configs = {
    'on-track': {
      label: 'On Track',
      color: 'var(--status-on-track)',
      bg: 'var(--status-on-track-bg)',
      border: 'var(--status-on-track-border)',
    },
    'monitor': {
      label: 'Monitor',
      color: 'var(--status-monitor)',
      bg: 'var(--status-monitor-bg)',
      border: 'var(--status-monitor-border)',
    },
    'needs-review': {
      label: 'Needs Review',
      color: 'var(--status-needs-review)',
      bg: 'var(--status-needs-review-bg)',
      border: 'var(--status-needs-review-border)',
    },
    'completed': {
      label: 'Completed',
      color: 'var(--status-completed)',
      bg: 'var(--status-completed-bg)',
      border: 'var(--status-completed-bg)',
    },
  };
  return configs[status] || configs['on-track'];
}

export function getSymptomLabel(symptom) {
  const labels = {
    'redness': 'Redness',
    'mild-swelling': 'Swelling',
    'swelling': 'Swelling',
    'discharge': 'Discharge',
    'bleeding': 'Bleeding',
    'fever-chills': 'Fever / Chills',
    'increased-pain': 'Increased Pain',
    'wound-reopening': 'Wound Reopening',
    'unusual-smell': 'Unusual Smell',
    'nausea': 'Nausea',
    'soreness': 'Soreness',
    'other': 'Other',
  };
  return labels[symptom] || symptom;
}

export function getConditionLabel(condition) {
  const labels = {
    'feeling-better': 'Feeling Better',
    'about-the-same': 'About the Same',
    'feeling-worse': 'Feeling Worse',
  };
  return labels[condition] || condition;
}

export function getActivityLabel(activity) {
  const labels = {
    'walking-normally': 'Walking Normally',
    'limited-movement': 'Limited Movement',
    'mostly-resting': 'Mostly Resting',
  };
  return labels[activity] || activity;
}

export function getAppetiteLabel(appetite) {
  const labels = {
    'normal': 'Normal',
    'reduced': 'Reduced',
    'poor': 'Poor',
  };
  return labels[appetite] || appetite;
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}
