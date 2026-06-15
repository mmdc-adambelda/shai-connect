import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import TicketDetailClient from './TicketDetailClient'

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAgent = profile && ['moderator', 'admin', 'superadmin'].includes(profile.role)

  // Fetch the ticket
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', id)
    .single()

  if (!ticket) return notFound()

  // Residents can only view their own tickets
  if (!isAgent && ticket.user_id !== user.id) return notFound()

  // Fetch submitter profile
  const { data: submitter } = await supabase
    .from('profiles')
    .select('id, full_name, unit, role, avatar_url')
    .eq('id', ticket.user_id)
    .single()

  // Fetch assignee profile (if assigned)
  let assignee = null
  if (ticket.assigned_to) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', ticket.assigned_to)
      .single()
    assignee = data
  }

  // Fetch comments — RLS automatically hides internal notes from residents
  const { data: comments } = await supabase
    .from('ticket_comments')
    .select('*, profiles(id, full_name, role, avatar_url)')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  // Fetch activity log
  const { data: activity } = await supabase
    .from('ticket_activity')
    .select('*, profiles(id, full_name, role)')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  // Fetch agent profiles for assignment dropdown (agents only)
  let agents: { id: string; full_name: string; role: string }[] = []
  if (isAgent) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['moderator', 'admin', 'superadmin'])
      .order('full_name')
    agents = data ?? []
  }

  const enrichedTicket = { ...ticket, submitter, assignee }

  return (
    <TicketDetailClient
      ticket={enrichedTicket}
      currentProfile={profile}
      currentUserId={user.id}
      isAgent={!!isAgent}
      initialComments={comments ?? []}
      initialActivity={activity ?? []}
      agents={agents}
    />
  )
}
