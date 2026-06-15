export default function FeedLoading() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="h-8 w-44 rounded-lg mb-1.5" style={{ background: 'var(--surface-2)' }} />
          <div className="h-4 w-60 rounded-lg" style={{ background: 'var(--surface-2)' }} />
        </div>
        <div className="h-9 w-24 rounded-lg" style={{ background: 'var(--surface-2)' }} />
      </div>

      <div className="card mb-5 p-4">
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ background: 'var(--surface-2)' }} />
          <div className="flex-1 h-10 rounded-full" style={{ background: 'var(--surface-2)' }} />
        </div>
      </div>

      <div className="space-y-4">
        {[72, 48, 90].map((lines, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ background: 'var(--surface-2)' }} />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-32 rounded" style={{ background: 'var(--surface-2)' }} />
                <div className="h-3 w-20 rounded" style={{ background: 'var(--surface-2)' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3.5 w-full rounded" style={{ background: 'var(--surface-2)' }} />
              <div className="h-3.5 rounded" style={{ background: 'var(--surface-2)', width: `${lines}%` }} />
              <div className="h-3.5 w-3/5 rounded" style={{ background: 'var(--surface-2)' }} />
            </div>
            <div className="mt-4 pt-3 flex gap-4" style={{ borderTop: '1px solid var(--border-soft)' }}>
              <div className="h-7 w-16 rounded-lg" style={{ background: 'var(--surface-2)' }} />
              <div className="h-7 w-20 rounded-lg" style={{ background: 'var(--surface-2)' }} />
              <div className="h-7 w-14 rounded-lg ml-auto" style={{ background: 'var(--surface-2)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
