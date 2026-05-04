'use client'

import { Bell, Sun, Moon, LogOut, X, Megaphone, MessageSquare, ThumbsUp, Search } from 'lucide-react'
import { useTheme } from '@/components/ui/ThemeProvider'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Profile } from '@/types'

const MOCK_NOTIFICATIONS = [
  { id: '1', icon: Megaphone, label: 'New Announcement', desc: 'Water interruption scheduled tomorrow 6AM–12NN.', time: '2h ago', read: false, color: 'text-yellow-600' },
  { id: '2', icon: ThumbsUp,  label: 'Juan liked your post', desc: '"Anyone attending the general assembly?"', time: '4h ago', read: false, color: 'text-brand' },
  { id: '3', icon: MessageSquare, label: 'New message from HOA Admin', desc: 'Your gate pass request has been approved.', time: '1d ago', read: true, color: 'text-blue-600' },
]

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="avatar font-bold" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  )
}

export default function Topbar({ profile }: { profile: Profile | null }) {
  const { theme, toggle } = useTheme()
  const router = useRouter()
  const supabase = createClient()
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const unreadCount = notifications.filter(n => !n.read).length

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  return (
    <header
      className="h-14 flex items-center px-5 gap-2 sticky top-0 z-40"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-xs)' }}
    >
      {/* Search bar */}
      <div className="flex-1 max-w-xs hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input py-2 pl-9 text-sm h-9"
            placeholder="Search residents, posts…"
            style={{ borderRadius: '99px' }}
          />
        </div>
      </div>

      <div className="flex-1" />

      {/* Theme toggle */}
      <button onClick={toggle} className="btn-icon" title="Toggle theme">
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Notifications */}
      <div className="relative">
        <button onClick={() => setShowNotifs(!showNotifs)} className="btn-icon relative" title="Notifications">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full border-2"
              style={{ background: '#ef4444', borderColor: 'var(--surface)' }} />
          )}
        </button>

        {showNotifs && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
            <div className="absolute right-0 top-11 w-80 z-50 overflow-hidden card"
              style={{ boxShadow: 'var(--shadow-lg)', borderRadius: 'var(--radius-lg)' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#ef4444' }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={() => setNotifications(p => p.map(n => ({ ...n, read: true })))}
                      className="text-xs font-medium text-brand" style={{ color: 'var(--brand)' }}>
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifs(false)} className="btn-icon w-6 h-6">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id}
                    className="flex gap-3 px-4 py-3 cursor-pointer transition-colors"
                    style={{ background: !n.read ? 'var(--brand-xlight)' : undefined, borderBottom: '1px solid var(--border-soft)' }}
                    onMouseEnter={e => { if (n.read) (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = !n.read ? 'var(--brand-xlight)' : '' }}
                    onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${n.color}`}><n.icon className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug font-medium" style={{ color: 'var(--text-primary)' }}>{n.label}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{n.desc}</p>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{n.time}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--brand)' }} />}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* User chip */}
      <div className="flex items-center gap-2.5 pl-3 ml-1" style={{ borderLeft: '1px solid var(--border-soft)' }}>
        <Avatar name={profile?.full_name || 'Me'} size={32} />
        <div className="hidden sm:block">
          <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {profile?.full_name || 'Resident'}
          </p>
          <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>{profile?.unit || ''}</p>
        </div>
        <button onClick={handleSignOut} className="btn-icon ml-1 hover:!bg-red-50 hover:!text-red-500" title="Sign out">
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  )
}
