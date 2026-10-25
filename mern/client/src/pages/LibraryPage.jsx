import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useState } from 'react';
import { SEED_BOOKS } from '../data/seedData.js';

export default function LibraryPage() {
  const { data } = useQuery({ queryKey: ['books'], queryFn: () => api.get('/books?limit=30'), retry: false });
  const items = (data?.items || []).length > 0 ? data.items : SEED_BOOKS;
  const [active, setActive] = useState(null);

  function open(book) {
    setActive(book);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="border-b pb-4 mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-book-open text-indigo-600"></i> PDF Notes & Books Library
          </h2>
          <p className="text-xs text-slate-500 mt-1">Read online or download authentic PDF notes, solved past papers, and subject guides.</p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((book) => (
            <article key={book._id || book.title} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between text-xs sm:text-sm space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded">{book.category}</span>
                </div>
                <h4 className="font-bold text-slate-900 leading-snug">{book.title}</h4>
                <p className="text-slate-400 text-xs">Size: {book.sizeLabel || book.size || 'PDF Book'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <button onClick={() => open(book)} className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-2 px-2 rounded-lg text-xs transition flex items-center justify-center gap-1">
                  <i className="fa-solid fa-eye"></i> Read Online
                </button>
                <a href={book.url || book.downloadUrl || '#'} target="_blank" rel="noreferrer" className="bg-indigo-900 hover:bg-indigo-800 text-white font-semibold py-2 px-2 rounded-lg text-xs transition flex items-center justify-center gap-1">
                  <i className="fa-solid fa-download"></i> Download
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 z-50">
          <div className="bg-white w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative">
            <div className="bg-slate-900 text-white p-3 sm:p-4 flex justify-between items-center border-b border-slate-800 gap-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-amber-400 text-slate-950 p-2 sm:p-2.5 rounded-xl font-bold text-xs sm:text-sm shrink-0">
                  <i className="fa-solid fa-book-reader"></i>
                </div>
                <div className="truncate">
                  <h3 className="font-bold text-xs sm:text-base text-white truncate">{active.title}</h3>
                  <p className="text-[10px] sm:text-xs text-amber-400 font-medium truncate">ExamInPocket Academic Library • {active.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={active.url || '#'} target="_blank" rel="noreferrer" className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-bold transition flex items-center gap-1">
                  <i className="fa-solid fa-arrow-up-right-from-square"></i> <span className="hidden sm:inline">Open Direct</span>
                </a>
                <a href={active.downloadUrl || active.url || '#'} target="_blank" rel="noreferrer" className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-bold transition flex items-center gap-1">
                  <i className="fa-solid fa-download"></i> <span className="hidden sm:inline">Download</span>
                </a>
                <button onClick={() => setActive(null)} className="text-slate-400 hover:text-white p-1.5 sm:p-2 rounded-lg transition text-lg sm:text-xl">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
            <div className="flex-grow bg-slate-100 p-2 sm:p-4 overflow-y-auto flex justify-center items-center">
              {active.embedUrl ? (
                <iframe title={active.title} src={active.embedUrl} className="w-full h-full rounded-xl border border-slate-300 bg-white shadow-inner" allow="fullscreen" />
              ) : (
                <div className="w-full max-w-4xl h-full bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm overflow-y-auto space-y-4">
                  <div className="border-b pb-4 mb-4 text-center">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{active.title}</h2>
                    <p className="text-xs text-amber-600 font-semibold mt-1">ExamInPocket Verified Study Guide</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-indigo-950 space-y-1">
                    <p className="font-bold">💡 Open in OneDrive</p>
                    <p className="text-xs">This book doesn't have an embeddable preview yet. Use "Open Direct" or "Download" to view the PDF.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-slate-50 p-2 text-center text-[11px] text-slate-500 border-t border-slate-200">
              📖 Use "Open Direct" or "Download" if the embedded view doesn't load.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
