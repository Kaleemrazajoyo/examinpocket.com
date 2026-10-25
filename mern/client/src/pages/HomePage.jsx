import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useMemo, useState } from 'react';
import { SEED_CATEGORIES, SEED_MCQS } from '../data/seedData.js';
import { useSaved } from '../context/SavedContext.jsx';

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');

  const { data: mcqsData, isLoading } = useQuery({
    queryKey: ['mcqs', { search, category }],
    queryFn: () => api.get(`/mcqs?q=${encodeURIComponent(search)}&category=${category}&limit=80`),
    retry: false,
  });

  const { data: catData } = useQuery({
    queryKey: ['mcq-categories'],
    queryFn: () => api.get('/mcqs/categories'),
    retry: false,
  });

  const apiItems = mcqsData?.items || [];
  const items = useMemo(() => {
    if (apiItems.length > 0) return apiItems;
    let list = [...SEED_MCQS];
    if (category !== 'ALL') list = list.filter((m) => m.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.question.toLowerCase().includes(q) || m.options?.some((o) => o.toLowerCase().includes(q)));
    }
    return list;
  }, [apiItems, category, search]);

  const apiCategories = catData?.categories || [];
  const categories = useMemo(() => {
    if (apiCategories.length > 0) return ['ALL', ...apiCategories];
    const existing = items.map((m) => m.category).filter(Boolean);
    const all = Array.from(new Set([...SEED_CATEGORIES, ...existing]));
    return ['ALL', ...all];
  }, [apiCategories, items]);

  return (
    <div className="space-y-6">
      <section className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-800 space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Prepare for <span className="text-amber-400">CSS, PMS, PCS, CCE</span> & All Competitive Exams
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
          Access thousands of verified MCQs, solved past papers, Dawn vocabulary, editorial articles, and AI-powered study guides.
        </p>
        <div className="relative w-full max-w-3xl">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-3.5 text-slate-400"></i>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions, subjects, amendments, rivers, foreign words..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border-0 text-slate-900 text-sm focus:ring-2 focus:ring-amber-400 outline-none shadow-inner"
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm transition ${
                category === cat ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        {isLoading && apiItems.length === 0 && <p className="text-slate-500">Loading MCQs...</p>}
        {!isLoading && items.length === 0 && <p className="text-slate-500">No MCQs found matching your query.</p>}
        {items.map((mcq) => (
          <McqCard key={mcq._id || mcq.legacyId || mcq.id} mcq={mcq} />
        ))}
      </section>
    </div>
  );
}

function McqCard({ mcq }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const { savedMcqs, toggleBookmarkMcq } = useSaved();

  const mcqId = mcq._id || mcq.legacyId || mcq.id;
  const isSaved = savedMcqs.some((id) => String(id) === String(mcqId));

  function checkAnswer(index) {
    if (revealed) return;
    setSelected(index);
    setRevealed(true);
  }

  function toggleBookmark() {
    toggleBookmarkMcq(mcqId);
  }

  return (
    <article
      className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4 ${
        mcq.isNew ? 'new-card-glow' : ''
      }`}
    >
      <div className="flex justify-between items-center">
        <span className="bg-indigo-100 text-indigo-900 text-[11px] font-bold px-2.5 py-1 rounded-lg">
          {mcq.category}
        </span>
        <button onClick={toggleBookmark} className="text-slate-400 hover:text-amber-500 transition" aria-label="Bookmark MCQ">
          <i className={`${isSaved ? 'fa-solid text-amber-500' : 'fa-regular'} fa-bookmark text-base`}></i>
        </button>
      </div>

      <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">{mcq.question}</h3>

      <div className="grid sm:grid-cols-2 gap-2.5">
        {(mcq.options || []).map((option, optIdx) => {
          let btnClass = `opt-btn-${mcqId} w-full text-left p-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-indigo-300 transition text-xs sm:text-sm flex items-center justify-between`;
          if (revealed && optIdx === mcq.answerIndex) {
            btnClass = `opt-btn-${mcqId} w-full text-left p-3 rounded-xl opt-correct text-xs sm:text-sm flex items-center justify-between`;
          } else if (revealed && selected === optIdx && optIdx !== mcq.answerIndex) {
            btnClass = `opt-btn-${mcqId} w-full text-left p-3 rounded-xl opt-wrong text-xs sm:text-sm flex items-center justify-between`;
          }

          return (
            <button
              key={optIdx}
              onClick={() => checkAnswer(optIdx)}
              disabled={revealed}
              className={btnClass}
            >
              <span>
                {String.fromCharCode(65 + optIdx)}) {option}
              </span>
              {revealed && optIdx === mcq.answerIndex && <i className="fa-solid fa-circle-check text-white"></i>}
              {revealed && selected === optIdx && optIdx !== mcq.answerIndex && <i className="fa-solid fa-circle-xmark text-white"></i>}
              {!revealed && <i className="fa-regular fa-circle text-slate-300 opt-icon"></i>}
            </button>
          );
        })}
      </div>

      {revealed && mcq.explanation && (
        <div className="bg-indigo-50 p-3.5 rounded-xl text-xs text-indigo-950 border border-indigo-100 space-y-1">
          <p>
            <strong>Explanation:</strong> {mcq.explanation}
          </p>
        </div>
      )}

      <button className="text-xs text-indigo-700 font-bold hover:underline flex items-center gap-1 pt-1">
        <i className="fa-solid fa-wand-magic-sparkles"></i> Ask AI Tutor to explain in simple Hinglish
      </button>
    </article>
  );
}
