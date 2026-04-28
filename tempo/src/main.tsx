import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply persisted theme before first render to avoid flash
const stored = localStorage.getItem('tempo-storage')
const isDark = stored ? (JSON.parse(stored)?.state?.isDarkMode ?? true) : true
document.documentElement.classList.add(isDark ? 'dark' : 'light')
document.documentElement.classList.remove(isDark ? 'light' : 'dark')

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error)
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
