// =====================================================
// IncisionCare — Mock Discharge Data
// =====================================================

export const discharges = {
  'PT-2024-0847': {
    patientId: 'PT-2024-0847',
    admissionDate: '2024-09-13',
    dischargeDate: '2024-09-15',
    hospital: 'Pacific Northwest Medical Center',
    department: 'General Surgery',
    admittingPhysician: 'Dr. Ananya Sen',
    diagnosis: {
      primary: 'Symptomatic Cholelithiasis (Gallstones)',
      secondary: 'Biliary colic with recurrent episodes',
    },
    procedure: {
      name: 'Laparoscopic Cholecystectomy',
      date: '2024-09-14',
      surgeon: 'Dr. Ananya Sen',
    },
    hospitalCourse: `Patient was admitted on September 13, 2024, for a planned laparoscopic cholecystectomy. Pre-operative assessment confirmed suitability for minimally invasive approach. The procedure was performed on September 14 without complications. Four small incisions were made in the upper right abdomen. Intraoperative cholangiogram demonstrated normal biliary anatomy with no evidence of common bile duct stones. The gallbladder was removed intact and sent for histopathological examination.

Post-operatively, the patient was monitored in the recovery unit. Vital signs remained stable. Pain was managed with IV acetaminophen and oral medications. The patient tolerated oral fluids and a light diet on the evening of surgery. Patient was ambulatory on post-operative day 1 with no signs of surgical site complications. Drain was not required. The patient was discharged in stable and improving condition on September 15.`,
    conditionAtDischarge: 'Stable, improving. Pain controlled with oral medications. Tolerating regular diet. Ambulating independently.',
    instructions: {
      woundCare: [
        'Keep surgical incision sites clean and dry for the first 48 hours.',
        'After 48 hours, you may gently wash the area with mild soap and water.',
        'Do not soak in a bathtub, hot tub, or swimming pool for 2 weeks.',
        'Steri-strips will fall off naturally within 7–10 days. Do not pull them off.',
        'Watch for signs of infection: increased redness, swelling, warmth, or drainage.',
      ],
      activityRestrictions: [
        'No heavy lifting (more than 10 pounds) for 2 weeks.',
        'Avoid strenuous exercise for 2 weeks.',
        'Light walking is encouraged to promote recovery.',
        'You may resume driving when you are no longer taking prescription pain medications and can comfortably wear a seatbelt.',
        'Gradually return to normal activities as tolerated.',
      ],
      diet: [
        'Start with light, easily digestible foods for the first few days.',
        'Gradually reintroduce fatty foods over the next 2–4 weeks.',
        'Stay well hydrated. Drink at least 8 glasses of water daily.',
        'Some patients experience temporary loose stools or bloating; this typically resolves within a few weeks.',
      ],
      hygiene: [
        'You may shower 48 hours after surgery. Pat incision sites dry.',
        'Avoid applying lotions, ointments, or creams to incisions unless directed.',
        'Wear loose, comfortable clothing to avoid irritating the incision sites.',
      ],
      warningSigns: [
        'Fever above 101°F (38.3°C)',
        'Severe or worsening abdominal pain not relieved by prescribed medications',
        'Persistent nausea or vomiting',
        'Redness, swelling, or drainage from incision sites',
        'Yellowing of the skin or eyes (jaundice)',
        'Difficulty breathing',
        'Inability to keep fluids down for more than 24 hours',
      ],
      followUpInstructions: [
        'Follow-up appointment scheduled for September 28, 2024.',
        'Contact the office if you have any concerns before your follow-up appointment.',
        'Bring a list of any new symptoms or questions to your follow-up visit.',
      ],
    },
    followUp: {
      date: '2024-09-28',
      department: 'General Surgery',
      physician: 'Dr. Ananya Sen',
      notes: 'Wound check, symptom review, pathology results discussion.',
    },
    dischargedBy: 'Dr. Ananya Sen',
    documents: ['Discharge Summary', 'Medication List', 'Follow-up Instructions', 'Wound Care Guide'],
  },
  'PT-2024-0923': {
    patientId: 'PT-2024-0923',
    admissionDate: '2024-09-15',
    dischargeDate: '2024-09-17',
    hospital: 'Pacific Northwest Medical Center',
    department: 'General Surgery',
    admittingPhysician: 'Dr. Vikram Malhotra',
    diagnosis: {
      primary: 'Right Inguinal Hernia',
      secondary: 'Type 2 Diabetes, Hypertension (managed)',
    },
    procedure: {
      name: 'Open Inguinal Hernia Repair with Mesh',
      date: '2024-09-16',
      surgeon: 'Dr. Vikram Malhotra',
    },
    hospitalCourse: `Patient was admitted for elective right inguinal hernia repair. Pre-operative blood glucose was well controlled (fasting 128 mg/dL). The open repair was performed using a polypropylene mesh. The procedure was completed without complications. Post-operative pain was managed with a multimodal approach given the patient's diabetes-related considerations.

The patient was monitored overnight. Blood glucose levels were stable throughout the post-operative period. The patient was ambulatory on post-operative day 1 and tolerated a regular diet. Wound inspection showed clean, dry incision with no signs of infection. The patient was discharged on September 17 in stable condition.`,
    conditionAtDischarge: 'Stable. Well-controlled blood glucose. Wound clean and dry.',
    instructions: {
      woundCare: [
        'Keep the incision clean and dry.',
        'Change dressing daily or as instructed.',
        'Monitor for signs of infection, especially given diabetes management.',
        'Do not remove sutures; they will be assessed at follow-up.',
      ],
      activityRestrictions: [
        'No heavy lifting (more than 15 pounds) for 4–6 weeks.',
        'Avoid straining during bowel movements. Use a stool softener if needed.',
        'Light walking encouraged from day one.',
        'No driving for 1 week or while on pain medications.',
      ],
      diet: [
        'Continue diabetic diet as prescribed.',
        'Stay well hydrated.',
        'High-fiber foods recommended to prevent constipation.',
      ],
      hygiene: [
        'Shower gently after 48 hours. Pat dry.',
        'Avoid soaking the wound.',
      ],
      warningSigns: [
        'Fever above 100.4°F (38°C)',
        'Increased swelling, redness, or warmth at the incision',
        'Foul-smelling drainage from the wound',
        'Severe pain not controlled by medication',
        'Blood glucose levels consistently above 250 mg/dL',
      ],
      followUpInstructions: [
        'Follow-up appointment on September 25, 2024.',
        'Continue all diabetes and hypertension medications as prescribed.',
        'Monitor blood glucose more frequently during recovery.',
      ],
    },
    followUp: {
      date: '2024-09-25',
      department: 'General Surgery',
      physician: 'Dr. Vikram Malhotra',
      notes: 'Wound assessment, suture check, diabetic wound healing evaluation.',
    },
    dischargedBy: 'Dr. Vikram Malhotra',
    documents: ['Discharge Summary', 'Medication List', 'Diabetic Care Instructions', 'Wound Care Guide'],
  },
};

export const getDischargeByPatientId = (patientId) => discharges[patientId] || null;
