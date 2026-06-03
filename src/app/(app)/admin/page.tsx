import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Allow superadmin, admin, and moderator
  if (!profile || !['superadmin', 'admin', 'moderator'].includes(profile.role)) {
    redirect('/feed')
  }

  const { data: allUsers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const { count: postCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })

  const { count: announcementCount } = await supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true })

  const { count: messageCount } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*, profiles(full_name, unit)')
    .order('created_at', { ascending: false })

  return (
    <AdminClient
      users={allUsers || []}
      currentProfile={profile}
      tickets={tickets || []}
      stats={{
        totalUsers: allUsers?.length || 0,
        totalPosts: postCount || 0,
        totalAnnouncements: announcementCount || 0,
        totalMessages: messageCount || 0,
      }}
    />
  )
}
