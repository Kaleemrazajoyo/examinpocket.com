import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from './lib/api.js';
import { toSlug, fromSlug, findCategoryBySlug } from './lib/seoPaths.js';
import { setPageMeta, resetPageMeta } from './lib/seoMeta.js';
import { buildMcqShareMessage, shareOnWhatsApp, copyMcqLink } from './lib/share.js';
import { INFO_PAGES } from './lib/infoContent.js';
import { AboutPage, PrivacyPage, TermsPage, DisclaimerPage } from './pages/InfoPages.jsx';

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

function isRetryableAiError(error) {
    const message = String(error?.message || '').toLowerCase();
    return (
        message.includes('failed to fetch') ||
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504')
    );
}

function renderAiText(text = '') {
    return String(text)
        .split('\n')
        .map((rawLine, lineIndex) => {
            let line = rawLine;
            const isBullet = /^\s*[*-]\s+/.test(line);
            if (isBullet) line = line.replace(/^\s*[*-]\s+/, '');
            const isHeading = /^\s*#{1,4}\s+/.test(line);
            if (isHeading) line = line.replace(/^\s*#{1,4}\s+/, '');
            if (!line.trim()) return <div key={`gap-${lineIndex}`} className="h-2" />;

            const parts = line
                .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
                .filter((part) => part !== '')
                .map((part, partIndex) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
                    }
                    if (part.startsWith('`') && part.endsWith('`')) {
                        return (
                            <code key={partIndex} className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-[11px]">
                                {part.slice(1, -1)}
                            </code>
                        );
                    }
                    return part;
                });

            if (isHeading) {
                return <p key={`h-${lineIndex}`} className="font-bold text-slate-900 mt-2">{parts}</p>;
            }
            if (isBullet) {
                return (
                    <p key={`b-${lineIndex}`} className="flex gap-2">
                        <span className="text-amber-500 shrink-0">•</span>
                        <span>{parts}</span>
                    </p>
                );
            }
            return <p key={`p-${lineIndex}`}>{parts}</p>;
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

/**
 * Real URLs for every tab.
 *
 * Google can only index pages that exist as URLs, so each tab now has a path.
 * `adminPanelTab` is intentionally NOT listed — the admin portal stays behind
 * the secret 5-click logo trigger and is never linked from the public site.
 */
const TAB_PATHS = {
    homeTab: '/',
    testTab: '/mock-test',
    dawnTab: '/dawn-vocabulary',
    articlesTab: '/articles',
    libraryTab: '/library',
    savedTab: '/saved',
    aiTab: '/ai-tutor',
    aboutTab: '/about',
    privacyTab: '/privacy',
    termsTab: '/terms',
    disclaimerTab: '/disclaimer',
};

const PATH_TO_TAB = Object.fromEntries(
    Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab])
);

const TAB_META = {
    homeTab: {
        title: 'ExamInPocket.com - CSS, PMS, PCS, CCE & Competitive Exam Portal',
        description: 'Verified MCQs, solved past papers, Dawn vocabulary, editorial articles, timed mock tests and an AI tutor for CSS, PMS, PPSC, FPSC, SPSC and CCE exams.',
        path: '/',
    },
    testTab: {
        title: 'Free Timed Mock Test for CSS, PMS, PPSC, FPSC - ExamInPocket',
        description: 'Take free timed mock tests with instant scoring, question-by-question review and a weak-area diagnostic breakdown for CSS, PMS, PPSC, FPSC and CCE.',
        path: '/mock-test',
    },
    dawnTab: {
        title: 'Daily Dawn Vocabulary with Urdu Meanings - ExamInPocket',
        description: 'Daily Dawn editorial vocabulary with Urdu meanings, usage sentences and national headlines for CSS, PMS and competitive exam candidates.',
        path: '/dawn-vocabulary',
    },
    articlesTab: {
        title: 'CSS & PMS Editorial Articles and Essays - ExamInPocket',
        description: 'Read exam-oriented editorial articles, essays and current affairs analysis for CSS, PMS, PCS and CCE written papers.',
        path: '/articles',
    },
    libraryTab: {
        title: 'Free PDF Notes and Books for CSS, PMS, PPSC - ExamInPocket',
        description: 'Download free PDF notes, solved past papers and reference books for CSS, PMS, PPSC, FPSC, SPSC and CCE preparation.',
        path: '/library',
    },
    savedTab: {
        title: 'My Saved MCQs, Vocabulary and Books - ExamInPocket',
        description: 'Your saved MCQs, Dawn vocabulary, articles and books in one place so you can revise exactly what you need.',
        path: '/saved',
    },
    aiTab: {
        title: 'AI Exam Tutor for CSS and PMS Preparation - ExamInPocket',
        description: 'Ask the ExamInPocket AI tutor for study plans, essay tips, current affairs guidance and MCQ explanations for CSS, PMS and competitive exams.',
        path: '/ai-tutor',
    },
    aboutTab: {
        title: INFO_PAGES.about.title,
        description: INFO_PAGES.about.description,
        path: INFO_PAGES.about.path,
    },
    privacyTab: {
        title: INFO_PAGES.privacy.title,
        description: INFO_PAGES.privacy.description,
        path: INFO_PAGES.privacy.path,
    },
    termsTab: {
        title: INFO_PAGES.terms.title,
        description: INFO_PAGES.terms.description,
        path: INFO_PAGES.terms.path,
    },
    disclaimerTab: {
        title: INFO_PAGES.disclaimer.title,
        description: INFO_PAGES.disclaimer.description,
        path: INFO_PAGES.disclaimer.path,
    },
};

export default function App() {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('homeTab');
    const [searchInput, setSearchInput] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [pendingCategorySlug, setPendingCategorySlug] = useState(null);
    const [deepLinkId, setDeepLinkId] = useState(null);
    const [libraryFilter, setLibraryFilter] = useState('ALL');
    const [savedSubFilter, setSavedSubFilter] = useState('ALL');
    const [aiMessages, setAiMessages] = useState([{ role: 'ai', welcome: true, text: 'Assalam-o-Alaikum Student! 🎓\nMain aap ka ExamInPocket AI Tutor hoon (Powered by Gemini). CSS/PMS, general knowledge, current affairs ya kisi bhi topic par sawal poochein — main simple Roman Urdu/English mein guide karunga.' }]);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const aiChatRef = useRef(null);
    const [logoClicks, setLogoClicks] = useState(0);
    const logoTimer = useRef(null);
    const [infoMenuOpen, setInfoMenuOpen] = useState(false);
    const [testConfig, setTestConfig] = useState({ category: 'ALL', count: 10 });
    const [testRunning, setTestRunning] = useState(false);
    const [testQuestions, setTestQuestions] = useState([]);
    const [testAnswers, setTestAnswers] = useState({});
    const [testResult, setTestResult] = useState(null);
    const [testSeconds, setTestSeconds] = useState(300);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [readerOpen, setReaderOpen] = useState(false);
    const [readerData, setReaderData] = useState({ title: '', cat: '', type: 'pdf', content: '', url: '' });
    const [siteTicker, setSiteTicker] = useState(localStorage.getItem('eip_ticker') || '📢 <span class="font-bold">Latest Exam Update:</span> CSS MPT &amp; SPSC CCE Solved Past Paper MCQs Added • Daily Dawn Vocabulary Active • Live Gemini AI Tutor Active!');
    const [currentUser, setCurrentUser] = useState(null);

    // Comments + user MCQ submissions
    const [commentModalMcq, setCommentModalMcq] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentForm, setCommentForm] = useState({ name: '', email: '', text: '' });
    const [commentCounts, setCommentCounts] = useState({});
    const [submitMcqOpen, setSubmitMcqOpen] = useState(false);
    const [submittingMcq, setSubmittingMcq] = useState(false);
    const [submitMcqForm, setSubmitMcqForm] = useState({ mainCategory: '', subCategory: '', question: '', opt0: '', opt1: '', opt2: '', opt3: '', answerIndex: 0, explanation: '' });
    const [adminSubmissions, setAdminSubmissions] = useState([]);
    const [adminComments, setAdminComments] = useState([]);

    const [mcqs, setMcqs] = useState([]);
    const [dawnWords, setDawnWords] = useState([]);
    const [headlines, setHeadlines] = useState([]);
    const [headlinesHeading, setHeadlinesHeading] = useState(localStorage.getItem('eip_headlines_heading') || 'Top National Headlines');
    const [headlinesHeadingInput, setHeadlinesHeadingInput] = useState(localStorage.getItem('eip_headlines_heading') || 'Top National Headlines');
    const [articles, setArticles] = useState([]);
    const [library, setLibrary] = useState([]);
    const [savedMcqs, setSavedMcqs] = useState([]);
    const [savedVocab, setSavedVocab] = useState([]);
    const [savedArticles, setSavedArticles] = useState([]);
    const [savedBooks, setSavedBooks] = useState([]);
    const [apiCategories, setApiCategories] = useState([]);
    const [catTree, setCatTree] = useState([]);
    const [adminCatMain, setAdminCatMain] = useState('');
    const [adminCatSub, setAdminCatSub] = useState('');
    const [adminMcqForm, setAdminMcqForm] = useState({ mainCategory: '', subCategory: '', category: '', customCategory: '', question: '', opt0: '', opt1: '', opt2: '', opt3: '', answerIndex: 0, explanation: '' });
    const [adminArtForm, setAdminArtForm] = useState({ title: '', category: '', author: '', content: '' });
    const [adminBookForm, setAdminBookForm] = useState({ title: '', category: '', sizeLabel: '', url: '' });
    const [adminVocabForm, setAdminVocabForm] = useState({ word: '', type: 'Word', meaning: '', urdu: '', sentence: '' });
    const [adminManageTab, setAdminManageTab] = useState('MCQS');
    const [adminHeadlineForm, setAdminHeadlineForm] = useState({ title: '' });
    const [tickerInput, setTickerInput] = useState(localStorage.getItem('eip_ticker') || '📢 <span class="font-bold">Latest Exam Update:</span> CSS MPT &amp; SPSC CCE Solved Past Paper MCQs Added • Daily Dawn Vocabulary Active • Live Gemini AI Tutor Active!');
    const [editMcq, setEditMcq] = useState(null);
    const [editArticle, setEditArticle] = useState(null);
    const [editBook, setEditBook] = useState(null);
    const [editVocab, setEditVocab] = useState(null);
    const [editHeadline, setEditHeadline] = useState(null);
    const [editMcqCat, setEditMcqCat] = useState('');
    const [editMcqCustom, setEditMcqCustom] = useState('');
    const [editMcqMain, setEditMcqMain] = useState('');
    const [editMcqSub, setEditMcqSub] = useState('');

    useEffect(() => {
        async function load() {
            try {
                const [m, v, h, a, b, c, ct, s, cc] = await Promise.all([
                    api.get('/mcqs?limit=500').catch(() => ({ items: [] })),
                    api.get('/vocab?limit=500').catch(() => ({ items: [] })),
                    api.get('/headlines?limit=50').catch(() => ({ items: [] })),
                    api.get('/articles?limit=200').catch(() => ({ items: [] })),
                    api.get('/books?limit=200').catch(() => ({ items: [] })),
                    api.get('/mcqs/categories').catch(() => ({ categories: [] })),
                    api.get('/categories/tree').catch(() => ({ tree: [] })),
                    api.get('/settings').catch(() => ({})),
                    api.get('/comments/counts').catch(() => ({ counts: {} }))
                ]);
                setMcqs(m.items || m || []);
                setDawnWords(v.items || v || []);
                setHeadlines(h.items || h || []);
                setArticles(a.items || a || []);
                setLibrary(b.items || b || []);
                setApiCategories(c.categories || []);
                setCatTree(ct.tree || []);
                setCommentCounts(cc.counts || {});
                const settings = (s && s.data) ? s.data : (s || {});
                if (settings.siteTicker) {
                    setSiteTicker(settings.siteTicker);
                    setTickerInput(settings.siteTicker);
                    localStorage.setItem('eip_ticker', settings.siteTicker);
                }
                if (settings.headlinesHeading) {
                    setHeadlinesHeading(settings.headlinesHeading);
                    setHeadlinesHeadingInput(settings.headlinesHeading);
                    localStorage.setItem('eip_headlines_heading', settings.headlinesHeading);
                }
            } catch (e) {}
        }
        load();
        const savedTicker = localStorage.getItem('eip_ticker');
        if (savedTicker) { setSiteTicker(savedTicker); setTickerInput(savedTicker); }
        api.get('/auth/me').then((res) => {
            if (res?.user) { setCurrentUser(res.user); loadSavedBookmarks(); }
        }).catch(() => {});
    }, []);

    /*
     * URL -> state sync.
     * Supported paths: /, /mcqs, /mcqs/:category, /mcq/:id, /mock-test,
     * /dawn-vocabulary, /articles, /library, /saved, /ai-tutor
     */
    useEffect(() => {
        const raw = location.pathname || '/';
        const path = raw.length > 1 ? raw.replace(/\/+$/, '') : '/';
        setInfoMenuOpen(false);

        const mcqMatch = path.match(/^\/mcq\/([A-Za-z0-9_-]+)$/);
        if (mcqMatch) {
            setActiveTab('homeTab');
            setActiveCategory('ALL');
            setSearchInput('');
            setDeepLinkId(mcqMatch[1]);
            return;
        }

        const categoryMatch = path.match(/^\/mcqs\/([A-Za-z0-9_-]+)$/);
        if (categoryMatch) {
            const slug = categoryMatch[1];
            setActiveTab('homeTab');
            setSearchInput('');
            setPendingCategorySlug(slug);
            // Set metadata immediately so a shared link keeps its own title and
            // canonical even before (or without) the category list loading.
            const label = fromSlug(slug);
            setPageMeta({
                title: `${label} MCQs with Answers - ExamInPocket`,
                description: `Practice ${label} MCQs with verified answers and explanations for CSS, PMS, PPSC, FPSC, SPSC and CCE exams.`,
                path: `/mcqs/${slug}`,
            });
            return;
        }

        if (path === '/mcqs') {
            setActiveTab('homeTab');
            setActiveCategory('ALL');
            setPageMeta({
                title: 'MCQs with Answers for CSS, PMS, PPSC and FPSC - ExamInPocket',
                description: 'Practice subject-wise MCQs with verified answers and explanations for CSS, PMS, PPSC, FPSC, SPSC and CCE exams.',
                path: '/mcqs',
            });
            return;
        }

        const tab = PATH_TO_TAB[path];
        if (tab) {
            setActiveTab(tab);
            if (path === '/') setActiveCategory('ALL');
            return;
        }

        setActiveTab('homeTab');
    }, [location.pathname]);

    // Resolve /mcqs/:slug once the category list has loaded from the API.
    useEffect(() => {
        if (!pendingCategorySlug) return;
        const subCategoryNames = (catTree || []).flatMap((m) => (m.children || []).map((c) => c.name));
        const resolved =
            findCategoryBySlug(categoryList, pendingCategorySlug) ||
            findCategoryBySlug(subCategoryNames, pendingCategorySlug);

        if (resolved) {
            setActiveCategory(resolved);
            setPendingCategorySlug(null);
        } else if (categoryList.length > 1) {
            // Unknown slug: show everything instead of an empty feed.
            setActiveCategory('ALL');
            setPendingCategorySlug(null);
        }
        // `categoryList` is derived from these three, so they are the real deps.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingCategorySlug, catTree, apiCategories, mcqs]);

    // Make sure a shared /mcq/:id link still works if that MCQ is not in the feed page.
    useEffect(() => {
        if (!deepLinkId) return;
        const alreadyLoaded = mcqs.some((m) => String(m._id || m.id) === String(deepLinkId));
        if (alreadyLoaded) return;
        let cancelled = false;
        api.get(`/mcqs/${deepLinkId}`)
            .then((res) => {
                const found = res?.mcq || res;
                if (!cancelled && found && (found._id || found.id)) {
                    setMcqs((prev) => [found, ...prev]);
                }
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [deepLinkId, mcqs]);

    // Scroll to, highlight and expand the shared MCQ.
    useEffect(() => {
        if (!deepLinkId) return;
        const target = mcqs.find((m) => String(m._id || m.id) === String(deepLinkId));
        if (!target) return;

        const timer = setTimeout(() => {
            const card = document.getElementById(`mcq-card-${deepLinkId}`);
            if (!card) return;
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('ring-2', 'ring-amber-400', 'ring-offset-2');
            const explanation = document.getElementById(`explanation-${deepLinkId}`);
            if (explanation) explanation.classList.remove('hidden');
        }, 250);

        setPageMeta({
            title: `${target.question} - ExamInPocket`,
            description: `${target.question} Correct answer: ${(target.options || [])[target.answerIndex] || ''}. ${target.explanation || ''}`.slice(0, 158),
            path: `/mcq/${deepLinkId}`,
        });

        return () => clearTimeout(timer);
    }, [deepLinkId, mcqs]);

    // Per-page title / description / canonical for every tab and category page.
    useEffect(() => {
        const rawPath = location.pathname.replace(/\/+$/, '') || '/';
        // Deep links set their own metadata (see URL sync / deep-link effect).
        if (deepLinkId || /^\/mcq\/[^/]+$/.test(rawPath)) return;
        // Category URLs already set slug-based metadata; once the real category
        // name is resolved, fall through so the title matches the prerendered HTML.
        if (pendingCategorySlug) return;
        if (/^\/mcqs\/[^/]+$/.test(rawPath) && activeCategory === 'ALL') return;
        if (activeTab === 'homeTab' && activeCategory !== 'ALL') {
            setPageMeta({
                title: `${activeCategory} MCQs with Answers - ExamInPocket`,
                description: `Practice ${activeCategory} MCQs with verified answers and explanations for CSS, PMS, PPSC, FPSC, SPSC and CCE exams.`,
                path: `/mcqs/${toSlug(activeCategory)}`,
            });
            return;
        }
        if (activeTab === 'homeTab' && rawPath === '/mcqs') {
            setPageMeta({
                title: 'MCQs with Answers for CSS, PMS, PPSC and FPSC - ExamInPocket',
                description: 'Practice subject-wise MCQs with verified answers and explanations for CSS, PMS, PPSC, FPSC, SPSC and CCE exams.',
                path: '/mcqs',
            });
            return;
        }
        const meta = TAB_META[activeTab];
        if (meta) {
            setPageMeta(meta);
        } else {
            resetPageMeta();
        }
    }, [activeTab, activeCategory, deepLinkId, pendingCategorySlug, location.pathname]);

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

    useEffect(() => {
        if (currentUser?.role === 'admin' && activeTab === 'adminPanelTab') {
            loadAdminFeedback();
        }
    }, [currentUser, activeTab]);

    useEffect(() => {
        if (aiChatRef.current) {
            aiChatRef.current.scrollTop = aiChatRef.current.scrollHeight;
        }
    }, [aiMessages, aiLoading]);

    useEffect(() => {
        if (!infoMenuOpen) return;
        const onPointerDown = (event) => {
            const target = event.target;
            if (target instanceof Element && !target.closest('#siteInfoMenu')) {
                setInfoMenuOpen(false);
            }
        };
        const onKeyDown = (event) => {
            if (event.key === 'Escape') setInfoMenuOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [infoMenuOpen]);

    function switchTab(id) {
        setActiveTab(id);
        setInfoMenuOpen(false);
        const path = TAB_PATHS[id];
        if (path && location.pathname !== path) {
            navigate(path);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleLogoClick() {
        setLogoClicks((c) => {
            const nc = c + 1;
            if (logoTimer.current) clearTimeout(logoTimer.current);
            logoTimer.current = setTimeout(() => setLogoClicks(0), 2500);
            if (nc >= 5) {
                setLogoClicks(0);
                if (currentUser?.role === 'admin') {
                    switchTab('adminPanelTab');
                    showToast('Admin Panel');
                    return 0;
                }
                showToast('Admin access required', 'error');
                return 0;
            }
            return nc;
        });
    }

    async function saveMcqFromAdmin() {
        try {
            const mainCat = adminMcqForm.mainCategory;
            const subCat = adminMcqForm.subCategory;
            if (!subCat) { showToast('Please select Main Category and Sub Category', 'error'); return; }
            if (!adminMcqForm.question || !adminMcqForm.opt0 || !adminMcqForm.opt1 || !adminMcqForm.opt2 || !adminMcqForm.opt3) {
                showToast('Please fill all required fields', 'error');
                return;
            }
            await api.post('/mcqs', {
                question: adminMcqForm.question,
                options: [adminMcqForm.opt0, adminMcqForm.opt1, adminMcqForm.opt2, adminMcqForm.opt3],
                answerIndex: Number(adminMcqForm.answerIndex),
                explanation: adminMcqForm.explanation || '',
                mainCategory: mainCat,
                subCategory: subCat,
                category: subCat || mainCat
            });
            showToast('MCQ saved successfully');
            setAdminMcqForm({ mainCategory: '', subCategory: '', category: '', customCategory: '', question: '', opt0: '', opt1: '', opt2: '', opt3: '', answerIndex: 0, explanation: '' });
            const m = await api.get('/mcqs?limit=500').catch(() => ({ items: mcqs }));
            setMcqs(m.items || m || []);
            const c = await api.get('/mcqs/categories').catch(() => ({ categories: apiCategories }));
            setApiCategories(c.categories || []);
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

    async function saveHeadlineFromAdmin() {
        try {
            if (!adminHeadlineForm.title.trim()) { showToast('Enter headline','error'); return; }
            await api.post('/headlines', { title: adminHeadlineForm.title.trim() });
            showToast('Headline added');
            setAdminHeadlineForm({ title: '' });
            const h = await api.get('/headlines?limit=50').catch(()=>({items:headlines}));
            setHeadlines(h.items||h||[]);
        } catch(e){ showToast(e.message||'Error','error'); }
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
        setEditMcq({ ...m, options: m.options || ['', '', '', ''] });
        const cat = m.category || '';
        setEditMcqCat(cat);
        setEditMcqCustom('');
        setEditMcqMain(m.mainCategory || '');
        setEditMcqSub(m.subCategory || '');
    }
    function catListAll() { const s=new Set(apiCategories); mcqs.forEach(x=>x.category&&s.add(x.category)); return Array.from(s); }
    async function saveMcqEdits() {
        if (!editMcq) return;
        let cat = editMcqCat || editMcq.category;
        if (cat === '__NEW__') {
            cat = (editMcqCustom||'').trim();
        }
        if (!cat) { showToast('Category required', 'error'); return; }
        try {
            await api.patch(`/mcqs/${editMcq._id||editMcq.id}`, { question: editMcq.question, options: editMcq.options, answerIndex: Number(editMcq.answerIndex), explanation: editMcq.explanation, category: editMcqSub || editMcqCat || cat, mainCategory: editMcqMain, subCategory: editMcqSub });
            showToast('MCQ updated');
            setEditMcq(null);
            setEditMcqCat('');
            setEditMcqCustom('');
            setEditMcqMain('');
            setEditMcqSub('');
            const m = await api.get('/mcqs?limit=500').catch(()=>({items:mcqs}));
            setMcqs(m.items||m||[]);
            const c = await api.get('/mcqs/categories').catch(() => ({ categories: apiCategories }));
            setApiCategories(c.categories || []);
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
    async function saveVocabEdits() {
        if (!editVocab) return;
        try {
            await api.patch(`/vocab/${editVocab._id||editVocab.id}`, editVocab);
            showToast('Vocab updated');
            setEditVocab(null);
            const v = await api.get('/vocab?limit=500').catch(()=>({items:dawnWords}));
            setDawnWords(v.items||v||[]);
        } catch(e){ showToast(e.message||'Failed','error'); }
    }
    async function deleteHeadline(id) {
        if (!(await showConfirmModal('Delete Headline', 'Are you sure?'))) return;
        try {
            await api.delete(`/headlines/${id}`);
            showToast('Headline deleted');
            setHeadlines(headlines.filter(h => String(h._id||h.id) !== String(id)));
        } catch(e){ showToast(e.message||'Failed','error'); }
    }
    async function saveHeadlineEdits() {
        if (!editHeadline) return;
        try {
            await api.patch(`/headlines/${editHeadline._id||editHeadline.id}`, editHeadline);
            showToast('Headline updated');
            setEditHeadline(null);
            const h = await api.get('/headlines?limit=50').catch(()=>({items:headlines}));
            setHeadlines(h.items||h||[]);
        } catch(e){ showToast(e.message||'Failed','error'); }
    }

    async function saveTicker() {
        setSiteTicker(tickerInput);
        localStorage.setItem('eip_ticker', tickerInput);
        try {
            await api.patch('/settings', { siteTicker: tickerInput });
            showToast('Ticker updated');
        } catch (e) {
            showToast(e.message || 'Saved locally, but failed to sync online', 'error');
        }
    }

    async function saveHeadlinesHeading() {
        const v = headlinesHeadingInput.trim() || 'Top National Headlines';
        setHeadlinesHeading(v);
        localStorage.setItem('eip_headlines_heading', v);
        try {
            await api.patch('/settings', { headlinesHeading: v });
            showToast('Heading updated');
        } catch (e) {
            showToast(e.message || 'Saved locally, but failed to sync online', 'error');
        }
    }

    async function openComments(mcq) {
        setCommentModalMcq(mcq);
        setComments([]);
        setCommentsLoading(true);
        try {
            const res = await api.get(`/comments?mcqId=${encodeURIComponent(mcq._id || mcq.id)}`);
            setComments(res.comments || []);
        } catch (e) {
            showToast(e.message || 'Failed to load comments', 'error');
        } finally {
            setCommentsLoading(false);
        }
    }

    async function postComment() {
        if (!commentModalMcq) return;
        const name = commentForm.name.trim();
        const email = commentForm.email.trim();
        const text = commentForm.text.trim();
        if (!name || !email || !text) { showToast('Name, email and comment are required', 'error'); return; }
        try {
            const res = await api.post('/comments', {
                mcqId: commentModalMcq._id || commentModalMcq.id,
                name,
                email,
                text,
            });
            setComments((prev) => [...prev, res.comment]);
            setCommentForm((prev) => ({ ...prev, text: '' }));
            const id = String(commentModalMcq._id || commentModalMcq.id);
            setCommentCounts((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
            showToast('Comment posted');
            setCommentModalMcq(null);
        } catch (e) {
            showToast(e.message || 'Failed to post comment', 'error');
        }
    }

    function openSubmitMcq() {
        if (!currentUser) {
            showToast('Please login or register to submit an MCQ', 'error');
            setAuthModalOpen(true);
            return;
        }
        setSubmitMcqForm({ mainCategory: '', subCategory: '', question: '', opt0: '', opt1: '', opt2: '', opt3: '', answerIndex: 0, explanation: '' });
        setSubmitMcqOpen(true);
    }

    async function submitMcq() {
        const f = submitMcqForm;
        if (!f.mainCategory) { showToast('Please select a main category', 'error'); return; }
        if (!f.question.trim() || !f.opt0.trim() || !f.opt1.trim() || !f.opt2.trim() || !f.opt3.trim()) {
            showToast('Please fill the question and all 4 options', 'error');
            return;
        }
        setSubmittingMcq(true);
        try {
            await api.post('/submissions', {
                question: f.question.trim(),
                options: [f.opt0.trim(), f.opt1.trim(), f.opt2.trim(), f.opt3.trim()],
                answerIndex: Number(f.answerIndex),
                explanation: f.explanation.trim(),
                mainCategory: f.mainCategory,
                subCategory: f.subCategory || '',
            });
            setSubmitMcqOpen(false);
            showToast('MCQ submitted for admin approval');
        } catch (e) {
            showToast(e.message || 'Failed to submit MCQ', 'error');
        } finally {
            setSubmittingMcq(false);
        }
    }

    async function loadAdminFeedback() {
        const [s, c] = await Promise.all([
            api.get('/submissions').catch(() => ({ submissions: [] })),
            api.get('/comments/admin').catch(() => ({ comments: [] })),
        ]);
        setAdminSubmissions(s.submissions || []);
        setAdminComments(c.comments || []);
    }

    async function approveSubmission(id) {
        if (!(await showConfirmModal('Approve MCQ', 'This will publish the MCQ on the website with the submitter\'s name.'))) return;
        try {
            await api.post(`/submissions/${id}/approve`);
            showToast('MCQ approved and published');
            const [s, m] = await Promise.all([
                api.get('/submissions').catch(() => ({ submissions: [] })),
                api.get('/mcqs?limit=500').catch(() => ({ items: mcqs })),
            ]);
            setAdminSubmissions(s.submissions || []);
            setMcqs(m.items || m || []);
        } catch (e) {
            showToast(e.message || 'Failed to approve submission', 'error');
        }
    }

    async function rejectSubmission(id) {
        if (!(await showConfirmModal('Reject MCQ', 'This submission will be deleted permanently.'))) return;
        try {
            await api.delete(`/submissions/${id}`);
            setAdminSubmissions((prev) => prev.filter((s) => String(s._id) !== String(id)));
            showToast('Submission rejected');
        } catch (e) {
            showToast(e.message || 'Failed to reject submission', 'error');
        }
    }

    async function deleteComment(id) {
        if (!(await showConfirmModal('Delete Comment', 'Are you sure you want to delete this comment?'))) return;
        try {
            await api.delete(`/comments/${id}`);
            setAdminComments((prev) => prev.filter((c) => String(c._id) !== String(id)));
            showToast('Comment deleted');
        } catch (e) {
            showToast(e.message || 'Failed to delete comment', 'error');
        }
    }

    async function loadSavedBookmarks() {
        try {
            const res = await api.get('/bookmarks');
            const items = res?.items || [];
            const ids = { mcq: [], vocab: [], article: [], book: [] };
            items.forEach((b) => {
                const key = b.itemType;
                const id = b.item?._id || b.item;
                if (ids[key] && id !== undefined && id !== null) ids[key].push(String(id));
            });
            setSavedMcqs(ids.mcq);
            setSavedVocab(ids.vocab);
            setSavedArticles(ids.article);
            setSavedBooks(ids.book);
        } catch (e) {
            // Not logged in or offline: keep current list.
        }
    }

    function handleLogout() {
        setCurrentUser(null);
        setActiveTab('homeTab');
        setSavedMcqs([]);
        setSavedVocab([]);
        setSavedArticles([]);
        setSavedBooks([]);
        api.post('/auth/logout').catch(() => {});
    }

    function toggleBookmark(itemType, id, current, setter, label) {
        if (!currentUser) { showToast(`Please login or register to save ${label}s`, 'error'); setAuthModalOpen(true); return; }
        const itemId = String(id);
        const shouldSave = !current.includes(itemId);
        const apply = (save) => setter((prev) => (
            save
                ? (prev.includes(itemId) ? prev : [...prev, itemId])
                : prev.filter((i) => i !== itemId)
        ));
        apply(shouldSave);
        showToast(shouldSave ? `${label} saved to favorites!` : `${label} removed from saved.`);
        const request = shouldSave
            ? api.post('/bookmarks', { itemType, itemId })
            : api.delete(`/bookmarks/${itemType}/${itemId}`);
        request.catch((e) => {
            apply(!shouldSave);
            showToast(e.message || 'Could not update favorites', 'error');
        });
    }

    function toggleBookmarkMcq(id) { toggleBookmark('mcq', id, savedMcqs, setSavedMcqs, 'MCQ'); }
    function toggleBookmarkVocab(id) { toggleBookmark('vocab', id, savedVocab, setSavedVocab, 'Vocab'); }
    function toggleBookmarkArticle(id) { toggleBookmark('article', id, savedArticles, setSavedArticles, 'Article'); }
    function toggleBookmarkBook(id) { toggleBookmark('book', id, savedBooks, setSavedBooks, 'Book'); }

    const categoryList = useMemo(() => {
        const set = new Set();
        if (catTree && catTree.length > 0) {
            catTree.forEach((m) => m.name && set.add(m.name));
        } else {
            apiCategories.forEach((c) => c && set.add(c));
            mcqs.forEach((m) => {
                if (m.mainCategory) set.add(m.mainCategory);
                else if (m.category) set.add(m.category);
            });
        }
        return ['ALL', ...Array.from(set)];
    }, [mcqs, apiCategories, catTree]);

    const filteredMcqs = useMemo(() => {
        return mcqs.filter((m) => {
            const q = searchInput.toLowerCase();
            const matchesQ = !q || (m.question||'').toLowerCase().includes(q);
            const matchesC = activeCategory === 'ALL' || m.mainCategory === activeCategory || m.category === activeCategory || m.subCategory === activeCategory;
            return matchesQ && matchesC;
        });
    }, [mcqs, searchInput, activeCategory]);

    // Library can be filtered by subject from the mock-test diagnostic report.
    const filteredLibrary = useMemo(() => {
        if (libraryFilter === 'ALL') return library;
        return library.filter((item) => (item.category || item.cat || '') === libraryFilter);
    }, [library, libraryFilter]);

    function shareMcq(mcq) {
        const id = mcq._id || mcq.id;
        shareOnWhatsApp(buildMcqShareMessage(mcq, id));
    }

    async function copyMcq(mcq) {
        const id = mcq._id || mcq.id;
        const ok = await copyMcqLink(id);
        if (ok) showToast('MCQ link copied');
        else showToast('Could not copy link', 'error');
    }

    function goToLibraryFor(category) {
        setLibraryFilter(category);
        switchTab('libraryTab');
    }

    // Category chips are real links so Google can crawl every category page.
    function selectCategory(category) {
        setActiveCategory(category);
        if (category === 'ALL') navigate('/mcqs');
        else navigate(`/mcqs/${toSlug(category)}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

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
        const details = [];
        const categoryStats = {};
        
        testQuestions.forEach((q) => {
            const qId = q._id || q.id;
            const userAns = testAnswers[qId];
            const isCorrect = userAns === q.answerIndex;
            if (isCorrect) correct++;
            
            const cat = q.category || 'General';
            if (!categoryStats[cat]) categoryStats[cat] = { total: 0, correct: 0 };
            categoryStats[cat].total++;
            if (isCorrect) categoryStats[cat].correct++;
            
            details.push({
                question: q.question,
                options: q.options || [],
                userAnswer: userAns,
                correctAnswer: q.answerIndex,
                isCorrect,
                explanation: q.explanation || 'No explanation available.',
                category: cat
            });
        });
        
        const total = testQuestions.length;
        const wrong = total - correct;
        const percentage = Math.round((correct / Math.max(total, 1)) * 100);
        
        const categoryBreakdown = Object.keys(categoryStats).map((cat) => {
            const stats = categoryStats[cat];
            return {
                category: cat,
                correct: stats.correct,
                total: stats.total,
                percentage: Math.round((stats.correct / Math.max(stats.total, 1)) * 100),
            };
        });
        categoryBreakdown.sort((a, b) => a.percentage - b.percentage);
        const weakSubjects = categoryBreakdown.filter((c) => c.percentage < 70);
        
        const quotes = [
            "Success is the sum of small efforts, repeated day in and day out. - Robert Collier",
            "The expert in anything was once a beginner. Keep going!",
            "Hard work beats talent when talent doesn't work hard.",
            "Your future is created by what you do today, not tomorrow.",
            "Push yourself, because no one else is going to do it for you.",
            "Great things never come from comfort zones.",
            "Believe you can and you're halfway there. - Theodore Roosevelt",
            "Every expert was once a disaster. Keep practicing!",
            "Success doesn't happen overnight. It happens with consistency.",
            "You are closer to success than you think. Never give up!"
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        
        setTestResult({ total, correct, wrong, percentage, details, weakSubjects, categoryBreakdown, quote: randomQuote, category: testConfig.category });
    }

    function resetMockTest() { setTestRunning(false); setTestResult(null); setTestQuestions([]); setTestAnswers({}); }

    async function sendAiChatMessage(prefill = null) {
        if (!currentUser) {
            showToast('Please login or register to use AI Tutor', 'error');
            setAuthModalOpen(true);
            return;
        }

        const msg = String(prefill ?? aiPrompt).trim();
        if (!msg || aiLoading) return;

        const history = aiMessages
            .filter((m) => !m.welcome && (m.role === 'user' || m.role === 'ai'))
            .slice(-8)
            .map((m) => ({ role: m.role === 'ai' ? 'model' : 'user', text: m.text }));

        setAiMessages((p) => [...p, { role: 'user', text: msg }]);
        setAiPrompt('');
        setAiLoading(true);

        try {
            const payload = { prompt: msg, history };
            let res;
            try {
                res = await api.post('/ai/chat', payload);
            } catch (error) {
                if (!isRetryableAiError(error)) throw error;
                await new Promise((resolve) => setTimeout(resolve, 2000));
                res = await api.post('/ai/chat', payload);
            }

            const reply = res?.reply || 'AI Tutor ne koi jawab nahi diya. Dobara koshish karein.';
            setAiMessages((p) => [
                ...p,
                { role: 'ai', text: reply, offline: Boolean(res?.offline), model: res?.model },
            ]);
            if (res?.offline) showToast('AI service is not available right now', 'error');
        } catch (error) {
            setAiMessages((p) => [
                ...p,
                { role: 'ai', text: error.message || 'AI Tutor se connect nahi ho saka. Dobara koshish karein.' },
            ]);
            showToast(error.message || 'AI request failed', 'error');
        } finally {
            setAiLoading(false);
        }
    }

    function clearAiChat() {
        setAiMessages([{ role: 'ai', welcome: true, text: 'Assalam-o-Alaikum Student! 🎓\nMain aap ka ExamInPocket AI Tutor hoon (Powered by Gemini). CSS/PMS, general knowledge, current affairs ya kisi bhi topic par sawal poochein — main simple Roman Urdu/English mein guide karunga.' }]);
    }

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

    const savedM = currentUser ? mcqs.filter((m) => savedMcqs.includes(String(m._id || m.id))) : [];
    const savedV = currentUser ? dawnWords.filter((w) => savedVocab.includes(String(w._id || w.id))) : [];
    const savedA = currentUser ? articles.filter((a) => savedArticles.includes(String(a._id || a.id))) : [];
    const savedB = currentUser ? library.filter((b) => savedBooks.includes(String(b._id || b.id))) : [];

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
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className="block font-bold text-slate-700 mb-1">Main Category</label><select value={editMcqMain} onChange={(e)=>{setEditMcqMain(e.target.value); setEditMcqSub(''); setEditMcq({...editMcq, mainCategory: e.target.value});}} className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50"><option value="">Select</option>{catTree.map(m=><option key={m._id} value={m.name}>{m.name}</option>)}</select></div>
                                <div><label className="block font-bold text-slate-700 mb-1">Sub Category</label><select value={editMcqSub} onChange={(e)=>{setEditMcqSub(e.target.value); setEditMcqCat(e.target.value); setEditMcq({...editMcq, subCategory: e.target.value, category: e.target.value});}} className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50"><option value="">Select</option>{(catTree.find(x=>x.name===editMcqMain)?.children||[]).map(s=><option key={s._id} value={s.name}>{s.name}</option>)}</select></div>
                            </div>
                            <div><label className="block font-bold text-slate-700 mb-1">Question Statement</label><textarea value={editMcq.question} onChange={(e)=>setEditMcq({...editMcq,question:e.target.value})} rows="2" className="w-full p-2.5 border border-slate-300 rounded-lg"></textarea></div>
                            <div className="grid grid-cols-2 gap-2"><input type="text" value={editMcq.options?.[0]||''} onChange={(e)=>{const o=[...(editMcq.options||[])];o[0]=e.target.value;setEditMcq({...editMcq,options:o});}} className="p-2 border rounded-lg" /><input type="text" value={editMcq.options?.[1]||''} onChange={(e)=>{const o=[...(editMcq.options||[])];o[1]=e.target.value;setEditMcq({...editMcq,options:o});}} className="p-2 border rounded-lg" /><input type="text" value={editMcq.options?.[2]||''} onChange={(e)=>{const o=[...(editMcq.options||[])];o[2]=e.target.value;setEditMcq({...editMcq,options:o});}} className="p-2 border rounded-lg" /><input type="text" value={editMcq.options?.[3]||''} onChange={(e)=>{const o=[...(editMcq.options||[])];o[3]=e.target.value;setEditMcq({...editMcq,options:o});}} className="p-2 border rounded-lg" /></div>
                            <div><label className="block font-bold text-slate-700 mb-1">Correct Answer</label><select value={editMcq.answerIndex} onChange={(e)=>setEditMcq({...editMcq,answerIndex:Number(e.target.value)})} className="w-full p-2.5 border border-slate-300 rounded-lg"><option value={0}>Option A</option><option value={1}>Option B</option><option value={2}>Option C</option><option value={3}>Option D</option></select></div>
                            <div><label className="block font-bold text-slate-700 mb-1">Explanation</label><input type="text" value={editMcq.explanation||''} onChange={(e)=>setEditMcq({...editMcq,explanation:e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg" /></div>
                            <button onClick={saveMcqEdits} className="w-full bg-slate-900 text-amber-400 font-bold py-2.5 rounded-lg">Save MCQ Updates</button>
                        </div>
                    </div>
                </div>
            )}

            {editVocab && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={()=>setEditVocab(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-lg"></i></button>
                        <h3 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-2"><i className="fa-solid fa-pen-to-square text-indigo-500"></i> Edit Dawn Vocab</h3>
                        <div className="space-y-3 text-xs sm:text-sm">
                            <div><label className="block font-bold text-slate-700 mb-1">Word</label><input type="text" value={editVocab.word||''} onChange={(e)=>setEditVocab({...editVocab,word:e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg" /></div>
                            <div><label className="block font-bold text-slate-700 mb-1">Parts of Speech</label><select value={editVocab.type||editVocab.partsOfSpeech||'Noun'} onChange={(e)=>setEditVocab({...editVocab,type:e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50">
                                <option value="Noun">Noun</option>
                                <option value="Verb">Verb</option>
                                <option value="Adjective">Adjective</option>
                                <option value="Adverb">Adverb</option>
                                <option value="Preposition">Preposition</option>
                                <option value="Pronoun">Pronoun</option>
                                <option value="Conjunction">Conjunction</option>
                                <option value="Interjection">Interjection</option>
                                <option value="Idiomatic Expression">Idiomatic Expression</option>
                                <option value="Verb Phrase">Verb Phrase</option>
                                <option value="Phrase">Phrase</option>
                                <option value="Phrasal Verb">Phrasal Verb</option>
                                <option value="Other">Other</option>
                            </select></div>
                            <div><label className="block font-bold text-slate-700 mb-1">Urdu</label><input type="text" value={editVocab.urdu||''} onChange={(e)=>setEditVocab({...editVocab,urdu:e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg" /></div>
                            <div><label className="block font-bold text-slate-700 mb-1">Meaning</label><input type="text" value={editVocab.meaning||''} onChange={(e)=>setEditVocab({...editVocab,meaning:e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg" /></div>
                            <div><label className="block font-bold text-slate-700 mb-1">Usage of Sentence</label><input type="text" value={editVocab.sentence||editVocab.usage||''} onChange={(e)=>setEditVocab({...editVocab,sentence:e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg" /></div>
                            <button onClick={saveVocabEdits} className="w-full bg-indigo-700 text-white font-bold py-2.5 rounded-lg">Save Vocab Updates</button>
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

            {editHeadline && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 relative">
                        <button onClick={()=>setEditHeadline(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-lg"></i></button>
                        <h3 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-2"><i className="fa-solid fa-pen-to-square text-amber-600"></i> Edit Headline</h3>
                        <div className="space-y-3 text-xs sm:text-sm">
                            <textarea rows="3" value={editHeadline.title||editHeadline||''} onChange={(e)=>setEditHeadline(typeof editHeadline === 'object' ? {...editHeadline,title:e.target.value} : {title:e.target.value})} className="w-full p-2.5 border rounded-lg"></textarea>
                            <button onClick={saveHeadlineEdits} className="w-full bg-amber-600 text-white font-bold py-2.5 rounded-lg">Save Headline Updates</button>
                        </div>
                    </div>
                </div>
            )}

            <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-amber-400/25 shadow-lg no-print">
                <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div onClick={handleLogoClick} className="flex items-center gap-3 cursor-pointer select-none" title="ExamInPocket Portal (Click 5 times for Admin Portal)">
                            <div className="bg-amber-400 text-slate-950 font-extrabold text-xl px-3 py-1.5 rounded-xl">EiP</div>
                            <div>
                                <h1 className="font-display text-xl font-bold tracking-tight text-white">ExamInPocket<span className="text-amber-400">.com</span></h1>
                                <p className="text-xs text-slate-400">FPSC • PPSC • SPSC • CSS • PMS • CCE</p>
                            </div>
                        </div>
                        <div id="siteInfoMenu" className="relative order-first">
                            <button
                                type="button"
                                onClick={() => setInfoMenuOpen((open) => !open)}
                                aria-label="Open site information menu"
                                aria-expanded={infoMenuOpen}
                                aria-controls="siteInfoMenuPanel"
                                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 p-2.5 rounded-lg transition"
                            >
                                <i className={`fa-solid ${infoMenuOpen ? 'fa-xmark' : 'fa-bars'} text-base`}></i>
                            </button>
                            {infoMenuOpen && (
                                <div id="siteInfoMenuPanel" className="absolute left-0 top-full mt-2 w-56 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50">
                                    <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Site information</p>
                                    <a href="/about" onClick={(e) => { e.preventDefault(); switchTab('aboutTab'); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-amber-50 hover:text-amber-900 transition">
                                        <i className="fa-solid fa-circle-info text-amber-500 w-4"></i> About Us
                                    </a>
                                    <a href="/privacy" onClick={(e) => { e.preventDefault(); switchTab('privacyTab'); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-amber-50 hover:text-amber-900 transition">
                                        <i className="fa-solid fa-shield-halved text-amber-500 w-4"></i> Privacy Policy
                                    </a>
                                    <a href="/terms" onClick={(e) => { e.preventDefault(); switchTab('termsTab'); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-amber-50 hover:text-amber-900 transition">
                                        <i className="fa-solid fa-file-contract text-amber-500 w-4"></i> Terms of Use
                                    </a>
                                    <a href="/disclaimer" onClick={(e) => { e.preventDefault(); switchTab('disclaimerTab'); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-amber-50 hover:text-amber-900 transition">
                                        <i className="fa-solid fa-triangle-exclamation text-amber-500 w-4"></i> Disclaimer
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                    <nav className="flex flex-wrap items-center gap-1 text-xs sm:text-sm font-medium">
                        <button onClick={() => switchTab('homeTab')} className={`nav-link group relative px-3 py-2 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg ${activeTab === 'homeTab' ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold shadow-amber-400/50 shadow-md' : 'hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-800'}`}><span className="relative z-10 flex items-center gap-1"><i className="fa-solid fa-house mr-1 group-hover:animate-bounce"></i> Home</span><div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/30 to-amber-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div></button>
                        <button onClick={() => switchTab('testTab')} className={`nav-link group relative px-3 py-2 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg ${activeTab === 'testTab' ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold shadow-amber-400/50 shadow-md' : 'hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-800'}`}><span className="relative z-10 flex items-center gap-1"><i className="fa-solid fa-stopwatch mr-1 group-hover:animate-pulse"></i> Mock Test</span><div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/30 to-amber-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div></button>
                        <button onClick={() => switchTab('dawnTab')} className={`nav-link group relative px-3 py-2 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg ${activeTab === 'dawnTab' ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold shadow-amber-400/50 shadow-md' : 'hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-800'}`}><span className="relative z-10 flex items-center gap-1"><i className="fa-solid fa-newspaper mr-1 group-hover:rotate-12 transition-transform"></i> Dawn Vocab</span><div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/30 to-amber-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div></button>
                        <button onClick={() => switchTab('articlesTab')} className={`nav-link group relative px-3 py-2 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg ${activeTab === 'articlesTab' ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold shadow-amber-400/50 shadow-md' : 'hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-800'}`}><span className="relative z-10 flex items-center gap-1"><i className="fa-solid fa-file-lines mr-1 group-hover:scale-110 transition-transform"></i> Articles</span><div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/30 to-amber-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div></button>
                        <button onClick={() => switchTab('libraryTab')} className={`nav-link group relative px-3 py-2 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg ${activeTab === 'libraryTab' ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold shadow-amber-400/50 shadow-md' : 'hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-800'}`}><span className="relative z-10 flex items-center gap-1"><i className="fa-solid fa-book-open mr-1 group-hover:scale-110 transition-transform"></i> Library</span><div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/30 to-amber-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div></button>
                        <button onClick={() => switchTab('savedTab')} className={`nav-link group relative px-3 py-2 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg ${activeTab === 'savedTab' ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold shadow-amber-400/50 shadow-md' : 'hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-800'}`}><span className="relative z-10 flex items-center gap-1"><i className="fa-solid fa-bookmark mr-1 group-hover:animate-pulse"></i> Favorite</span><div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/30 to-amber-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div></button>
                        <button onClick={() => switchTab('aiTab')} className={`nav-link group relative px-3 py-2 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg border border-indigo-600/50 ${activeTab === 'aiTab' ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-amber-300 font-bold shadow-indigo-500/50 shadow-md' : 'bg-gradient-to-r from-indigo-900 to-indigo-950 hover:from-indigo-800 hover:to-indigo-900'}`}><span className="relative z-10 flex items-center gap-1"><i className="fa-solid fa-robot mr-1 group-hover:animate-bounce"></i> AI Tutor</span><div className="absolute inset-0 bg-gradient-to-r from-amber-300/0 via-amber-300/20 to-amber-300/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div></button>
                        {currentUser ? (
                            <button onClick={()=>{handleLogout(); showToast('Logged out');}} className="group relative px-3 py-2 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold"><span className="relative z-10 flex items-center gap-1"><i className="fa-solid fa-user-check mr-1 text-amber-400"></i> {currentUser.name || currentUser.email?.split('@')[0] || 'User'}</span></button>
                        ) : (
                            <button onClick={()=>setAuthModalOpen(true)} className="group relative px-3 py-2 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold shadow-amber-400/30"><span className="relative z-10 flex items-center gap-1"><i className="fa-solid fa-right-to-bracket mr-1 group-hover:animate-pulse"></i> Login / Register</span><div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div></button>
                        )}
                    </nav>
                </div>
            </header>

            <div className="bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 border-b border-amber-300 text-amber-950 py-2.5 px-4 text-xs font-semibold overflow-hidden no-print shadow-inner flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full font-extrabold shrink-0 text-[11px] shadow-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
                    </span>
                    LIVE UPDATE
                </div>
                <div className="w-full overflow-hidden relative flex items-center">
                    <div className="ticker-marquee-content" dangerouslySetInnerHTML={{ __html: siteTicker || '📢 <span class="font-bold">Latest Exam Update:</span> CSS MPT &amp; SPSC CCE Solved Past Paper MCQs Added • Daily Dawn Vocabulary Active • Live Gemini AI Tutor Active!' }}></div>
                </div>
            </div>

            {readerOpen && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[70] flex items-center justify-center p-2 sm:p-4 no-print">
                    <div className="bg-white w-full h-[98vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative">
                        <div className="bg-slate-900 text-white p-3 sm:p-4 flex justify-between items-center border-b border-slate-800 gap-2">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="bg-amber-400 text-slate-950 p-2 rounded-xl"><i className="fa-solid fa-book-reader"></i></div>
                                <div className="truncate"><h3 className="font-bold text-xs sm:text-base truncate">{readerData.title}</h3><p className="text-[10px] sm:text-xs text-amber-400">{readerData.cat}</p></div>
                            </div>
                            <div className="flex items-center gap-2">
                                {readerData.type !== 'pdf' && readerData.content && (
                                    <button onClick={() => {
                                        const blob = new Blob([readerData.content || ''], { type: 'text/plain;charset=utf-8' });
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `${(readerData.title||'document').replace(/[^a-z0-9]/gi,'_')}.txt`;
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        showToast('Download started');
                                    }} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold"><i className="fa-solid fa-download mr-1"></i> Download</button>
                                )}
                                {readerData.type === 'pdf' && readerData.url && (
                                    <button onClick={() => window.open(readerData.url, '_blank')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold"><i className="fa-solid fa-download mr-1"></i> Download</button>
                                )}
                                <button onClick={() => setReaderOpen(false)} className="text-slate-400 hover:text-white"><i className="fa-solid fa-xmark text-lg"></i></button>
                            </div>
                        </div>
                        <div className="flex-grow bg-slate-100 p-2 sm:p-4 overflow-hidden">
                            {readerData.type === 'pdf' && readerData.content ? <iframe src={formatGoogleDriveUrl(readerData.content) || readerData.content} className="w-full h-full rounded-xl border border-slate-300 bg-white" allow="autoplay"></iframe> : <div className="w-full h-full bg-white p-4 sm:p-10 rounded-xl border border-slate-200 shadow-sm overflow-y-auto"><div className="whitespace-pre-line text-slate-800 leading-relaxed text-xs sm:text-sm max-w-5xl mx-auto">{readerData.content}</div></div>}
                        </div>
                    </div>
                </div>
            )}

            {commentModalMcq && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[75] flex items-center justify-center p-4 no-print">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setCommentModalMcq(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-lg"></i></button>
                        <div className="border-b pb-2 pr-8">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><i className="fa-regular fa-comments text-indigo-600"></i> Comments</h3>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{commentModalMcq.question}</p>
                        </div>
                        <div className="space-y-2.5">
                            <div className="grid sm:grid-cols-2 gap-2">
                                <input value={commentForm.name} onChange={(e) => setCommentForm((p) => ({ ...p, name: e.target.value }))} placeholder="Your name" className="p-2.5 border border-slate-300 rounded-lg text-sm" />
                                <input type="email" value={commentForm.email} onChange={(e) => setCommentForm((p) => ({ ...p, email: e.target.value }))} placeholder="Your email (not public)" className="p-2.5 border border-slate-300 rounded-lg text-sm" />
                            </div>
                            <textarea rows="3" value={commentForm.text} onChange={(e) => setCommentForm((p) => ({ ...p, text: e.target.value }))} placeholder="Write your comment..." className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"></textarea>
                            <button onClick={postComment} className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-bold py-2.5 rounded-lg text-sm"><i className="fa-solid fa-paper-plane mr-1"></i> Post Comment</button>
                            <p className="text-[10px] text-slate-400 text-center">Your email is only visible to the admin, never publicly.</p>
                        </div>
                        <div className="border-t pt-3 space-y-2.5 max-h-64 overflow-y-auto">
                            {commentsLoading ? (
                                <p className="text-xs text-slate-400">Loading comments...</p>
                            ) : comments.length === 0 ? (
                                <p className="text-xs text-slate-400">No comments yet. Be the first to comment!</p>
                            ) : comments.map((c) => (
                                <div key={c._id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <div className="flex justify-between items-center gap-2">
                                        <strong className="text-xs text-slate-900">{c.name}</strong>
                                        <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-slate-700 mt-1 whitespace-pre-line">{c.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {submitMcqOpen && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[75] flex items-center justify-center p-4 no-print">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setSubmitMcqOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-lg"></i></button>
                        <div className="border-b pb-2">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><i className="fa-solid fa-circle-plus text-emerald-600"></i> Submit Your MCQ</h3>
                            <p className="text-xs text-slate-500 mt-1">Your MCQ will be reviewed by the admin before it appears on the website.</p>
                        </div>
                        <div className="space-y-3 text-xs sm:text-sm">
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className="block font-bold text-slate-700 mb-1">Main Category</label><select value={submitMcqForm.mainCategory} onChange={(e) => setSubmitMcqForm((p) => ({ ...p, mainCategory: e.target.value, subCategory: '' }))} className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50"><option value="">Select</option>{catTree.map((m) => <option key={m._id} value={m.name}>{m.name}</option>)}</select></div>
                                <div><label className="block font-bold text-slate-700 mb-1">Sub Category</label><select value={submitMcqForm.subCategory} onChange={(e) => setSubmitMcqForm((p) => ({ ...p, subCategory: e.target.value }))} className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50"><option value="">Select</option>{(catTree.find((x) => x.name === submitMcqForm.mainCategory)?.children || []).map((s) => <option key={s._id} value={s.name}>{s.name}</option>)}</select></div>
                            </div>
                            <div><label className="block font-bold text-slate-700 mb-1">Question Statement</label><textarea rows="2" value={submitMcqForm.question} onChange={(e) => setSubmitMcqForm((p) => ({ ...p, question: e.target.value }))} placeholder="Enter the full question..." className="w-full p-2.5 border border-slate-300 rounded-lg"></textarea></div>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" value={submitMcqForm.opt0} onChange={(e) => setSubmitMcqForm((p) => ({ ...p, opt0: e.target.value }))} placeholder="Option A" className="p-2.5 border border-slate-300 rounded-lg" />
                                <input type="text" value={submitMcqForm.opt1} onChange={(e) => setSubmitMcqForm((p) => ({ ...p, opt1: e.target.value }))} placeholder="Option B" className="p-2.5 border border-slate-300 rounded-lg" />
                                <input type="text" value={submitMcqForm.opt2} onChange={(e) => setSubmitMcqForm((p) => ({ ...p, opt2: e.target.value }))} placeholder="Option C" className="p-2.5 border border-slate-300 rounded-lg" />
                                <input type="text" value={submitMcqForm.opt3} onChange={(e) => setSubmitMcqForm((p) => ({ ...p, opt3: e.target.value }))} placeholder="Option D" className="p-2.5 border border-slate-300 rounded-lg" />
                            </div>
                            <div><label className="block font-bold text-slate-700 mb-1">Correct Answer</label><select value={submitMcqForm.answerIndex} onChange={(e) => setSubmitMcqForm((p) => ({ ...p, answerIndex: Number(e.target.value) }))} className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50"><option value={0}>Option A</option><option value={1}>Option B</option><option value={2}>Option C</option><option value={3}>Option D</option></select></div>
                            <div><label className="block font-bold text-slate-700 mb-1">Explanation (optional)</label><input type="text" value={submitMcqForm.explanation} onChange={(e) => setSubmitMcqForm((p) => ({ ...p, explanation: e.target.value }))} placeholder="Explain the answer..." className="w-full p-2.5 border border-slate-300 rounded-lg" /></div>
                            <button onClick={submitMcq} disabled={submittingMcq} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg">{submittingMcq ? 'Submitting...' : 'Submit MCQ for Approval'}</button>
                        </div>
                    </div>
                </div>
            )}

            {authModalOpen && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4 no-print">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setAuthModalOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-lg"></i></button>
                        <div className="text-center space-y-2">
                            <div className="bg-indigo-100 text-indigo-900 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-xl"><i className="fa-solid fa-user-graduate"></i></div>
                            <h3 className="text-xl font-bold text-slate-900">Student Login / Register</h3>
                            <p className="text-xs text-slate-500">Create account to save MCQs, Vocab, Articles & Books</p>
                        </div>
                        <div className="space-y-3">
                            <input id="authName" type="text" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Full Name (for registration)" />
                            <input id="authEmail" type="email" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Email Address" />
                            <input id="authPass" type="password" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Password" />
                            <button onClick={async ()=>{
                                const name = document.getElementById('authName').value.trim();
                                const email = document.getElementById('authEmail').value.trim().toLowerCase();
                                const password = document.getElementById('authPass').value;
                                if(!email || !password){ showToast('Email and password required','error'); return; }
                                try {
                                    const res = await api.post('/auth/login',{email,password});
                                    const user = res?.user || res?.data?.user || res;
                                    if(user){ setCurrentUser(user); loadSavedBookmarks(); setAuthModalOpen(false); showToast(user.role === 'admin' ? 'Admin login successful' : 'Login successful'); }
                                    else { showToast('Authentication failed','error'); }
                                } catch(e){ 
                                    try {
                                        if(!name){ showToast('Name required for registration','error'); return; }
                                        const res2 = await api.post('/auth/register',{name,email,password});
                                        const user2 = res2?.user || res2?.data?.user || res2;
                                        if(user2){ setCurrentUser(user2); loadSavedBookmarks(); setAuthModalOpen(false); showToast('Account created & logged in'); }
                                        else showToast('Registration failed','error');
                                    } catch(e2){ showToast(e2.message||'Login failed','error'); } 
                                }
                            }} className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold py-2.5 rounded-lg text-sm transition">Login / Register</button>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 py-6 flex-grow w-full space-y-6">
                {activeTab === 'homeTab' && (
                    <section className="space-y-6">
                        <div className="relative overflow-hidden text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-800 space-y-4" style={{ backgroundImage: 'radial-gradient(120% 120% at 100% 0%, rgba(245,179,1,0.20) 0%, rgba(245,179,1,0) 45%), radial-gradient(100% 100% at 0% 100%, rgba(67,56,202,0.38) 0%, rgba(67,56,202,0) 55%), linear-gradient(135deg, #060A14 0%, #0B1220 55%, #161244 100%)' }}>
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Prepare for <span className="text-amber-400">CSS, PMS, PCS, CCE</span> & All Competitive Exams</h2>
                            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">Access thousands of verified MCQs, solved past papers, Dawn vocabulary, editorial articles, and AI-powered study guides.</p>
                            <div className="flex flex-col sm:flex-row gap-2 w-full max-w-4xl">
                                <div className="relative flex-grow min-w-0"><i className="fa-solid fa-magnifying-glass absolute left-4 top-3.5 text-slate-400"></i><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search questions, subjects, amendments, rivers, foreign words..." className="w-full pl-11 pr-4 py-3 rounded-xl border-0 text-slate-900 text-sm focus:ring-2 focus:ring-amber-400 outline-none shadow-inner" /></div>
                                <button onClick={openSubmitMcq} className="shrink-0 px-4 py-3 rounded-xl text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition flex items-center justify-center gap-2 shadow-gold"><i className="fa-solid fa-circle-plus"></i> Submit Your MCQ</button>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {categoryList.map((cat) => {
                                    const hasSub = cat !== 'ALL' && catTree.find(m => m.name === cat) && (catTree.find(m => m.name === cat)?.children || []).length > 0;
                                    return (
                                        <a key={cat} href={cat === 'ALL' ? '/mcqs' : `/mcqs/${toSlug(cat)}`} onClick={(e) => { e.preventDefault(); selectCategory(cat); }} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm transition flex items-center gap-1 ${activeCategory === cat ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}>{cat}{hasSub && <i className="fa-solid fa-chevron-down text-[9px]"></i>}</a>
                                    );
                                })}
                            </div>
                            {activeCategory !== 'ALL' && catTree.find(m => m.name === activeCategory) && (
                                <div className="flex flex-wrap gap-2">
                                    {(catTree.find(m => m.name === activeCategory)?.children || []).map((sub) => (
                                        <a key={sub._id} href={`/mcqs/${toSlug(sub.name)}`} onClick={(e) => { e.preventDefault(); selectCategory(sub.name); }} className={`px-2.5 py-1 rounded-lg text-xs transition ${activeCategory === sub.name ? 'bg-emerald-400 text-slate-950 font-bold' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}>{sub.name}</a>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">{filteredMcqs.map((mcq) => {
                            const mcqId = mcq._id || mcq.id;
                            const cardId = `mcq-card-${mcqId}`;
                            const isSaved = savedMcqs.includes(String(mcqId));
                            return (
                                <div key={mcqId} id={cardId} className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4 ${mcq.isNew ? 'new-card-glow' : ''}`}>
                                    <div className="flex justify-between items-center"><span className="bg-indigo-100 text-indigo-900 text-[11px] font-bold px-2.5 py-1 rounded-lg">{mcq.category}</span><button onClick={() => toggleBookmarkMcq(mcqId)} aria-label={isSaved ? 'Remove this MCQ from favorites' : 'Save this MCQ to favorites'} title={isSaved ? 'Remove from favorites' : 'Save to favorites'} className="text-slate-400 hover:text-amber-500 transition"><i className={`${isSaved ? 'fa-solid text-amber-500' : 'fa-regular'} fa-bookmark text-base`}></i></button></div>
                                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">{mcq.question}</h3>
                                    <div className="grid sm:grid-cols-2 gap-2.5">{(mcq.options||[]).map((opt, optIdx) => (<button key={optIdx} onClick={() => checkAnswer(mcqId, optIdx, cardId)} className={`opt-btn-${mcqId} w-full text-left p-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-indigo-300 transition text-xs sm:text-sm flex items-center justify-between`}><span>{String.fromCharCode(65 + optIdx)}) {opt}</span><i className="fa-regular fa-circle text-slate-300 opt-icon"></i></button>))}</div>
                                    <div id={`explanation-${mcqId}`} className="hidden bg-indigo-50 p-3.5 rounded-xl text-xs text-indigo-950 border border-indigo-100 space-y-1"><p><strong>Explanation:</strong> {mcq.explanation}</p></div>
                                    {mcq.submittedBy && (<p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1"><i className="fa-solid fa-user-pen"></i> Submitted by {mcq.submittedBy}</p>)}
                                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 gap-2 flex-wrap">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <button onClick={() => openComments(mcq)} className="text-slate-500 hover:text-indigo-700 text-xs font-semibold flex items-center gap-1.5"><i className="fa-regular fa-comment"></i> Comments{commentCounts[String(mcqId)] ? ` (${commentCounts[String(mcqId)]})` : ''}</button>
                                            <button onClick={() => shareMcq(mcq)} aria-label="Share this MCQ on WhatsApp" title="Share on WhatsApp" className="text-emerald-700 hover:text-emerald-800 text-xs font-semibold flex items-center gap-1.5"><i className="fa-brands fa-whatsapp"></i> Share</button>
                                            <button onClick={() => copyMcq(mcq)} aria-label="Copy link to this MCQ" title="Copy link" className="text-slate-500 hover:text-indigo-700 text-xs font-semibold flex items-center gap-1.5"><i className="fa-solid fa-link"></i> Copy link</button>
                                        </div>
                                        <span className="text-[10px] text-slate-500">Tap an option to check the answer</span>
                                    </div>
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
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-indigo-700 space-y-4">
                                        <div className="text-center space-y-2"><h3 className="text-2xl sm:text-3xl font-black">🎉 Test Completed</h3><div className="text-6xl font-black text-amber-400">{testResult.correct} / {testResult.total}</div><p className="text-lg font-bold">Score: {testResult.percentage}%</p><p className="text-xs text-slate-300">Correct: {testResult.correct} | Wrong: {testResult.wrong} | Total: {testResult.total}</p></div>
                                        <div className="bg-white/10 p-4 rounded-xl text-center italic text-sm">"{testResult.quote}"</div>
                                    </div>
                                    
                                    {testResult.categoryBreakdown && testResult.categoryBreakdown.length > 0 && (
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                                            <div>
                                                <h4 className="font-bold text-slate-900 flex items-center gap-2"><i className="fa-solid fa-chart-simple text-indigo-700"></i> Subject Diagnostic Breakdown</h4>
                                                <p className="text-xs text-slate-600 mt-1">Accuracy per subject. Anything below 50% is marked as a weak focus area.</p>
                                            </div>
                                            <div className="grid sm:grid-cols-2 gap-3">
                                                {testResult.categoryBreakdown.map((row, idx) => {
                                                    const isWeak = row.percentage < 50;
                                                    const isMid = row.percentage >= 50 && row.percentage < 70;
                                                    const tone = isWeak ? 'border-rose-300 bg-rose-50' : isMid ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-emerald-50';
                                                    const scoreTone = isWeak ? 'text-rose-700' : isMid ? 'text-amber-700' : 'text-emerald-700';
                                                    return (
                                                        <div key={idx} className={`p-4 rounded-xl border ${tone} space-y-2`}>
                                                            <div className="flex justify-between items-start gap-2">
                                                                <div>
                                                                    <p className="font-bold text-slate-900 text-sm">{row.category}</p>
                                                                    <p className="text-xs text-slate-600">{row.correct}/{row.total} correct</p>
                                                                </div>
                                                                <p className={`text-lg font-black ${scoreTone}`}>{row.percentage}%</p>
                                                            </div>
                                                            {isWeak && <span className="inline-block bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">Weak Focus Area</span>}
                                                            {isWeak && (
                                                                <button onClick={() => goToLibraryFor(row.category)} className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2"><i className="fa-solid fa-book-open"></i> Revise {row.category} Notes</button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <button onClick={() => { switchTab('aiTab'); setAiPrompt(`I scored ${testResult.percentage}% in mock test. My weak subjects are: ${(testResult.categoryBreakdown || []).filter(w=>w.percentage<70).map(w=>w.category+' ('+w.percentage+'%)').join(', ') || 'none'}. Please help me improve in these weak areas with targeted questions and explanations.`); }} className="w-full bg-indigo-900 hover:bg-indigo-800 text-amber-300 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"><i className="fa-solid fa-robot"></i> Get Help in Your Weak Areas - Use Gemini AI Tutor</button>
                                        </div>
                                    )}
                                    
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                                        <h4 className="font-bold text-slate-900 flex items-center gap-2"><i className="fa-solid fa-list-check"></i> Detailed Review - Question by Question</h4>
                                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                            {testResult.details && testResult.details.map((d, idx) => (
                                                <div key={idx} className={`p-4 rounded-xl border ${d.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'} space-y-2`}>
                                                    <div className="flex justify-between items-start gap-2">
                                                        <p className="font-bold text-slate-900 text-xs sm:text-sm flex-1">Q{idx+1}: {d.question}</p>
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${d.isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>{d.isCorrect ? '✓ CORRECT' : '✗ WRONG'}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-600"><strong>Category:</strong> {d.category}</p>
                                                    <div className="space-y-1">
                                                        {(d.options||[]).map((opt, oIdx) => (
                                                            <div key={oIdx} className={`p-2 rounded text-xs flex items-center gap-2 ${oIdx === d.correctAnswer ? 'bg-emerald-100 border border-emerald-300' : oIdx === d.userAnswer && !d.isCorrect ? 'bg-rose-100 border border-rose-300' : 'bg-white border border-slate-200'}`}>
                                                                <span className="font-bold">{String.fromCharCode(65+oIdx)})</span>
                                                                <span className="flex-1">{opt}</span>
                                                                {oIdx === d.correctAnswer && <span className="text-emerald-700 font-bold text-xs">✓ Correct Answer</span>}
                                                                {oIdx === d.userAnswer && !d.isCorrect && <span className="text-rose-700 font-bold text-xs">✗ Your Answer</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {!d.isCorrect && d.explanation && (
                                                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 text-xs"><strong className="text-indigo-900">Explanation:</strong> <span className="text-indigo-800">{d.explanation}</span></div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button onClick={resetMockTest} className="flex-1 bg-indigo-900 hover:bg-indigo-800 text-white font-bold py-3 rounded-xl text-sm">Take Another Test</button>
                                        <button onClick={() => switchTab('homeTab')} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-sm">Back to Home</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {activeTab === 'dawnTab' && (
                    <section className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="border-b pb-4 mb-6">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><i className="fa-solid fa-newspaper text-indigo-600"></i> Daily Dawn Editorial Vocabulary & Headlines</h2>
                                <p className="text-xs text-slate-500 mt-1">High-yield vocabulary words with Urdu meanings, context, and daily national headlines for CSS/PMS candidates.</p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center gap-2"><i className="fa-solid fa-book text-amber-500"></i> Today's Editorial Vocab</h3>
                                    <div className="space-y-3">{dawnWords.map((w, i) => { const id = w._id || w.id || i; const isSaved = savedVocab.includes(String(id)); return (<div key={id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 text-xs sm:text-sm"><div className="flex justify-between items-start"><p className="font-bold text-indigo-900">{w.word} <span className="text-[11px] text-slate-500 font-normal">({w.type || w.partsOfSpeech || 'Noun'})</span></p><button onClick={() => toggleBookmarkVocab(id)} className="text-slate-400 hover:text-amber-500 transition"><i className={`${isSaved ? 'fa-solid text-amber-500' : 'fa-regular'} fa-bookmark`}></i></button></div><p className="text-slate-700"><strong>Urdu:</strong> {w.urdu}</p><p className="text-slate-700"><strong>Meaning:</strong> {w.meaning}</p><p className="text-slate-700"><strong>Usage of Sentence:</strong> {w.sentence || w.usage || ''}</p></div>); })}</div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center gap-2"><i className="fa-solid fa-bullhorn text-amber-500"></i> {headlinesHeading}</h3>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><ul className="list-disc pl-5 text-xs sm:text-sm text-slate-700 space-y-2">{headlines.map((h, i) => <li key={i} className="hover:text-indigo-700 transition">{h.title || h}</li>)}</ul></div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'articlesTab' && (
                    <section className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><i className="fa-solid fa-file-pen text-amber-600"></i> Editorial Articles</h2>
                            <div className="grid md:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto pr-1">{articles.map((art, i) => { const id = art._id || art.id || i; const isSaved = savedArticles.includes(String(id)); return (<div key={id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3"><div className="flex justify-between items-center"><span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">{art.category}</span><button onClick={() => toggleBookmarkArticle(id)} className="text-slate-400 hover:text-amber-500"><i className={`${isSaved ? 'fa-solid text-amber-500' : 'fa-regular'} fa-bookmark`}></i></button></div><h3 className="font-bold text-slate-900 text-sm">{art.title}</h3><p className="text-[11px] text-slate-500">By {art.author}</p><div className="grid grid-cols-2 gap-2"><button onClick={() => { setReaderData({ title: art.title, cat: `Editorial Essay • ${art.category}`, type: 'text', content: art.content }); setReaderOpen(true); }} className="bg-slate-900 text-amber-400 hover:bg-slate-800 text-xs font-bold px-3 py-2 rounded-lg transition"><i className="fa-solid fa-expand mr-1"></i> Full Page View</button><button onClick={() => { const blob = new Blob([art.content || ''], { type: 'text/plain;charset=utf-8' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${(art.title||'article').replace(/[^a-z0-9]/gi,'_')}.txt`; a.click(); window.URL.revokeObjectURL(url); showToast('Download started'); }} className="bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition"><i className="fa-solid fa-download mr-1"></i> Download</button></div></div>); })}</div>
                        </div>
                    </section>
                )}

                {activeTab === 'libraryTab' && (
                    <section className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><i className="fa-solid fa-book-open text-indigo-600"></i> PDF Notes & Books Library</h2>
                            {libraryFilter !== 'ALL' && (
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                                    <p className="text-xs font-semibold text-amber-900">Showing resources for: {libraryFilter}</p>
                                    <button onClick={() => setLibraryFilter('ALL')} className="text-xs font-bold text-amber-900 underline">Show all resources</button>
                                </div>
                            )}
                            {filteredLibrary.length === 0 && (
                                <div className="mb-4 bg-slate-50 p-6 rounded-xl border border-slate-200 text-xs text-slate-700">
                                    No library resources for <strong>{libraryFilter}</strong> yet.
                                    <button onClick={() => setLibraryFilter('ALL')} className="ml-1 underline font-bold text-indigo-700">Show all resources</button>
                                </div>
                            )}
                            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[75vh] overflow-y-auto pr-1">{filteredLibrary.map((item, i) => { const id = item._id || item.id || i; const isSaved = savedBooks.includes(String(id)); return (<div key={id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3"><div><div className="flex justify-between items-start"><span className="text-[10px] font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded">{item.category || item.cat}</span><button onClick={() => toggleBookmarkBook(id)} aria-label={isSaved ? 'Remove this book from favorites' : 'Save this book to favorites'} title={isSaved ? 'Remove from favorites' : 'Save to favorites'} className="text-slate-400 hover:text-amber-500"><i className={`${isSaved ? 'fa-solid text-amber-500' : 'fa-regular'} fa-bookmark`}></i></button></div><h4 className="font-bold text-slate-900 mt-2">{item.title}</h4><p className="text-slate-500 text-xs">{item.sizeLabel || item.size}</p></div><div className="grid grid-cols-2 gap-2"><button onClick={() => openReaderModal(id)} className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-2 rounded-lg text-xs"><i className="fa-solid fa-expand mr-1"></i> Full Page View</button><button onClick={() => downloadBook(id)} className="bg-indigo-900 hover:bg-indigo-800 text-white font-semibold py-2 rounded-lg text-xs"><i className="fa-solid fa-download mr-1"></i> Download</button></div></div>); })}</div>
                        </div>
                    </section>
                )}

                {activeTab === 'savedTab' && (
                    <section className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="border-b pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div><h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><i className="fa-solid fa-bookmark mr-1"></i> Favorite</h2></div>{currentUser && <div className="flex gap-2"><button onClick={() => setSavedSubFilter('ALL')} className={`px-3 py-1 rounded-lg text-xs ${savedSubFilter === 'ALL' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-100 text-slate-700'}`}>All</button><button onClick={() => setSavedSubFilter('MCQS')} className={`px-3 py-1 rounded-lg text-xs ${savedSubFilter === 'MCQS' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-100 text-slate-700'}`}>MCQs</button><button onClick={() => setSavedSubFilter('VOCAB')} className={`px-3 py-1 rounded-lg text-xs ${savedSubFilter === 'VOCAB' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-100 text-slate-700'}`}>Vocab</button><button onClick={() => setSavedSubFilter('ARTICLES')} className={`px-3 py-1 rounded-lg text-xs ${savedSubFilter === 'ARTICLES' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-100 text-slate-700'}`}>Articles</button><button onClick={() => setSavedSubFilter('BOOKS')} className={`px-3 py-1 rounded-lg text-xs ${savedSubFilter === 'BOOKS' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-100 text-slate-700'}`}>Books</button></div>}</div>
                            <div className="space-y-6">
                                {!currentUser && <div className="bg-amber-50 p-8 text-center text-amber-900 rounded-2xl border border-amber-200 text-sm"><i className="fa-solid fa-lock mr-2"></i>Please <button onClick={()=>setAuthModalOpen(true)} className="font-bold underline">login or register</button> to view and save your favorites.</div>}
                                {currentUser && <>
                                {(savedSubFilter === 'ALL' || savedSubFilter === 'MCQS') && savedM.length > 0 && <div className="space-y-3"><h3 className="font-bold text-slate-800 text-sm">Saved MCQs ({savedM.length})</h3>{savedM.map((m) => { const id = m._id || m.id; return (<div key={id} onClick={() => { navigate(`/mcq/${id}`); }} className="bg-slate-50 p-4 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition"><div className="flex justify-between items-center mb-2 gap-2"><span className="bg-indigo-100 text-indigo-900 text-[10px] font-bold px-2 py-0.5 rounded">{m.category}</span><div className="flex items-center gap-2"><button onClick={(e) => { e.stopPropagation(); shareMcq(m); }} aria-label="Share this MCQ on WhatsApp" title="Share on WhatsApp" className="text-emerald-700 hover:text-emerald-800 text-xs"><i className="fa-brands fa-whatsapp"></i></button><button onClick={(e) => { e.stopPropagation(); copyMcq(m); }} aria-label="Copy link to this MCQ" title="Copy link" className="text-slate-500 hover:text-indigo-700 text-xs"><i className="fa-solid fa-link"></i></button><button onClick={(e) => { e.stopPropagation(); toggleBookmarkMcq(id); }} className="text-rose-600 text-xs font-bold">Remove</button></div></div><p className="font-bold text-slate-900 text-xs">{m.question}</p></div>); })}</div>}
                                {(savedSubFilter === 'ALL' || savedSubFilter === 'VOCAB') && savedV.length > 0 && <div className="space-y-3"><h3 className="font-bold text-slate-800 text-sm">Saved Vocab ({savedV.length})</h3>{savedV.map((w, i) => { const id = w._id || w.id || i; return (<div key={id} onClick={() => { setActiveTab('dawnTab'); }} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs cursor-pointer hover:bg-slate-100 transition"><div><strong className="text-indigo-950">{w.word}</strong> - {w.urdu}</div><button onClick={(e) => { e.stopPropagation(); toggleBookmarkVocab(id); }} className="text-rose-600 font-bold">Remove</button></div>); })}</div>}
                                {(savedSubFilter === 'ALL' || savedSubFilter === 'ARTICLES') && savedA.length > 0 && <div className="space-y-3"><h3 className="font-bold text-slate-800 text-sm">Saved Articles ({savedA.length})</h3>{savedA.map((a, i) => { const id = a._id || a.id || i; return (<div key={id} onClick={() => { setReaderData({ title: a.title, cat: `Editorial Essay • ${a.category}`, type: 'text', content: a.content }); setReaderOpen(true); }} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs cursor-pointer hover:bg-slate-100 transition"><div><strong className="text-slate-900">{a.title}</strong></div><button onClick={(e) => { e.stopPropagation(); toggleBookmarkArticle(id); }} className="text-rose-600 font-bold">Remove</button></div>); })}</div>}
                                {(savedSubFilter === 'ALL' || savedSubFilter === 'BOOKS') && savedB.length > 0 && <div className="space-y-3"><h3 className="font-bold text-slate-800 text-sm">Saved Books ({savedB.length})</h3>{savedB.map((b, i) => { const id = b._id || b.id || i; return (<div key={id} onClick={() => { openReaderModal(id); }} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs cursor-pointer hover:bg-slate-100 transition"><div><strong className="text-slate-900">{b.title}</strong></div><button onClick={(e) => { e.stopPropagation(); toggleBookmarkBook(id); }} className="text-rose-600 font-bold">Remove</button></div>); })}</div>}
                                {savedM.length === 0 && savedV.length === 0 && savedA.length === 0 && savedB.length === 0 && <div className="bg-slate-50 p-8 text-center text-slate-500 rounded-2xl border border-slate-200 text-xs">No saved items yet.</div>}
                                </>}
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'aiTab' && (
                    <section className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="border-b pb-4 mb-4 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">AI Exam Tutor Chatbot</h2>
                                    <p className="text-xs text-slate-600 mt-1">Powered by Gemini • Sirf logged-in students ke liye</p>
                                </div>
                                {currentUser && (
                                    <button onClick={clearAiChat} disabled={aiLoading} className="text-xs text-slate-500 disabled:opacity-40">Clear Chat</button>
                                )}
                            </div>

                            {!currentUser ? (
                                <div className="bg-amber-50 p-8 text-center text-amber-900 rounded-2xl border border-amber-200 space-y-3">
                                    <div className="bg-amber-100 text-amber-700 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-xl"><i className="fa-solid fa-lock"></i></div>
                                    <p className="text-sm font-semibold">AI Tutor use karne ke liye login ya register karein.</p>
                                    <p className="text-xs">Sirf logged-in students hi AI se sawal pooch sakte hain.</p>
                                    <button onClick={() => setAuthModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold px-5 py-2.5 rounded-xl text-sm">Login / Register</button>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4 flex flex-wrap gap-2">
                                        <button onClick={()=>sendAiChatMessage('Create a detailed CSS 7-Day Study Timetable for competitive exams')} className="text-xs bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:text-slate-900 transition">📅 CSS 7-Day Timetable</button>
                                        <button onClick={()=>sendAiChatMessage('Give me practical English Essay Tips for CSS/PMS with structure, outline and examples')} className="text-xs bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:text-slate-900 transition">✍️ English Essay Tips</button>
                                        <button onClick={()=>sendAiChatMessage('Suggest effective General Knowledge Strategy for CSS/PMS including sources and revision plan')} className="text-xs bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:text-slate-900 transition">💡 General Knowledge Strategy</button>
                                        <button onClick={()=>sendAiChatMessage('How to prepare for Current Affairs for CSS/PMS? Give daily routine and resources')} className="text-xs bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:text-slate-900 transition">📰 Current Affairs Prep</button>
                                        <button onClick={()=>sendAiChatMessage('Explain English Precis Writing rules, techniques and practice for CSS')} className="text-xs bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:text-slate-900 transition">📝 Precis Writing Guide</button>
                                        <button onClick={()=>sendAiChatMessage('Give me MCQ Practice Strategy with weak area improvement plan')} className="text-xs bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:text-slate-900 transition">🎯 MCQ Practice Strategy</button>
                                    </div>
                                    <div ref={aiChatRef} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 min-h-[380px] max-h-[500px] overflow-y-auto space-y-4 shadow-inner">
                                        {aiMessages.map((m, i) => (
                                            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                                                {m.role === 'ai' && <div className="bg-indigo-900 text-amber-400 p-2 rounded-xl h-fit"><i className="fa-solid fa-robot"></i></div>}
                                                <div className={`${m.role === 'user' ? 'bg-indigo-900 text-white' : 'bg-white'} ${m.offline ? 'border border-amber-300' : ''} p-4 rounded-2xl text-xs sm:text-sm whitespace-pre-line max-w-2xl space-y-1`}>
                                                    {m.role === 'user' ? m.text : renderAiText(m.text)}
                                                    {m.role === 'ai' && m.model && !m.offline && <p className="text-[10px] text-slate-400 pt-1">Gemini • {m.model}</p>}
                                                </div>
                                            </div>
                                        ))}
                                        {aiLoading && (
                                            <div className="flex gap-3">
                                                <div className="bg-indigo-900 text-amber-400 p-2 rounded-xl h-fit"><i className="fa-solid fa-robot"></i></div>
                                                <div className="bg-white p-4 rounded-2xl text-xs sm:text-sm max-w-2xl text-slate-500">
                                                    <span className="animate-pulse">AI Tutor soch raha hai...</span>
                                                    <p className="text-[10px] text-slate-400 mt-1">First request may take 30–60 seconds if the server was asleep.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <textarea
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiChatMessage(); } }}
                                            rows="2"
                                            placeholder="Type your question... (Enter to send, Shift+Enter for new line)"
                                            disabled={aiLoading}
                                            className="flex-grow p-3 border border-slate-300 rounded-xl text-xs disabled:bg-slate-100"
                                        ></textarea>
                                        <button onClick={() => sendAiChatMessage()} disabled={aiLoading || !aiPrompt.trim()} className="bg-indigo-900 hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-amber-300 font-bold px-5 rounded-xl text-xs">
                                            {aiLoading ? 'Sending...' : 'Send'}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2">AI general knowledge bhi answer karta hai, lekin important facts official source se verify karein.</p>
                                </>
                            )}
                        </div>
                    </section>
                )}

                {activeTab === 'aboutTab' && <AboutPage />}
                {activeTab === 'privacyTab' && <PrivacyPage />}
                {activeTab === 'termsTab' && <TermsPage />}
                {activeTab === 'disclaimerTab' && <DisclaimerPage />}

                {activeTab === 'adminTab' && null}

                {activeTab === 'adminPanelTab' && currentUser?.role === 'admin' && (
                    <section className="space-y-6">
                        <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div className="flex items-center gap-3">
                                <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md">AUTHENTICATED ADMIN</span>
                                <div><h3 className="font-bold text-sm sm:text-base">ExamInPocket Control Panel</h3><p className="text-xs text-slate-400">Manage MCQs, Dawn Vocab, Articles, Library Books & AI Key</p></div>
                            </div>
                            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"><i className="fa-solid fa-right-from-bracket"></i> Logout</button>
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
                            <div className="grid sm:grid-cols-4 gap-3 text-xs sm:text-sm">
                                <div><label className="block font-bold text-slate-700 mb-1">Main Category</label><select value={adminMcqForm.mainCategory} onChange={(e)=>setAdminMcqForm(p=>({...p,mainCategory:e.target.value, subCategory:''}))} className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50"><option value="">Select Main Category</option>{catTree.map(m=><option key={m._id} value={m.name}>{m.name}</option>)}</select></div>
                                <div><label className="block font-bold text-slate-700 mb-1">Sub Category</label><select value={adminMcqForm.subCategory} onChange={(e)=>setAdminMcqForm(p=>({...p,subCategory:e.target.value}))} className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50"><option value="">Select Sub Category</option>{(catTree.find(x=>x.name===adminMcqForm.mainCategory)?.children||[]).map(s=><option key={s._id} value={s.name}>{s.name}</option>)}</select></div>
                                <div className="sm:col-span-2"><label className="block font-bold text-slate-700 mb-1">Question Statement</label><input type="text" value={adminMcqForm.question} onChange={(e)=>setAdminMcqForm(p=>({...p,question:e.target.value}))} placeholder="Enter full question..." className="w-full p-2.5 border border-slate-300 rounded-lg" /></div>
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
                            <div className="grid sm:grid-cols-5 gap-2 text-xs">
                                <input type="text" value={adminVocabForm.word} onChange={(e)=>setAdminVocabForm(p=>({...p,word:e.target.value}))} placeholder="Word" className="p-2.5 border rounded-lg" />
                                <select value={adminVocabForm.type} onChange={(e)=>setAdminVocabForm(p=>({...p,type:e.target.value}))} className="p-2.5 border rounded-lg bg-slate-50">
                                    <option value="Noun">Noun</option>
                                    <option value="Verb">Verb</option>
                                    <option value="Adjective">Adjective</option>
                                    <option value="Adverb">Adverb</option>
                                    <option value="Preposition">Preposition</option>
                                    <option value="Pronoun">Pronoun</option>
                                    <option value="Conjunction">Conjunction</option>
                                    <option value="Interjection">Interjection</option>
                                    <option value="Idiomatic Expression">Idiomatic Expression</option>
                                    <option value="Verb Phrase">Verb Phrase</option>
                                    <option value="Phrase">Phrase</option>
                                    <option value="Phrasal Verb">Phrasal Verb</option>
                                    <option value="Other">Other</option>
                                </select>
                                <input type="text" value={adminVocabForm.urdu} onChange={(e)=>setAdminVocabForm(p=>({...p,urdu:e.target.value}))} placeholder="Urdu" className="p-2.5 border rounded-lg" />
                                <input type="text" value={adminVocabForm.meaning} onChange={(e)=>setAdminVocabForm(p=>({...p,meaning:e.target.value}))} placeholder="Meaning" className="p-2.5 border rounded-lg" />
                                <input type="text" value={adminVocabForm.sentence} onChange={(e)=>setAdminVocabForm(p=>({...p,sentence:e.target.value}))} placeholder="Usage of Sentence" className="p-2.5 border rounded-lg" />
                            </div>
                            <button onClick={saveVocabFromAdmin} className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold px-6 py-2.5 rounded-lg text-xs"><i className="fa-solid fa-plus mr-1"></i> Save Vocab</button>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-2"><i className="fa-solid fa-heading text-amber-600"></i> Edit Headlines Section Heading</h3>
                            <div className="flex gap-2">
                                <input type="text" value={headlinesHeadingInput} onChange={(e)=>setHeadlinesHeadingInput(e.target.value)} placeholder="Heading..." className="flex-grow p-2.5 border rounded-lg text-xs" />
                                <button onClick={saveHeadlinesHeading} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs"><i className="fa-solid fa-save mr-1"></i> Update Heading</button>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-2"><i className="fa-solid fa-bullhorn text-amber-600"></i> Add Daily Headline</h3>
                            <div className="flex gap-2">
                                <input type="text" value={adminHeadlineForm.title} onChange={(e)=>setAdminHeadlineForm({title:e.target.value})} placeholder="Enter headline..." className="flex-grow p-2.5 border rounded-lg text-xs" />
                                <button onClick={saveHeadlineFromAdmin} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs"><i className="fa-solid fa-plus mr-1"></i> Add Headline</button>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-2"><i className="fa-solid fa-book-medical text-indigo-600"></i> 3. Add PDF Notes / Books to Library</h3>
                            <div className="grid sm:grid-cols-3 gap-3 text-xs"><input type="text" value={adminBookForm.title} onChange={(e)=>setAdminBookForm(p=>({...p,title:e.target.value}))} placeholder="Book Title" className="p-2.5 border rounded-lg" /><input type="text" value={adminBookForm.category} onChange={(e)=>setAdminBookForm(p=>({...p,category:e.target.value}))} placeholder="Category" className="p-2.5 border rounded-lg" /><input type="text" value={adminBookForm.sizeLabel} onChange={(e)=>setAdminBookForm(p=>({...p,sizeLabel:e.target.value}))} placeholder="File Size (e.g. 12 MB PDF)" className="p-2.5 border rounded-lg" /></div>
                            <div className="space-y-2"><p className="text-xs font-bold text-slate-700">Option B: Paste Google Drive / External PDF Link</p><input type="text" value={adminBookForm.url} onChange={(e)=>setAdminBookForm(p=>({...p,url:e.target.value}))} placeholder="Google Drive Link (https://drive.google.com/...) or direct link" className="w-full p-2.5 border rounded-lg text-xs" /></div>
                            <button onClick={saveBookFromAdmin} className="bg-indigo-900 hover:bg-indigo-800 text-white font-bold px-6 py-2.5 rounded-lg text-xs"><i className="fa-solid fa-cloud-arrow-up mr-1"></i> Add Book to Library</button>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-2"><i className="fa-solid fa-list-check text-indigo-600"></i> Manage Content Items (Edit & Delete)</h3>
                            <div className="flex flex-wrap gap-2"><button onClick={()=>setAdminManageTab('MCQS')} className={`px-3 py-1 rounded-lg text-xs ${adminManageTab==='MCQS'?'bg-slate-900 text-white':'bg-slate-100 text-slate-700'}`}>MCQs</button><button onClick={()=>setAdminManageTab('VOCAB')} className={`px-3 py-1 rounded-lg text-xs ${adminManageTab==='VOCAB'?'bg-slate-900 text-white':'bg-slate-100 text-slate-700'}`}>Dawn Vocab</button><button onClick={()=>setAdminManageTab('HEADLINES')} className={`px-3 py-1 rounded-lg text-xs ${adminManageTab==='HEADLINES'?'bg-slate-900 text-white':'bg-slate-100 text-slate-700'}`}>Headlines</button><button onClick={()=>setAdminManageTab('ARTICLES')} className={`px-3 py-1 rounded-lg text-xs ${adminManageTab==='ARTICLES'?'bg-slate-900 text-white':'bg-slate-100 text-slate-700'}`}>Articles</button><button onClick={()=>setAdminManageTab('BOOKS')} className={`px-3 py-1 rounded-lg text-xs ${adminManageTab==='BOOKS'?'bg-slate-900 text-white':'bg-slate-100 text-slate-700'}`}>Books</button><button onClick={()=>setAdminManageTab('SUBMISSIONS')} className={`px-3 py-1 rounded-lg text-xs ${adminManageTab==='SUBMISSIONS'?'bg-emerald-700 text-white':'bg-emerald-100 text-emerald-900'}`}>MCQ Submissions{adminSubmissions.length > 0 ? ` (${adminSubmissions.length})` : ''}</button><button onClick={()=>setAdminManageTab('COMMENTS')} className={`px-3 py-1 rounded-lg text-xs ${adminManageTab==='COMMENTS'?'bg-indigo-700 text-white':'bg-indigo-100 text-indigo-900'}`}>Comments</button></div>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                {adminManageTab==='MCQS' && mcqs.map((m,i)=>(<div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center gap-2"><div className="truncate text-xs"><strong className="text-indigo-900">[{m.category}]</strong> {m.question}</div><div className="flex gap-1 shrink-0"><button onClick={()=>openEditMcqModal(m)} className="bg-indigo-900 text-white px-2 py-1 rounded text-xs font-bold">Edit</button><button onClick={()=>deleteMcq(m._id||m.id)} className="bg-rose-600 text-white px-2 py-1 rounded text-xs font-bold">Delete</button></div></div>))}
                                {adminManageTab==='VOCAB' && dawnWords.map((w,i)=>(<div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center gap-2"><div className="truncate text-xs"><strong className="text-indigo-900">{w.word}</strong> ({w.type||w.partsOfSpeech}) - {w.urdu} | {w.meaning}</div><div className="flex gap-1 shrink-0"><button onClick={()=>setEditVocab({...w})} className="bg-indigo-700 text-white px-2 py-1 rounded text-xs font-bold">Edit</button><button onClick={()=>deleteVocab(w._id||w.id)} className="bg-rose-600 text-white px-2 py-1 rounded text-xs font-bold">Delete</button></div></div>))}
                                {adminManageTab==='HEADLINES' && headlines.map((h,i)=>(<div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center gap-2"><div className="truncate text-xs"><strong className="text-amber-900">Headline</strong> {h.title||h}</div><div className="flex gap-1 shrink-0"><button onClick={()=>setEditHeadline(h)} className="bg-amber-600 text-white px-2 py-1 rounded text-xs font-bold">Edit</button><button onClick={()=>deleteHeadline(h._id||h.id)} className="bg-rose-600 text-white px-2 py-1 rounded text-xs font-bold">Delete</button></div></div>))}
                                {adminManageTab==='ARTICLES' && articles.map((a,i)=>(<div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center gap-2"><div className="truncate text-xs"><strong className="text-amber-900">[{a.category}]</strong> {a.title}</div><div className="flex gap-1 shrink-0"><button onClick={()=>setEditArticle(a)} className="bg-amber-600 text-white px-2 py-1 rounded text-xs font-bold">Edit</button><button onClick={()=>deleteArticle(a._id||a.id)} className="bg-rose-600 text-white px-2 py-1 rounded text-xs font-bold">Delete</button></div></div>))}
                                {adminManageTab==='BOOKS' && library.map((b,i)=>(<div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center gap-2"><div className="truncate text-xs"><strong className="text-slate-900">{b.title}</strong> ({b.category||b.cat})</div><div className="flex gap-1 shrink-0"><button onClick={()=>setEditBook(b)} className="bg-indigo-900 text-white px-2 py-1 rounded text-xs font-bold">Edit</button><button onClick={()=>deleteBook(b._id||b.id)} className="bg-rose-600 text-white px-2 py-1 rounded text-xs font-bold">Delete</button></div></div>))}
                                {adminManageTab==='SUBMISSIONS' && (adminSubmissions.length === 0 ? (<p className="text-xs text-slate-400">No pending MCQ submissions.</p>) : adminSubmissions.map((s) => (<div key={s._id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2"><div className="flex flex-wrap gap-2 items-center text-[11px]"><span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">{s.mainCategory || s.category}{s.subCategory ? ` > ${s.subCategory}` : ''}</span><span className="text-slate-500">Submitted by <strong className="text-slate-800">{s.submittedBy}</strong> ({s.submittedByEmail})</span></div><p className="text-xs font-semibold text-slate-900">{s.question}</p><p className="text-[11px] text-slate-600">{s.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(' • ')}</p><p className="text-[11px] text-emerald-700 font-bold">Correct: {String.fromCharCode(65 + s.answerIndex)}</p>{s.explanation && <p className="text-[11px] text-slate-500">Explanation: {s.explanation}</p>}<div className="flex gap-2 pt-1"><button onClick={()=>approveSubmission(s._id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-bold">Approve</button><button onClick={()=>rejectSubmission(s._id)} className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded text-xs font-bold">Reject</button></div></div>)))}
                                {adminManageTab==='COMMENTS' && (adminComments.length === 0 ? (<p className="text-xs text-slate-400">No comments yet.</p>) : adminComments.map((c) => (<div key={c._id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-start gap-2"><div className="text-xs min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="text-slate-900">{c.name}</strong><span className="text-slate-500">{c.email}</span><span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleString()}</span></div><p className="text-slate-700 mt-1 whitespace-pre-line">{c.text}</p><p className="text-[10px] text-slate-400 mt-1 truncate">On: {c.mcqId?.question || 'Deleted MCQ'}</p></div><button onClick={()=>deleteComment(c._id)} className="bg-rose-600 text-white px-2 py-1 rounded text-xs font-bold shrink-0">Delete</button></div>)))}
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
                <nav aria-label="Site information" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold">
                    <a href="/about" onClick={(e) => { e.preventDefault(); switchTab('aboutTab'); }} className="hover:text-amber-400 transition">About Us</a>
                    <a href="/privacy" onClick={(e) => { e.preventDefault(); switchTab('privacyTab'); }} className="hover:text-amber-400 transition">Privacy Policy</a>
                    <a href="/terms" onClick={(e) => { e.preventDefault(); switchTab('termsTab'); }} className="hover:text-amber-400 transition">Terms of Use</a>
                    <a href="/disclaimer" onClick={(e) => { e.preventDefault(); switchTab('disclaimerTab'); }} className="hover:text-amber-400 transition">Disclaimer</a>
                </nav>
                <p className="text-slate-500">© {new Date().getFullYear()} ExamInPocket.com — All Rights Reserved.</p>
            </footer>
        </div>
    );
}
