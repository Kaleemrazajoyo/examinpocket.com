export const SEED_MCQS = [
  {
    _id: 'seed-mcq-1001',
    legacyId: 1001,
    category: 'Current Affairs',
    question:
      'Which Constitutional Amendment passed in late 2024 established dedicated Constitutional Benches in the Supreme Court and High Courts of Pakistan?',
    options: ['24th Amendment', '25th Amendment', '26th Amendment', '27th Amendment'],
    answerIndex: 2,
    explanation:
      'The 26th Constitutional Amendment introduced dedicated constitutional benches and modified judicial appointment procedures.',
  },
  {
    _id: 'seed-mcq-1002',
    legacyId: 1002,
    category: 'Sindhology',
    question: 'Where is the Institute of Sindhology located in Sindh, Pakistan?',
    options: ['University of Karachi', 'University of Sindh, Jamshoro', 'Shah Abdul Latif University, Khairpur', 'Mehran University'],
    answerIndex: 1,
    explanation: 'The Institute of Sindhology is located at the University of Sindh, Jamshoro campus.',
  },
  {
    _id: 'seed-mcq-1003',
    legacyId: 1003,
    category: 'General Knowledge',
    question: 'Under the Indus Waters Treaty (1960), which three eastern rivers were allocated exclusively to India?',
    options: ['Indus, Jhelum, Chenab', 'Ravi, Beas, Sutlej', 'Chenab, Ravi, Sutlej', 'Jhelum, Ravi, Beas'],
    answerIndex: 1,
    explanation: 'India was given full control over Ravi, Beas, and Sutlej, while Pakistan was allocated Indus, Jhelum, and Chenab.',
  },
  {
    _id: 'seed-mcq-1004',
    legacyId: 1004,
    category: 'Foreign Words',
    question: "What is the meaning of the Latin term 'De Facto' commonly used in Law and Political Science exams?",
    options: ['By law', 'In reality / in fact', 'By force', 'Without agreement'],
    answerIndex: 1,
    explanation: "'De Facto' means existing in reality or fact, regardless of whether it is legally recognized (De Jure).",
  },
  {
    _id: 'seed-mcq-1005',
    legacyId: 1005,
    category: 'Abbreviations',
    question: 'What does CCE stand for in provincial competitive examinations?',
    options: ['Central Competitive Examination', 'Combined Competitive Examination', 'Civil Services Commission Exam', 'Combined Commission Entrance'],
    answerIndex: 1,
    explanation: 'CCE stands for Combined Competitive Examination conducted by SPSC, PPSC, etc.',
  },
  {
    _id: 'seed-mcq-1006',
    legacyId: 1006,
    category: 'Islamic Studies',
    question: 'In which Hijri year was the Treaty of Hudaibiya (Sulh al-Hudaibiyyah) signed?',
    options: ['4th Hijri', '6th Hijri', '8th Hijri', '10th Hijri'],
    answerIndex: 1,
    explanation: 'The Treaty of Hudaibiya was signed in 6th Hijri between Prophet Muhammad (PBUH) and the Quraysh.',
  },
];

export const SEED_VOCAB = [
  {
    _id: 'seed-vocab-2001',
    legacyId: 2001,
    word: 'Pragmatic',
    type: 'Adjective',
    meaning: 'Dealing with things sensibly and realistically.',
    urdu: 'حقیقت پسندانہ / عملی',
    sentence: 'Pakistan needs a pragmatic foreign policy to navigate current economic realities.',
  },
  {
    _id: 'seed-vocab-2002',
    legacyId: 2002,
    word: 'Consensus',
    type: 'Noun',
    meaning: 'General agreement among a group.',
    urdu: 'اتفاقِ رائے',
    sentence: 'Economic reform requires a broad political consensus among leaders.',
  },
];

export const SEED_HEADLINES = [
  { _id: 'seed-head-1', title: 'State Bank of Pakistan maintains policy rate amid stabilizing inflation outlook.' },
  { _id: 'seed-head-2', title: 'Government announces energy sector structural reforms in federal cabinet meeting.' },
  { _id: 'seed-head-3', title: 'SCO Council Summit in Islamabad highlights trade and regional connectivity.' },
];

export const SEED_ARTICLES = [
  {
    _id: 'seed-art-4001',
    legacyId: 4001,
    title: "Pakistan's Economic Challenges & Structural Reforms",
    category: 'Current Affairs',
    author: 'ExamInPocket Senior Editorial Team',
    content:
      "1. Introduction:\nPakistan's economy faces persistent structural bottlenecks including fiscal deficits, energy sector circular debt, and narrow tax base.\n\n2. Key Reform Priorities:\n- Tax diversification and broadening tax-to-GDP ratio.\n- Restructuring State-Owned Enterprises (SOEs).\n- Boosting export competitiveness.\n\n3. Way Forward:\nLong-term sustainable fiscal planning and policy continuity are essential for economic stabilization.",
  },
];

export const SEED_BOOKS = [
  {
    _id: 'seed-book-3001',
    legacyId: 3001,
    title: 'Caravan General Knowledge 2026 Edition',
    category: 'General Knowledge',
    sizeLabel: '42 MB PDF',
    provider: 'external',
    url: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view',
    embedUrl: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/preview',
    downloadUrl: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view',
  },
  {
    _id: 'seed-book-3002',
    legacyId: 3002,
    title: 'CSS Pakistan Affairs High-Yield Solved Papers',
    category: 'CSS / PMS Notes',
    sizeLabel: '15 MB PDF',
    provider: 'onedrive',
    url: '',
    embedUrl: '',
    downloadUrl: '',
  },
  {
    _id: 'seed-book-3003',
    legacyId: 3003,
    title: 'Sindh History & Culture Guide for CCE / SPSC',
    category: 'Sindhology',
    sizeLabel: '18 MB PDF',
    provider: 'onedrive',
    url: '',
    embedUrl: '',
    downloadUrl: '',
  },
];

export const SEED_CATEGORIES = [
  'General Knowledge',
  'Pakistan Studies',
  'Everyday Science',
  'Islamic Studies',
  'Basic Computer Operations & IT',
  'Mathematics',
  'Intelligence Tests',
  'Common Observation Questions',
  'English',
  'Abbreviations',
  'Foreign Words',
  'Current Affairs',
  'Sindhology',
  'Past Papers MCQs',
];
