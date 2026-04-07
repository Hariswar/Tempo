import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAppStore } from '../../stores/appStore'
import AIAssistantPanel from '../ai/AIAssistantPanel'
import EventModal from '../calendar/EventModal'
import { AnimatePresence } from 'framer-motion'

export default function AppShell() {
  const { isAIPanelOpen, isEventModalOpen } = useAppStore()

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden relative">
          <Outlet />
        </main>
      </div>

      {/* AI Panel */}
      <AnimatePresence>
        {isAIPanelOpen && <AIAssistantPanel />}
      </AnimatePresence>

      {/* Event Modal */}
      <AnimatePresence>
        {isEventModalOpen && <EventModal />}
      </AnimatePresence>
    </div>
  )
}
