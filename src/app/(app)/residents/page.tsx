import { createClient } from '@/lib/supabase/server'
import ResidentsClient from './ResidentsClient'

export default async function ResidentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: residents } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user!.id)

  const followingIds = new Set((follows || []).map(f => f.following_id))

  return (
    <ResidentsClient
      residents={residents || []}
      currentUserId={user!.id}
      initialFollowing={followingIds}
    />
  )
}
