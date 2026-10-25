import { useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function AiPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!user) return showToast('Login to use AI Tutor', 'error');
    if (!prompt.trim()) return;
    const userMsg = { role: 'user', text: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await api.post('/ai/chat', { prompt });
      setMessages((prev) => [...prev, { role: 'bot', text: res.reply, offline: res.offline }]);
      setPrompt('');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[70vh]">
      <div className="p-4 border-b border-slate-200 flex items-center gap-2">
        <div className="bg-indigo-900 text-amber-400 p-2 rounded-xl"><i className="fa-solid fa-robot"></i></div>
        <div>
          <p className="font-semibold">ExamInPocket AI Tutor</p>
          <p className="text-xs text-slate-500">CSS • PMS • Roman Urdu + Hinglish</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-slate-500">Ask anything about CSS/PMS topics...</p>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl p-3 rounded-2xl text-sm whitespace-pre-line ${msg.role === 'user' ? 'bg-indigo-900 text-white rounded-tr-none' : 'bg-slate-100 rounded-tl-none'}`}>
              {msg.text}
              {msg.offline && <p className="text-xs mt-1 opacity-70">Offline fallback</p>}
            </div>
          </div>
        ))}
        {loading && <p className="text-sm text-slate-500">Thinking...</p>}
      </div>
      <div className="p-3 border-t border-slate-200 flex gap-2">
        <input value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Type your question..." className="flex-1 p-2.5 border border-slate-200 rounded-lg" />
        <button onClick={send} className="px-4 py-2 rounded-lg bg-indigo-900 text-amber-300">Send</button>
      </div>
    </div>
  );
}
