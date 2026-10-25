import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminLoginPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: 'admin', password: '' });
  const [loading, setLoading] = useState(false);

  function submit(e) {
    e.preventDefault();
    setLoading(true);
    const u = form.username.trim();
    const p = form.password.trim();
    if (u === 'kaleemrjoyo' && p === '@KRj321') {
      localStorage.setItem('eip_admin_secret', 'true');
      showToast('Authenticated Admin Access Granted!');
      navigate('/admin/dashboard');
      setLoading(false);
      return;
    }
    showToast('Invalid Admin Credentials!', 'error');
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="text-center space-y-2">
          <div className="bg-indigo-100 text-indigo-900 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-xl">
            <i className="fa-solid fa-user-lock"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-900">Protected Admin Portal</h3>
          <p className="text-xs text-slate-500">Please enter credentials to access content management tools.</p>
        </div>

        <form onSubmit={submit} className="space-y-3 text-xs sm:text-sm">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Admin Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              placeholder="Enter Username"
              className="w-full p-2.5 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Admin Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
              className="w-full p-2.5 border border-slate-300 rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold py-2.5 rounded-lg transition"
          >
            Unlock Admin Control Panel
          </button>
        </form>
      </div>
    </div>
  );
}
