import { createClient } from '@/lib/supabase/server'
import TicketClient from './TicketClient'

export default async function TicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: myTickets } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return <TicketClient profile={profile} myTickets={myTickets ?? []} />
}
