import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/context/ThemeProvider';
import App from './pages/App.tsx';
import './index.css';
import { Toaster } from 'react-hot-toast';
import { registerSW } from 'virtual:pwa-register';

// Create a client
const queryClient = new QueryClient();

// Register service worker for PWA (auto-update)
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <App />
          <Toaster position="bottom-right" reverseOrder={false} />
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)