import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ postId: string }> }

// GET /api/posts/[postId]/comments
// Returns top-level comments with nested replies in a single efficient query
// Uses two queries: one for top-level, one for all replies — avoids N+1
export async function GET(req: Request, { params }: Params) {
  const { postId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 50)
  const offset = parseInt(url.searchParams.get('offset') ?? '0')

  // Query 1: top-level comments + author profile
  const { data: topLevel, error } = await supabase
    .from('comments')
    .select(`
      id, post_id, author_id, parent_id, content, created_at,
      profiles ( id, full_name, unit, phase, role, avatar_url )
    `)
    .eq('post_id', postId)
    .is('parent_id', null)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!topLevel?.length) return NextResponse.json({ comments: [], total: 0 })

  // Query 2: all replies for those top-level comments (single query, no N+1)
  const topLevelIds = topLevel.map(c => c.id)
  const { data: replies } = await supabase
    .from('comments')
    .select(`
      id, post_id, author_id, parent_id, content, created_at,
      profiles ( id, full_name, unit, phase, role, avatar_url )
    `)
    .in('parent_id', topLevelIds)
    .order('created_at', { ascending: true })

  // Group replies by parent_id in-memory
  const replyMap: Record<string, typeof replies> = {}
  for (const reply of replies ?? []) {
    if (!replyMap[reply.parent_id!]) replyMap[reply.parent_id!] = []
    replyMap[reply.parent_id!]!.push(reply)
  }

  // Merge replies into parent comments
  const comments = topLevel.map(comment => ({
    ...comment,
    replies: replyMap[comment.id] ?? [],
    reply_count: (replyMap[comment.id] ?? []).length,
  }))

  // Total top-level count for pagination
  const { count } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)
    .is('parent_id', null)

  return NextResponse.json({ comments, total: count ?? 0 })
}

// POST /api/posts/[postId]/comments  { content, parent_id? }
// Creates a top-level comment or a reply (max 1 level deep)
export async function POST(req: Request, { params }: Params) {
  const { postId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const content: string = (body.content ?? '').trim()
  const parentId: string | null = body.parent_id ?? null

  if (!content || content.length > 2000) {
    return NextResponse.json({ error: 'Content must be 1–2000 characters' }, { status: 400 })
  }

  // If replying, verify parent exists and belongs to this post
  // Also enforce max 1 level of nesting (parent must be top-level)
  if (parentId) {
    const { data: parent } = await supabase
      .from('comments')
      .select('id, parent_id, post_id')
      .eq('id', parentId)
      .single()

    if (!parent || parent.post_id !== postId) {
      return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 })
    }
    if (parent.parent_id !== null) {
      return NextResponse.json({ error: 'Cannot nest replies more than 1 level' }, { status: 400 })
    }
  }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: user.id,
      ...(parentId ? { parent_id: parentId } : {}),
      content,
    })
    .select(`
      id, post_id, author_id, parent_id, content, created_at,
      profiles ( id, full_name, unit, phase, role, avatar_url )
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment }, { status: 201 })
}
