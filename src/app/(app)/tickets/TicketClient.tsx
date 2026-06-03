'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bug, Lightbulb, MessageCircle, CheckCircle, Send } from 'lucide-react'
import type { Profile } from '@/types'

const CATEGORIES = [
  { id: 'bug',      label: 'Bug Report',       icon: Bug,           desc: 'Something isn\'t working as expected' },
  { id: 'feature',  label: 'Feature Request',   icon: Lightbulb,     desc: 'Suggest a new feature or improvement' },
  { id: 'feedback', label: 'General Feedback',  icon: MessageCircle, desc: 'Share your thoughts about the app' },
]

export default function TicketClient({ profile }: { profile: Profile | null }) {
  const [category, setCategory] = useState('bug')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) return
    setSubmitting(true)
    setError(null)
    const { error: err } = await supabase.from('support_tickets').insert({
      user_id: profile?.id,
      type: category,
      subject: subject.trim(),
      description: description.trim(),
    })
    setSubmitting(false)
    if (err) {
      setError('Failed to submit ticket. Please try again.')
    } else {
      setSubmitted(true)
      setSubject('')
      setDescription('')
      setCategory('bug')
    }
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center gap-4 py-16 px-4 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'var(--brand-xlight)' }}
        >
          <CheckCircle className="w-8 h-8" style={{ color: 'var(--brand)' }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Ticket Submitted!</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Thank you for your feedback. Our team will review your ticket and get back to you shortly.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="btn-primary mt-2"
        >
          Submit Another Ticket
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-0">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Submit a Ticket</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Help us improve SHAI Connect — report a bug, suggest a feature, or share your feedback during the beta.
        </p>
      </div>

      <div className="card p-5 flex flex-col gap-5">

        {/* Category selector */}
        <div>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Category</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {CATEGORIES.map(c => {
              const active = category === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className="flex flex-col items-start gap-1.5 p-3 rounded-xl border-2 text-left transition-all"
                  style={{
                    borderColor: active ? 'var(--brand)' : 'var(--border-soft)',
                    background: active ? 'var(--brand-xlight)' : 'var(--surface-2)',
                  }}
                >
                  <c.icon
                    className="w-4 h-4"
                    style={{ color: active ? 'var(--brand)' : 'var(--text-muted)' }}
                  />
                  <span
                    className="text-xs font-semibold leading-tight"
                    style={{ color: active ? 'var(--brand)' : 'var(--text-primary)' }}
                  >
                    {c.label}
                  </span>
                  <span className="text-[10px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                    {c.desc}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="text-sm font-semibold mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
            Subject
          </label>
          <input
            className="input w-full"
            placeholder="Brief summary of your ticket"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            maxLength={120}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-semibold mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
            Description
          </label>
          <textarea
            className="input w-full resize-none"
            rows={5}
            placeholder="Describe the issue, suggestion, or feedback in detail…"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Submitting as <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{profile?.full_name || 'Resident'}</span>
          </p>
          <button
            onClick={handleSubmit}
            disabled={!subject.trim() || !description.trim() || submitting}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? 'Submitting…' : 'Submit Ticket'}
          </button>
        </div>

      </div>
    </div>
  )
}
