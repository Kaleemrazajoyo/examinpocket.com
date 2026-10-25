import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useEffect, useRef, useState } from 'react';
import { useSaved } from '../../context/SavedContext.jsx';

const links = [
  { to: '/', label: 'Home', icon: 'fa-house' },
  { to: '/test', label: 'Mock Test', icon: 'fa-stopwatch' },
  { to: '/dawn', label: 'Dawn Vocab', icon: 'fa-newspaper' },
  { to: '/articles', label: 'Articles', icon: 'fa-file-lines' },
  { to: '/library', label: 'Library', icon: 'fa-book-open' },
  { to: '/saved', label: 'Saved', icon: 'fa-bookmark' },
  { to: '/ai', label: 'AI Tutor', icon: 'fa-robot' },
];

const DEFAULT_TICKER = '📢 <span class="font-bold">Latest Exam Update:</span> CSS MPT & SPSC CCE Solved Past Paper MCQs Added • Daily Dawn Vocabulary Active • Live Gemini AI Tutor Active!';

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  const { total } = useSaved();
  const navigate = useNavigate();
  const clicks = useRef(0);
  const timer = useRef(null);
  const [ticker, setTicker] = useState(() => localStorage.getItem('eip_ticker_text') || DEFAULT_TICKER);

  useEffect(() => {
    const handler = () => setTicker(localStorage.getItem('eip_ticker_text') || DEFAULT_TICKER);
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  function handleLogoClick() {
    clicks.current += 1;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      clicks.current = 0;
    }, 2500);
    if (clicks.current >= 5) {
      clicks.current = 0;
      navigate('/admin');
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-2">
          <div onClick={handleLogoClick} className="flex items-center gap-3 cursor-pointer select-none" title="ExamInPocket Portal (Click 5 times for Admin Portal)">
            <div className="bg-amber-400 text-slate-950 font-extrabold text-xl px-3 py-1.5 rounded-xl shadow-sm hover:bg-amber-300 transition">
              EiP
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                ExamInPocket<span className="text-amber-400">.com</span>
              </h1>
              <p className="text-xs text-slate-400">FPSC • PPSC • SPSC • CSS • PMS • CCE</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-1 text-xs sm:text-sm font-medium">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `nav-link px-3 py-2 rounded-lg hover:bg-slate-800 transition ${
                    isActive ? 'active-link' : ''
                  } ${link.to === '/ai' ? 'bg-indigo-900 text-amber-300 hover:bg-indigo-800 border border-indigo-700' : ''} ${
                    link.to === '/saved' ? 'flex items-center gap-1' : ''
                  }`
                }
              >
                <i className={`fa-solid ${link.icon} ${link.to === '/saved' ? 'text-amber-400' : ''} mr-1`}></i>
                {link.label}
                {link.to === '/saved' && <span id="saved-count">({total})</span>}
              </NavLink>
            ))}

            {user ? (
              <>
                <span className="hidden sm:inline text-slate-300 px-2">
                  {user.name} {isAdmin && <span className="text-amber-400">(Admin)</span>}
                </span>
                {isAdmin && (
                  <NavLink to="/admin/dashboard" className="px-3 py-2 rounded-lg hover:bg-slate-800 transition">
                    <i className="fa-solid fa-shield-halved mr-1"></i> Admin
                  </NavLink>
                )}
                <button onClick={logout} className="px-3 py-2 rounded-lg hover:bg-slate-800 transition">
                  <i className="fa-solid fa-right-from-bracket mr-1"></i> Logout
                </button>
              </>
            ) : (
              <NavLink to="/login" className="bg-amber-400 text-slate-950 font-semibold px-3 py-2 rounded-lg hover:bg-amber-300 transition ml-1">
                <i className="fa-solid fa-user mr-1"></i> Login
              </NavLink>
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
          <div className="ticker-marquee-content" dangerouslySetInnerHTML={{ __html: ticker }} />
        </div>
      </div>
    </>
  );
}

export function Footer() {
  return (
    <footer className="mt-12 bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-xs text-center space-y-4 no-print">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <p className="font-bold text-white text-sm">ExamInPocket.com</p>
          <p className="text-slate-400 text-xs">Empowering CSS, PMS, PCS, CCE & Competitive Exam Preparation.</p>
        </div>
        <div className="flex gap-4 text-lg">
          <a href="#" className="hover:text-amber-400 transition"><i className="fa-brands fa-facebook"></i></a>
          <a href="#" className="hover:text-amber-400 transition"><i className="fa-brands fa-whatsapp"></i></a>
          <a href="#" className="hover:text-amber-400 transition"><i className="fa-brands fa-telegram"></i></a>
          <a href="#" className="hover:text-amber-400 transition"><i className="fa-brands fa-youtube"></i></a>
        </div>
      </div>
      <p className="text-slate-500 text-[11px] border-t border-slate-800/60 pt-4">© {new Date().getFullYear()} ExamInPocket.com — All Rights Reserved.</p>
    </footer>
  );
}
