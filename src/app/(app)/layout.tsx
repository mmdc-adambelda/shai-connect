'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import BottomNav from '@/components/layout/BottomNav'
import FAB from '@/components/ui/FAB'
import type { Profile } from '@/types'

const IDLE_TIMEOUT_MS  = 2 * 60 * 60 * 1000  // 2 hours
const WARN_BEFORE_MS   = 60 * 1000            // warn 1 minute before logout

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile]         = useState<Profile | null>(null)
  const [showIdleWarning, setShowIdleWarning] = useState(false)
  const idleTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warnTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router      = useRouter()

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      }
    }
    load()
  }, [])

  // ── Auto-logout on idle ──────────────────────────────────────────
  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }, [router])

  const resetTimers = useCallback(() => {
    setShowIdleWarning(false)
    if (idleTimer.current)  clearTimeout(idleTimer.current)
    if (warnTimer.current)  clearTimeout(warnTimer.current)

    warnTimer.current = setTimeout(() => {
      setShowIdleWarning(true)
    }, IDLE_TIMEOUT_MS - WARN_BEFORE_MS)

    idleTimer.current = setTimeout(() => {
      signOut()
    }, IDLE_TIMEOUT_MS)
  }, [signOut])

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    events.forEach(e => window.addEventListener(e, resetTimers, { passive: true }))
    resetTimers() // start timers on mount

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimers))
      if (idleTimer.current)  clearTimeout(idleTimer.current)
      if (warnTimer.current)  clearTimeout(warnTimer.current)
    }
  }, [resetTimers])

  return (
    <div className="flex overflow-hidden h-app" style={{ background: 'var(--surface-2)' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} profile={profile} />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar profile={profile} onMenuClick={() => setSidebarOpen(true)} />
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6 main-content-pb"
          style={{
            background: 'var(--surface-2)',
            overscrollBehaviorY: 'contain',
          }}
        >
          {children}
        </main>
      </div>

      <BottomNav userId={profile?.id} />
      <FAB />

      {/* Idle warning banner */}
      {showIdleWarning && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium"
          style={{ background: '#1A1A1A', color: '#FFFFFF', maxWidth: 'calc(100vw - 2rem)' }}
        >
          <span>⚠️ You'll be signed out in 1 minute due to inactivity.</span>
          <button
            onClick={resetTimers}
            className="px-3 py-1 rounded-lg text-xs font-bold"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            Stay signed in
          </button>
        </div>
      )}
    </div>
  )
}
