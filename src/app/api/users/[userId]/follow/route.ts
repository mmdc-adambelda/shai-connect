import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ userId: string }> }

// POST /api/users/[userId]/follow  → Follow a user
// DELETE /api/users/[userId]/follow → Unfollow a user
// GET /api/users/[userId]/follow   → Check if current user follows userId

export async function GET(_req: Request, { params }: Params) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.id === userId) return NextResponse.json({ isFollowing: false, isSelf: true })

  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', userId)
    .maybeSingle()

  return NextResponse.json({ isFollowing: !!data })
}

export async function POST(_req: Request, { params }: Params) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.id === userId) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
  }

  // Verify target user exists
  const { data: target } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, following_id: userId })

  if (error) {
    // Unique constraint = already following
    if (error.code === '23505') {
      return NextResponse.json({ message: 'Already following', isFollowing: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Followed', isFollowing: true }, { status: 201 })
}

export async function DELETE(_req: Request, { params }: Params) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', userId)

  return NextResponse.json({ message: 'Unfollowed', isFollowing: false })
}
