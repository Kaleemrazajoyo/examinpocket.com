import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from './lib/api.js';

function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `px-4 py-2 rounded-xl shadow-lg text-xs font-semibold pointer-events-auto ${type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`;
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 2500);
}

function closeConfirmModal(result) {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;
    modal.classList.add('hidden');
    if (window._confirmResolve) {
        window._confirmResolve(result);
        window._confirmResolve = null;
    }
}

function showConfirmModal(title, text) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmModalTitle').innerText = title;
        document.getElementById('confirmModalText').innerText = text;
        window._confirmResolve = resolve;
        modal.classList.remove('hidden');
    });
}

function formatGoogleDriveUrl(url) {
    if (!url || typeof url !== 'string') return '';
    let trimmed = url.trim();
    if (trimmed.includes('drive.google.com')) {
        let match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/file/d/${match[1]}/preview`;
        }
    }
    if (trimmed.includes('docs.google.com')) {
        let match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/file/d/${match[1]}/preview`;
        }
    }
    return trimmed;
}

export default function App() {
    const [activeTab, setActiveTab] = useState('homeTab');
    const [searchInput, setSearchInput] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [savedSubFilter, setSavedSubFilter] = useState('ALL');
    const [aiMessages, setAiMessages] = useState([{ role: 'ai', text: 'Assalam-o-Alaikum Student! 🎓\nMain aap ka ExamInPocket Gemini AI Tutor Chatbot hoon.' }]);
    const [aiPrompt, setAiPrompt] = useState('');
    const [logoClicks, setLogoClicks] = useState(0);
    const logoTimer = useRef(null);
    const [testConfig, setTestConfig] = useState({ category: 'ALL', count: 10 });
    const [testRunning, setTestRunning] = useState(false);
    const [testQuestions, setTestQuestions] = useState([]);
    const [testAnswers, setTestAnswers] = useState({});
    const [testResult, setTestResult] = useState(null);
    const [testSeconds, setTestSeconds] = useState(300);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [readerOpen, setReaderOpen] = useState(false);
    const [readerData, setReaderData] = useState({ title: '', cat: '', type: 'pdf', content: '', url: '' });
    const [siteTicker, setSiteTicker] = useState('📢 <span class="font-bold">Updates:</span> All content loaded from database.');
    const [currentUser, setCurrentUser] = useState(null);
    const [adminLoginForm, setAdminLoginForm] = useState({ email: '', password: '' });

    const [mcqs, setMcqs] = useState([]);
    const [dawnWords, setDawnWords] = useState([]);
    const [headlines, setHeadlines] = useState([]);
    const [articles, setArticles] = useState([]);
    const [library, setLibrary] = useState([]);
    const [savedMcqs, setSavedMcqs] = useState([]);
    const [savedVocab, setSavedVocab] = useState([]);
    const [savedArticles, setSavedArticles] = useState([]);
    const [savedBooks, setSavedBooks] = useState([]);
    const [apiCategories, setApiCategories] = useState([]);
    const [adminMcqForm, setAdminMcqForm] = useState({ category: '', customCategory: '', question: '', opt0: '', opt1: '', opt2: '', opt3: '', answerIndex: 0, explanation: '' });
    const [adminArtForm, setAdminArtForm] = useState({ title: '', category: '', author: '', content: '' });
    const [adminBookForm, setAdminBookForm] = useState({ title: '', category: '', sizeLabel: '', url: '' });
    const [adminVocabForm, setAdminVocabForm] = useState({ word: '', type: 'Word', meaning: '', urdu: '', sentence: '' });
    const [adminManageTab, setAdminManageTab] = useState('MCQS');
    const [tickerInput, setTickerInput] = useState(siteTicker);
    const [editMcq, setEditMcq] = useState(null);
    const [editArticle, setEditArticle] = useState(null);
    const [editBook, setEditBook] = useState(null);
    const [editMcqCat, setEditMcqCat] = useState('');
    const [editMcqCustom, setEditMcqCustom] = useState('');

    useEffect(() => {
        async function load() {
            try {
                const [m, v, h, a, b, c] = await Promise.all([
                    api.get('/mcqs?limit=500').catch(() => ({ items: [] })),
                    api.get('/vocab?limit=500').catch(() => ({ items: [] })),
                    api.get('/headlines?limit=50').catch(() => ({ items: [] })),
                    api.get('/articles?limit=200').catch(() => ({ items: [] })),
                    api.get('/books?limit=200').catch(() => ({ items: [] })),
                    api.get('/mcqs/categories').catch(() => ({ categories: [] }))
                ]);
                setMcqs(m.items || m || []);
                setDawnWords(v.items || v || []);
                setHeadlines(h.items || h || []);
                setArticles(a.items || a || []);
                setLibrary(b.items || b || []);
                setApiCategories(c.categories || []);
            } catch (e) {}
        }
        load();
        api.get('/auth/me').then((res) => {
            if (res?.user) setCurrentUser(res.user);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        if (!testRunning) return;
        const t = setInterval(() => {
            setTestSeconds((s) => {
                if (s <= 1) { clearInterval(t); submitMockTest(); return 0; }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [testRunning]);

    function switchTab(id) { setActiveTab(id); window.scrollTo({ top: 0, behavior: 'smooth' }); }

    function handleLogoClick() {
        setLogoClicks((c) => {
            const nc = c + 1;
            if (logoTimer.current) clearTimeout(logoTimer.current);
            logoTimer.current = setTimeout(() => setLogoClicks(0), 2500);
            if (nc >= 5) {
                setLogoClicks(0);
                switchTab('adminTab');
                showToast('🔒 Admin Portal');
                return 0;
            }
            return nc;
        });
    }

    async function handleAdminLogin() {
        try {
            const res = await api.post('/auth/login', { email: adminLoginForm.email, password: adminLoginForm.password });
            const user = res?.user || res;
            if (user?.role === 'admin') {
                setCurrentUser(user);
                showToast('Admin login successful');
                setActiveTab('adminPanelTab');
            } else if (user) {
                showToast('Access denied - Admin only', 'error');
            } else {
                showToast('Login failed', 'error');
            }
        } catch (e) {
            showToast(e.message || 'Invalid credentials', 'error');
        }
    }

    async function saveMcqFromAdmin() {
        try {
            const cat = adminMcqForm.category === '__NEW_SUBJECT__' ? adminMcqForm.customCategory : adminMcqForm.category;
            if (!adminMcqForm.question || !adminMcqForm.opt0 || !adminMcqForm.opt1 || !adminMcqForm.opt2 || !adminMcqForm.opt3 || !cat) {
                showToast('Please fill all required fields', 'error');
                return;
            }
            await api.post('/mcqs', {
                question: adminMcqForm.question,
                options: [adminMcqForm.opt0, adminMcqForm.opt1, adminMcqForm.opt2, adminMcqForm.opt3],
                answerIndex: Number(adminMcqForm.answerIndex),
                explanation: adminMcqForm.explanation || '',
                category: cat
            });
            showToast('MCQ saved successfully');
            setAdminMcqForm({ category: '', customCategory: '', question: '', opt0: '', opt1: '', opt2: '', opt3: '', answerIndex: 0, explanation: '' });
            const m = await api.get('/mcqs?limit=500').catch(() => ({ items: mcqs }));
            setMcqs(m.items || m || []);
        } catch (e) {
            showToast(e.message || 'Failed to save MCQ', 'error');
        }
    }

    async function saveArticleFromAdmin() {
        try {
            if (!adminArtForm.title || !adminArtForm.content) { showToast('Title and content required', 'error'); return; }
            await api.post('/articles', adminArtForm);
            showToast('Article saved successfully');
            setAdminArtForm({ title: '', category: '', author: '', content: '' });
            const a = await api.get('/articles?limit=200').catch(() => ({ items: articles }));
            setArticles(a.items || a || []);
        } catch (e) {
            showToast(e.message || 'Failed to save article', 'error');
        }
    }

    async function saveBookFromAdmin() {
        try {
            if (!adminBookForm.title || !adminBookForm.url) { showToast('Title and link required', 'error'); return; }
            await api.post('/books', { title: adminBookForm.title, category: adminBookForm.category, sizeLabel: adminBookForm.sizeLabel, url: adminBookForm.url });
            showToast('Book added to library');
            setAdminBookForm({ title: '', category: '', sizeLabel: '', url: '' });
            const b = await api.get('/books?limit=200').catch(() => ({ items: library }));
            setLibrary(b.items || b || []);
        } catch (e) {
            showToast(e.message || 'Failed to save book', 'error');
        }
    }

    async function saveVocabFromAdmin() {
        try {
            if (!adminVocabForm.word || !adminVocabForm.meaning) { showToast('Word and meaning required', 'error'); return; }
            await api.post('/vocab', adminVocabForm);
            showToast('Vocab saved successfully');
            setAdminVocabForm({ word: '', type: 'Word', meaning: '', urdu: '', sentence: '' });
            const v = await api.get('/vocab?limit=500').catch(() => ({ items: dawnWords }));
            setDawnWords(v.items || v || []);
        } catch (e) {
            showToast(e.message || 'Failed to save vocab', 'error');
        }
    }

    async function deleteMcq(id) {
        if (!(await showConfirmModal('Delete MCQ', 'Are you sure?'))) return;
        try {
            await api.delete(`/mcqs/${id}`);
            showToast('MCQ deleted');
            setMcqs(mcqs.filter(m => String(m._id||m.id) !== String(id)));
        } catch (e) { showToast(e.message || 'Failed', 'error'); }
    }

    async function deleteVocab(id) {
        if (!(await showConfirmModal('Delete Vocab', 'Are you sure?'))) return;
        try {
            await api.delete(`/vocab/${id}`);
            showToast('Vocab deleted');
            setDawnWords(dawnWords.filter(w => String(w._id||w.id) !== String(id)));
        } catch (e) { showToast(e.message || 'Failed', 'error'); }
    }

    async function deleteArticle(id) {
        if (!(await showConfirmModal('Delete Article', 'Are you sure?'))) return;
        try {
            await api.delete(`/articles/${id}`);
            showToast('Article deleted');
            setArticles(articles.filter(a => String(a._id||a.id) !== String(id)));
        } catch (e) { showToast(e.message || 'Failed', 'error'); }
    }

    async function deleteBook(id) {
        if (!(await showConfirmModal('Delete Book', 'Are you sure?'))) return;
        try {
            await api.delete(`/books/${id}`);
            showToast('Book deleted');
            setLibrary(library.filter(b => String(b._id||b.id) !== String(id)));
        } catch (e) { showToast(e.message || 'Failed', 'error'); }
    }

    function openEditMcqModal(m) {
        setEditMcq(m);
        const cat = m.category;
        if (catListAll().includes(cat)) { setEditMcqCat(cat); setEditMcqCustom(''); }
        else { setEditMcqCat('__NEW_SUBJECT__'); setEditMcqCustom(cat); }
    }
    function catListAll() { const s=new Set(apiCategories); mcqs.forEach(x=>x.category&&s.add(x.category)); return Array.from(s); }
    async function saveMcqEdits() {
        if (!editMcq) return;
        const cat = editMcqCat === '__NEW_SUBJECT__' ? editMcqCustom : editMcqCat;
        try {
            await api.patch(`/mcqs/${editMcq._id||editMcq.id}`, { question: editMcq.question, options: editMcq.options, answerIndex: Number(editMcq.answerIndex), explanation: editMcq.explanation, category: cat });
            showToast('MCQ updated');
            setEditMcq(null);
            const m = await api.get('/mcqs?limit=500').catch(()=>({items:mcqs}));
            setMcqs(m.items||m||[]);
        } catch(e){ showToast(e.message||'Failed','error'); }
    }
    async function saveArticleEdits() {
        if (!editArticle) return;
        try {
            await api.patch(`/articles/${editArticle._id||editArticle.id}`, editArticle);
            showToast('Article updated');
            setEditArticle(null);
            const a = await api.get('/articles?limit=200').catch(()=>({items:articles}));
            setArticles(a.items||a||[]);
        } catch(e){ showToast(e.message||'Failed','error'); }
    }
    async function saveBookEdits() {
        if (!editBook) return;
        try {
            await api.patch(`/books/${editBook._id||editBook.id}`, editBook);
            showToast('Book updated');
            setEditBook(null);
            const b = await api.get('/books?limit=200').catch(()=>({items:library}));
            setLibrary(b.items||b||[]);
        } catch(e){ showToast(e.message||'Failed','error'); }
    }

    function saveTicker() {
        setSiteTicker(tickerInput);
        showToast('Ticker updated');
    }

    function toggleBookmarkMcq(id) {
        const numId = String(id);
        setSavedMcqs(prev => {
            const exists = prev.includes(numId);
            showToast(exists ? 'MCQ removed from saved.' : 'MCQ saved to favorites!');
            return exists ? prev.filter(i => i !== numId) : [...prev, numId];
        });
    }
    function toggleBookmarkVocab(id) {
        const numId = String(id);
        setSavedVocab(prev => {
            const exists = prev.includes(numId);
            showToast(exists ? 'Vocab removed from saved.' : 'Vocab saved!');
            return exists ? prev.filter(i => i !== numId) : [...prev, numId];
        });
    }
    function toggleBookmarkArticle(id) {
        const numId = String(id);
        setSavedArticles(prev => {
            const exists = prev.includes(numId);
            showToast(exists ? 'Article removed from saved.' : 'Article saved to bookmarks!');
            return exists ? prev.filter(i => i !== numId) : [...prev, numId];
        });
    }
    function toggleBookmarkBook(id) {
        const numId = String(id);
        setSavedBooks(prev => {
            const exists = prev.includes(numId);
            showToast(exists ? 'Book removed from saved.' : 'Book saved to library favorites!');
            return exists ? prev.filter(i => i !== numId) : [...prev, numId];
        });
    }

    const categoryList = useMemo(() => {
        const set = new Set(apiCategories);
        mcqs.forEach((m) => m.category && set.add(m.category));
        return ['ALL', ...Array.from(set)];
    }, [mcqs, apiCategories]);

    const filteredMcqs = useMemo(() => {
        return mcqs.filter((m) => {
            const q = searchInput.toLowerCase();
            const matchesQ = !q || (m.question||'').toLowerCase().includes(q);
            const matchesC = activeCategory === 'ALL' || m.category === activeCategory;
            return matchesQ && matchesC;
        });
    }, [mcqs, searchInput, activeCategory]);

    const totalSaved = savedMcqs.length + savedVocab.length + savedArticles.length + savedBooks.length;

    function checkAnswer(mcqId, selectedOptIndex, cardId) {
        const mcq = mcqs.find((m) => String(m._id || m.id) === String(mcqId));
        if (!mcq) return;
        const card = document.getElementById(cardId);
        if (!card) return;
        const btns = card.querySelectorAll(`.opt-btn-${mcqId}`);
        btns.forEach((btn, idx) => {
            btn.disabled = true;
            if (idx === mcq.answerIndex) {
                btn.classList.add('opt-correct');
            } else if (idx === selectedOptIndex) {
                btn.classList.add('opt-wrong');
            }
        });
        const exp = document.getElementById(`explanation-${mcqId}`);
        if (exp) exp.classList.remove('hidden');
    }

    function startMockTest() {
        let eligible = testConfig.category === 'ALL' ? mcqs : mcqs.filter((m) => m.category === testConfig.category);
        if (eligible.length === 0) eligible = mcqs;
        let shuffled = [...eligible].sort(() => 0.5 - Math.random());
        const questions = shuffled.slice(0, testConfig.count);
        setTestQuestions(questions);
        setTestAnswers({});
        setTestResult(null);
        setTestSeconds(testConfig.count * 60);
        setTestRunning(true);
        switchTab('testTab');
    }

    function selectTestOption(mcqId, optIdx, btn) {
        setTestAnswers((p) => ({ ...p, [mcqId]: optIdx }));
        const card = btn.closest('.test-q');
        if (!card) return;
        card.querySelectorAll(`.test-opt-${mcqId}`).forEach((b) => b.classList.remove('bg-indigo-900', 'text-white'));
        btn.classList.add('bg-indigo-900', 'text-white');
    }

    function submitMockTest() {
        setTestRunning(false);
        let correct = 0;
        testQuestions.forEach((q) => {
            if (testAnswers[q._id || q.id] === q.answerIndex) correct++;
        });
        const total = testQuestions.length;
        const wrong = total - correct;
        const percentage = Math.round((correct / Math.max(total, 1)) * 100);
        setTestResult({ total, correct, wrong, percentage });
    }

    function resetMockTest() { setTestRunning(false); setTestResult(null); setTestQuestions([]); setTestAnswers({}); }

    async function sendAiChatMessage(prefill = null) {
        const msg = prefill || aiPrompt;
        if (!msg.trim()) return;
        setAiMessages((p) => [...p, { role: 'user', text: msg }]);
        setAiPrompt('');
        setTimeout(() => {
            setAiMessages((p) => [...p, { role: 'ai', text: 'AI Tutor response is available with Gemini API key configured in Admin.' }]);
        }, 400);
    }

    function clearAiChat() { setAiMessages([{ role: 'ai', text: 'Assalam-o-Alaikum Student! 🎓\nMain aap ka ExamInPocket Gemini AI Tutor Chatbot hoon.' }]); }

    function openArticleReader(artId) {
        const art = articles.find((a) => String(a._id || a.id) === String(artId));
        if (!art) return;
        setReaderData({ title: art.title, cat: `Editorial Essay • ${art.category}`, type: 'text', content: art.content });
        setReaderOpen(true);
    }

    function openReaderModal(bookId) {
        const item = library.find((b) => String(b._id || b.id) === String(bookId));
        if (!item) return;
        const targetUrl = item.url || item.downloadUrl || '';
        if (!targetUrl) { showToast('No link available', 'error'); return; }
        const embedUrl = formatGoogleDriveUrl(targetUrl);
        setReaderData({ title: item.title, cat: `ExamInPocket Library • ${item.category || item.cat}`, type: 'pdf', content: embedUrl || targetUrl, url: targetUrl });
        setReaderOpen(true);
    }

    function downloadBook(bookId) {
        const item = library.find((b) => String(b._id || b.id) === String(bookId));
        const url = item?.url || item?.downloadUrl || '';
        if (url) window.open(url, '_blank');
        else showToast('No download link', 'error');
    }

    const savedM = mcqs.filter((m) => savedMcqs.includes(String(m._id || m.id)));
    const savedV = dawnWords.filter((w) => savedVocab.includes(String(w._id || w.id)));
    const savedA = articles.filter((a) => savedArticles.includes(String(a._id || a.id)));
    const savedB = library.filter((b) => savedBooks.includes(String(b._id || b.id)));

    return (
        <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 relative">
            <div id="toastContainer" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 no-print pointer-events-none"></div>
            <div id="confirmModal" className="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
                <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 text-center">
                    <h3 id="confirmModalTitle" className="text-base font-bold text-slate-900">Are you sure?</h3>
                    <p id="confirmModalText" className="text-xs text-slate-500">This action cannot be undone.</p>
                    <div className="flex gap-2 pt-2">
                        <button onClick={() => closeConfirmModal(false)} className="w-1/2 bg-slate-100 text-slate-700 font-bold py-2 rounded-lg text-xs">Cancel</button>
                        <button onClick={() => closeConfirmModal(true)} className="w-1/2 bg-rose-600 text-white font-bold py-2 rounded-lg text-xs">Confirm</button>
                    </div>
                </div>
            </div>

            {editMcq && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={()=>setEditMcq(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-lg"></i></button>
                        <h3 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-2"><i className="fa-solid fa-pen-to-square text-amber-500"></i> Edit MCQ Question</h3>
                        <div className="space-y-3 text-xs sm:text-sm">
                            <div><label className="block font-bold text-slate-700 mb-1">Subject Category</label><select value={editMcqCat} onChange={(e)=>setEditMcqCat(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50">{catListAll().map(c=><option key={c}>{c}</option>)}<option value="__NEW_SUBJECT__">➕ Add New / Custom Subject...</option></select>{editMcqCat==='__NEW_SUBJECT__' && <input type="text" value={editMcqCustom} onChange={(e)=>setEditMcqCustom(e.target.value)} className="w-full p-2.5 border border-amber-300 rounded-lg mt-2" />}</div>
                            <div><label className="block font-bold text-slate-700 mb-1">Question Statement</label><textarea value={editMcq.question} onChange={(e)=>setEditMcq({...editMcq,question:e.target.value})} rows="2" className="w-full p-2.5 border border-slate-300 rounded-lg"></textarea></div>
                            <div className="grid grid-cols-2 gap-2"><input type="text" value={editMcq.options?.[0]||''} onChange={(e)=>{const o=[...(editMcq.options||[])];o[0]=e.target.value;setEditMcq({...editMcq,options:o});}} className="p-2 border rounded-lg" /><input type="text" value={editMcq.options?.[1]||''} onChange={(e)=>{const o=[...(editMcq.options||[])];o[1]=e.target.value;setEditMcq({...editMcq,options:o});}} className="p-2 border rounded-lg" /><input type="text" value={editMcq.options?.[2]||''} onChange={(e)=>{const o=[...(editMcq.options||[])];o[2]=e.target.value;setEditMcq({...editMcq,options:o});}} className="p-2 border rounded-lg" /><input type="text" value={editMcq.options?.[3]||''} onChange={(e)=>{const o=[...(editMcq.options||[])];o[3]=e.target.value;setEditMcq({...editMcq,options:o});}} className="p-2 border rounded-lg" /></div>
                            <div><label className="block font-bold text-slate-700 mb-1">Correct Answer</label><select value={editMcq.answerIndex} onChange={(e)=>setEditMcq({...editMcq,answerIndex:Number(e.target.value)})} className="w-full p-2.5 border border-slate-300 rounded-lg"><option value={0}>Option A</option><option value={1}>Option B</option><option value={2}>Option C</option><option value={3}>Option D</option></select></div>
                            <div><label className="block font-bold text-slate-700 mb-1">Explanation</label><input type="text" value={editMcq.explanation||''} onChange={(e)=>setEditMcq({...editMcq,explanation:e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg" /></div>
                            <button onClick={saveMcqEdits} className="w-full bg-slate-900 text-amber-400 font-bold py-2.5 rounded-lg">Save MCQ Updates</button>
                        </div>
                    </div>
                </div>
            )}

            {editArticle && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={()=>setEditArticle(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-lg"></i></button>
                        <h3 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-2"><i className="fa-solid fa-file-pen text-amber-600"></i> Edit Article</h3>
                        <div className="space-y-3 text-xs sm:text-sm">
                            <input type="text" value={editArticle.title||''} onChange={(e)=>setEditArticle({...editArticle,title:e.target.value})} placeholder="Title" className="w-full p-2.5 border rounded-lg" />
                            <div className="grid grid-cols-2 gap-2"><input type="text" value={editArticle.category||''} onChange={(e)=>setEditArticle({...editArticle,category:e.target.value})} placeholder="Category" className="w-full p-2.5 border rounded-lg" /><input type="text" value={editArticle.author||''} onChange={(e)=>setEditArticle({...editArticle,author:e.target.value})} placeholder="Author" className="w-full p-2.5 border rounded-lg" /></div>
                            <textarea rows="6" value={editArticle.content||''} onChange={(e)=>setEditArticle({...editArticle,content:e.target.value})} className="w-full p-2.5 border rounded-lg font-mono text-xs"></textarea>
                            <button onClick={saveArticleEdits} className="w-full bg-amber-500 text-slate-950 font-bold py-2.5 rounded-lg">Save Article Updates</button>
                        </div>
                    </div>
                </div>
            )}

            {editBook && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 relative">
                        <button onClick={()=>setEditBook(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-lg"></i></button>
                        <h3 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-2"><i className="fa-solid fa-pen-to-square text-indigo-600"></i> Edit Book Details</h3>
                        <div className="space-y-3 text-xs sm:text-sm">
                            <input type="text" value={editBook.title||''} onChange={(e)=>setEditBook({...editBook,title:e.target.value})} className="w-full p-2.5 border rounded-lg" placeholder="Title" />
                            <input type="text" value={editBook.category||editBook.cat||''} onChange={(e)=>setEditBook({...editBook,category:e.target.value})} className="w-full p-2.5 border rounded-lg" placeholder="Category" />
                            <input type="text" value={editBook.sizeLabel||editBook.size||''} onChange={(e)=>setEditBook({...editBook,sizeLabel:e.target.value})} className="w-full p-2.5 border rounded-lg" placeholder="Size" />
                            <input type="text" value={editBook.url||''} onChange={(e)=>setEditBook({...editBook,url:e.target.value})} className="w-full p-2.5 border rounded-lg" placeholder="Link" />
                            <button onClick={saveBookEdits} className="w-full bg-indigo-900 text-white font-bold py-2.5 rounded-lg">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md no-print">
                <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-2">
                    <div onClick={handleLogoClick} className="flex items-center gap-3 cursor-pointer select-none" title="ExamInPocket Portal (Click 5 times for Admin Portal)">
                        <div className="bg-amber-400 text-slate-950 font-extrabold text-xl px-3 py-1.5 rounded-xl">EiP</div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-white">ExamInPocket<span className="text-amber-400">.com</span></h1>
                            <p className="text-xs text-slate-400">FPSC • PPSC • SPSC • CSS • PMS • CCE</p>
                        </div>
                    </div>
                    <nav className="flex flex-wrap items-center gap-1 text-xs sm:text-sm font-medium">
                        <button onClick={() => switchTab('homeTab')} className={`nav-link px-3 py-2 rounded-lg hover:bg-slate-800 transition ${activeTab === 'homeTab' ? 'active-link' : ''}`}><i className="fa-solid fa-house mr-1"></i> Home</button>
                        <button onClick={() => switchTab('testTab')} className={`nav-link px-3 py-2 rounded-lg hover:bg-slate-800 transition ${activeTab === 'testTab' ? 'active-link' : ''}`}><i className="fa-solid fa-stopwatch mr-1"></i> Mock Test</button>
                        <button onClick={() => switchTab('dawnTab')} className={`nav-link px-3 py-2 rounded-lg hover:bg-slate-800 transition ${activeTab === 'dawnTab' ? 'active-link' : ''}`}><i className="fa-solid fa-newspaper mr-1"></i> Dawn Vocab</button>
                        <button onClick={() => switchTab('articlesTab')} className={`nav-link px-3 py-2 rounded-lg hover:bg-slate-800 transition ${activeTab === 'articlesTab' ? 'active-link' : ''}`}><i className="fa-solid fa-file-lines mr-1"></i> Articles</button>
                        <button onClick={() => switchTab('libraryTab')} className={`nav-link px-3 py-2 rounded-lg hover:bg-slate-800 transition ${activeTab === 'libraryTab' ? 'active-link' : ''}`}><i className="fa-solid fa-book-open mr-1"></i> Library</button>
                        <button onClick={() => switchTab('savedTab')} className={`nav-link px-3 py-2 rounded-lg hover:bg-slate-800 transition ${activeTab === 'savedTab' ? 'active-link' : ''}`}><i className="fa-solid fa-bookmark mr-1"></i> Favorite</button>
                        <button onClick={() => switchTab('aiTab')} className={`nav-link px-3 py-2 rounded-lg bg-indigo-900 text-amber-300 hover:bg-indigo-800 transition border border-indigo-700 ${activeTab === 'aiTab' ? 'active-link' : ''}`}><i className="fa-solid fa-robot mr-1"></i> AI Tutor</button>
                        <button onClick={() => setAuthModalOpen(true)} className="bg-amber-400 text-slate-950 font-semibold px-3 py-2 rounded-lg hover:bg-amber-300 transition ml-1"><i className="fa-solid fa-user mr-1"></i> Login</button>
                    </nav>
                </div>
            </header>

            <div className="bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 border-b border-amber-300 text-amber-950 py-2.5 px-4 text-xs font-semibold overflow-hidden no-print shadow-inner flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full font-extrabold shrink-0 text-[11px]">UPDATES</div>
                <div className="w-full overflow-hidden relative flex items-center"><div className="ticker-marquee-content" dangerouslySetInnerHTML={{ __html: siteTicker }}></div></div>
            </div>

            {readerOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-6 no-print">
                    <div className="bg-white w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative">
                        <div className="bg-slate-900 text-white p-3 sm:p-4 flex justify-between items-center border-b border-slate-800 gap-2">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="bg-amber-400 text-slate-950 p-2 rounded-xl"><i className="fa-solid fa-book-reader"></i></div>
                                <div className="truncate"><h3 className="font-bold text-xs sm:text-base truncate">{readerData.title}</h3><p className="text-[10px] sm:text-xs text-amber-400">{readerData.cat}</p></div>
                            </div>
                            <button onClick={() => setReaderOpen(false)} className="text-slate-400 hover:text-white"><i className="fa-solid fa-xmark text-lg"></i></button>
                        </div>
                        <div className="flex-grow bg-slate-100 p-2 sm:p-4">
                            {readerData.type === 'pdf' && readerData.content ? <iframe src={formatGoogleDriveUrl(readerData.content) || readerData.content} className="w-full h-full rounded-xl border border-slate-300 bg-white" allow="autoplay"></iframe> : <div className="w-full max-w-4xl h-full bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm overflow-y-auto"><div className="whitespace-pre-line text-slate-800 leading-relaxed text-xs sm:text-sm">{readerData.content}</div></div>}
                        </div>
                    </div>
                </div>
            )}

            {authModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 relative">
                        <button onClick={() => setAuthModalOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-lg"></i></button>
                        <h3 className="text-xl font-bold text-slate-900">Student Account</h3>
                        <div className="space-y-3"><input type="email" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Email" /><input type="password" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Password" /><button onClick={() => { setAuthModalOpen(false); showToast('Login'); }} className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg text-sm">Login / Register</button></div>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 py-6 flex-grow w-full space-y-6">
                {activeTab === 'homeTab' && (
                    <section className="space-y-6">
                        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-800 space-y-4">
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Prepare for <span className="text-amber-400">CSS, PMS, PCS, CCE</span> & All Competitive Exams</h2>
                            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">Access thousands of verified MCQs, solved past papers, Dawn vocabulary, editorial articles, and AI-powered study guides.</p>
                            <div className="relative w-full max-w-3xl"><i className="fa-solid fa-magnifying-glass absolute left-4 top-3.5 text-slate-400"></i><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search questions, subjects, amendments, rivers, foreign words..." className="w-full pl-11 pr-4 py-3 rounded-xl border-0 text-slate-900 text-sm focus:ring-2 focus:ring-amber-400 outline-none shadow-inner" /></div>
                            <div className="flex flex-wrap gap-2 pt-2">{categoryList.map((cat) => (<button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm transition ${activeCategory === cat ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}>{cat}</button>))}</div>
                        </div>
                        <div className="space-y-4">{filteredMcqs.map((mcq) => {
                            const mcqId = mcq._id || mcq.id;
                            const cardId = `mcq-card-${mcqId}`;
                            const isSaved = savedMcqs.includes(String(mcqId));
                            return (
                                <div key={mcqId} id={cardId} className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4 ${mcq.isNew ? 'new-card-glow' : ''}`}>
                                    <div className="flex justify-between items-center"><span className="bg-indigo-100 text-indigo-900 text-[11px] font-bold px-2.5 py-1 rounded-lg">{mcq.category}</span><button onClick={() => toggleBookmarkMcq(mcqId)} className="text-slate-400 hover:text-amber-500 transition"><i className={`${isSaved ? 'fa-solid text-amber-500' : 'fa-regular'} fa-bookmark text-base`}></i></button></div>
                                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">{mcq.question}</h3>
                                    <div className="grid sm:grid-cols-2 gap-2.5">{(mcq.options||[]).map((opt, optIdx) => (<button key={optIdx} onClick={() => checkAnswer(mcqId, optIdx, cardId)} className={`opt-btn-${mcqId} w-full text-left p-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-indigo-300 transition text-xs sm:text-sm flex items-center justify-between`}><span>{String.fromCharCode(65 + optIdx)}) {opt}</span><i className="fa-regular fa-circle text-slate-300 opt-icon"></i></button>))}</div>
                                    <div id={`explanation-${mcqId}`} className="hidden bg-indigo-50 p-3.5 rounded-xl text-xs text-indigo-950 border border-indigo-100 space-y-1"><p><strong>Explanation:</strong> {mcq.explanation}</p></div>
                                </div>
                            );
                        })}</div>
                    </section>
                )}

                {activeTab === 'testTab' && (
                    <section className="tab-content active space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            {!testRunning && !testResult && (
                                <>
                                    <div className="border-b pb-4 mb-6"><h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><i className="fa-solid fa-stopwatch text-indigo-600"></i> Online Timed Mock Test Engine</h2><p className="text-xs text-slate-500 mt-1">Practice under real examination conditions.</p></div>
                                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                                        <div><label className="block text-xs font-bold text-slate-700 mb-1">Select Subject / Field</label><select value={testConfig.category} onChange={(e) => setTestConfig((p) => ({ ...p, category: e.target.value }))} className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"><option value="ALL">All Combined Subjects Mix</option>{categoryList.filter((c) => c !== 'ALL').map((cat) => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                                        <div><label className="block text-xs font-bold text-slate-700 mb-1">Question Count</label><select value={testConfig.count} onChange={(e) => setTestConfig((p) => ({ ...p, count: Number(e.target.value) }))} className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"><option value={5}>5 Questions</option><option value={10}>10 Questions</option><option value={20}>20 Questions</option><option value={30}>30 Questions</option></select></div>
                                        <div className="flex items-end"><button onClick={startMockTest} className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-bold py-2.5 px-4 rounded-lg transition text-sm flex items-center justify-center gap-2"><i className="fa-solid fa-play"></i> Start Timed Test</button></div>
                                    </div>
                                </>
                            )}
                            {testRunning && (
                                <div className="space-y-6">
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 flex justify-between items-center"><div><span className="text-xs font-bold text-indigo-700">Exam Mode Active</span><h3 className="text-sm font-bold text-indigo-950">Questions: {testQuestions.length}</h3></div><div className="bg-slate-900 text-amber-400 px-4 py-2 rounded-xl font-mono font-bold text-lg">{String(Math.floor(testSeconds / 60)).padStart(2, '0')}:{String(testSeconds % 60).padStart(2, '0')}</div></div>
                                    <div className="space-y-6">{testQuestions.map((q, qIdx) => (<div key={q._id || q.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 test-q"><h4 className="font-bold text-slate-900 text-xs sm:text-sm">Q{qIdx + 1}: {q.question}</h4><div className="grid sm:grid-cols-2 gap-2">{(q.options||[]).map((opt, oIdx) => (<button key={oIdx} onClick={(e) => selectTestOption(q._id || q.id, oIdx, e.currentTarget)} className={`test-opt-${q._id || q.id} text-left p-2.5 rounded-lg border border-slate-200 hover:bg-indigo-50 text-xs transition`}>{String.fromCharCode(65 + oIdx)}) {opt}</button>))}</div></div>))}</div>
                                    <button onClick={submitMockTest} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-6 rounded-xl text-sm shadow-md transition">Submit Test</button>
                                </div>
                            )}
                            {testResult && (
                                <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6">
                                    <div className="text-center space-y-2"><h3 className="text-2xl font-black text-slate-900">Test Completed</h3><div className="text-5xl font-black text-indigo-700">{testResult.correct} / {testResult.total}</div><p className="text-sm font-semibold text-slate-700">Score: {testResult.percentage}%</p></div>
                                    <div className="text-center"><button onClick={resetMockTest} className="bg-indigo-900 text-white font-semibold px-8 py-3 rounded-xl text-xs sm:text-sm">Take Another Test</button></div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {activeTab === 'dawnTab' && (
                    <section className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><i className="fa-solid fa-newspaper text-indigo-600"></i> Daily Dawn Editorial Vocabulary & Headlines</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">{dawnWords.map((w, i) => { const id = w._id || w.id || i; const isSaved = savedVocab.includes(String(id)); return (<div key={id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2"><div className="flex justify-between items-start"><p className="font-bold text-indigo-950">{w.word} <span className="text-slate-400">({w.type})</span></p><button onClick={() => toggleBookmarkVocab(id)} className="text-slate-400 hover:text-amber-500"><i className={`${isSaved ? 'fa-solid text-amber-500' : 'fa-regular'} fa-bookmark`}></i></button></div><p className="text-slate-700"><strong>Urdu:</strong> {w.urdu}</p><p className="text-slate-600"><strong>Meaning:</strong> {w.meaning}</p><p className="text-slate-500 italic">"{w.sentence}"</p></div>); })}</div>
                                <div><h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2"><i className="fa-solid fa-bullhorn text-amber-500"></i> Top National Headlines</h3><div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><ul className="list-disc pl-5 text-xs sm:text-sm text-slate-700 space-y-2">{headlines.map((h, i) => <li key={i}>{h.title || h}</li>)}</ul></div></div>
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'articlesTab' && (
                    <section className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><i className="fa-solid fa-file-pen text-amber-600"></i> Editorial Articles</h2>
                            <div className="grid md:grid-cols-2 gap-4">{articles.map((art, i) => { const id = art._id || art.id || i; const isSaved = savedArticles.includes(String(id)); return (<div key={id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3"><div className="flex justify-between items-center"><span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">{art.category}</span><button onClick={() => toggleBookmarkArticle(id)} className="text-slate-400 hover:text-amber-500"><i className={`${isSaved ? 'fa-solid text-amber-500' : 'fa-regular'} fa-bookmark`}></i></button></div><h3 className="font-bold text-slate-900 text-sm">{art.title}</h3><p className="text-[11px] text-slate-500">By {art.author}</p><button onClick={() => { setReaderData({ title: art.title, cat: `Editorial Essay • ${art.category}`, type: 'text', content: art.content }); setReaderOpen(true); }} className="bg-slate-900 text-amber-400 hover:bg-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg transition"><i className="fa-solid fa-eye mr-1"></i> Read Full Essay / Article</button></div>); })}</div>
                        </div>
                    </section>
                )}

                {activeTab === 'libraryTab' && (
                    <section className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><i className="fa-solid fa-book-open text-indigo-600"></i> PDF Notes & Books Library</h2>
                            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">{library.map((item, i) => { const id = item._id || item.id || i; const isSaved = savedBooks.includes(String(id)); return (<div key={id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3"><div><div className="flex justify-between items-start"><span className="text-[10px] font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded">{item.category || item.cat}</span><button onClick={() => toggleBookmarkBook(id)} className="text-slate-400 hover:text-amber-500"><i className={`${isSaved ? 'fa-solid text-amber-500' : 'fa-regular'} fa-bookmark`}></i></button></div><h4 className="font-bold text-slate-900 mt-2">{item.title}</h4><p className="text-slate-400 text-xs">{item.sizeLabel || item.size}</p></div><div className="grid grid-cols-2 gap-2"><button onClick={() => openReaderModal(id)} className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-2 rounded-lg text-xs">Read Online</button><button onClick={() => downloadBook(id)} className="bg-indigo-900 hover:bg-indigo-800 text-white font-semibold py-2 rounded-lg text-xs">Download</button></div></div>); })}</div>
                        </div>
                    </section>
                )}

                {activeTab === 'savedTab' && (
                    <section className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="border-b pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div><h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><i className="fa-solid fa-bookmark mr-1"></i> Favorite</h2></div><div className="flex gap-2"><button onClick={() => setSavedSubFilter('ALL')} className={`px-3 py-1 rounded-lg text-xs ${savedSubFilter === 'ALL' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-100 text-slate-700'}`}>All</button><button onClick={() => setSavedSubFilter('MCQS')} className={`px-3 py-1 rounded-lg text-xs ${savedSubFilter === 'MCQS' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-100 text-slate-700'}`}>MCQs</button><button onClick={() => setSavedSubFilter('VOCAB')} className={`px-3 py-1 rounded-lg text-xs ${savedSubFilter === 'VOCAB' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-100 text-slate-700'}`}>Vocab</button><button onClick={() => setSavedSubFilter('ARTICLES')} className={`px-3 py-1 rounded-lg text-xs ${savedSubFilter === 'ARTICLES' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-100 text-slate-700'}`}>Articles</button><button onClick={() => setSavedSubFilter('BOOKS')} className={`px-3 py-1 rounded-lg text-xs ${savedSubFilter === 'BOOKS' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-100 text-slate-700'}`}>Books</button></div></div>
                            <div className="space-y-6">
                                {(savedSubFilter === 'ALL' || savedSubFilter === 'MCQS') && savedM.length > 0 && <div className="space-y-3"><h3 className="font-bold text-slate-800 text-sm">Saved MCQs ({savedM.length})</h3>{savedM.map((m) => { const id = m._id || m.id; return (<div key={id} className="bg-slate-50 p-4 rounded-xl border border-slate-200"><div className="flex justify-between items-center mb-2"><span className="bg-indigo-100 text-indigo-900 text-[10px] font-bold px-2 py-0.5 rounded">{m.category}</span><button onClick={() => toggleBookmarkMcq(id)} className="text-rose-600 text-xs font-bold">Remove</button></div><p className="font-bold text-slate-900 text-xs">{m.question}</p></div>); })}</div>}
                                {(savedSubFilter === 'ALL' || savedSubFilter === 'VOCAB') && savedV.length > 0 && <div className="space-y-3"><h3 className="font-bold text-slate-800 text-sm">Saved Vocab ({savedV.length})</h3>{savedV.map((w, i) => { const id = w._id || w.id || i; return (<div key={id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs"><div><strong className="text-indigo-950">{w.word}</strong> - {w.urdu}</div><button onClick={() => toggleBookmarkVocab(id)} className="text-rose-600 font-bold">Remove</button></div>); })}</div>}
                                {(savedSubFilter === 'ALL' || savedSubFilter === 'ARTICLES') && savedA.length > 0 && <div className="space-y-3"><h3 className="font-bold text-slate-800 text-sm">Saved Articles ({savedA.length})</h3>{savedA.map((a, i) => { const id = a._id || a.id || i; return (<div key={id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs"><div><strong className="text-slate-900">{a.title}</strong></div><button onClick={() => toggleBookmarkArticle(id)} className="text-rose-600 font-bold">Remove</button></div>); })}</div>}
                                {(savedSubFilter === 'ALL' || savedSubFilter === 'BOOKS') && savedB.length > 0 && <div className="space-y-3"><h3 className="font-bold text-slate-800 text-sm">Saved Books ({savedB.length})</h3>{savedB.map((b, i) => { const id = b._id || b.id || i; return (<div key={id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs"><div><strong className="text-slate-900">{b.title}</strong></div><button onClick={() => toggleBookmarkBook(id)} className="text-rose-600 font-bold">Remove</button></div>); })}</div>}
                                {savedM.length === 0 && savedV.length === 0 && savedA.length === 0 && savedB.length === 0 && <div className="bg-slate-50 p-8 text-center text-slate-500 rounded-2xl border border-slate-200 text-xs">No saved items yet.</div>}
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'aiTab' && (
                    <section className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="border-b pb-4 mb-4 flex justify-between items-center"><div><h2 className="text-xl font-bold text-slate-900">Gemini AI Exam Tutor Chatbot</h2></div><button onClick={clearAiChat} className="text-xs text-slate-500">Clear Chat</button></div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 min-h-[380px] max-h-[500px] overflow-y-auto space-y-4 shadow-inner">{aiMessages.map((m,i)=>(<div key={i} className={`flex gap-3 ${m.role==='user'?'justify-end':''}`}>{m.role==='ai' && <div className="bg-indigo-900 text-amber-400 p-2 rounded-xl"><i className="fa-solid fa-robot"></i></div>}<div className={`${m.role==='user'?'bg-indigo-900 text-white':'bg-white'} p-4 rounded-2xl text-xs sm:text-sm whitespace-pre-line max-w-2xl`}>{m.text}</div></div>))}</div>
                            <div className="mt-4 flex gap-2"><textarea value={aiPrompt} onChange={(e)=>setAiPrompt(e.target.value)} rows="2" placeholder="Type your question..." className="flex-grow p-3 border border-slate-300 rounded-xl text-xs"></textarea><button onClick={()=>sendAiChatMessage()} className="bg-indigo-900 hover:bg-indigo-800 text-amber-300 font-bold px-5 rounded-xl text-xs">Send</button></div>
                        </div>
                    </section>
                )}

                {activeTab === 'adminTab' && (
                    <section className="space-y-6">
                        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md mx-auto space-y-4">
                            <div className="text-center space-y-2"><div className="bg-indigo-100 text-indigo-900 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-xl"><i className="fa-solid fa-user-lock"></i></div><h3 className="text-xl font-bold text-slate-900">Admin Portal</h3><p className="text-xs text-slate-500">Login with admin credentials</p></div>
                            <div className="space-y-3 text-xs sm:text-sm">
                                <input type="email" placeholder="Email" value={adminLoginForm.email} onChange={(e)=>setAdminLoginForm(p=>({...p,email:e.target.value}))} className="w-full p-2.5 border border-slate-300 rounded-lg" />
                                <input type="password" placeholder="Password" value={adminLoginForm.password} onChange={(e)=>setAdminLoginForm(p=>({...p,password:e.target.value}))} className="w-full p-2.5 border border-slate-300 rounded-lg" />
                                <button onClick={handleAdminLogin} className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold py-2.5 rounded-lg">Login</button>
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'adminPanelTab' && currentUser?.role === 'admin' && (
                    <section className="space-y-6">
                        <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div className="flex items-center gap-3">
                                <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md">AUTHENTICATED ADMIN</span>
                                <div><h3 className="font-bold text-sm sm:text-base">ExamInPocket Control Panel</h3><p className="text-xs text-slate-400">Manage MCQs, Dawn Vocab, Articles, Library Books & AI Key</p></div>
                            </div>
                            <button onClick={()=>{setCurrentUser(null); setActiveTab('homeTab'); api.post('/auth/logout').catch(()=>{});}} className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"><i className="fa-solid fa-right-from-bracket"></i> Logout</button>
                        </div>

                        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 space-y-3">
                            <h4 className="font-bold text-amber-950 text-sm flex items-center gap-2"><i className="fa-solid fa-key text-amber-600"></i> AI Tutor Key Settings (1-Time Setup)</h4>
                            <p className="text-xs text-amber-800 leading-relaxed">Enter your <strong>Free Gemini API Key</strong> from <strong>aistudio.google.com</strong>.</p>
                            <div className="flex flex-col sm:flex-row gap-2"><input type="password" className="flex-grow p-2.5 border border-amber-300 rounded-lg text-xs bg-white" placeholder="Paste Gemini API Key (AIzaSy...)" /><button className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition">Save AI Key</button></div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-2"><i className="fa-solid fa-bullhorn text-amber-600"></i> Ticker / Announcement Bar</h3>
                            <input value={tickerInput} onChange={(e)=>setTickerInput(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-xs" />
                            <button onClick={saveTicker} className="bg-slate-900 text-white font-bold px-4 py-2 rounded-lg text-xs">Update Ticker</button>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-2"><i className="fa-solid fa-plus-circle text-emerald-600"></i> 1. Add / Create MCQ Question</h3>
                            <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                                <div><label className="block font-bold text-slate-700 mb-1">Subject Field / Category</label><select value={adminMcqForm.category} onChange={(e)=>setAdminMcqForm(p=>({...p,category:e.target.value}))} className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50">{categoryList.filter(c=>c!=='ALL').map(c=><option key={c}>{c}</option>)}<option value="__NEW_SUBJECT__">➕ Add New / Custom Subject...</option></select>{adminMcqForm.category==='__NEW_SUBJECT__' && <input type="text" value={adminMcqForm.customCategory} onChange={(e)=>setAdminMcqForm(p=>({...p,customCategory:e.target.value}))} placeholder="Type new subject name" className="w-full p-2.5 border border-amber-300 rounded-lg mt-2" />}</div>
                                <div><label className="block font-bold text-slate-700 mb-1">Question Statement</label><input type="text" value={adminMcqForm.question} onChange={(e)=>setAdminMcqForm(p=>({...p,question:e.target.value}))} placeholder="Enter full question..." className="w-full p-2.5 border border-slate-300 rounded-lg" /></div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-2 text-xs"><input type="text" value={adminMcqForm.opt0} onChange={(e)=>setAdminMcqForm(p=>({...p,opt0:e.target.value}))} placeholder="Option A" className="p-2 border rounded-lg" /><input type="text" value={adminMcqForm.opt1} onChange={(e)=>setAdminMcqForm(p=>({...p,opt1:e.target.value}))} placeholder="Option B" className="p-2 border rounded-lg" /><input type="text" value={adminMcqForm.opt2} onChange={(e)=>setAdminMcqForm(p=>({...p,opt2:e.target.value}))} placeholder="Option C" className="p-2 border rounded-lg" /><input type="text" value={adminMcqForm.opt3} onChange={(e)=>setAdminMcqForm(p=>({...p,opt3:e.target.value}))} placeholder="Option D" className="p-2 border rounded-lg" /></div>
                            <div className="grid sm:grid-cols-2 gap-3 text-xs"><div><label className="block font-bold text-slate-700 mb-1">Correct Answer</label><select value={adminMcqForm.answerIndex} onChange={(e)=>setAdminMcqForm(p=>({...p,answerIndex:Number(e.target.value)}))} className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50"><option value={0}>Option A</option><option value={1}>Option B</option><option value={2}>Option C</option><option value={3}>Option D</option></select></div><div><label className="block font-bold text-slate-700 mb-1">Explanation</label><input type="text" value={adminMcqForm.explanation} onChange={(e)=>setAdminMcqForm(p=>({...p,explanation:e.target.value}))} placeholder="Explanation detail..." className="w-full p-2.5 border border-slate-300 rounded-lg" /></div></div>
                            <button onClick={saveMcqFromAdmin} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-lg text-xs"><i className="fa-solid fa-save mr-1"></i> Save MCQ Question</button>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-2"><i className="fa-solid fa-pen-fancy text-amber-600"></i> 2. Add Editorial Article / Essay Outline</h3>
                            <div className="grid sm:grid-cols-3 gap-3 text-xs"><input type="text" value={adminArtForm.title} onChange={(e)=>setAdminArtForm(p=>({...p,title:e.target.value}))} placeholder="Article Title" className="p-2.5 border rounded-lg" /><input type="text" value={adminArtForm.category} onChange={(e)=>setAdminArtForm(p=>({...p,category:e.target.value}))} placeholder="Subject / Category" className="p-2.5 border rounded-lg" /><input type="text" value={adminArtForm.author} onChange={(e)=>setAdminArtForm(p=>({...p,author:e.target.value}))} placeholder="Author Name" className="p-2.5 border rounded-lg" /></div>
                            <textarea rows="4" value={adminArtForm.content} onChange={(e)=>setAdminArtForm(p=>({...p,content:e.target.value}))} placeholder="Full article content / Essay outline..." className="w-full p-3 border rounded-xl text-xs"></textarea>
                            <button onClick={saveArticleFromAdmin} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs"><i className="fa-solid fa-file-circle-plus mr-1"></i> Save Article / Essay</button>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-2"><i className="fa-solid fa-newspaper text-indigo-600"></i> Add Dawn Vocab</h3>
                            <div className="grid sm:grid-cols-5 gap-2 text-xs"><input type="text" value={adminVocabForm.word} onChange={(e)=>setAdminVocabForm(p=>({...p,word:e.target.value}))} placeholder="Word" className="p-2.5 border rounded-lg" /><input type="text" value={adminVocabForm.type} onChange={(e)=>setAdminVocabForm(p=>({...p,type:e.target.value}))} placeholder="Type" className="p-2.5 border rounded-lg" /><input type="text" value={adminVocabForm.urdu} onChange={(e)=>setAdminVocabForm(p=>({...p,urdu:e.target.value}))} placeholder="Urdu" className="p-2.5 border rounded-lg" /><input type="text" value={adminVocabForm.meaning} onChange={(e)=>setAdminVocabForm(p=>({...p,meaning:e.target.value}))} placeholder="Meaning" className="p-2.5 border rounded-lg" /><input type="text" value={adminVocabForm.sentence} onChange={(e)=>setAdminVocabForm(p=>({...p,sentence:e.target.value}))} placeholder="Sentence" className="p-2.5 border rounded-lg" /></div>
                            <button onClick={saveVocabFromAdmin} className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold px-6 py-2.5 rounded-lg text-xs"><i className="fa-solid fa-plus mr-1"></i> Save Vocab</button>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-2"><i className="fa-solid fa-book-medical text-indigo-600"></i> 3. Add PDF Notes / Books to Library</h3>
                            <div className="grid sm:grid-cols-3 gap-3 text-xs"><input type="text" value={adminBookForm.title} onChange={(e)=>setAdminBookForm(p=>({...p,title:e.target.value}))} placeholder="Book Title" className="p-2.5 border rounded-lg" /><input type="text" value={adminBookForm.category} onChange={(e)=>setAdminBookForm(p=>({...p,category:e.target.value}))} placeholder="Category" className="p-2.5 border rounded-lg" /><input type="text" value={adminBookForm.sizeLabel} onChange={(e)=>setAdminBookForm(p=>({...p,sizeLabel:e.target.value}))} placeholder="File Size (e.g. 12 MB PDF)" className="p-2.5 border rounded-lg" /></div>
                            <div className="space-y-2"><p className="text-xs font-bold text-slate-700">Option B: Paste Google Drive / External PDF Link</p><input type="text" value={adminBookForm.url} onChange={(e)=>setAdminBookForm(p=>({...p,url:e.target.value}))} placeholder="Google Drive Link (https://drive.google.com/...) or direct link" className="w-full p-2.5 border rounded-lg text-xs" /></div>
                            <button onClick={saveBookFromAdmin} className="bg-indigo-900 hover:bg-indigo-800 text-white font-bold px-6 py-2.5 rounded-lg text-xs"><i className="fa-solid fa-cloud-arrow-up mr-1"></i> Add Book to Library</button>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-2"><i className="fa-solid fa-list-check text-indigo-600"></i> Manage Content Items (Edit & Delete)</h3>
                            <div className="flex flex-wrap gap-2"><button onClick={()=>setAdminManageTab('MCQS')} className={`px-3 py-1 rounded-lg text-xs ${adminManageTab==='MCQS'?'bg-slate-900 text-white':'bg-slate-100 text-slate-700'}`}>MCQs</button><button onClick={()=>setAdminManageTab('VOCAB')} className={`px-3 py-1 rounded-lg text-xs ${adminManageTab==='VOCAB'?'bg-slate-900 text-white':'bg-slate-100 text-slate-700'}`}>Dawn Vocab</button><button onClick={()=>setAdminManageTab('ARTICLES')} className={`px-3 py-1 rounded-lg text-xs ${adminManageTab==='ARTICLES'?'bg-slate-900 text-white':'bg-slate-100 text-slate-700'}`}>Articles</button><button onClick={()=>setAdminManageTab('BOOKS')} className={`px-3 py-1 rounded-lg text-xs ${adminManageTab==='BOOKS'?'bg-slate-900 text-white':'bg-slate-100 text-slate-700'}`}>Books</button></div>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {adminManageTab==='MCQS' && mcqs.map((m,i)=>(<div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center gap-2"><div className="truncate"><strong className="text-indigo-900">[{m.category}]</strong> {m.question}</div><div className="flex gap-1 shrink-0"><button onClick={()=>openEditMcqModal(m)} className="bg-indigo-900 text-white px-2 py-1 rounded text-xs font-bold">Edit</button><button onClick={()=>deleteMcq(m._id||m.id)} className="bg-rose-600 text-white px-2 py-1 rounded text-xs font-bold">Delete</button></div></div>))}
                                {adminManageTab==='VOCAB' && dawnWords.map((w,i)=>(<div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center gap-2"><div className="truncate"><strong className="text-indigo-900">{w.word}</strong> ({w.urdu})</div><button onClick={()=>deleteVocab(w._id||w.id)} className="bg-rose-600 text-white px-2 py-1 rounded text-xs font-bold">Delete</button></div>))}
                                {adminManageTab==='ARTICLES' && articles.map((a,i)=>(<div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center gap-2"><div className="truncate"><strong className="text-amber-900">[{a.category}]</strong> {a.title}</div><div className="flex gap-1 shrink-0"><button onClick={()=>setEditArticle(a)} className="bg-amber-600 text-white px-2 py-1 rounded text-xs font-bold">Edit</button><button onClick={()=>deleteArticle(a._id||a.id)} className="bg-rose-600 text-white px-2 py-1 rounded text-xs font-bold">Delete</button></div></div>))}
                                {adminManageTab==='BOOKS' && library.map((b,i)=>(<div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center gap-2"><div className="truncate"><strong className="text-slate-900">{b.title}</strong> ({b.category||b.cat})</div><div className="flex gap-1 shrink-0"><button onClick={()=>setEditBook(b)} className="bg-indigo-900 text-white px-2 py-1 rounded text-xs font-bold">Edit</button><button onClick={()=>deleteBook(b._id||b.id)} className="bg-rose-600 text-white px-2 py-1 rounded text-xs font-bold">Delete</button></div></div>))}
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-2"><i className="fa-solid fa-file-export text-emerald-700"></i> Database Export & Backup</h3>
                            <p className="text-xs text-slate-600">Download all website content as JSON backup file anytime.</p>
                            <button onClick={()=>{window.open('/api/admin/export','_blank');}} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-lg text-xs"><i className="fa-solid fa-download mr-1"></i> Export JSON</button>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-2"><i className="fa-solid fa-file-import text-indigo-700"></i> Import JSON</h3>
                            <p className="text-xs text-slate-600">Import backup JSON data into the database.</p>
                            <input type="file" accept="application/json" className="text-xs" />
                            <button className="bg-indigo-900 hover:bg-indigo-800 text-white font-bold px-6 py-2.5 rounded-lg text-xs"><i className="fa-solid fa-upload mr-1"></i> Import JSON</button>
                        </div>
                    </section>
                )}
            </main>

            <footer className="mt-12 bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-xs text-center space-y-4 no-print">
                <p className="text-slate-500">© {new Date().getFullYear()} ExamInPocket.com — All Rights Reserved.</p>
            </footer>
        </div>
    );
}
