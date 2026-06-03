'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import type { Profile } from '@/types'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

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

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} profile={profile} />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar profile={profile} onMenuClick={() => setSidebarOpen(true)} />
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6"
          style={{ background: 'var(--surface-2)' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
