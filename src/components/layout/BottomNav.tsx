'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Newspaper, Megaphone, MessageSquare, Mail, User } from 'lucide-react'
import { useUnreadDMs } from '@/hooks/useUnreadDMs'

const LEFT_ITEMS = [
  { href: '/feed',           icon: Newspaper, label: 'Feed'  },
  { href: '/bulletin-board', icon: Megaphone, label: 'Board' },
]

const RIGHT_ITEMS = [
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav({ userId }: { userId?: string | null }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const unreadDMs = useUnreadDMs(userId)
  const [showChatSheet, setShowChatSheet] = useState(false)

  const chatActive = pathname === '/chat' || pathname.startsWith('/chat/') ||
                      pathname === '/messages' || pathname.startsWith('/messages/')

  const renderItem = ({ href, icon: Icon, label }: { href: string; icon: typeof Newspaper; label: string }) => {
    const active = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link
        key={href}
        href={href}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all relative"
        style={{ color: active ? 'var(--brand)' : 'var(--text-muted)' }}
      >
        {active && (
          <span
            className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
            style={{ background: 'var(--brand)' }}
          />
        )}
        <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
        <span className="text-[10px] leading-none font-semibold" style={{ fontWeight: active ? 700 : 500 }}>
          {label}
        </span>
      </Link>
    )
  }

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        }}
      >
        {LEFT_ITEMS.map(renderItem)}

        {/* Chat — combines Phase Chat + Direct Messages; tap slides up a picker */}
        <button
          onClick={() => setShowChatSheet(true)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all relative"
          style={{ color: chatActive ? 'var(--brand)' : 'var(--text-muted)' }}
        >
          {chatActive && (
            <span
              className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
              style={{ background: 'var(--brand)' }}
            />
          )}
          <span className="relative">
            <MessageSquare className="w-5 h-5" strokeWidth={chatActive ? 2.5 : 1.8} />
            {unreadDMs > 0 && (
              <span
                className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: '#EF4444' }}
              >
                {unreadDMs > 9 ? '9+' : unreadDMs}
              </span>
            )}
          </span>
          <span className="text-[10px] leading-none font-semibold" style={{ fontWeight: chatActive ? 700 : 500 }}>
            Chat
          </span>
        </button>

        {RIGHT_ITEMS.map(renderItem)}
      </nav>

      {/* Slide-up picker: Phase Chat vs Direct Messages */}
      {showChatSheet && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowChatSheet(false)}
          />
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl overflow-hidden"
            style={{
              background: 'var(--surface)',
              boxShadow: 'var(--shadow-xl)',
              paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
            }}
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-9 h-1 rounded-full" style={{ background: 'var(--border)' }} />
            </div>

            <button
              onClick={() => { setShowChatSheet(false); router.push('/chat') }}
              className="w-full flex items-center gap-3 px-5 py-4 text-left"
            >
              <MessageSquare className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--brand)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Phase Chat</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Chat with residents in your phase</p>
              </div>
            </button>

            <div className="h-px mx-5" style={{ background: 'var(--border-soft)' }} />

            <button
              onClick={() => { setShowChatSheet(false); router.push('/messages') }}
              className="w-full flex items-center gap-3 px-5 py-4 text-left"
            >
              <Mail className="w-5 h-5 flex-shrink-0" style={{ color: '#2563eb' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Direct Messages</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Private conversations</p>
              </div>
              {unreadDMs > 0 && (
                <span className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: '#EF4444' }}>
                  {unreadDMs > 9 ? '9+' : unreadDMs}
                </span>
              )}
            </button>
          </div>
        </>
      )}
    </>
  )
}
