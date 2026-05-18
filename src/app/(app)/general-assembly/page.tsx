'use client'

import { useState } from 'react'
import { Video, Users, Wifi, Calendar, Clock, Info, Maximize2, ExternalLink } from 'lucide-react'

export default function GeneralAssemblyPage() {
  const [fullscreen, setFullscreen] = useState(false)

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
              Online General Assembly
            </h1>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white animate-pulse"
              style={{ background: '#ef4444' }}
            >
              LIVE
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Sabella Homeowners Association Inc. — Official Community Meeting
          </p>
        </div>

        <a
          href="https://teams.microsoft.com/convene/townhall?eventId=70a898ca-9306-41a1-a9d5-47dded65720e@fb3e8493-3161-4889-9cd3-14eb27f43754&sessionId=69fcc171-fcb2-4a2f-b4c9-67965d0fd2b9"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost flex items-center gap-2 text-sm self-start sm:self-auto"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in Teams
        </a>
      </div>

      {/* ── Info strip ── */}
      <div
        className="card flex flex-wrap gap-4 px-4 py-3 text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} />
          <span>S.H.A.I. General Assembly 2025</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} />
          <span>Hosted via Microsoft Teams Town Hall</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} />
          <span>All homeowners welcome</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} />
          <span>Stable internet connection recommended</span>
        </div>
      </div>

      {/* ── Embed ── */}
      <div
        className="card overflow-hidden"
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {/* Toolbar */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ borderBottom: '1px solid var(--border-soft)', background: 'var(--surface)' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              Microsoft Teams — Town Hall
            </span>
          </div>
          <button
            onClick={() => setFullscreen(f => !f)}
            className="btn-icon w-7 h-7"
            title={fullscreen ? 'Exit fullscreen' : 'Expand'}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Responsive iframe wrapper */}
        <div
          className="w-full"
          style={{
            position: 'relative',
            paddingBottom: fullscreen ? '0' : '56.25%', /* 16:9 */
            height: fullscreen ? 'calc(100vh - 260px)' : '0',
            minHeight: fullscreen ? '400px' : undefined,
            overflow: 'hidden',
            background: '#000',
          }}
        >
          <iframe
            src="https://teams.microsoft.com/convene/townhall?eventId=70a898ca-9306-41a1-a9d5-47dded65720e@fb3e8493-3161-4889-9cd3-14eb27f43754&sessionId=69fcc171-fcb2-4a2f-b4c9-67965d0fd2b9"
            style={{
              position: fullscreen ? 'relative' : 'absolute',
              top: 0, left: 0,
              width: '100%',
              height: fullscreen ? 'calc(100vh - 260px)' : '100%',
              minHeight: fullscreen ? '400px' : undefined,
              border: 'none',
            }}
            frameBorder={0}
            scrolling="no"
            allowFullScreen
            allow="autoplay; camera; microphone; display-capture"
            title="SHAI General Assembly — Microsoft Teams Town Hall"
          />
        </div>
      </div>

      {/* ── Notice ── */}
      <div
        className="flex gap-3 px-4 py-3 rounded-xl text-sm"
        style={{ background: 'var(--brand-xlight)', border: '1px solid var(--brand-light)' }}
      >
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--brand)' }} />
        <div style={{ color: 'var(--brand)' }}>
          <strong>Having trouble viewing?</strong> If the meeting doesn&apos;t load, click{' '}
          <a
            href="https://teams.microsoft.com/convene/townhall?eventId=70a898ca-9306-41a1-a9d5-47dded65720e@fb3e8493-3161-4889-9cd3-14eb27f43754&sessionId=69fcc171-fcb2-4a2f-b4c9-67965d0fd2b9"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold"
          >
            Open in Teams
          </a>{' '}
          to join directly. For the best experience, use the Microsoft Teams desktop app or Google Chrome.
        </div>
      </div>

    </div>
  )
}
