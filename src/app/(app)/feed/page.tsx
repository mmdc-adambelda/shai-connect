import { createClient } from '@/lib/supabase/server'
import FeedClient from './FeedClient'
import type { Post, ReactionType } from '@/types'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch posts + author profiles in one query
  const { data: rawPosts } = await supabase
    .from('posts')
    .select('*, profiles(id, full_name, unit, phase, role, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(30)

  if (!rawPosts?.length) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
    return <FeedClient posts={[]} currentProfile={profile} currentUserId={user!.id} />
  }

  const postIds = rawPosts.map(p => p.id)

  // Batch-fetch reaction counts for all posts (single query — no N+1)
  const { data: allReactions } = await supabase
    .from('reactions')
    .select('post_id, type')
    .in('post_id', postIds)

  // Batch-fetch current user's reactions (single query)
  const { data: userReactions } = await supabase
    .from('reactions')
    .select('post_id, type')
    .in('post_id', postIds)
    .eq('user_id', user!.id)

  // Batch-fetch comment counts (single query)
  const { data: commentCounts } = await supabase
    .from('comments')
    .select('post_id')
    .in('post_id', postIds)
    .is('parent_id', null)

  // Build lookup maps in-memory
  const reactionMap: Record<string, Record<string, number>> = {}
  for (const r of allReactions ?? []) {
    if (!reactionMap[r.post_id]) reactionMap[r.post_id] = {}
    reactionMap[r.post_id][r.type] = (reactionMap[r.post_id][r.type] ?? 0) + 1
  }

  const userReactionMap: Record<string, ReactionType> = {}
  for (const r of userReactions ?? []) {
    userReactionMap[r.post_id] = r.type as ReactionType
  }

  const commentCountMap: Record<string, number> = {}
  for (const c of commentCounts ?? []) {
    commentCountMap[c.post_id] = (commentCountMap[c.post_id] ?? 0) + 1
  }

  // Merge into posts
  const posts: Post[] = rawPosts.map(p => ({
    ...p,
    reaction_counts: Object.entries(reactionMap[p.id] ?? {}).map(([type, count]) => ({ type: type as ReactionType, count })),
    user_reaction: userReactionMap[p.id] ?? null,
    comment_count: commentCountMap[p.id] ?? 0,
  }))

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  return <FeedClient posts={posts} currentProfile={profile} currentUserId={user!.id} />
}
