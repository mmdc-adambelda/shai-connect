'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, FileText, Megaphone, MessageSquare, ShieldAlert, ChevronDown, CheckCircle } from 'lucide-react'
import type { Profile } from '@/types'
import clsx from 'clsx'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const MOCK_FLAGS = [
  { id: '1', user: 'unknown_user_42', content: 'Spam post in Phase 2 chat', reason: 'Spam', time: '2h ago' },
  { id: '2', user: 'resident_anon', content: 'Offensive comment on announcement', reason: 'Conduct', time: '5h ago' },
  { id: '3', user: 'new_account_7', content: 'Unverified claim about HOA funds', reason: 'Misinformation', time: '1d ago' },
]

const reasonBadge: Record<string, string> = {
  Spam: 'badge-yellow',
  Conduct: 'badge-red',
  Misinformation: 'badge-red',
}

export default function AdminClient({
  users,
  currentProfile,
  stats,
}: {
  users: Profile[]
  currentProfile: Profile
  stats: { totalUsers: number; totalPosts: number; totalAnnouncements: number; totalMessages: number }
}) {
  const [tab, setTab] = useState<'overview' | 'users' | 'flags'>('overview')
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null)
  const [resolvedFlags, setResolvedFlags] = useState<Set<string>>(new Set())
  const [userSearch, setUserSearch] = useState('')
  const supabase = createClient()

  const handleRoleChange = async (userId: string, newRole: string) => {
    setRoleUpdating(userId)
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    setRoleUpdating(null)
  }

  const resolveFlag = (id: string) => {
    setResolvedFlags(prev => new Set(prev).add(id))
  }

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.unit.toLowerCase().includes(userSearch.toLowerCase())
  )

  const statCards = [
    { label: 'Total Residents', value: stats.totalUsers, icon: Users, color: 'text-brand-600' },
    { label: 'Total Posts', value: stats.totalPosts, icon: FileText, color: 'text-blue-600' },
    { label: 'Announcements', value: stats.totalAnnouncements, icon: Megaphone, color: 'text-yellow-600' },
    { label: 'Chat Messages', value: stats.totalMessages, icon: MessageSquare, color: 'text-purple-600' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Community governance and moderation tools</p>
        </div>
        <span className="badge badge-red flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" /> Admin Only
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        {(['overview', 'users', 'flags'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize',
              tab === t
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            {t}
            {t === 'flags' && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {MOCK_FLAGS.length - resolvedFlags.size}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
                  </div>
                  <Icon className={`w-5 h-5 ${color} mt-0.5`} />
                </div>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-4">Phase Breakdown</h3>
            {['Phase 1 – Sampaguita', 'Phase 2 – Rosal', 'Phase 3 – Ilang-Ilang', 'Phase 4 – Dama de Noche'].map(phase => {
              const count = users.filter(u => u.phase === phase).length
              const pct = stats.totalUsers > 0 ? Math.round((count / stats.totalUsers) * 100) : 0
              return (
                <div key={phase} className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>{phase}</span>
                    <span className="font-semibold">{count} residents ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* USERS TAB */}
      {tab === 'users' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <input
              className="input flex-1"
              placeholder="Search residents…"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
            />
            <span className="text-xs text-gray-400 whitespace-nowrap">{filteredUsers.length} shown</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Resident</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Unit</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Phase</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {initials(user.full_name)}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{user.unit}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{user.phase}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('badge', user.role === 'admin' ? 'badge-red' : user.role === 'moderator' ? 'badge-blue' : 'badge-green')}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.id !== currentProfile.id && (
                        <div className="flex items-center gap-2">
                          <select
                            defaultValue={user.role}
                            disabled={roleUpdating === user.id}
                            onChange={e => handleRoleChange(user.id, e.target.value)}
                            className="input py-1 text-xs w-auto"
                          >
                            <option value="resident">Resident</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      )}
                      {user.id === currentProfile.id && (
                        <span className="text-xs text-gray-400">You</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FLAGS TAB */}
      {tab === 'flags' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Flagged Content</h3>
            <p className="text-xs text-gray-400 mt-0.5">Review and moderate reported posts and users</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {MOCK_FLAGS.map(flag => {
              const resolved = resolvedFlags.has(flag.id)
              return (
                <div key={flag.id} className={clsx('p-4 flex items-start gap-4 transition-colors', resolved && 'opacity-50')}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{flag.user}</span>
                      <span className={`badge ${reasonBadge[flag.reason] || 'badge-gray'}`}>{flag.reason}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{flag.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{flag.time}</p>
                  </div>
                  {resolved ? (
                    <div className="flex items-center gap-1 text-brand-600 text-xs font-medium">
                      <CheckCircle className="w-4 h-4" /> Resolved
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => resolveFlag(flag.id)}
                        className="btn-primary py-1.5 text-xs"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => resolveFlag(flag.id)}
                        className="btn-ghost py-1.5 text-xs"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
