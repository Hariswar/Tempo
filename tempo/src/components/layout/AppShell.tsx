import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, BarChart3, Settings, Sparkles, Download, X } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAppStore } from '../../stores/appStore'
import { useIsMobile } from '../../lib/useIsMobile'
import AIAssistantPanel from '../ai/AIAssistantPanel'
import EventModal from '../calendar/EventModal'
import TutorialCoach from '../onboarding/TutorialCoach'

const MOBILE_NAV = [
  { to: '/', icon: Calendar, label: 'Calendar' },
  { to: '/insights', icon: BarChart3, label: 'Insights' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

interface BeforeInstallPromptEventLike extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export default function AppShell() {
  const { isAIPanelOpen, isEventModalOpen, toggleAIPanel, setSelectedDate } = useAppStore()
  const isMobile = useIsMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEventLike | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showIosInstructions, setShowIosInstructions] = useState(false)
  const location = useLocation()

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    const isTouchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
    const isIos = /iphone|ipad|ipod/.test(ua) || isTouchMac
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    const dismissed = sessionStorage.getItem('tempo-install-banner-dismissed') === '1'

    function updateBannerVisibility(hasPrompt: boolean) {
      if (isStandalone || dismissed) {
        setShowInstallBanner(false)
        return
      }
      setShowInstallBanner(hasPrompt || isIos)
    }

    const onBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEventLike
      promptEvent.preventDefault()
      setDeferredInstallPrompt(promptEvent)
      updateBannerVisibility(true)
    }

    const onInstalled = () => {
      setShowInstallBanner(false)
      setDeferredInstallPrompt(null)
      setShowIosInstructions(false)
    }

    updateBannerVisibility(false)
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function handleInstallClick() {
    if (deferredInstallPrompt) {
      await deferredInstallPrompt.prompt()
      const choice = await deferredInstallPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setShowInstallBanner(false)
      }
      setDeferredInstallPrompt(null)
      return
    }
    setShowIosInstructions(true)
  }

  function dismissInstallBanner() {
    sessionStorage.setItem('tempo-install-banner-dismissed', '1')
    setShowInstallBanner(false)
  }

  function handleCalendarNavClick() {
    setSelectedDate(new Date().toISOString())
  }

  return (
    <div
      className="flex w-screen overflow-hidden"
      style={{
        background: 'var(--bg-base)',
        height: '100dvh',
        minHeight: '100dvh',
        paddingLeft: isMobile ? 'var(--safe-left)' : undefined,
        paddingRight: isMobile ? 'var(--safe-right)' : undefined,
      }}
    >
      {/* Desktop sidebar */}
      {!isMobile && <Sidebar />}

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64"
            >
              <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-col flex-1 min-w-0">
        <Header
          onMenuToggle={isMobile ? () => setMobileMenuOpen(true) : undefined}
          isMobile={isMobile}
        />
        <main
          className="flex-1 overflow-hidden relative"
          style={isMobile ? { paddingBottom: 'calc(56px + var(--safe-bottom))' } : undefined}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile install banner */}
      {isMobile && showInstallBanner && (
        <div
          style={{
            position: 'fixed',
            left: 12,
            right: 12,
            bottom: 'calc(64px + var(--safe-bottom))',
            zIndex: 36,
          }}
        >
          <div
            className="rounded-xl px-3 py-2.5 flex items-center gap-2"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(255,106,0,0.35)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,106,0,0.18)' }}>
              <Download size={14} style={{ color: '#ffb347' }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-text-primary">Install Tempo</div>
              <div className="text-[10px] text-text-muted">Use as a home-screen web app on Android or iPhone.</div>
            </div>
            <button
              onClick={handleInstallClick}
              className="px-2.5 h-7 rounded-lg text-[11px] font-semibold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #ff6a00, #ff8a00)' }}
            >
              Install
            </button>
            <button
              onClick={dismissInstallBanner}
              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Dismiss install prompt"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      {isMobile && (
        <nav
          className="mobile-bottom-nav"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 35,
            height: 'calc(56px + var(--safe-bottom))',
            paddingBottom: 'var(--safe-bottom)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            background: 'var(--sidebar-bg)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {MOBILE_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => {
                if (to === '/') {
                  handleCalendarNavClick()
                }
              }}
              data-tutorial-id={
                to === '/'
                  ? 'mobile-nav-calendar'
                  : to === '/insights'
                    ? 'mobile-nav-insights'
                    : 'mobile-nav-settings'
              }
              style={({ isActive }) => ({
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                gap: 2,
                padding: '6px 12px',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 500,
                color: isActive ? '#ffb347' : 'var(--text-muted)',
                transition: 'color 0.15s',
                textDecoration: 'none',
              })}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
          <button
            data-tutorial-id="mobile-ai-toggle"
            onClick={toggleAIPanel}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '6px 12px',
              borderRadius: 10,
              fontSize: 10,
              fontWeight: 500,
              color: '#ffb347',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Sparkles size={18} />
            <span>AI</span>
          </button>
        </nav>
      )}

      {/* iOS/manual install guide */}
      <AnimatePresence>
        {showIosInstructions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setShowIosInstructions(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed left-0 right-0 z-50 rounded-t-2xl p-4"
              style={{
                bottom: 0,
                background: 'var(--bg-card)',
                borderTop: '1px solid var(--border-subtle)',
                paddingBottom: 'calc(16px + var(--safe-bottom))',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-text-primary">Install Tempo on iPhone or iPad</h3>
                <button onClick={() => setShowIosInstructions(false)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed mb-2">
                Tempo installs as a web app from your browser (not from the App Store).
              </p>
              <ol className="text-xs text-text-secondary leading-relaxed pl-4 space-y-1">
                <li>Open this site in Safari.</li>
                <li>Tap Share.</li>
                <li>Select Add to Home Screen, then tap Add.</li>
              </ol>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI Panel */}
      <AnimatePresence>
        {isAIPanelOpen && <AIAssistantPanel isMobile={isMobile} />}
      </AnimatePresence>

      {/* Event Modal */}
      <AnimatePresence>
        {isEventModalOpen && <EventModal />}
      </AnimatePresence>

      <TutorialCoach />
    </div>
  )
}
