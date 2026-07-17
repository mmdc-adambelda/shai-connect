'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, User as UserIcon, FileText, Loader2 } from 'lucide-react'
import AvatarUI from '@/components/ui/Avatar'
import type { Profile, Post } from '@/types'

export default function GlobalSearch({
  profile,
  placeholder = 'Search people, posts…',
  autoFocus = false,
  onNavigate,
}: {
  profile: Profile | null
  placeholder?: string
  autoFocus?: boolean
  onNavigate?: () => void
}) {
  const router = useRouter()
  const supabase = createClient()
  const containerRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [people, setPeople] = useState<Profile[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setPeople([])
      setPosts([])
      setOpen(false)
      return
    }

    setLoading(true)
    const timeout = setTimeout(async () => {
      const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'

      let postsQuery = supabase
        .from('posts')
        .select('id, content, created_at, phase_tag, profiles(id, full_name, avatar_url)')
        .ilike('content', `%${q}%`)
        .order('created_at', { ascending: false })
        .limit(5)
      if (!isAdmin && profile?.phase) {
        postsQuery = postsQuery.or(`phase_tag.eq.All Phases,phase_tag.eq.${profile.phase}`)
      }

      const [{ data: matchedPeople }, { data: matchedPosts }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, unit, phase, role, avatar_url')
          .or(`full_name.ilike.%${q}%,unit.ilike.%${q}%`)
          .limit(5),
        postsQuery,
      ])

      setPeople((matchedPeople as Profile[]) || [])
      setPosts((matchedPosts as unknown as Post[]) || [])
      setLoading(false)
      setOpen(true)
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, profile])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const goToProfile = (id: string) => {
    setOpen(false)
    setQuery('')
    onNavigate?.()
    router.push(`/profile?userId=${id}`)
  }

  const goToPost = (id: string) => {
    setOpen(false)
    setQuery('')
    onNavigate?.()
    router.push(`/feed?post=${id}`)
  }

  const hasResults = people.length > 0 || posts.length > 0
  const showNoResults = !loading && query.trim().length >= 2 && !hasResults

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        <input
          autoFocus={autoFocus}
          className="input py-2 pl-9 text-sm h-9 w-full"
          placeholder={placeholder}
          style={{ borderRadius: '99px', background: 'var(--surface-2)', fontSize: '0.8125rem' }}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (query.trim().length >= 2) setOpen(true) }}
        />
      </div>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden card"
          style={{ boxShadow: 'var(--shadow-lg)', borderRadius: 'var(--radius-lg)' }}
        >
          <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
            {loading && (
              <div className="flex items-center gap-2 px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…
              </div>
            )}

            {showNoResults && (
              <div className="px-4 py-4 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                No results for &ldquo;{query}&rdquo;
              </div>
            )}

            {!loading && people.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  People
                </p>
                {people.map(p => (
                  <button
                    key={p.id}
                    onClick={() => goToProfile(p.id)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors"
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <AvatarUI name={p.full_name} avatarUrl={p.avatar_url} size={28} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{p.full_name}</p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{p.unit}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && posts.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Posts
                </p>
                {posts.map(post => (
                  <button
                    key={post.id}
                    onClick={() => goToPost(post.id)}
                    className="w-full flex items-start gap-3 px-4 py-2 text-left transition-colors"
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--brand-xlight)' }}>
                      <FileText className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {(post.profiles as unknown as Profile)?.full_name ?? 'Resident'}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{post.content}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
