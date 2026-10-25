import { createContext, useContext, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function showToast(message, type = 'success') {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2500);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-xl shadow-lg border text-sm ${
              toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-slate-900 text-amber-300 border-slate-700'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
