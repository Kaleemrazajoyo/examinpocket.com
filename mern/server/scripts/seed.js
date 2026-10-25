import 'dotenv/config';
import { connectDB } from '../src/config/db.js';
import { Mcq } from '../src/models/Mcq.js';
import { Vocab } from '../src/models/Vocab.js';
import { Headline } from '../src/models/Headline.js';
import { Article } from '../src/models/Article.js';
import { Book } from '../src/models/Book.js';

async function run() {
  await connectDB();

  const mcqCount = await Mcq.estimatedDocumentCount();
  const vocabCount = await Vocab.estimatedDocumentCount();
  const headlineCount = await Headline.estimatedDocumentCount();
  const articleCount = await Article.estimatedDocumentCount();
  const bookCount = await Book.estimatedDocumentCount();

  if (mcqCount || vocabCount || headlineCount || articleCount || bookCount) {
    console.log('[seed] skipped (existing data found)');
    process.exit(0);
  }

  await Mcq.insertMany([
    {
      question: 'Which Constitutional Amendment passed in late 2024 established dedicated Constitutional Benches in the Supreme Court and High Courts of Pakistan?',
      options: ['24th Amendment', '25th Amendment', '26th Amendment', '27th Amendment'],
      answerIndex: 2,
      explanation:
        'The 26th Constitutional Amendment introduced dedicated constitutional benches and modified judicial appointment procedures.',
      category: 'Current Affairs',
      difficulty: 'medium',
    },
    {
      question: 'Where is the Institute of Sindhology located in Sindh, Pakistan?',
      options: ['University of Karachi', 'University of Sindh, Jamshoro', 'Shah Abdul Latif University, Khairpur', 'Mehran University'],
      answerIndex: 1,
      explanation: 'The Institute of Sindhology is located at the University of Sindh, Jamshoro campus.',
      category: 'Sindhology',
      difficulty: 'easy',
    },
    {
      question: 'Under the Indus Waters Treaty (1960), which three eastern rivers were allocated exclusively to India?',
      options: ['Indus, Jhelum, Chenab', 'Ravi, Beas, Sutlej', 'Chenab, Ravi, Sutlej', 'Jhelum, Ravi, Beas'],
      answerIndex: 1,
      explanation: 'India was given full control over Ravi, Beas, and Sutlej, while Pakistan was allocated Indus, Jhelum, and Chenab.',
      category: 'General Knowledge',
      difficulty: 'medium',
    },
    {
      question: "What is the meaning of the Latin term 'De Facto' commonly used in Law and Political Science exams?",
      options: ['By law', 'In reality / in fact', 'By force', 'Without agreement'],
      answerIndex: 1,
      explanation: "'De Facto' means existing in reality or fact, regardless of whether it is legally recognized (De Jure).",
      category: 'Foreign Words',
      difficulty: 'easy',
    },
    {
      question: 'What does CCE stand for in provincial competitive examinations?',
      options: ['Central Competitive Examination', 'Combined Competitive Examination', 'Civil Services Commission Exam', 'Combined Commission Entrance'],
      answerIndex: 1,
      explanation: 'CCE stands for Combined Competitive Examination conducted by SPSC, PPSC, etc.',
      category: 'Abbreviations',
      difficulty: 'easy',
    },
    {
      question: 'In which Hijri year was the Treaty of Hudaibiya (Sulh al-Hudaibiyyah) signed?',
      options: ['4th Hijri', '6th Hijri', '8th Hijri', '10th Hijri'],
      answerIndex: 1,
      explanation: 'The Treaty of Hudaibiya was signed in 6th Hijri between Prophet Muhammad (PBUH) and the Quraysh.',
      category: 'Islamic Studies',
      difficulty: 'medium',
    },
  ]);

  await Vocab.insertMany([
    {
      word: 'Pragmatic',
      type: 'Adjective',
      meaning: 'Dealing with things sensibly and realistically.',
      urdu: 'حقیقت پسندانہ / عملی',
      sentence: 'Pakistan needs a pragmatic foreign policy to navigate current economic realities.',
    },
    {
      word: 'Consensus',
      type: 'Noun',
      meaning: 'General agreement among a group.',
      urdu: 'اتفاقِ رائے',
      sentence: 'Economic reform requires a broad political consensus among leaders.',
    },
  ]);

  await Headline.insertMany([
    { title: 'State Bank of Pakistan maintains policy rate amid stabilizing inflation outlook.' },
    { title: 'Government announces energy sector structural reforms in federal cabinet meeting.' },
    { title: 'SCO Council Summit in Islamabad highlights trade and regional connectivity.' },
  ]);

  await Article.insertMany([
    {
      title: "Pakistan's Economic Challenges & Structural Reforms",
      category: 'Current Affairs',
      author: 'ExamInPocket Senior Editorial Team',
      content:
        "1. Introduction:\nPakistan's economy faces persistent structural bottlenecks including fiscal deficits, energy sector circular debt, and narrow tax base.\n\n2. Key Reform Priorities:\n- Tax diversification and broadening tax-to-GDP ratio.\n- Restructuring State-Owned Enterprises (SOEs).\n- Boosting export competitiveness.\n\n3. Way Forward:\nLong-term sustainable fiscal planning and policy continuity are essential for economic stabilization.",
    },
  ]);

  await Book.insertMany([
    {
      title: 'Caravan General Knowledge 2026 Edition',
      category: 'General Knowledge',
      sizeLabel: '42 MB PDF',
      provider: 'external',
      url: 'https://drive.google://somewhere.example/placeholder', // replace via admin with a real OneDrive link
      embedUrl: '',
      downloadUrl: '',
      description: 'Seed placeholder — replace this URL with a valid OneDrive share link in the admin panel.',
    },
  ]);

  console.log('[seed] done');
  process.exit(0);
}

run().catch((error) => {
  console.error('[seed] failed', error.message);
  process.exit(1);
});
