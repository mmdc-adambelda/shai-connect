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
  return <TicketClient profile={profile} />
}
