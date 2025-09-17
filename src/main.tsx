import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProvider } from './contexts/AppProvider'
import { initializeBackendEnforcer, showBackendStatus } from './utils/backendEnforcer'

// Initialize backend enforcement to block localStorage usage for backend-managed data
initializeBackendEnforcer();
showBackendStatus();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
