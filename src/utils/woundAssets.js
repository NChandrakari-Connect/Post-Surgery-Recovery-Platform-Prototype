// Sample clinical wound illustration/placeholder data URLs for realistic demonstration

export const SAMPLE_WOUND_PHOTOS = [
  {
    id: 'sample-1',
    label: 'Clean Healing Port Incision (Normal)',
    description: 'Day 8 laparoscopic port site, edges well-approximated, minimal erythema, clean sutures.',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
        <defs>
          <radialGradient id="skin" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stop-color="#f8ded1"/>
            <stop offset="50%" stop-color="#eed0be"/>
            <stop offset="100%" stop-color="#ddb9a5"/>
          </radialGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#552211" flood-opacity="0.25"/>
          </filter>
        </defs>
        <rect width="400" height="300" fill="url(#skin)"/>
        
        <!-- Subtle anatomical contours -->
        <path d="M 0 160 Q 200 140 400 165" stroke="#d5ab95" stroke-width="1.5" fill="none" opacity="0.4"/>
        <path d="M 0 210 Q 200 195 400 220" stroke="#d5ab95" stroke-width="1.2" fill="none" opacity="0.3"/>
        
        <!-- Incision Site Area -->
        <ellipse cx="200" cy="145" rx="55" ry="32" fill="#efb29d" opacity="0.6"/>
        <ellipse cx="200" cy="145" rx="42" ry="22" fill="#e89882" opacity="0.4"/>
        
        <!-- Surgical Incision Line -->
        <path d="M 160 145 C 180 143, 220 147, 240 145" stroke="#933636" stroke-width="3" stroke-linecap="round" filter="url(#shadow)"/>
        
        <!-- Steri-strips / Sutures -->
        <line x1="172" y1="134" x2="172" y2="156" stroke="#4a5568" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="190" y1="133" x2="190" y2="157" stroke="#4a5568" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="210" y1="133" x2="210" y2="157" stroke="#4a5568" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="228" y1="134" x2="228" y2="156" stroke="#4a5568" stroke-width="1.8" stroke-linecap="round"/>
        
        <!-- Medical stamp watermark -->
        <rect x="15" y="15" width="120" height="24" rx="4" fill="rgba(15, 23, 42, 0.65)"/>
        <text x="75" y="31" fill="#ffffff" font-size="10" font-family="sans-serif" font-weight="600" text-anchor="middle">INCISION RECORD</text>
        <text x="385" y="285" fill="#64748b" font-size="10" font-family="sans-serif" text-anchor="end">IncisionCare Clinical Photo Log</text>
      </svg>
    `)}`
  },
  {
    id: 'sample-2',
    label: 'Mild Incision Redness (Requires Monitoring)',
    description: 'Day 5 incision with localized mild periwound erythema, dry dressing removed.',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
        <defs>
          <radialGradient id="skin2" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stop-color="#f5d6c8"/>
            <stop offset="60%" stop-color="#e8c2ad"/>
            <stop offset="100%" stop-color="#d4aa95"/>
          </radialGradient>
        </defs>
        <rect width="400" height="300" fill="url(#skin2)"/>
        
        <!-- Erythema flush -->
        <ellipse cx="205" cy="150" rx="70" ry="45" fill="#e57373" opacity="0.35"/>
        <ellipse cx="205" cy="150" rx="48" ry="30" fill="#ef5350" opacity="0.4"/>
        
        <!-- Surgical Incision Line -->
        <path d="M 165 150 C 185 147, 215 153, 245 150" stroke="#a91d22" stroke-width="3.5" stroke-linecap="round"/>
        
        <!-- Sutures -->
        <line x1="178" y1="138" x2="178" y2="162" stroke="#334155" stroke-width="2" stroke-linecap="round"/>
        <line x1="198" y1="137" x2="198" y2="163" stroke="#334155" stroke-width="2" stroke-linecap="round"/>
        <line x1="218" y1="137" x2="218" y2="163" stroke="#334155" stroke-width="2" stroke-linecap="round"/>
        <line x1="234" y1="138" x2="234" y2="162" stroke="#334155" stroke-width="2" stroke-linecap="round"/>
        
        <rect x="15" y="15" width="130" height="24" rx="4" fill="rgba(185, 28, 28, 0.75)"/>
        <text x="80" y="31" fill="#ffffff" font-size="10" font-family="sans-serif" font-weight="600" text-anchor="middle">MONITORING LOG</text>
        <text x="385" y="285" fill="#64748b" font-size="10" font-family="sans-serif" text-anchor="end">IncisionCare Clinical Photo Log</text>
      </svg>
    `)}`
  }
];
