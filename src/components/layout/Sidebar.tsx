'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  Newspaper, Megaphone,
  Users, User, ShieldCheck, Video, X,
  Rss, FileText, BarChart3, LogOut,
} from 'lucide-react'
import clsx from 'clsx'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const navItems = [
  { label: 'Feed',              href: '/feed',              icon: Newspaper,  badge: null },
  { label: 'Announcements',    href: '/announcements',     icon: Megaphone,  badge: null },
  { label: 'Community Updates',href: '/community-updates', icon: Rss,        badge: null },
  { label: 'Board Resolutions',href: '/board-resolutions', icon: FileText,   badge: null },
  { label: 'Financial Reports',href: '/financial-reports', icon: BarChart3,  badge: null },
  { label: 'Residents',        href: '/residents',         icon: Users,      badge: null },
  { label: 'General Assembly', href: '/general-assembly',  icon: Video,      badge: null },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  profile: Profile | null
}

export default function Sidebar({ open, onClose, profile }: SidebarProps) {
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

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
      className="w-60 flex-shrink-0 flex flex-col px-3 gap-0.5 overflow-y-auto h-full"
      style={{
        background: 'var(--surface)',
        borderRight: '1px solid var(--border-soft)',
        paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Logo row */}
      <div className="px-3 mb-6 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-2.5 group" onClick={onClose}>
          <Image
            src="/logo.png"
            alt="SHAI Connect"
            width={36}
            height={36}
            className="rounded-xl flex-shrink-0 transition-transform group-hover:scale-105"
          />
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

        {/* User info chip — mobile only */}
        {profile && (
          <div className="px-3 mb-2 md:hidden flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
              style={{ background: 'var(--brand)' }}
            >
              {profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{profile.full_name}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{profile.unit}</p>
            </div>
          </div>
        )}

        <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Account
        </p>
        {[
          { label: 'My Profile',  href: '/profile', icon: User        },
          ...(isAdmin ? [{ label: 'Admin Panel', href: '/admin', icon: ShieldCheck }] : []),
        ].map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} className={clsx('nav-link', active && 'active')}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}

        {/* Logout — always in sidebar (primary on mobile, secondary on desktop) */}
        <button
          onClick={handleSignOut}
          className="nav-link w-full text-left mt-0.5"
          style={{ color: '#ef4444' }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign Out
        </button>
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
