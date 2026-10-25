import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function SignupPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      showToast('Account created');
      navigate('/');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
      <h2 className="text-xl font-bold">Sign Up</h2>
      <form onSubmit={submit} className="space-y-3">
        <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Full Name" className="w-full p-2.5 border border-slate-200 rounded-lg" required />
        <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="w-full p-2.5 border border-slate-200 rounded-lg" required />
        <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="Password (min 6)" className="w-full p-2.5 border border-slate-200 rounded-lg" required />
        <button disabled={loading} className="w-full py-2.5 rounded-lg bg-indigo-900 text-amber-300">Create Account</button>
      </form>
      <p className="text-sm text-slate-500">Already have an account? <Link to="/login" className="text-indigo-700">Login</Link></p>
    </div>
  );
}
