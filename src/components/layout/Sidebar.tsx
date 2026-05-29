'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Newspaper, Megaphone, MessageSquare, Mail,
  Users, User, ShieldCheck, Leaf, Video, X,
  Rss, FileText, BarChart3,
} from 'lucide-react'
import clsx from 'clsx'
import { useEffect } from 'react'

const navItems = [
  { label: 'Feed',              href: '/feed',              icon: Newspaper,     badge: null },
  { label: 'Announcements',    href: '/announcements',     icon: Megaphone,     badge: null },
  { label: 'Community Updates',href: '/community-updates', icon: Rss,           badge: null },
  { label: 'Board Resolutions',href: '/board-resolutions', icon: FileText,      badge: null },
  { label: 'Financial Reports',href: '/financial-reports', icon: BarChart3,     badge: null },
  { label: 'Phase Chats',      href: '/chat',              icon: MessageSquare, badge: 3    },
  { label: 'Messages',         href: '/messages',          icon: Mail,          badge: null },
  { label: 'Residents',        href: '/residents',         icon: Users,         badge: null },
  { label: 'General Assembly', href: '/general-assembly',  icon: Video,         badge: null },
]
const accountItems = [
  { label: 'My Profile',  href: '/profile', icon: User        },
  { label: 'Admin Panel', href: '/admin',   icon: ShieldCheck },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  useEffect(() => { onClose() }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const Inner = () => (
    <aside
      className="w-60 flex-shrink-0 flex flex-col py-5 px-3 gap-0.5 overflow-y-auto h-full"
      style={{ background: 'var(--surface)', borderRight: '1px solid var(--border-soft)' }}
    >
      {/* Logo row */}
      <div className="px-3 mb-6 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-2.5 group" onClick={onClose}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
            style={{ background: 'var(--brand)' }}
          >
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display text-base font-bold leading-tight" style={{ color: 'var(--brand)' }}>
              SHAI Connect
            </p>
            <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>
              Sabella HOA Inc.
            </p>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="md:hidden btn-icon w-8 h-8 flex-shrink-0"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main nav */}
      <div className="mb-1">
        <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Main
        </p>
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} className={clsx('nav-link', active && 'active')}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge !== null && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: 'var(--brand)' }}>
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      <div className="flex-1" />

      {/* Account section */}
      <div>
        <div className="h-px mx-3 mb-3" style={{ background: 'var(--border-soft)' }} />
        <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Account
        </p>
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

  return (
    <>
      {/* ── Desktop: static sidebar ── */}
      <div className="hidden md:flex flex-col w-60 flex-shrink-0 h-full">
        <Inner />
      </div>

      {/* ── Mobile: slide-over drawer ── */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 md:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-64 transition-transform duration-250 ease-in-out md:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ boxShadow: 'var(--shadow-xl)' }}
      >
        <Inner />
      </div>
    </>
  )
}
