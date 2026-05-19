import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PendingClient from './PendingClient'

export default async function PendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If somehow already verified, send to feed
  if (profile?.is_verified) redirect('/feed')

  return <PendingClient profile={profile} email={user.email ?? ''} />
}
