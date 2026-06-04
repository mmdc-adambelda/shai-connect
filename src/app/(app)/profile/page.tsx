import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const params = await searchParams
  const targetUserId = params.userId ?? user.id
  const isOwnProfile = targetUserId === user.id

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', targetUserId)
    .single()

  // Batch all queries in parallel — no N+1
  const [
    { count: postCount },
    { data: userPosts },
    { count: followingCount },
    { count: followerCount },
    { data: followRow },
  ] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', targetUserId),
    supabase.from('posts')
      .select('id,content,phase_tag,image_url,created_at')
      .eq('author_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetUserId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetUserId),
    // Is the current viewer following this profile?
    isOwnProfile
      ? Promise.resolve({ data: null })
      : supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', targetUserId).maybeSingle(),
  ])

  return (
    <ProfileClient
      profile={profile}
      email={isOwnProfile ? user.email || '' : ''}
      postCount={postCount || 0}
      userPosts={userPosts || []}
      followingCount={followingCount || 0}
      followerCount={followerCount || 0}
      viewingUserId={user.id}
      isOwnProfile={isOwnProfile}
      isFollowing={!!followRow}
    />
  )
}
