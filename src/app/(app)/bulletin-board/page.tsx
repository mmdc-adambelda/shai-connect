import { createClient } from '@/lib/supabase/server'
import BulletinBoardClient from './BulletinBoardClient'

export default async function BulletinBoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*, profiles(id, full_name, role)')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  return (
    <BulletinBoardClient
      announcements={announcements || []}
      currentProfile={profile}
      currentUserId={user!.id}
    />
  )
}
