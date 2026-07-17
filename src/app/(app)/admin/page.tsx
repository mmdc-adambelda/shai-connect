import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'
import type { Report, ReportableType } from '@/types'

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

  const { data: residents } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = new Set((follows || []).map(f => f.following_id))

  // ── Flagged content ─────────────────────────────────────────────
  const { data: rawReports } = await supabase
    .from('reports')
    .select('*, reporter:profiles!reports_reporter_id_fkey(id, full_name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const reportsList = rawReports ?? []
  const idsByType = (t: ReportableType) => reportsList.filter(r => r.content_type === t).map(r => r.content_id)

  const [{ data: reportedPosts }, { data: reportedComments }, { data: reportedChats }] = await Promise.all([
    supabase.from('posts').select('id, content, profiles(full_name)').in('id', idsByType('post').length ? idsByType('post') : ['00000000-0000-0000-0000-000000000000']),
    supabase.from('comments').select('id, content, profiles(full_name)').in('id', idsByType('comment').length ? idsByType('comment') : ['00000000-0000-0000-0000-000000000000']),
    supabase.from('chat_messages').select('id, content, profiles(full_name)').in('id', idsByType('chat_message').length ? idsByType('chat_message') : ['00000000-0000-0000-0000-000000000000']),
  ])

  const previewMap: Record<string, { author: string; content: string }> = {}
  for (const p of reportedPosts ?? []) previewMap[p.id] = { author: (p.profiles as unknown as { full_name: string })?.full_name ?? 'Unknown', content: p.content }
  for (const c of reportedComments ?? []) previewMap[c.id] = { author: (c.profiles as unknown as { full_name: string })?.full_name ?? 'Unknown', content: c.content }
  for (const m of reportedChats ?? []) previewMap[m.id] = { author: (m.profiles as unknown as { full_name: string })?.full_name ?? 'Unknown', content: m.content }

  const reports: Report[] = reportsList.map(r => ({
    ...r,
    preview_author: previewMap[r.content_id]?.author ?? null,
    preview_content: previewMap[r.content_id]?.content ?? '[content already removed]',
  }))

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
      residents={residents || []}
      initialFollowing={followingIds}
      reports={reports}
    />
  )
}
