import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ userId: string }> }

// GET /api/users/[userId]/following?limit=20&offset=0
// Returns paginated list of users that [userId] follows
export async function GET(req: Request, { params }: Params) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 50)
  const offset = parseInt(url.searchParams.get('offset') ?? '0')

  const { data, error } = await supabase
    .from('follows')
    .select(`
      created_at,
      profiles!follows_following_id_fkey (
        id, full_name, unit, phase, role, avatar_url
      )
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId)

  const following = (data ?? []).map(row => ({
    ...row.profiles,
    followed_at: row.created_at,
  }))

  return NextResponse.json({ following, total: count ?? 0 })
}
