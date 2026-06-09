'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Bug, Lightbulb, MessageCircle, CheckCircle, Send,
  ClipboardList, Clock, Loader2, AlertCircle, XCircle,
} from 'lucide-react'
import type { Profile, SupportTicket } from '@/types'
import { formatDistanceToNow } from 'date-fns'

const CATEGORIES = [
  { id: 'bug',      label: 'Bug Report',      icon: Bug,           desc: "Something isn't working as expected" },
  { id: 'feature',  label: 'Feature Request',  icon: Lightbulb,     desc: 'Suggest a new feature or improvement' },
  { id: 'feedback', label: 'General Feedback', icon: MessageCircle, desc: 'Share your thoughts about the app' },
]

function StatusBadge({ status }: { status: string }) {
  if (status === 'open')
    return <span className="badge text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: '#FEF9EC', color: '#854D0E', border: '1px solid #F3D77A' }}>Pending</span>
  if (status === 'in_progress')
    return <span className="badge text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>In Progress</span>
  if (status === 'resolved')
    return <span className="badge badge-green text-[10px]">Resolved</span>
  if (status === 'closed')
    return <span className="badge badge-gray text-[10px]">Closed</span>
  return <span className="badge badge-gray text-[10px]">{status}</span>
}

function TypeBadge({ type }: { type: string }) {
  if (type === 'bug')      return <span className="badge text-[10px]" style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}>Bug</span>
  if (type === 'feature')  return <span className="badge text-[10px]" style={{ background: '#EEF2FF', color: '#3730A3', border: '1px solid #C7D2FE' }}>Feature</span>
  if (type === 'feedback') return <span className="badge badge-gray text-[10px]">Feedback</span>
  return <span className="badge badge-gray text-[10px]">{type}</span>
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'open')        return <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#D97706' }} />
  if (status === 'in_progress') return <Loader2 className="w-4 h-4 flex-shrink-0" style={{ color: '#2563EB' }} />
  if (status === 'resolved')    return <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brand)' }} />
  if (status === 'closed')      return <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
  return <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
}

export default function TicketClient({
  profile,
  myTickets,
}: {
  profile: Profile | null
  myTickets: SupportTicket[]
}) {
  const [tab, setTab] = useState<'submit' | 'my_tickets'>('submit')
  const [category, setCategory] = useState('bug')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tickets, setTickets] = useState<SupportTicket[]>(myTickets)
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) return
    setSubmitting(true)
    setError(null)
    const { data, error: err } = await supabase.from('support_tickets').insert({
      user_id: profile?.id,
      type: category,
      subject: subject.trim(),
      description: description.trim(),
    }).select('*').single()
    setSubmitting(false)
    if (err) {
      setError('Failed to submit ticket. Please try again.')
    } else {
      if (data) setTickets(prev => [data as SupportTicket, ...prev])
      setSubmitted(true)
      setSubject('')
      setDescription('')
      setCategory('bug')
    }
  }

  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center gap-4 py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-xlight)' }}>
          <CheckCircle className="w-8 h-8" style={{ color: 'var(--brand)' }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Ticket Submitted!</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Thank you for your feedback. Our team will review your ticket and get back to you shortly.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setSubmitted(false)} className="btn-primary mt-2">
            Submit Another Ticket
          </button>
          <button onClick={() => { setSubmitted(false); setTab('my_tickets') }} className="btn-ghost mt-2">
            View My Tickets
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-0">
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Support Tickets</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Report issues, suggest features, or track your submitted tickets.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'var(--surface-3)' }}>
        <button
          onClick={() => setTab('submit')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: tab === 'submit' ? 'var(--surface)' : 'transparent',
            color: tab === 'submit' ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: tab === 'submit' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <Send className="w-3.5 h-3.5" /> Submit Ticket
        </button>
        <button
          onClick={() => setTab('my_tickets')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: tab === 'my_tickets' ? 'var(--surface)' : 'transparent',
            color: tab === 'my_tickets' ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: tab === 'my_tickets' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          My Tickets
          {openCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: 'var(--brand)' }}>
              {openCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Submit Ticket tab ── */}
      {tab === 'submit' && (
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
                    <c.icon className="w-4 h-4" style={{ color: active ? 'var(--brand)' : 'var(--text-muted)' }} />
                    <span className="text-xs font-semibold leading-tight"
                      style={{ color: active ? 'var(--brand)' : 'var(--text-primary)' }}>
                      {c.label}
                    </span>
                    <span className="text-[10px] leading-snug" style={{ color: 'var(--text-muted)' }}>{c.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: 'var(--text-primary)' }}>Subject</label>
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
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: 'var(--text-primary)' }}>Description</label>
            <textarea
              className="input w-full resize-none"
              rows={5}
              placeholder="Describe the issue, suggestion, or feedback in detail…"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Submitting as{' '}
              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                {profile?.full_name || 'Resident'}
              </span>
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
      )}

      {/* ── My Tickets tab ── */}
      {tab === 'my_tickets' && (
        <div>
          {tickets.length === 0 ? (
            <div className="card p-12 flex flex-col items-center gap-3 text-center">
              <ClipboardList className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>No tickets yet</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Submit a ticket to report an issue or share feedback.
              </p>
              <button onClick={() => setTab('submit')} className="btn-primary mt-1">
                Submit a Ticket
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {tickets.map(ticket => (
                <div key={ticket.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <StatusIcon status={ticket.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {ticket.subject}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <TypeBadge type={ticket.type} />
                        <StatusBadge status={ticket.status} />
                      </div>
                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                        {ticket.description}
                      </p>
                      <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
                        Submitted {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <p className="text-xs text-center pb-2" style={{ color: 'var(--text-muted)' }}>
                {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} total
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
