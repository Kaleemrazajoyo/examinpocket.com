import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';
import {
  addCustomArticle,
  addCustomBook,
  addCustomMcq,
  addCustomVocab,
  deleteCustomArticle,
  deleteCustomBook,
  deleteCustomMcq,
  deleteCustomVocab,
  getCustomArticles,
  getCustomBooks,
  getCustomMcqs,
  getCustomVocab,
  updateCustomArticle,
  updateCustomBook,
  updateCustomMcq,
  updateCustomVocab,
} from '../../utils/storage.js';

export default function AdminDashboard() {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('mcqs');
  const [bookLink, setBookLink] = useState('');
  const [resolved, setResolved] = useState(null);

  const [customMcqs, setCustomMcqs] = useState(() => getCustomMcqs());
  const [customVocab, setCustomVocab] = useState(() => getCustomVocab());
  const [customArticles, setCustomArticles] = useState(() => getCustomArticles());
  const [customBooks, setCustomBooks] = useState(() => getCustomBooks());

  const [mcqForm, setMcqForm] = useState({ category: 'General Knowledge', question: '', options: ['', '', '', ''], answerIndex: 0, explanation: '' });
  const [vocabForm, setVocabForm] = useState({ word: '', urdu: '', meaning: '', sentence: '' });
  const [artForm, setArtForm] = useState({ title: '', category: 'Current Affairs', author: 'Editorial Team', content: '' });
  const [bookForm, setBookForm] = useState({ title: '', category: 'General Knowledge', sizeLabel: 'PDF', url: '', embedUrl: '', downloadUrl: '' });

  useEffect(() => {
    setCustomMcqs(getCustomMcqs());
    setCustomVocab(getCustomVocab());
    setCustomArticles(getCustomArticles());
    setCustomBooks(getCustomBooks());
  }, []);

  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: () => api.get('/admin/stats'), retry: false });
  const { data: mcqs } = useQuery({ queryKey: ['admin-mcqs'], queryFn: () => api.get('/mcqs?limit=100'), retry: false });
  const { data: books } = useQuery({ queryKey: ['admin-books'], queryFn: () => api.get('/books?limit=100'), retry: false });
  const { data: articles } = useQuery({ queryKey: ['admin-articles'], queryFn: () => api.get('/articles?limit=100'), retry: false });
  const { data: vocab } = useQuery({ queryKey: ['admin-vocab'], queryFn: () => api.get('/vocab?limit=100'), retry: false });

  const resolveMut = useMutation({
    mutationFn: () => api.post('/links/resolve', { url: bookLink }),
    onSuccess: (data) => { setResolved(data); showToast('Link resolved'); },
    onError: (e) => showToast(e.message, 'error'),
  });

  const createBookMut = useMutation({
    mutationFn: (body) => api.post('/books', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-books'] });
      qc.invalidateQueries({ queryKey: ['books'] });
      showToast('Book added');
      setBookLink('');
      setResolved(null);
    },
    onError: (e) => showToast(e.message, 'error'),
  });

  const counts = stats?.counts || {};

  function adminLogout() {
    localStorage.removeItem('eip_admin_secret');
    navigate('/');
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md">AUTHENTICATED ADMIN</span>
          <div>
            <h3 className="font-bold text-sm sm:text-base">ExamInPocket Control Panel</h3>
            <p className="text-xs text-slate-400">Manage MCQs, Dawn Vocab, Articles, Library Books & AI Key</p>
          </div>
        </div>
        <button onClick={adminLogout} className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
          <i className="fa-solid fa-right-from-bracket"></i> Logout
        </button>
      </div>

      <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 space-y-3">
        <h4 className="font-bold text-amber-950 text-sm flex items-center gap-2">
          <i className="fa-solid fa-key text-amber-600"></i> AI Tutor Key Settings (1-Time Setup)
        </h4>
        <p className="text-xs text-amber-800 leading-relaxed">
          Enter your <strong>Free Gemini API Key</strong> from <strong>aistudio.google.com</strong>.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="password" placeholder="Paste Gemini API Key (AIzaSy...)" className="flex-grow p-2.5 border border-amber-300 rounded-lg text-xs bg-white" />
          <button className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition">
            Save AI Key
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold flex items-center gap-2"><i className="fa-solid fa-shield-halved text-indigo-900"></i> Admin Dashboard</h2>
        <div className="mt-4 grid sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <Card label="MCQs" value={counts.mcqs} />
          <Card label="Vocab" value={counts.vocab} />
          <Card label="Headlines" value={counts.headlines} />
          <Card label="Articles" value={counts.articles} />
          <Card label="Books" value={counts.books} />
          <Card label="Users" value={counts.users} />
          <Card label="Bookmarks" value={counts.bookmarks} />
          <Card label="Attempts" value={counts.attempts} />
        </div>
      </div>

      <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 space-y-3">
        <h4 className="font-bold text-amber-950 text-sm flex items-center gap-2">
          <i className="fa-solid fa-bullhorn text-amber-600"></i> Live Update Ticker (Announcement)
        </h4>
        <p className="text-xs text-amber-800 leading-relaxed">Update the announcement text shown in the top ticker. HTML allowed.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            id="adminTickerInput"
            defaultValue={localStorage.getItem('eip_ticker_text') || '📢 <span class="font-bold">Latest Exam Update:</span> CSS MPT & SPSC CCE Solved Past Paper MCQs Added • Daily Dawn Vocabulary Active • Live Gemini AI Tutor Active!'}
            className="flex-grow p-2.5 border border-amber-300 rounded-lg text-xs bg-white"
          />
          <button
            onClick={() => {
              const val = document.getElementById('adminTickerInput').value;
              localStorage.setItem('eip_ticker_text', val);
              window.dispatchEvent(new Event('storage'));
              showToast('Ticker updated');
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition"
          >
            Save Announcement
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-wrap border-b border-slate-200">
          {['mcqs', 'books', 'articles', 'vocab', 'backup'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm capitalize ${tab === t ? 'bg-indigo-900 text-amber-300' : ''}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {tab === 'mcqs' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-2">
                <div className="space-y-2">
                  <select
                    value={mcqForm.category === 'Custom' ? 'Custom' : (mcqForm.customCategory ? 'Custom' : mcqForm.category)}
                    onChange={(e) => {
                      if (e.target.value === 'Custom') {
                        setMcqForm((p) => ({ ...p, category: 'Custom', customCategory: p.customCategory || '' }));
                      } else {
                        setMcqForm((p) => ({ ...p, category: e.target.value, customCategory: '' }));
                      }
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-lg"
                  >
                    <option value="General Knowledge">General Knowledge</option>
                    <option value="Pakistan Studies">Pakistan Studies</option>
                    <option value="Everyday Science">Everyday Science</option>
                    <option value="Islamic Studies">Islamic Studies</option>
                    <option value="Basic Computer Operations & IT">Basic Computer Operations & IT</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Intelligence Tests">Intelligence Tests</option>
                    <option value="Common Observation Questions">Common Observation Questions</option>
                    <option value="English">English</option>
                    <option value="Abbreviations">Abbreviations</option>
                    <option value="Foreign Words">Foreign Words</option>
                    <option value="Current Affairs">Current Affairs</option>
                    <option value="Sindhology">Sindhology</option>
                    <option value="Past Papers MCQs">Past Papers MCQs</option>
                    <option value="Custom">➕ Add New / Custom Subject...</option>
                  </select>
                  {mcqForm.category === 'Custom' && (
                    <input
                      value={mcqForm.customCategory || ''}
                      onChange={(e) => setMcqForm((p) => ({ ...p, customCategory: e.target.value }))}
                      placeholder="Type custom subject name..."
                      className="w-full p-2.5 border border-amber-300 rounded-lg"
                    />
                  )}
                </div>
                <input value={mcqForm.question} onChange={(e) => setMcqForm((p) => ({ ...p, question: e.target.value }))} placeholder="Question" className="p-2.5 border border-slate-200 rounded-lg md:col-span-2" />
                {mcqForm.options.map((opt, idx) => (
                  <input key={idx} value={opt} onChange={(e) => setMcqForm((p) => { const o=[...p.options]; o[idx]=e.target.value; return {...p,options:o}; })} placeholder={`Option ${String.fromCharCode(65+idx)}`} className="p-2.5 border border-slate-200 rounded-lg" />
                ))}
                <select value={mcqForm.answerIndex} onChange={(e) => setMcqForm((p) => ({ ...p, answerIndex: Number(e.target.value) }))} className="p-2.5 border border-slate-200 rounded-lg">
                  <option value={0}>Correct: A</option>
                  <option value={1}>Correct: B</option>
                  <option value={2}>Correct: C</option>
                  <option value={3}>Correct: D</option>
                </select>
                <input value={mcqForm.explanation} onChange={(e) => setMcqForm((p) => ({ ...p, explanation: e.target.value }))} placeholder="Explanation" className="p-2.5 border border-slate-200 rounded-lg" />
              </div>
              <button
                onClick={() => {
                  const catToUse = mcqForm.category === 'Custom' ? (mcqForm.customCategory || 'Custom') : mcqForm.category;
                  const c = addCustomMcq({ ...mcqForm, category: catToUse });
                  setCustomMcqs(getCustomMcqs());
                  showToast('MCQ added');
                  setMcqForm({ category: 'General Knowledge', question: '', options: ['', '', '', ''], answerIndex: 0, explanation: '', customCategory: '' });
                }}
                className="px-4 py-2 rounded-lg bg-indigo-900 text-amber-300"
              >
                Add MCQ
              </button>
              <div className="space-y-2">
                {customMcqs.map((m) => (
                  <div key={m._id || m.id} className="p-3 border border-slate-200 rounded-xl text-sm flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{m.question}</p>
                      <p className="text-xs text-slate-500">{m.category}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { deleteCustomMcq(m._id || m.id); setCustomMcqs(getCustomMcqs()); showToast('MCQ deleted'); }} className="text-xs text-rose-600">Delete</button>
                    </div>
                  </div>
                ))}
                {(mcqs?.items || []).slice(0, 10).map((m) => (
                  <div key={m._id} className="p-3 border border-slate-200 rounded-xl text-sm">{m.question}</div>
                ))}
              </div>
            </div>
          )}

          {tab === 'books' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-2">
                <input value={bookForm.title} onChange={(e) => setBookForm((p) => ({ ...p, title: e.target.value }))} placeholder="Book Title" className="p-2.5 border border-slate-200 rounded-lg" />
                <div className="space-y-2">
                  <select
                    value={bookForm.category === 'Custom' ? 'Custom' : (bookForm.customCategory ? 'Custom' : bookForm.category)}
                    onChange={(e) => {
                      if (e.target.value === 'Custom') {
                        setBookForm((p) => ({ ...p, category: 'Custom', customCategory: p.customCategory || '' }));
                      } else {
                        setBookForm((p) => ({ ...p, category: e.target.value, customCategory: '' }));
                      }
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-lg"
                  >
                    <option value="General Knowledge">General Knowledge</option>
                    <option value="Pakistan Studies">Pakistan Studies</option>
                    <option value="CSS / PMS Notes">CSS / PMS Notes</option>
                    <option value="Everyday Science">Everyday Science</option>
                    <option value="Islamic Studies">Islamic Studies</option>
                    <option value="Sindhology">Sindhology</option>
                    <option value="Current Affairs">Current Affairs</option>
                    <option value="English">English</option>
                    <option value="Past Papers">Past Papers</option>
                    <option value="Custom">➕ Add New / Custom Subject...</option>
                  </select>
                  {bookForm.category === 'Custom' && (
                    <input
                      value={bookForm.customCategory || ''}
                      onChange={(e) => setBookForm((p) => ({ ...p, customCategory: e.target.value }))}
                      placeholder="Type custom category name..."
                      className="w-full p-2.5 border border-amber-300 rounded-lg"
                    />
                  )}
                </div>
                <input value={bookForm.url} onChange={(e) => setBookForm((p) => ({ ...p, url: e.target.value }))} placeholder="Link" className="p-2.5 border border-slate-200 rounded-lg md:col-span-2" />
              </div>
              <button
                onClick={() => {
                  const catToUse = bookForm.category === 'Custom' ? (bookForm.customCategory || 'Custom') : bookForm.category;
                  const c = addCustomBook({ ...bookForm, category: catToUse });
                  setCustomBooks(getCustomBooks());
                  showToast('Book added');
                  setBookForm({ title: '', category: 'General Knowledge', sizeLabel: 'PDF', url: '', embedUrl: '', downloadUrl: '', customCategory: '' });
                }}
                className="px-4 py-2 rounded-lg bg-indigo-900 text-amber-300"
              >
                Add Book (OneDrive/Link)
              </button>
              <div className="grid md:grid-cols-2 gap-3">
                <input value={bookLink} onChange={(e) => setBookLink(e.target.value)} placeholder="Paste OneDrive / SharePoint / direct link" className="p-2.5 border border-slate-200 rounded-lg" />
                <button onClick={() => resolveMut.mutate()} disabled={!bookLink} className="px-4 py-2 rounded-lg bg-indigo-900 text-amber-300">Resolve Link</button>
              </div>
              {resolved && (
                <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-xl text-sm space-y-2">
                  <p className="font-semibold">Resolved</p>
                  <p>Embed: {resolved.embedUrl}</p>
                  <p>Download: {resolved.downloadUrl}</p>
                  {resolved.warning && <p className="text-amber-700">{resolved.warning}</p>}
                  <button
                    onClick={() => createBookMut.mutate({ title: 'New Book', category: 'General Knowledge', sizeLabel: 'PDF Book', url: resolved.url, embedUrl: resolved.embedUrl, downloadUrl: resolved.downloadUrl })}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white"
                  >
                    Save to Library
                  </button>
                </div>
              )}
              <div className="space-y-2">
                {customBooks.map((b) => (
                  <div key={b._id || b.id} className="p-3 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-medium">{b.title}</p>
                      <p className="text-xs text-slate-500">{b.category}</p>
                    </div>
                    <button onClick={() => { deleteCustomBook(b._id || b.id); setCustomBooks(getCustomBooks()); showToast('Book deleted'); }} className="text-xs text-rose-600">Delete</button>
                  </div>
                ))}
                {(books?.items || []).map((b) => (
                  <div key={b._id} className="p-3 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-medium">{b.title}</p>
                      <p className="text-xs text-slate-500">{b.category}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100">{b.provider}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'articles' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-2">
                <input value={artForm.title} onChange={(e) => setArtForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className="p-2.5 border border-slate-200 rounded-lg" />
                <div className="space-y-2">
                  <select
                    value={artForm.category === 'Custom' ? 'Custom' : (artForm.customCategory ? 'Custom' : artForm.category)}
                    onChange={(e) => {
                      if (e.target.value === 'Custom') {
                        setArtForm((p) => ({ ...p, category: 'Custom', customCategory: p.customCategory || '' }));
                      } else {
                        setArtForm((p) => ({ ...p, category: e.target.value, customCategory: '' }));
                      }
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-lg"
                  >
                    <option value="Current Affairs">Current Affairs</option>
                    <option value="Pakistan Affairs">Pakistan Affairs</option>
                    <option value="International Affairs">International Affairs</option>
                    <option value="Essay">Essay</option>
                    <option value="Political Science">Political Science</option>
                    <option value="Economy">Economy</option>
                    <option value="Custom">➕ Add New / Custom Category...</option>
                  </select>
                  {artForm.category === 'Custom' && (
                    <input
                      value={artForm.customCategory || ''}
                      onChange={(e) => setArtForm((p) => ({ ...p, customCategory: e.target.value }))}
                      placeholder="Type custom category name..."
                      className="w-full p-2.5 border border-amber-300 rounded-lg"
                    />
                  )}
                </div>
                <textarea value={artForm.content} onChange={(e) => setArtForm((p) => ({ ...p, content: e.target.value }))} placeholder="Content" className="p-2.5 border border-slate-200 rounded-lg md:col-span-2" rows={4} />
              </div>
              <button
                onClick={() => {
                  const catToUse = artForm.category === 'Custom' ? (artForm.customCategory || 'Custom') : artForm.category;
                  const c = addCustomArticle({ ...artForm, category: catToUse });
                  setCustomArticles(getCustomArticles());
                  showToast('Article added');
                  setArtForm({ title: '', category: 'Current Affairs', author: 'Editorial Team', content: '', customCategory: '' });
                }}
                className="px-4 py-2 rounded-lg bg-indigo-900 text-amber-300"
              >
                Add Article
              </button>
              <div className="space-y-2">
                {customArticles.map((a) => (
                  <div key={a._id || a.id} className="p-3 border border-slate-200 rounded-xl text-sm flex items-center justify-between">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-slate-500">{a.category}</p>
                    </div>
                    <button onClick={() => { deleteCustomArticle(a._id || a.id); setCustomArticles(getCustomArticles()); showToast('Article deleted'); }} className="text-xs text-rose-600">Delete</button>
                  </div>
                ))}
                {(articles?.items || []).slice(0, 10).map((a) => (
                  <div key={a._id} className="p-3 border border-slate-200 rounded-xl text-sm">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.category}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'vocab' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-2">
                <input value={vocabForm.word} onChange={(e) => setVocabForm((p) => ({ ...p, word: e.target.value }))} placeholder="Word" className="p-2.5 border border-slate-200 rounded-lg" />
                <select
                  value={vocabForm.type || 'Noun'}
                  onChange={(e) => setVocabForm((p) => ({ ...p, type: e.target.value }))}
                  className="p-2.5 border border-slate-200 rounded-lg"
                >
                  <option value="Noun">Noun</option>
                  <option value="Verb">Verb</option>
                  <option value="Adjective">Adjective</option>
                  <option value="Adverb">Adverb</option>
                  <option value="Pronoun">Pronoun</option>
                  <option value="Preposition">Preposition</option>
                  <option value="Conjunction">Conjunction</option>
                  <option value="Idioms/Phrases">Idioms/Phrases</option>
                  <option value="Other">Other</option>
                </select>
                <input value={vocabForm.urdu} onChange={(e) => setVocabForm((p) => ({ ...p, urdu: e.target.value }))} placeholder="Urdu" className="p-2.5 border border-slate-200 rounded-lg" />
                <input value={vocabForm.meaning} onChange={(e) => setVocabForm((p) => ({ ...p, meaning: e.target.value }))} placeholder="Meaning" className="p-2.5 border border-slate-200 rounded-lg" />
                <input value={vocabForm.sentence} onChange={(e) => setVocabForm((p) => ({ ...p, sentence: e.target.value }))} placeholder="Sentence" className="p-2.5 border border-slate-200 rounded-lg md:col-span-2" />
              </div>
              <button
                onClick={() => {
                  const form = { ...vocabForm, type: vocabForm.type || 'Noun' };
                  addCustomVocab(form);
                  setCustomVocab(getCustomVocab());
                  showToast('Vocab added');
                  setVocabForm({ word: '', urdu: '', meaning: '', sentence: '', type: 'Noun' });
                }}
                className="px-4 py-2 rounded-lg bg-indigo-900 text-amber-300"
              >
                Add Vocab
              </button>
              <div className="space-y-2">
                {customVocab.map((v) => (
                  <div key={v._id || v.id} className="p-3 border border-slate-200 rounded-xl text-sm flex items-center justify-between">
                    <div>
                      <p className="font-medium">{v.word}</p>
                      <p className="text-xs text-slate-500">{v.urdu}</p>
                    </div>
                    <button onClick={() => { deleteCustomVocab(v._id || v.id); setCustomVocab(getCustomVocab()); showToast('Vocab deleted'); }} className="text-xs text-rose-600">Delete</button>
                  </div>
                ))}
                {(vocab?.items || []).slice(0, 10).map((v) => (
                  <div key={v._id} className="p-3 border border-slate-200 rounded-xl text-sm flex items-center justify-between">
                    <p className="font-medium">{v.word}</p>
                    <p className="text-xs text-slate-500">{v.urdu}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'backup' && (
            <div className="flex flex-wrap gap-2">
              <a href="/api/admin/export" className="px-4 py-2 rounded-lg bg-indigo-900 text-amber-300">Export JSON Backup</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold">{value ?? '-'}</p>
    </div>
  );
}
