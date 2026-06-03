'use client'

import { Bell, Sun, Moon, LogOut, X, Megaphone, MessageSquare, ThumbsUp, Search, Menu } from 'lucide-react'
import { useTheme } from '@/components/ui/ThemeProvider'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import AvatarUI from '@/components/ui/Avatar'
import type { Profile } from '@/types'

const MOCK_NOTIFICATIONS = [
  { id: '1', icon: Megaphone,      label: 'New Announcement',       desc: 'Water interruption scheduled tomorrow 6AM–12NN.', time: '2h ago', read: false, color: 'text-yellow-600' },
  { id: '2', icon: ThumbsUp,       label: 'Juan liked your post',   desc: '"Anyone attending the general assembly?"',        time: '4h ago', read: false, color: 'text-brand'    },
  { id: '3', icon: MessageSquare,  label: 'New message from HOA Admin', desc: 'Your gate pass request has been approved.',   time: '1d ago', read: true,  color: 'text-blue-600' },
]



interface TopbarProps {
  profile: Profile | null
  onMenuClick: () => void
}

export default function Topbar({ profile, onMenuClick }: TopbarProps) {
  const { theme, toggle } = useTheme()
  const router = useRouter()
  const supabase = createClient()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const unreadCount = notifications.filter(n => !n.read).length

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  return (
    <header
      className="h-14 flex items-center px-4 gap-2 sticky top-0 z-40"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-xs)' }}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="md:hidden btn-icon flex-shrink-0"
        aria-label="Open menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Desktop search */}
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

      {/* Mobile search toggle */}
      <button
        onClick={() => setShowMobileSearch(s => !s)}
        className="md:hidden btn-icon"
        aria-label="Search"
      >
        <Search className="w-4 h-4" />
      </button>

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
            <div
              className="fixed right-3 z-50 overflow-hidden card"
              style={{
                top: '3.75rem',
                width: 'min(340px, calc(100vw - 1.5rem))',
                maxHeight: 'calc(100vh - 5rem)',
                boxShadow: 'var(--shadow-lg)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
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
                    <button
                      onClick={() => setNotifications(p => p.map(n => ({ ...n, read: true })))}
                      className="text-xs font-medium"
                      style={{ color: 'var(--brand)' }}
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifs(false)} className="btn-icon w-6 h-6">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className="flex gap-3 px-4 py-3 cursor-pointer transition-colors"
                    style={{
                      background: !n.read ? 'var(--brand-xlight)' : undefined,
                      borderBottom: '1px solid var(--border-soft)',
                    }}
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
      <div className="flex items-center gap-2 pl-2 ml-1" style={{ borderLeft: '1px solid var(--border-soft)' }}>
        <AvatarUI name={profile?.full_name || 'Me'} avatarUrl={profile?.avatar_url} size={30} />
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

      {/* Mobile search — full-width dropdown */}
      {showMobileSearch && (
        <div
          className="absolute left-0 right-0 top-14 px-3 py-2 z-30 md:hidden"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            <input
              autoFocus
              className="input py-2 pl-9 text-sm h-9"
              placeholder="Search residents, posts…"
              style={{ borderRadius: '99px' }}
              onBlur={() => setShowMobileSearch(false)}
            />
          </div>
        </div>
      )}
    </header>
  )
}
