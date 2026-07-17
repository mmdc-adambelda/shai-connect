'use client'

import { useState } from 'react'
import { Megaphone, Rss } from 'lucide-react'
import type { Announcement, Profile } from '@/types'
import AnnouncementsClient from './AnnouncementsClient'
import CommunityUpdatesPanel from './CommunityUpdatesPanel'

export default function BulletinBoardClient({
  announcements,
  currentProfile,
  currentUserId,
}: {
  announcements: Announcement[]
  currentProfile: Profile | null
  currentUserId: string
}) {
  const [tab, setTab] = useState<'announcements' | 'updates'>('announcements')

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center gap-2 mb-5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--brand)' }}
        >
          <Megaphone className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
          Bulletin Board
        </h1>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-lg w-fit"
        style={{ background: 'var(--surface-2)' }}
      >
        {([
          { key: 'announcements', label: 'Announcements', icon: Megaphone },
          { key: 'updates',       label: 'Updates',        icon: Rss       },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5"
            style={{
              background: tab === key ? 'var(--surface)' : 'transparent',
              color:      tab === key ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow:  tab === key ? 'var(--shadow-xs)' : 'none',
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'announcements' && (
        <AnnouncementsClient
          announcements={announcements}
          currentProfile={currentProfile}
          currentUserId={currentUserId}
        />
      )}
      {tab === 'updates' && <CommunityUpdatesPanel />}
    </div>
  )
}
