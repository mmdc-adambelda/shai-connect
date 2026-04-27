export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return Response.json({
    env_loaded: !!url && !!key,
    supabase_url: url || 'NOT SET',
    key_prefix: key ? key.slice(0, 30) + '...' : 'NOT SET',
    key_length: key?.length || 0,
    node_env: process.env.NODE_ENV,
  })
}
