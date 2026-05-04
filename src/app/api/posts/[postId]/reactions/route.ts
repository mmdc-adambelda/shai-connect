import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ReactionType } from '@/types'

type Params = { params: Promise<{ postId: string }> }

// GET /api/posts/[postId]/reactions
// Returns reaction counts + current user's reaction for a post
export async function GET(_req: Request, { params }: Params) {
  const { postId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Single query: counts per type + user's own reaction (no N+1)
  const [{ data: counts }, { data: userReaction }] = await Promise.all([
    supabase
      .from('reactions')
      .select('type')
      .eq('post_id', postId),
    supabase
      .from('reactions')
      .select('type')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  // Aggregate counts in-memory (tiny result set)
  const aggregated: Record<string, number> = {}
  for (const r of counts ?? []) {
    aggregated[r.type] = (aggregated[r.type] ?? 0) + 1
  }

  return NextResponse.json({
    counts: aggregated,
    userReaction: userReaction?.type ?? null,
    total: counts?.length ?? 0,
  })
}

// POST /api/posts/[postId]/reactions  { type: ReactionType }
// Upserts a reaction — if same type already exists, removes it (toggle)
// If different type exists, switches to the new type
export async function POST(req: Request, { params }: Params) {
  const { postId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const type: ReactionType = body.type

  const VALID: ReactionType[] = ['like', 'love', 'haha', 'wow', 'sad', 'angry']
  if (!VALID.includes(type)) {
    return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 })
  }

  // Check existing reaction
  const { data: existing } = await supabase
    .from('reactions')
    .select('id, type')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    if (existing.type === type) {
      // Toggle off — remove reaction
      await supabase.from('reactions').delete().eq('id', existing.id)
      return NextResponse.json({ action: 'removed', type: null })
    } else {
      // Switch reaction type
      await supabase.from('reactions').update({ type }).eq('id', existing.id)
      return NextResponse.json({ action: 'changed', type })
    }
  }

  // Insert new reaction
  const { error } = await supabase.from('reactions').insert({
    post_id: postId,
    user_id: user.id,
    type,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ action: 'added', type }, { status: 201 })
}

// DELETE /api/posts/[postId]/reactions
// Explicitly remove any reaction from the current user
export async function DELETE(_req: Request, { params }: Params) {
  const { postId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase
    .from('reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', user.id)

  return NextResponse.json({ action: 'removed' })
}
