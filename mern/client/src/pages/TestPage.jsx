import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { SEED_MCQS } from '../data/seedData.js';

export default function TestPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { data: catData } = useQuery({ queryKey: ['mcq-categories'], queryFn: () => api.get('/mcqs/categories'), retry: false });
  const [config, setConfig] = useState({ category: 'ALL', count: 10 });
  const [running, setRunning] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [seconds, setSeconds] = useState(300);

  async function start() {
    let pool = [];
    try {
      const res = await api.get(`/mcqs?category=${config.category}&limit=100`);
      pool = res.items || [];
    } catch (e) {
      pool = [];
    }
    if (pool.length === 0) {
      let list = [...SEED_MCQS];
      if (config.category !== 'ALL') list = list.filter((m) => m.category === config.category);
      pool = list;
    }
    const picked = [...pool].sort(() => 0.5 - Math.random()).slice(0, config.count);
    if (picked.length === 0) return showToast('No questions available for this category', 'error');
    setQuestions(picked);
    setAnswers({});
    setResult(null);
    setSeconds(config.count * 60);
    setRunning(true);
  }

  async function submit() {
    try {
      if (user) {
        const payload = {
          category: config.category,
          answers: questions.map((q) => ({ mcqId: q._id || q.id || q.legacyId, selectedIndex: answers[q._id || q.id || q.legacyId] ?? null })),
        };
        try {
          const res = await api.post('/attempts', payload);
          setResult(res.attempt);
          setRunning(false);
          showToast('Test submitted');
          return;
        } catch (e) {
          // fall through to local calculation
        }
      }
      // Local calculation fallback
      let correct = 0;
      questions.forEach((q) => {
        const id = q._id || q.id || q.legacyId;
        if (answers[id] === q.answerIndex) correct++;
      });
      const total = questions.length;
      const wrong = total - correct;
      setResult({ total, correct, wrong, percentage: Math.round((correct / Math.max(total, 1)) * 100) });
      setRunning(false);
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  if (result) {
    return (
      <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6">
        <div className="text-center space-y-2 border-b pb-4">
          <span className="bg-indigo-100 text-indigo-900 text-xs font-extrabold px-3 py-1 rounded-full border border-indigo-200">Test Completed</span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900">📊 Your Exam Performance Report</h3>
          <div className="text-5xl font-black text-indigo-700 my-3">{result.correct} / {result.total}</div>
          <p className="text-sm font-semibold text-slate-700">Score: {result.percentage}%</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <p className="text-[11px] font-bold text-emerald-800 uppercase">Correct</p>
            <p className="text-xl font-black text-emerald-700">{result.correct}</p>
          </div>
          <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
            <p className="text-[11px] font-bold text-rose-800 uppercase">Wrong</p>
            <p className="text-xl font-black text-rose-700">{result.wrong}</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
            <p className="text-[11px] font-bold text-amber-800 uppercase">Unattempted</p>
            <p className="text-xl font-black text-amber-700">{result.total - result.correct - result.wrong}</p>
          </div>
          <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200">
            <p className="text-[11px] font-bold text-indigo-800 uppercase">Total Questions</p>
            <p className="text-xl font-black text-indigo-700">{result.total}</p>
          </div>
        </div>
        <div className="text-center pt-2">
          <button onClick={() => { setResult(null); setRunning(false); }} className="bg-indigo-900 text-white font-semibold px-8 py-3 rounded-xl text-xs sm:text-sm hover:bg-indigo-800 transition shadow-md">
            <i className="fa-solid fa-rotate-right mr-1"></i> Take Another Test
          </button>
        </div>
      </div>
    );
  }

  if (running) {
    const qid = (q) => q._id || q.id || q.legacyId;
    return (
      <div className="space-y-6">
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-indigo-700">Exam Mode Active</span>
            <h3 className="text-sm font-bold text-indigo-950">Question {Math.min(questions.length, 1)} of {questions.length}</h3>
          </div>
          <div className="bg-slate-900 text-amber-400 px-4 py-2 rounded-xl font-mono font-bold text-lg">
            {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
          </div>
        </div>
        {questions.map((q, idx) => (
          <article key={qid(q)} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Q{idx + 1}: {q.question}</h4>
            <div className="grid sm:grid-cols-2 gap-2">
              {(q.options || []).map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => setAnswers((prev) => ({ ...prev, [qid(q)]: oIdx }))}
                  className={`test-opt-${qid(q)} text-left p-2.5 rounded-lg border border-slate-200 hover:bg-indigo-50 text-xs transition ${
                    answers[qid(q)] === oIdx ? 'bg-indigo-900 text-white' : ''
                  }`}
                >
                  {String.fromCharCode(65 + oIdx)}) {opt}
                </button>
              ))}
            </div>
          </article>
        ))}
        <button onClick={submit} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-6 rounded-xl text-sm shadow-md transition">
          Submit Test & Get Performance Analytics
        </button>
      </div>
    );
  }

  const allCats = Array.from(new Set([...(catData?.categories || []), ...SEED_MCQS.map((m) => m.category)]));
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="border-b pb-4 mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <i className="fa-solid fa-stopwatch text-indigo-600"></i> Online Timed Mock Test Engine
        </h2>
        <p className="text-xs text-slate-500 mt-1">Practice under real examination conditions with countdown timer and automated performance reporting.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Subject / Field</label>
          <select value={config.category} onChange={(e) => setConfig((p) => ({ ...p, category: e.target.value }))} className="w-full p-2.5 rounded-lg border border-slate-300 text-sm">
            <option value="ALL">All Combined Subjects Mix</option>
            {allCats.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Question Count</label>
          <select value={config.count} onChange={(e) => setConfig((p) => ({ ...p, count: Number(e.target.value) }))} className="w-full p-2.5 rounded-lg border border-slate-300 text-sm">
            <option value={5}>5 Questions (Quick Quiz)</option>
            <option value={10}>10 Questions (Standard Test)</option>
            <option value={20}>20 Questions (Extended Test)</option>
            <option value={30}>30 Questions (Full Subject Test)</option>
            <option value={50}>50 Questions (Grand Mock Exam)</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={start} className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-bold py-2.5 px-4 rounded-lg transition text-sm flex items-center justify-center gap-2">
            <i className="fa-solid fa-play"></i> Start Timed Test
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 text-center">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
