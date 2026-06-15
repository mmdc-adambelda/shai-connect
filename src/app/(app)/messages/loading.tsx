export default function MessagesLoading() {
  const convos = [1, 2, 3, 4]
  const bubbles = [
    { me: false, w: 'w-48' },
    { me: true,  w: 'w-36' },
    { me: false, w: 'w-56' },
    { me: true,  w: 'w-44' },
  ]

  return (
    <div className="animate-pulse">
      <div className="mb-4">
        <div className="h-7 w-44 rounded-lg mb-1" style={{ background: 'var(--surface-2)' }} />
        <div className="h-4 w-56 rounded-lg" style={{ background: 'var(--surface-2)' }} />
      </div>

      <div className="card flex overflow-hidden chat-panel">
        {/* Conversation list */}
        <div className="w-64 flex-shrink-0 flex flex-col hidden md:flex" style={{ borderRight: '1px solid var(--border-soft)' }}>
          <div className="p-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-soft)' }}>
            <div className="h-9 w-full rounded-lg" style={{ background: 'var(--surface-2)' }} />
          </div>
          <div className="flex-1">
            {convos.map(i => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <div className="w-9 h-9 rounded-full flex-shrink-0" style={{ background: 'var(--surface-2)' }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-28 rounded" style={{ background: 'var(--surface-2)' }} />
                  <div className="h-3 w-36 rounded" style={{ background: 'var(--surface-2)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-soft)' }}>
            <div className="w-9 h-9 rounded-full" style={{ background: 'var(--surface-2)' }} />
            <div className="space-y-1">
              <div className="h-4 w-28 rounded" style={{ background: 'var(--surface-2)' }} />
              <div className="h-3 w-20 rounded" style={{ background: 'var(--surface-2)' }} />
            </div>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-hidden">
            {bubbles.map(({ me, w }, i) => (
              <div key={i} className={`flex gap-2 ${me ? 'flex-row-reverse' : ''}`}>
                <div className={`flex flex-col gap-1 ${me ? 'items-end' : ''}`}>
                  <div className={`h-10 ${w} rounded-2xl`} style={{ background: 'var(--surface-2)' }} />
                  <div className="h-2.5 w-10 rounded" style={{ background: 'var(--surface-2)' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 flex gap-2 flex-shrink-0" style={{ borderTop: '1px solid var(--border-soft)' }}>
            <div className="flex-1 h-11 rounded-xl" style={{ background: 'var(--surface-2)' }} />
            <div className="w-11 h-11 rounded-full" style={{ background: 'var(--surface-2)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
