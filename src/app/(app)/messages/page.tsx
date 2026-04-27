import { createClient } from '@/lib/supabase/server'
import MessagesClient from './MessagesClient'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: sentMessages } = await supabase
    .from('direct_messages')
    .select('*, sender:profiles!direct_messages_sender_id_fkey(*), recipient:profiles!direct_messages_recipient_id_fkey(*)')
    .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
    .order('created_at', { ascending: false })

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', user!.id)
    .order('full_name')

  return (
    <MessagesClient
      messages={sentMessages || []}
      allProfiles={allProfiles || []}
      currentProfile={profile}
      currentUserId={user!.id}
    />
  )
}
