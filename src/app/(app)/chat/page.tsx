import { createClient } from '@/lib/supabase/server'
import ChatClient from './ChatClient'

const ROOMS = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4']

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const defaultRoom = profile?.phase && ROOMS.includes(profile.phase) ? profile.phase : ROOMS[0]

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*, profiles(id, full_name, unit)')
    .eq('room', defaultRoom)
    .order('created_at', { ascending: true })
    .limit(50)

  return (
    <ChatClient
      rooms={ROOMS}
      initialRoom={defaultRoom}
      initialMessages={messages || []}
      currentProfile={profile}
      currentUserId={user!.id}
    />
  )
}
