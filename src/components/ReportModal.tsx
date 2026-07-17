'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Flag, X, Check } from 'lucide-react'
import type { ReportableType, ReportReason } from '@/types'

const REASONS: ReportReason[] = ['Spam', 'Conduct', 'Misinformation', 'Other']

export default function ReportModal({
  contentType,
  contentId,
  reporterId,
  onClose,
}: {
  contentType: ReportableType
  contentId: string
  reporterId: string
  onClose: () => void
}) {
  const supabase = createClient()
  const [reason, setReason] = useState<ReportReason>('Spam')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    const { error: dbErr } = await supabase.from('reports').insert({
      content_type: contentType,
      content_id: contentId,
      reporter_id: reporterId,
      reason,
      details: details.trim() || null,
    })
    setSubmitting(false)
    if (dbErr) { setError('Could not submit report. Please try again.'); return }
    setDone(true)
    setTimeout(onClose, 1400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="card w-full max-w-sm p-5" style={{ boxShadow: 'var(--shadow-xl)' }} onClick={e => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--brand-xlight)' }}>
              <Check className="w-6 h-6" style={{ color: 'var(--brand)' }} />
            </div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Report submitted</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>The moderation team will review it shortly.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4" style={{ color: '#DC2626' }} />
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Report Content</h3>
              </div>
              <button onClick={onClose} className="btn-icon w-7 h-7"><X className="w-4 h-4" /></button>
            </div>

            <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Reason
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className="py-2 px-2 rounded-xl border-2 text-sm font-medium transition-all"
                  style={{
                    borderColor: reason === r ? '#DC2626' : 'var(--border-soft)',
                    background: reason === r ? '#FEF2F2' : 'var(--surface-2)',
                    color: reason === r ? '#DC2626' : 'var(--text-secondary)',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Details <span className="font-normal normal-case" style={{ color: 'var(--text-muted)' }}>(optional)</span>
            </label>
            <textarea
              className="input resize-none mb-4"
              rows={3}
              placeholder="Add any extra context…"
              value={details}
              onChange={e => setDetails(e.target.value)}
            />

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <div className="flex gap-2">
              <button onClick={onClose} className="btn-ghost flex-1 text-sm">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 text-sm">
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
