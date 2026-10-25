import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient.js';
import { AuthProvider } from './context/AuthContext.jsx';
import { SavedProvider } from './context/SavedContext.jsx';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SavedProvider>
          <App />
        </SavedProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);
