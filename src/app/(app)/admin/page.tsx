import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Only admins and moderators can access
  if (!profile || !['admin', 'moderator'].includes(profile.role)) {
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

  return (
    <AdminClient
      users={allUsers || []}
      currentProfile={profile}
      stats={{
        totalUsers: allUsers?.length || 0,
        totalPosts: postCount || 0,
        totalAnnouncements: announcementCount || 0,
        totalMessages: messageCount || 0,
      }}
    />
  )
}
