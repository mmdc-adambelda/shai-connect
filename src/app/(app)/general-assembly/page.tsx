'use client'

import { Video, Calendar, Users, Info } from 'lucide-react'

export default function GeneralAssemblyPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--brand)' }}
            >
              <Video className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
              General Assembly Broadcast
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Sabella Homeowners Association Inc. — Official Community Meeting
          </p>
        </div>
      </div>

      {/* ── Info strip ── */}
      <div
        className="card flex flex-wrap gap-4 px-4 py-3 text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} />
          <span>S.H.A.I. General Assembly</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} />
          <span>All homeowners welcome</span>
        </div>
      </div>

      {/* ── Placeholder ── */}
      <div
        className="card flex flex-col items-center justify-center py-20 px-6 text-center"
        style={{ minHeight: '380px' }}
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'var(--brand-xlight)', border: '2px dashed var(--brand-light)' }}
        >
          <Video className="w-9 h-9" style={{ color: 'var(--brand)' }} />
        </div>
        <h2
          className="text-lg font-bold font-display mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          Broadcast Unavailable
        </h2>
        <p
          className="text-sm max-w-md leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          The General Assembly broadcast is currently unavailable. Please check back for future
          events and announcements.
        </p>
      </div>

      {/* ── Notice ── */}
      <div
        className="flex gap-3 px-4 py-3 rounded-xl text-sm"
        style={{ background: 'var(--brand-xlight)', border: '1px solid var(--brand-light)' }}
      >
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--brand)' }} />
        <div style={{ color: 'var(--brand)' }}>
          Stay tuned to the <strong>Announcements</strong> section for updates on upcoming General
          Assembly events and community meetings.
        </div>
      </div>

    </div>
  )
}
