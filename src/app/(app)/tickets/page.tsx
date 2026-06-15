import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TicketClient from './TicketClient'

export default async function TicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Agents go to the full service desk dashboard
  if (profile && ['moderator', 'admin', 'superadmin'].includes(profile.role)) {
    redirect('/support')
  }

  const { data: myTickets } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <TicketClient profile={profile} myTickets={myTickets ?? []} />
}
