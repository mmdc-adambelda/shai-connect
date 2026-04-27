import { createClient } from '@/lib/supabase/server'
import FeedClient from './FeedClient'

export default async function FeedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles(id, full_name, unit, phase, role)')
    .order('created_at', { ascending: false })
    .limit(30)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  return <FeedClient posts={posts || []} currentProfile={profile} currentUserId={user!.id} />
}
