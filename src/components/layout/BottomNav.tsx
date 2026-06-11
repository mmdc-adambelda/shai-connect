'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Newspaper, Megaphone, MessageSquare, Mail, User } from 'lucide-react'

const ITEMS = [
  { href: '/feed',          icon: Newspaper,    label: 'Feed'     },
  { href: '/announcements', icon: Megaphone,    label: 'Board'    },
  { href: '/chat',          icon: MessageSquare, label: 'Chat'    },
  { href: '/messages',      icon: Mail,         label: 'Messages' },
  { href: '/profile',       icon: User,         label: 'Profile'  },
]

export default function BottomNav() {
  const pathname = usePathname()

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
