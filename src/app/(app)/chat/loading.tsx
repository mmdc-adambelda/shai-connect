export default function ChatLoading() {
  const bubbles = [
    { me: false, w: 'w-48' },
    { me: true,  w: 'w-36' },
    { me: false, w: 'w-64' },
    { me: true,  w: 'w-52' },
    { me: false, w: 'w-40' },
    { me: true,  w: 'w-28' },
  ]

  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="mb-4">
        <div className="h-7 w-32 rounded-lg mb-1" style={{ background: 'var(--surface-2)' }} />
        <div className="h-4 w-56 rounded-lg" style={{ background: 'var(--surface-2)' }} />
      </div>

      <div className="card overflow-hidden flex flex-col chat-panel">
        {/* Header */}
        <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-soft)' }}>
          <div className="h-4 w-20 rounded" style={{ background: 'var(--surface-2)' }} />
          <div className="h-3 w-10 rounded mt-1" style={{ background: 'var(--surface-2)' }} />
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-4 overflow-hidden">
          {bubbles.map(({ me, w }, i) => (
            <div key={i} className={`flex gap-2.5 ${me ? 'flex-row-reverse' : ''}`}>
              {!me && (
                <div className="w-7 h-7 rounded-full flex-shrink-0" style={{ background: 'var(--surface-2)' }} />
              )}
              <div className={`flex flex-col gap-1 ${me ? 'items-end' : ''}`}>
                {!me && <div className="h-3 w-20 rounded" style={{ background: 'var(--surface-2)' }} />}
                <div className={`h-10 ${w} rounded-2xl`} style={{ background: 'var(--surface-2)' }} />
                <div className="h-2.5 w-12 rounded" style={{ background: 'var(--surface-2)' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 py-3 flex gap-2 flex-shrink-0" style={{ borderTop: '1px solid var(--border-soft)' }}>
          <div className="flex-1 h-11 rounded-xl" style={{ background: 'var(--surface-2)' }} />
          <div className="w-10 h-10 rounded-full" style={{ background: 'var(--surface-2)' }} />
        </div>
      </div>
    </div>
  )
}
