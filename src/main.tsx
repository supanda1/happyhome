import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProvider } from './contexts/AppProvider'
import { initializeBackendEnforcer, showBackendStatus } from './utils/backendEnforcer'

// Initialize backend enforcement to block localStorage usage for backend-managed data
initializeBackendEnforcer();
showBackendStatus();

// Ensure DOM is ready before rendering
const container = document.getElementById('root');
if (!container) throw new Error('Root container not found');

createRoot(container).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>
)
