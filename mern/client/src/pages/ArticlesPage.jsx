import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useState } from 'react';
import { SEED_ARTICLES } from '../data/seedData.js';
import { useSaved } from '../context/SavedContext.jsx';

export default function ArticlesPage() {
  const { data } = useQuery({ queryKey: ['articles'], queryFn: () => api.get('/articles?limit=20'), retry: false });
  const items = (data?.items || []).length > 0 ? data.items : SEED_ARTICLES;
  const { savedArticles, toggleBookmarkArticle } = useSaved();
  const [open, setOpen] = useState(null);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="border-b pb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-file-pen text-amber-600"></i> Editorial Articles & CSS/PMS Essay Outlines
          </h2>
          <p className="text-xs text-slate-500">Comprehensive essay breakdowns, current affairs analysis, and subject outlines.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((article) => {
            const id = article._id || article.legacyId || article.id;
            const isSaved = savedArticles.some((s) => String(s) === String(id));
            return (
              <div key={id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">{article.category}</span>
                  <button onClick={() => toggleBookmarkArticle(id)} className="text-slate-400 hover:text-amber-500 text-xs">
                    <i className={`${isSaved ? 'fa-solid text-amber-500' : 'fa-regular'} fa-bookmark`}></i>
                  </button>
                </div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{article.title}</h3>
                <p className="text-[11px] text-slate-500">By {article.author || 'Editorial Team'}</p>
                <button
                  onClick={() => setOpen(article)}
                  className="bg-slate-900 text-amber-400 hover:bg-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                >
                  <i className="fa-solid fa-eye mr-1"></i> Read Full Essay / Article
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-6">
          <div className="bg-white w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative">
            <div className="bg-slate-900 text-white p-3 sm:p-4 flex justify-between items-center border-b border-slate-800 gap-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-amber-400 text-slate-950 p-2 sm:p-2.5 rounded-xl font-bold text-xs sm:text-sm shrink-0">
                  <i className="fa-solid fa-book-reader"></i>
                </div>
                <div className="truncate">
                  <h3 className="font-bold text-xs sm:text-base text-white truncate">{open.title}</h3>
                  <p className="text-[10px] sm:text-xs text-amber-400 font-medium truncate">Editorial Essay • {open.category}</p>
                </div>
              </div>
              <button onClick={() => setOpen(null)} className="text-slate-400 hover:text-white p-1.5 sm:p-2 rounded-lg transition text-lg sm:text-xl">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="flex-grow bg-slate-100 p-2 sm:p-4 overflow-y-auto flex justify-center items-center">
              <div className="w-full max-w-4xl h-full bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm overflow-y-auto printable-area space-y-4">
                <div className="border-b pb-4 mb-4 text-center">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{open.title}</h2>
                  <p className="text-xs text-amber-600 font-semibold mt-1">ExamInPocket Verified Study Guide</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-xs text-slate-500 border-b pb-2">
                    <span><strong>Author:</strong> {open.author || 'Editorial Team'}</span>
                    <span><strong>Subject:</strong> {open.category}</span>
                  </div>
                  <div className="whitespace-pre-line text-slate-800 leading-relaxed font-sans text-xs sm:text-sm">
                    {open.content}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
