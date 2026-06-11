'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Newspaper, Megaphone, MessageSquare, Mail, User } from 'lucide-react'
import { useUnreadDMs } from '@/hooks/useUnreadDMs'

const ITEMS = [
  { href: '/feed',          icon: Newspaper,    label: 'Feed'     },
  { href: '/announcements', icon: Megaphone,    label: 'Board'    },
  { href: '/chat',          icon: MessageSquare, label: 'Chat'    },
  { href: '/messages',      icon: Mail,         label: 'Messages' },
  { href: '/profile',       icon: User,         label: 'Profile'  },
]

export default function BottomNav({ userId }: { userId?: string | null }) {
  const pathname  = usePathname()
  const unreadDMs = useUnreadDMs(userId)

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
      }}
    >
      {ITEMS.map(({ href, icon: Icon, label }) => {
        const active  = pathname === href || pathname.startsWith(href + '/')
        const showBadge = href === '/messages' && unreadDMs > 0
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
            <span className="relative">
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
              {showBadge && (
                <span
                  className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: '#EF4444' }}
                >
                  {unreadDMs > 9 ? '9+' : unreadDMs}
                </span>
              )}
            </span>
            <span
              className="text-[10px] leading-none font-semibold"
              style={{ fontWeight: active ? 700 : 500 }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
