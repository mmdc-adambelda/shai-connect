import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SupportClient from './SupportClient'

export default async function SupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Only agents can access the support dashboard
  if (!profile || !['moderator', 'admin', 'superadmin'].includes(profile.role)) {
    redirect('/tickets')
  }

  // All tickets with submitter + assignee profiles
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select(`
      *,
      submitter:profiles!support_tickets_user_id_fkey(id, full_name, unit, role),
      assignee:profiles!support_tickets_assigned_to_fkey(id, full_name, role)
    `)
    .order('created_at', { ascending: false })

  // All agent profiles for assignment
  const { data: agents } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['moderator', 'admin', 'superadmin'])
    .order('full_name')

  return (
    <SupportClient
      tickets={tickets ?? []}
      agents={agents ?? []}
      currentProfile={profile}
      currentUserId={user.id}
    />
  )
}
