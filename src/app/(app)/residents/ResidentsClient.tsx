'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, UserCheck, UserPlus, User } from 'lucide-react'
import type { Profile } from '@/types'
import Link from 'next/link'
import clsx from 'clsx'
import { useSearchParams } from 'next/navigation'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function roleBadgeClass(role: string) {
  if (role === 'admin')     return 'badge-red'
  if (role === 'moderator') return 'badge-blue'
  return 'badge-green'
}

function ResidentAvatar({ resident }: { resident: Profile }) {
  if (resident.avatar_url) {
    return (
      <img
        src={resident.avatar_url}
        alt={resident.full_name}
        className="w-14 h-14 rounded-full object-cover mx-auto mb-3 border-2 border-white shadow-sm"
      />
    )
  }
  return (
    <div className={clsx(
      'w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-3 border-2',
      resident.role === 'admin'
        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700'
        : resident.role === 'moderator'
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
          : 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-800'
    )}>
      {initials(resident.full_name)}
    </div>
  )
}

export default function ResidentsClient({
  residents,
  currentUserId,
  initialFollowing,
}: {
  residents: Profile[]
  currentUserId: string
  initialFollowing: Set<string>
}) {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearch(q)
  }, [searchParams])
  const [following, setFollowing]     = useState<Set<string>>(initialFollowing)
  const [loadingIds, setLoadingIds]   = useState<Set<string>>(new Set())
  const [phaseFilter, setPhaseFilter] = useState('All')

  const phases = ['All', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4']

  const filtered = residents.filter(r => {
    if (r.id === currentUserId) return false
    const matchSearch =
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.unit.toLowerCase().includes(search.toLowerCase())
    const matchPhase = phaseFilter === 'All' || r.phase === phaseFilter
    return matchSearch && matchPhase
  })

  const toggleFollow = async (profileId: string) => {
    setLoadingIds(prev => new Set(prev).add(profileId))
    const isFollowing = following.has(profileId)
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', profileId)
      setFollowing(prev => { const s = new Set(prev); s.delete(profileId); return s })
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: profileId })
      setFollowing(prev => new Set(prev).add(profileId))
    }
    setLoadingIds(prev => { const s = new Set(prev); s.delete(profileId); return s })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Residents Directory</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{residents.length} verified homeowners</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or unit…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={phaseFilter} onChange={e => setPhaseFilter(e.target.value)}>
          {phases.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-500 dark:text-gray-400">No residents found matching your search.</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map(resident => {
          const isFollowing = following.has(resident.id)
          const isLoading   = loadingIds.has(resident.id)

          return (
            <div
              key={resident.id}
              className="card p-4 text-center hover:border-brand-200 dark:hover:border-brand-800 transition-colors flex flex-col"
            >
              {/* Avatar */}
              <ResidentAvatar resident={resident} />

              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{resident.full_name}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{resident.unit}</p>
              <div className="mt-2">
                <span className={`badge ${roleBadgeClass(resident.role)} text-[10px]`}>
                  {resident.role.charAt(0).toUpperCase() + resident.role.slice(1)}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 truncate">{resident.phase}</p>

              {/* Spacer pushes buttons to bottom */}
              <div className="flex-1" />

              {/* View Profile — always visible */}
              <Link
                href={`/profile?userId=${resident.id}`}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <User className="w-3.5 h-3.5" /> View Profile
              </Link>

              {/* Follow / Following */}
              <button
                onClick={() => toggleFollow(resident.id)}
                disabled={isLoading}
                className={clsx(
                  'mt-1.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border disabled:opacity-50',
                  isFollowing
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-200'
                    : 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-800 hover:bg-brand-600 hover:text-white hover:border-brand-600'
                )}
              >
                {isFollowing
                  ? <><UserCheck className="w-3.5 h-3.5" /> Following</>
                  : <><UserPlus  className="w-3.5 h-3.5" /> Follow</>
                }
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
