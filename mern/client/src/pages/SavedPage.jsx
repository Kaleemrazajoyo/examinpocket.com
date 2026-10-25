import { useMemo, useState } from 'react';
import { useSaved } from '../context/SavedContext.jsx';
import { SEED_ARTICLES, SEED_BOOKS, SEED_MCQS, SEED_VOCAB } from '../data/seedData.js';

export default function SavedPage() {
  const [filter, setFilter] = useState('ALL');
  const { savedMcqs, savedVocab, savedArticles, savedBooks, toggleBookmarkMcq, toggleBookmarkVocab, toggleBookmarkArticle, toggleBookmarkBook } = useSaved();

  const savedM = useMemo(
    () => SEED_MCQS.filter((m) => {
      const mids = [m.id, m.legacyId, m._id];
      return savedMcqs.some((sid) => mids.some((mid) => mid !== undefined && mid !== null && String(sid) === String(mid)));
    }),
    [savedMcqs],
  );
  const savedV = useMemo(
    () => SEED_VOCAB.filter((w) => {
      const wids = [w.id, w.legacyId, w._id];
      return savedVocab.some((sid) => wids.some((wid) => wid !== undefined && wid !== null && String(sid) === String(wid)));
    }),
    [savedVocab],
  );
  const savedA = useMemo(
    () => SEED_ARTICLES.filter((a) => {
      const aids = [a.id, a.legacyId, a._id];
      return savedArticles.some((sid) => aids.some((aid) => aid !== undefined && aid !== null && String(sid) === String(aid)));
    }),
    [savedArticles],
  );
  const savedB = useMemo(
    () => SEED_BOOKS.filter((b) => {
      const bids = [b.id, b.legacyId, b._id];
      return savedBooks.some((sid) => bids.some((bid) => bid !== undefined && bid !== null && String(sid) === String(bid)));
    }),
    [savedBooks],
  );

  const isEmpty = savedM.length === 0 && savedV.length === 0 && savedA.length === 0 && savedB.length === 0;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="border-b pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <i className="fa-solid fa-bookmark text-amber-500"></i> Saved Revision Favorites
            </h2>
            <p className="text-xs text-slate-500 mt-1">Questions, vocabulary words, articles, and library books bookmarked for quick revision.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'ALL', label: 'All' },
              { key: 'MCQS', label: 'MCQs' },
              { key: 'VOCAB', label: 'Vocab' },
              { key: 'ARTICLES', label: 'Articles' },
              { key: 'BOOKS', label: 'Books' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1 rounded-lg text-xs ${
                  filter === f.key ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-100 text-slate-700 font-medium'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isEmpty && (
          <div className="bg-slate-50 p-8 text-center text-slate-500 rounded-2xl border border-slate-200 text-xs sm:text-sm">
            No saved items yet. Click bookmarks across the portal to save study items here!
          </div>
        )}

        {!isEmpty && (
          <div className="space-y-6">
            {(filter === 'ALL' || filter === 'MCQS') && savedM.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center gap-2">
                  <i className="fa-solid fa-list-check text-indigo-600"></i> Saved MCQs ({savedM.length})
                </h3>
                {savedM.map((m) => {
                  const mid = m.id || m.legacyId || m._id;
                  return (
                    <div key={mid} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded text-[10px]">{m.category}</span>
                        <button onClick={() => toggleBookmarkMcq(mid)} className="text-amber-500 font-bold">
                          Remove
                        </button>
                      </div>
                      <p className="font-bold text-slate-900">{m.question}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {(filter === 'ALL' || filter === 'VOCAB') && savedV.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center gap-2 mt-4">
                  <i className="fa-solid fa-book text-amber-500"></i> Saved Vocab ({savedV.length})
                </h3>
                {savedV.map((w) => {
                  const wid = w.id || w.legacyId || w._id;
                  return (
                    <div key={wid} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <strong className="text-indigo-950">{w.word}</strong> - {w.urdu}
                      </div>
                      <button onClick={() => toggleBookmarkVocab(wid)} className="text-amber-500 font-bold">
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {(filter === 'ALL' || filter === 'ARTICLES') && savedA.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center gap-2 mt-4">
                  <i className="fa-solid fa-file-pen text-amber-600"></i> Saved Articles ({savedA.length})
                </h3>
                {savedA.map((a) => {
                  const aid = a.id || a.legacyId || a._id;
                  return (
                    <div key={aid} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <strong className="text-slate-900">{a.title}</strong> ({a.category})
                      </div>
                      <button onClick={() => toggleBookmarkArticle(aid)} className="text-amber-500 font-bold">
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {(filter === 'ALL' || filter === 'BOOKS') && savedB.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center gap-2 mt-4">
                  <i className="fa-solid fa-book-open text-indigo-600"></i> Saved Books ({savedB.length})
                </h3>
                {savedB.map((b) => {
                  const bid = b.id || b.legacyId || b._id;
                  return (
                    <div key={bid} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <strong className="text-slate-900">{b.title}</strong> ({b.cat})
                      </div>
                      <button onClick={() => toggleBookmarkBook(bid)} className="text-amber-500 font-bold">
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
