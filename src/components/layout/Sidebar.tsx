'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Newspaper, Megaphone, MessageSquare, Mail,
  Users, User, ShieldCheck, Home
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { label: 'Feed', href: '/feed', icon: Newspaper },
  { label: 'Announcements', href: '/announcements', icon: Megaphone },
  { label: 'Phase Chats', href: '/chat', icon: MessageSquare },
  { label: 'Messages', href: '/messages', icon: Mail },
  { label: 'Residents', href: '/residents', icon: Users },
]

const accountItems = [
  { label: 'My Profile', href: '/profile', icon: User },
  { label: 'Admin Panel', href: '/admin', icon: ShieldCheck },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col py-4 px-2 gap-1 overflow-y-auto">
      <div className="px-3 mb-2">
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-brand-600" />
          <span className="font-serif font-bold text-brand-700 dark:text-brand-400 text-lg">SHAI Connect</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 ml-7">Sabella HOA Inc.</p>
      </div>

      <div className="px-3 pt-2 pb-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Main</p>
      </div>
      {navItems.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={clsx('nav-link', pathname === href || pathname.startsWith(href + '/') ? 'active' : '')}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {label}
        </Link>
      ))}

      <div className="px-3 pt-3 pb-1 mt-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account</p>
      </div>
      {accountItems.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={clsx('nav-link', pathname === href || pathname.startsWith(href + '/') ? 'active' : '')}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {label}
        </Link>
      ))}
    </aside>
  )
}
