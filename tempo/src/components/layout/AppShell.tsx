import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, BarChart3, Settings, Sparkles } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAppStore } from '../../stores/appStore'
import { useIsMobile } from '../../lib/useIsMobile'
import AIAssistantPanel from '../ai/AIAssistantPanel'
import EventModal from '../calendar/EventModal'

const MOBILE_NAV = [
  { to: '/', icon: Calendar, label: 'Calendar' },
  { to: '/insights', icon: BarChart3, label: 'Insights' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function AppShell() {
  const { isAIPanelOpen, isEventModalOpen, toggleAIPanel } = useAppStore()
  const isMobile = useIsMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
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

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          onMenuToggle={isMobile ? () => setMobileMenuOpen(true) : undefined}
          isMobile={isMobile}
        />
        <main className="flex-1 overflow-hidden relative" style={isMobile ? { paddingBottom: 56 } : undefined}>
          <Outlet />
        </main>
      </div>

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
            height: 56,
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
              style={({ isActive }) => ({
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                gap: 2,
                padding: '6px 12px',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 500,
                color: isActive ? '#a78bfa' : 'var(--text-muted)',
                transition: 'color 0.15s',
                textDecoration: 'none',
              })}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
          <button
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
              color: '#a78bfa',
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

      {/* AI Panel */}
      <AnimatePresence>
        {isAIPanelOpen && <AIAssistantPanel isMobile={isMobile} />}
      </AnimatePresence>

      {/* Event Modal */}
      <AnimatePresence>
        {isEventModalOpen && <EventModal />}
      </AnimatePresence>
    </div>
  )
}
