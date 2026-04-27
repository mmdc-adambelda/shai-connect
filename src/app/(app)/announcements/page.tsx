import { createClient } from '@/lib/supabase/server'
import AnnouncementsClient from './AnnouncementsClient'

export default async function AnnouncementsPage() {
  const supabase = createClient()
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

  return <AnnouncementsClient announcements={announcements || []} currentProfile={profile} currentUserId={user!.id} />
}
