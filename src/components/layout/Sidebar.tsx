'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Newspaper, Megaphone, MessageSquare, Mail, Users, User, ShieldCheck, Leaf } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { label: 'Feed',          href: '/feed',         icon: Newspaper,     badge: null },
  { label: 'Announcements', href: '/announcements', icon: Megaphone,     badge: null },
  { label: 'Phase Chats',   href: '/chat',          icon: MessageSquare, badge: 3 },
  { label: 'Messages',      href: '/messages',      icon: Mail,          badge: null },
  { label: 'Residents',     href: '/residents',     icon: Users,         badge: null },
]
const accountItems = [
  { label: 'My Profile',  href: '/profile', icon: User },
  { label: 'Admin Panel', href: '/admin',   icon: ShieldCheck },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col py-5 px-3 gap-0.5 overflow-y-auto"
      style={{ background: 'var(--surface)', borderRight: '1px solid var(--border-soft)' }}>
      <div className="px-3 mb-6">
        <Link href="/feed" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
            style={{ background: 'var(--brand)' }}>
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display text-base font-bold leading-tight" style={{ color: 'var(--brand)' }}>SHAI Connect</p>
            <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>Sabella HOA Inc.</p>
          </div>
        </Link>
      </div>
      <div className="mb-1">
        <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Main</p>
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} className={clsx('nav-link', active && 'active')}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge !== null && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: 'var(--brand)' }}>{badge}</span>
              )}
            </Link>
          )
        })}
      </div>
      <div className="flex-1" />
      <div>
        <div className="h-px mx-3 mb-3" style={{ background: 'var(--border-soft)' }} />
        <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Account</p>
        {accountItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} className={clsx('nav-link', active && 'active')}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
