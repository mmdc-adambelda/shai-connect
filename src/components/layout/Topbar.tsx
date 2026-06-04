'use client'

import { Bell, Sun, Moon, LogOut, X, MessageSquare, Search, Menu, Mail, LifeBuoy } from 'lucide-react'
import { useTheme } from '@/components/ui/ThemeProvider'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import AvatarUI from '@/components/ui/Avatar'
import type { Profile } from '@/types'

interface AppNotification {
  id: string
  type: 'dm' | 'chat'
  label: string
  desc: string
  createdAt: string
  read: boolean
  href: string
}

interface TopbarProps {
  profile: Profile | null
  onMenuClick: () => void
}

export default function Topbar({ profile, onMenuClick }: TopbarProps) {
  const { theme, toggle } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const unreadCount = notifications.filter(n => !n.read).length

  // ── Real-time subscriptions ──────────────────────────────────────
  useEffect(() => {
    if (!profile?.id) return

    // Direct messages — new messages where I am the recipient
    const dmChannel = supabase
      .channel(`notif:dm:${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `recipient_id=eq.${profile.id}` },
        async (payload) => {
          const { data: sender } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.sender_id)
            .single()

          setNotifications(prev => [{
            id: payload.new.id,
            type: 'dm',
            label: `New message from ${sender?.full_name ?? 'Someone'}`,
            desc: payload.new.content,
            createdAt: payload.new.created_at,
            read: pathname === '/messages',
            href: '/messages',
          }, ...prev])
        }
      )
      .subscribe()

    // Phase chat — new messages in the user's phase room, not sent by me
    const chatChannel = supabase
      .channel(`notif:chat:${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room=eq.${profile.phase}` },
        async (payload) => {
          if (payload.new.sender_id === profile.id) return

          const { data: sender } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.sender_id)
            .single()

          setNotifications(prev => [{
            id: payload.new.id,
            type: 'chat',
            label: `${sender?.full_name ?? 'Someone'} in ${profile.phase}`,
            desc: payload.new.content,
            createdAt: payload.new.created_at,
            read: pathname === '/chat',
            href: '/chat',
          }, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(dmChannel)
      supabase.removeChannel(chatChannel)
    }
  }, [profile?.id, profile?.phase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  const handleNotifClick = (notif: AppNotification) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
    setShowNotifs(false)
    router.push(notif.href)
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

      {/* Quick-nav icons: Phase Chat · Messages · Ticket */}
      {[
        { href: '/chat',     icon: MessageSquare, title: 'Phase Chats'     },
        { href: '/messages', icon: Mail,          title: 'Messages'        },
        { href: '/tickets',  icon: LifeBuoy,      title: 'Submit a Ticket' },
      ].map(({ href, icon: Icon, title }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className="btn-icon relative"
            title={title}
            style={active ? { color: 'var(--brand)' } : undefined}
          >
            <Icon className="w-4 h-4" />
            {active && (
              <span
                className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                style={{ background: 'var(--brand)' }}
              />
            )}
          </Link>
        )
      })}

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
              {/* Panel header */}
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

              {/* List */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
                    <Bell className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>You're all caught up</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>New messages and phase chat activity will appear here.</p>
                  </div>
                ) : (
                  notifications.map(n => {
                    const Icon = n.type === 'dm' ? Mail : MessageSquare
                    const iconColor = n.type === 'dm' ? '#2563eb' : 'var(--brand)'
                    return (
                      <div
                        key={n.id}
                        className="flex gap-3 px-4 py-3 cursor-pointer transition-colors"
                        style={{
                          background: !n.read ? 'var(--brand-xlight)' : undefined,
                          borderBottom: '1px solid var(--border-soft)',
                        }}
                        onClick={() => handleNotifClick(n)}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          <Icon className="w-4 h-4" style={{ color: iconColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug font-medium" style={{ color: 'var(--text-primary)' }}>{n.label}</p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{n.desc}</p>
                          <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--brand)' }} />}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* User chip — avatar always visible; name + logout only on sm+ */}
      <div className="flex items-center gap-2 pl-2 ml-1" style={{ borderLeft: '1px solid var(--border-soft)' }}>
        <AvatarUI name={profile?.full_name || 'Me'} avatarUrl={profile?.avatar_url} size={30} />
        <div className="hidden sm:block">
          <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {profile?.full_name || 'Resident'}
          </p>
          <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>{profile?.unit || ''}</p>
        </div>
        <button onClick={handleSignOut} className="hidden sm:flex btn-icon ml-1 hover:!bg-red-50 hover:!text-red-500" title="Sign out">
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
