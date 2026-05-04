import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import type { Profile } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-5 md:p-6" style={{ background: 'var(--surface-2)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
