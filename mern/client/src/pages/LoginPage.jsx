import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      showToast('Logged in');
      navigate('/');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
      <h2 className="text-xl font-bold">Login</h2>
      <form onSubmit={submit} className="space-y-3">
        <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="w-full p-2.5 border border-slate-200 rounded-lg" required />
        <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="Password" className="w-full p-2.5 border border-slate-200 rounded-lg" required />
        <button disabled={loading} className="w-full py-2.5 rounded-lg bg-indigo-900 text-amber-300">Login</button>
      </form>
      <p className="text-sm text-slate-500">Don't have an account? <Link to="/signup" className="text-indigo-700">Sign up</Link></p>
    </div>
  );
}
