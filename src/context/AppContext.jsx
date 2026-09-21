import { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

import { patientGuidance as initialPatientGuidance, appointments as initialAppointments } from '../data/timeline';
import { checkins as initialCheckinsRaw } from '../data/checkins';
import { getPatientById, getPatientFullName } from '../data/patients';
import { SAMPLE_WOUND_PHOTOS } from '../utils/woundAssets';
import { formatDateShort } from '../utils/helpers';

// Enrich initial checkins so those with hasPhoto have a realistic clinical photoUrl
const enrichedInitialCheckins = Object.fromEntries(
  Object.entries(initialCheckinsRaw).map(([patId, list]) => [
    patId,
    list.map((c, idx) => ({
      ...c,
      photoUrl: c.photoUrl || (c.hasPhoto ? SAMPLE_WOUND_PHOTOS[idx % SAMPLE_WOUND_PHOTOS.length].dataUrl : null)
    }))
  ])
);

const INITIAL_TASKS = {
  'PT-2024-0847': [
    { id: 'task-1', text: 'Complete daily check-in', done: false, time: 'Morning', icon: 'clipboard' },
    { id: 'task-2', text: 'Take morning medications', done: true, time: '8:00 AM', icon: 'pill' },
    { id: 'task-3', text: 'Review wound care instructions', done: false, time: 'Afternoon', icon: 'file' },
    { id: 'task-4', text: 'Take a short walk', done: false, time: 'Evening', icon: 'activity' },
  ],
  'PT-2024-0923': [
    { id: 'task-1', text: 'Complete daily check-in', done: true, time: 'Morning', icon: 'clipboard' },
    { id: 'task-2', text: 'Take antibiotic (Cephalexin)', done: false, time: '8:00 AM', icon: 'pill' },
    { id: 'task-3', text: 'Inspect incision redness & log photo', done: true, time: 'Morning', icon: 'camera' },
    { id: 'task-4', text: 'Keep incision dry and elevated', done: true, time: 'All day', icon: 'activity' },
  ],
  'PT-2024-0834': [
    { id: 'task-1', text: 'Complete daily check-in (Overdue)', done: false, time: 'Morning', icon: 'clipboard' },
    { id: 'task-2', text: 'Take pain management medication', done: true, time: 'Morning', icon: 'pill' },
    { id: 'task-3', text: 'Physical therapy ankle flex exercises', done: false, time: 'Afternoon', icon: 'activity' },
    { id: 'task-4', text: 'Check dressing for drainage', done: false, time: 'Evening', icon: 'file' },
  ],
};

const DEFAULT_PATIENT_TASKS = [
  { id: 'task-1', text: 'Complete daily check-in', done: false, time: 'Morning', icon: 'clipboard' },
  { id: 'task-2', text: 'Take prescribed medications', done: false, time: 'Morning', icon: 'pill' },
  { id: 'task-3', text: 'Review wound care instructions', done: false, time: 'Afternoon', icon: 'file' },
  { id: 'task-4', text: 'Rest and light walking', done: false, time: 'Evening', icon: 'activity' },
];

const INITIAL_PATIENT_QUESTIONS = {
  'PT-2024-0847': [
    {
      id: 'Q-0847-02',
      patientId: 'PT-2024-0847',
      question: 'I feel a slight pulling and tightening around the navel incision when standing up straight. Is this normal healing or should I rest more?',
      category: 'Incision & Healing',
      urgency: 'routine',
      status: 'pending',
      askedAt: '2024-09-21T16:30:00',
      timeFormatted: 'Yesterday at 4:30 PM',
      response: null,
    },
    {
      id: 'Q-0847-01',
      patientId: 'PT-2024-0847',
      question: 'Can I shower with the waterproof dressing on, or should I wait until the steristrips come off?',
      category: 'Bathing & Wound Care',
      urgency: 'routine',
      status: 'answered',
      askedAt: '2024-09-18T10:15:00',
      timeFormatted: 'Sep 18, 2024 at 10:15 AM',
      response: {
        answeredBy: 'Dr. Ananya Sen',
        role: 'Attending General Surgeon',
        answeredAt: '2024-09-18T11:45:00',
        timeFormatted: 'Sep 18, 2024 at 11:45 AM',
        text: 'Yes, brief lukewarm showers are safe with your current waterproof dressing. Avoid direct forceful spray on the sites, pat gently dry with a clean towel, and do not submerge in a bathtub or pool.'
      }
    }
  ],
  'PT-2024-0923': [
    {
      id: 'Q-0923-01',
      patientId: 'PT-2024-0923',
      question: 'My blood glucose was 155 this morning after breakfast. Should I adjust my insulin timing around the antibiotic dose?',
      category: 'Medication & Blood Sugar',
      urgency: 'urgent',
      status: 'pending',
      askedAt: '2024-09-22T08:00:00',
      timeFormatted: 'Today at 8:00 AM',
      response: null,
    }
  ],
  'PT-2024-0834': [
    {
      id: 'Q-0834-01',
      patientId: 'PT-2024-0834',
      question: 'How many times per day should I be doing the ankle pump exercises?',
      category: 'Physical Therapy & Activity',
      urgency: 'routine',
      status: 'answered',
      askedAt: '2024-09-19T14:00:00',
      timeFormatted: 'Sep 19, 2024 at 2:00 PM',
      response: {
        answeredBy: 'Shreya Joshi, DPT',
        role: 'Physical Therapist',
        answeredAt: '2024-09-19T15:20:00',
        timeFormatted: 'Sep 19, 2024 at 3:20 PM',
        text: 'Aim for 10-15 ankle pumps every 1-2 hours while awake to encourage healthy venous return and prevent blood clots.'
      }
    }
  ]
};

export function AppProvider({ children }) {
  const [role, setRole] = useState('care-team'); // 'care-team' | 'patient'
  const [selectedPatientId, setSelectedPatientId] = useState('PT-2024-0847'); // Maya Sharma default
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [patientTasks, setPatientTasks] = useState(INITIAL_TASKS);
  const [allGuidance, setAllGuidance] = useState(initialPatientGuidance);
  const [allCheckins, setAllCheckins] = useState(enrichedInitialCheckins);
  const [allAppointments, setAllAppointments] = useState(initialAppointments);
  const [allQuestions, setAllQuestions] = useState(INITIAL_PATIENT_QUESTIONS);

  const toggleRole = useCallback(() => {
    setRole(r => r === 'care-team' ? 'patient' : 'care-team');
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getCheckinsForPatient = useCallback((patientId) => {
    return allCheckins[patientId] || [];
  }, [allCheckins]);

  const addCheckin = useCallback((patientId, checkinData) => {
    const hasPhoto = Boolean(checkinData.photoUrl);
    const newCheckin = {
      id: `CHK-${patientId.replace('PT-', '')}-${Date.now().toString().slice(-4)}`,
      patientId,
      date: new Date().toISOString().split('T')[0],
      recoveryDay: checkinData.recoveryDay || 8,
      pain: Number(checkinData.pain ?? 3),
      symptoms: checkinData.symptoms || [],
      generalCondition: checkinData.condition || checkinData.generalCondition || 'feeling-better',
      activityLevel: checkinData.activityLevel || 'walking-normally',
      appetite: checkinData.appetite || 'normal',
      temperature: checkinData.temperature || '98.6',
      notes: checkinData.notes || (hasPhoto ? 'Patient uploaded wound photo update.' : ''),
      hasPhoto,
      photoUrl: checkinData.photoUrl || null,
      photoDescription: checkinData.photoDescription || (hasPhoto ? 'Patient submitted incision photo for care team review.' : ''),
      createdAt: new Date().toISOString(),
    };

    setAllCheckins(prev => {
      const patientList = prev[patientId] || [];
      return {
        ...prev,
        [patientId]: [newCheckin, ...patientList]
      };
    });

    return newCheckin;
  }, []);

  const sendWoundPhoto = useCallback((patientId, photoData) => {
    const newCheckin = {
      id: `CHK-WND-${Date.now().toString().slice(-4)}`,
      patientId,
      date: new Date().toISOString().split('T')[0],
      recoveryDay: photoData.recoveryDay || 8,
      pain: Number(photoData.pain ?? 3),
      symptoms: photoData.symptoms || [],
      generalCondition: photoData.generalCondition || 'feeling-better',
      activityLevel: 'resting',
      appetite: 'normal',
      temperature: '98.6',
      notes: photoData.notes || 'Patient uploaded wound photo for care team review.',
      hasPhoto: true,
      photoUrl: photoData.photoUrl,
      photoDescription: photoData.photoDescription || photoData.notes || 'Incision site photo submitted by patient.',
      createdAt: new Date().toISOString(),
    };

    setAllCheckins(prev => {
      const patientList = prev[patientId] || [];
      return {
        ...prev,
        [patientId]: [newCheckin, ...patientList]
      };
    });

    addToast('Wound photo successfully sent to your Care Team! Dr. Ananya Sen and team have been notified.');
    return newCheckin;
  }, [addToast]);

  const getTasksForPatient = useCallback((patientId) => {
    return patientTasks[patientId] || DEFAULT_PATIENT_TASKS;
  }, [patientTasks]);

  const toggleTask = useCallback((patientId, taskId) => {
    setPatientTasks(prev => {
      const currentList = prev[patientId] || DEFAULT_PATIENT_TASKS;
      const updated = currentList.map(t => {
        if (t.id === taskId) {
          return { ...t, done: !t.done };
        }
        return t;
      });
      return { ...prev, [patientId]: updated };
    });
  }, []);

  const markTaskDone = useCallback((patientId, taskId, done = true) => {
    setPatientTasks(prev => {
      const currentList = prev[patientId] || DEFAULT_PATIENT_TASKS;
      const updated = currentList.map(t => {
        if (t.id === taskId) {
          return { ...t, done };
        }
        return t;
      });
      return { ...prev, [patientId]: updated };
    });
  }, []);

  const addTask = useCallback((patientId, taskData) => {
    const newTask = {
      id: `task-${Date.now()}`,
      text: taskData.text,
      time: taskData.time || 'Today',
      icon: taskData.icon || 'activity',
      done: false,
    };
    setPatientTasks(prev => {
      const currentList = prev[patientId] || DEFAULT_PATIENT_TASKS;
      return { ...prev, [patientId]: [...currentList, newTask] };
    });
    addToast(`Added new task: "${taskData.text}"`);
    return newTask;
  }, [addToast]);

  const getGuidanceForPatient = useCallback((patientId) => {
    return allGuidance[patientId] || {
      lastUpdated: new Date().toISOString().split('T')[0],
      updatedBy: 'Dr. Ananya Sen',
      items: []
    };
  }, [allGuidance]);

  const addGuidanceItem = useCallback((patientId, itemData) => {
    const newItem = {
      text: itemData.text,
      category: itemData.category || 'general',
      priority: itemData.priority || 'normal',
    };
    setAllGuidance(prev => {
      const current = prev[patientId] || {
        lastUpdated: new Date().toISOString().split('T')[0],
        updatedBy: 'Dr. Ananya Sen',
        items: []
      };
      return {
        ...prev,
        [patientId]: {
          ...current,
          lastUpdated: new Date().toISOString().split('T')[0],
          items: [newItem, ...current.items]
        }
      };
    });
    addToast(`Added patient guidance: "${itemData.text}"`);
    return newItem;
  }, [addToast]);

  const getAppointmentsForPatient = useCallback((patientId) => {
    return allAppointments.filter(a => a.patientId === patientId);
  }, [allAppointments]);

  const addAppointment = useCallback((patientId, aptData) => {
    const p = getPatientById(patientId);
    const resolvedName = (aptData.patientName && aptData.patientName !== 'Patient')
      ? aptData.patientName
      : (p ? getPatientFullName(p) : 'Patient');

    const newApt = {
      id: `APT-${Date.now().toString().slice(-4)}`,
      patientId,
      patientName: resolvedName,
      date: aptData.date || new Date().toISOString().split('T')[0],
      time: aptData.time || '10:00 AM',
      department: aptData.department || p?.surgery?.department || 'General Surgery',
      physician: aptData.physician || p?.careTeam?.[0]?.name || 'Dr. Ananya Sen',
      reason: aptData.reason || 'Post-operative follow-up',
      status: 'upcoming',
      type: aptData.type || 'In-Person Clinic Visit',
      location: aptData.location || 'Surgical Outpatient Pavilion, Suite 402',
      notes: aptData.notes || '',
      createdAt: new Date().toISOString(),
    };
    setAllAppointments(prev => [newApt, ...prev]);
    addToast(`Scheduled follow-up appointment for ${formatDateShort(newApt.date)} at ${newApt.time}!`);
    return newApt;
  }, [addToast]);

  const completeAppointment = useCallback((appointmentId) => {
    setAllAppointments(prev => prev.map(a => {
      if (a.id === appointmentId) {
        return { ...a, status: 'completed' };
      }
      return a;
    }));
    addToast('Follow-up appointment marked as completed');
  }, [addToast]);

  const getQuestionsForPatient = useCallback((patientId) => {
    return allQuestions[patientId] || [];
  }, [allQuestions]);

  const askPatientQuestion = useCallback((patientId, questionData) => {
    const newQ = {
      id: `Q-${patientId.replace('PT-', '')}-${Date.now().toString().slice(-4)}`,
      patientId,
      question: questionData.question || '',
      category: questionData.category || 'General Recovery',
      urgency: questionData.urgency || 'routine',
      status: 'pending',
      askedAt: new Date().toISOString(),
      timeFormatted: 'Just now',
      response: null,
    };

    setAllQuestions(prev => ({
      ...prev,
      [patientId]: [newQ, ...(prev[patientId] || [])]
    }));

    addToast('Your question has been sent directly to your care team! They have been alerted.', 'success');
    return newQ;
  }, [addToast]);

  const replyToPatientQuestion = useCallback((patientId, questionId, replyText, answeredBy = 'Dr. Ananya Sen', role = 'Attending Surgeon') => {
    setAllQuestions(prev => {
      const currentList = prev[patientId] || [];
      const updated = currentList.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            status: 'answered',
            response: {
              answeredBy,
              role,
              answeredAt: new Date().toISOString(),
              timeFormatted: 'Just now',
              text: replyText
            }
          };
        }
        return q;
      });
      return { ...prev, [patientId]: updated };
    });

    addToast('Clinical response sent to patient! Reflected on patient portal.', 'success');
  }, [addToast]);

  const resetDemoData = useCallback(() => {
    setPatientTasks(INITIAL_TASKS);
    setAllGuidance(initialPatientGuidance);
    setAllCheckins(enrichedInitialCheckins);
    setAllAppointments(initialAppointments);
    setAllQuestions(INITIAL_PATIENT_QUESTIONS);
    addToast('All demo data has been refreshed back to initial state!', 'info');
  }, [addToast]);

  return (
    <AppContext.Provider value={{
      role,
      setRole,
      toggleRole,
      selectedPatientId,
      setSelectedPatientId,
      sidebarOpen,
      setSidebarOpen,
      toasts,
      addToast,
      removeToast,
      patientTasks,
      getTasksForPatient,
      toggleTask,
      markTaskDone,
      addTask,
      getGuidanceForPatient,
      addGuidanceItem,
      allCheckins,
      getCheckinsForPatient,
      addCheckin,
      sendWoundPhoto,
      allAppointments,
      getAppointmentsForPatient,
      addAppointment,
      completeAppointment,
      allQuestions,
      getQuestionsForPatient,
      askPatientQuestion,
      replyToPatientQuestion,
      resetDemoData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
