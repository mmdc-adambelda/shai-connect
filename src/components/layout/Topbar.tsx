'use client'

import { Bell, Sun, Moon, LogOut, X, Megaphone, MessageSquare, ThumbsUp } from 'lucide-react'
import { useTheme } from '@/components/ui/ThemeProvider'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Profile } from '@/types'

const MOCK_NOTIFICATIONS = [
  { id: '1', icon: Megaphone, label: 'New Announcement', desc: 'Water interruption scheduled tomorrow 6AM–12NN.', time: '2h ago', read: false, color: 'text-yellow-600' },
  { id: '2', icon: ThumbsUp, label: 'Juan liked your post', desc: '"Anyone attending the general assembly?"', time: '4h ago', read: false, color: 'text-brand-600' },
  { id: '3', icon: MessageSquare, label: 'New message from HOA Admin', desc: 'Your gate pass request has been approved.', time: '1d ago', read: true, color: 'text-blue-600' },
]

export default function Topbar({ profile }: { profile: Profile | null }) {
  const { theme, toggle } = useTheme()
  const router = useRouter()
  const supabase = createClient()
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'ME'

  const unreadCount = notifications.filter(n => !n.read).length

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-5 gap-3 sticky top-0 z-50 shadow-sm">
      <div className="flex-1" />

      <button
        onClick={toggle}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Toggle dark/light mode"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifs(!showNotifs)}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
          )}
        </button>

        {showNotifs && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
            {/* Panel */}
            <div className="absolute right-0 top-11 w-80 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifs(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                {notifications.length === 0 && (
                  <div className="py-10 text-center text-gray-400 text-sm">No notifications</div>
                )}
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!n.read ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`}
                    onClick={() => setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif))}
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${n.color}`}>
                      <n.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                        {n.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{n.desc}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* User */}
      <div className="flex items-center gap-2 pl-2 border-l border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 flex items-center justify-center text-xs font-bold border-2 border-brand-300 dark:border-brand-700">
          {initials}
        </div>
        <div className="hidden sm:block">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">{profile?.full_name || 'Resident'}</p>
          <p className="text-[10px] text-gray-400 leading-tight">{profile?.unit || ''}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="ml-1 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
