'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Shield, Wrench, Droplets, Lightbulb, Building2, Receipt,
  AlertTriangle, HelpCircle, MoreHorizontal, Send, X, ChevronDown,
  ClipboardList, CheckCircle, Clock, Loader2, XCircle, ArrowRight,
  TicketCheck, AlertCircle, User, Phone,
} from 'lucide-react'
import type { Profile, SupportTicket, TicketPriority } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import ImportantContactsPanel from './ImportantContactsPanel'

// ── Constants ────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'security_concern',    label: 'Security Concern',    icon: Shield,        color: '#DC2626' },
  { id: 'maintenance_request', label: 'Maintenance Request', icon: Wrench,        color: '#D97706' },
  { id: 'water_service',       label: 'Water Service',       icon: Droplets,      color: '#2563EB' },
  { id: 'streetlight_concern', label: 'Streetlight Concern', icon: Lightbulb,     color: '#7C3AED' },
  { id: 'facility_reservation',label: 'Facility Reservation',icon: Building2,     color: '#0891B2' },
  { id: 'financial_inquiry',   label: 'Financial Inquiry',   icon: Receipt,       color: '#16A34A' },
  { id: 'community_complaint', label: 'Community Complaint', icon: AlertTriangle, color: '#EA580C' },
  { id: 'general_inquiry',     label: 'General Inquiry',     icon: HelpCircle,    color: 'var(--brand)' },
  { id: 'other',               label: 'Other',               icon: MoreHorizontal,color: 'var(--text-muted)' },
]

const PRIORITIES: { id: TicketPriority; label: string; color: string; bg: string; dot: string }[] = [
  { id: 'low',    label: 'Low',    color: '#6B7280', bg: 'var(--surface-3)', dot: '#9CA3AF' },
  { id: 'medium', label: 'Medium', color: '#2563EB', bg: '#EFF6FF',          dot: '#3B82F6' },
  { id: 'high',   label: 'High',   color: '#D97706', bg: '#FFFBEB',          dot: '#F59E0B' },
  { id: 'urgent', label: 'Urgent', color: '#DC2626', bg: '#FEF2F2',          dot: '#EF4444' },
]

const STATUS_META: Record<string, { label: string; bg: string; color: string; border: string }> = {
  open:                  { label: 'Open',                  bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  assigned:              { label: 'Assigned',              bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  in_progress:           { label: 'In Progress',           bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  waiting_for_resident:  { label: 'Awaiting Your Reply',   bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  resolved:              { label: 'Resolved',              bg: '#DCFCE7', color: '#166534', border: '#86EFAC' },
  closed:                { label: 'Closed',                bg: 'var(--surface-3)', color: 'var(--text-muted)', border: 'var(--border)' },
}

// ── Helpers ──────────────────────────────────────────────────

function statusIcon(status: string) {
  if (status === 'open')       return <Clock className="w-3.5 h-3.5" />
  if (status === 'assigned')   return <User className="w-3.5 h-3.5" />
  if (status === 'in_progress')return <Loader2 className="w-3.5 h-3.5" />
  if (status === 'waiting_for_resident') return <AlertCircle className="w-3.5 h-3.5" />
  if (status === 'resolved')   return <CheckCircle className="w-3.5 h-3.5" />
  return <XCircle className="w-3.5 h-3.5" />
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || STATUS_META.open
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}>
      {statusIcon(status)}
      {m.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = PRIORITIES.find(x => x.id === priority) || PRIORITIES[1]
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: p.bg, color: p.color, border: `1px solid ${p.dot}40` }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.dot }} />
      {p.label}
    </span>
  )
}

function CategoryLabel({ category }: { category: string }) {
  const c = CATEGORIES.find(x => x.id === category)
  if (!c) return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{category}</span>
  const Icon = c.icon
  return (
    <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
      <Icon className="w-3 h-3 flex-shrink-0" style={{ color: c.color }} />
      {c.label}
    </span>
  )
}

// ── New Ticket Modal ─────────────────────────────────────────

function NewTicketModal({
  profile,
  onClose,
  onCreated,
}: {
  profile: Profile | null
  onClose: () => void
  onCreated: (ticket: SupportTicket) => void
}) {
  const supabase = createClient()
  const [category, setCategory] = useState('general_inquiry')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<SupportTicket | null>(null)

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      setError('Subject and description are required.')
      return
    }
    setSubmitting(true)
    setError('')
    const { data, error: err } = await supabase
      .from('support_tickets')
      .insert({
        user_id:      profile?.id,
        category,
        priority,
        subject:      subject.trim(),
        description:  description.trim(),
        contact_info: contactInfo.trim() || null,
      })
      .select('*')
      .single()
    setSubmitting(false)
    if (err || !data) {
      setError('Failed to submit ticket. Please try again.')
    } else {
      setSuccess(data as SupportTicket)
      onCreated(data as SupportTicket)
    }
  }

  if (success) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-panel p-8 text-center" onClick={e => e.stopPropagation()}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--brand-xlight)' }}>
            <TicketCheck className="w-8 h-8" style={{ color: 'var(--brand)' }} />
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Ticket Successfully Created
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            Our team will review your concern and respond shortly.
          </p>
          <div className="card p-4 mb-5 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>TICKET NUMBER</span>
              <span className="font-bold text-sm font-mono" style={{ color: 'var(--brand)' }}>
                {success.ticket_number}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>STATUS</span>
              <StatusBadge status="open" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>ASSIGNED TO</span>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Pending Assignment</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href={`/tickets/${success.id}`}
              className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm py-2.5">
              View Ticket <ArrowRight className="w-4 h-4" />
            </Link>
            <button onClick={onClose} className="flex-1 btn-ghost text-sm py-2.5">
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Submit a Ticket</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Submitting as <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{profile?.full_name}</span>
              {profile?.unit && <span> · {profile.unit}</span>}
            </p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Category *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(c => {
                const Icon = c.icon
                const active = category === c.id
                return (
                  <button key={c.id} onClick={() => setCategory(c.id)}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 text-center transition-all"
                    style={{
                      borderColor: active ? c.color : 'var(--border-soft)',
                      background:  active ? `${c.color}12` : 'var(--surface-2)',
                    }}>
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: active ? c.color : 'var(--text-muted)' }} />
                    <span className="text-[10px] font-semibold leading-tight"
                      style={{ color: active ? c.color : 'var(--text-secondary)' }}>
                      {c.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Priority *
            </label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button key={p.id} onClick={() => setPriority(p.id)}
                  className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: priority === p.id ? p.dot : 'var(--border-soft)',
                    background:  priority === p.id ? p.bg : 'var(--surface-2)',
                  }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: p.dot }} />
                  <span className="text-[11px] font-semibold" style={{ color: priority === p.id ? p.color : 'var(--text-muted)' }}>
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Subject *
            </label>
            <input className="input" placeholder="Brief summary of your concern"
              value={subject} onChange={e => setSubject(e.target.value)} maxLength={120} />
            <p className="text-[10px] mt-1 text-right" style={{ color: 'var(--text-muted)' }}>
              {subject.length}/120
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Description *
            </label>
            <textarea className="input resize-none" rows={4}
              placeholder="Describe your concern in detail. Include location, date, and any other relevant information."
              value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          {/* Contact Info */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Contact Number <span className="font-normal normal-case" style={{ color: 'var(--text-muted)' }}>(optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input className="input pl-9" placeholder="+63 9XX XXX XXXX"
                value={contactInfo} onChange={e => setContactInfo(e.target.value)} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm p-3 rounded-xl"
              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} className="btn-ghost flex-shrink-0">Cancel</button>
          <button onClick={handleSubmit} disabled={!subject.trim() || !description.trim() || submitting}
            className="btn-primary flex-1 flex items-center justify-center gap-2">
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              : <><Send className="w-4 h-4" /> Submit Ticket</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────

export default function TicketClient({
  profile,
  myTickets: initialTickets,
}: {
  profile: Profile | null
  myTickets: SupportTicket[]
}) {
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets)
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [view, setView] = useState<'tickets' | 'contacts'>('tickets')

  const stats = {
    open:       tickets.filter(t => t.status === 'open' || t.status === 'assigned').length,
    inProgress: tickets.filter(t => t.status === 'in_progress' || t.status === 'waiting_for_resident').length,
    resolved:   tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
  }

  const filtered = tickets.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      t.ticket_number.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.category.replace(/_/g, ' ').includes(q)
    return matchStatus && matchSearch
  })

  const handleCreated = (ticket: SupportTicket) => {
    setTickets(prev => [ticket, ...prev])
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            My Support Tickets
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Track your concerns and communicate with the HOA team
          </p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex-shrink-0 flex items-center gap-2 text-sm">
          <Send className="w-3.5 h-3.5" /> New Ticket
        </button>
      </div>

      {/* Tabs: file a ticket vs. important contacts */}
      <div
        className="flex gap-1 mb-5 p-1 rounded-lg w-fit"
        style={{ background: 'var(--surface-2)' }}
      >
        {([
          { key: 'tickets',  label: 'File a Ticket',      icon: ClipboardList },
          { key: 'contacts', label: 'Important Contacts', icon: Phone         },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5"
            style={{
              background: view === key ? 'var(--surface)' : 'transparent',
              color:      view === key ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow:  view === key ? 'var(--shadow-xs)' : 'none',
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {view === 'contacts' && <ImportantContactsPanel />}

      {view === 'tickets' && (
        <>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Open',        value: stats.open,       color: '#B45309', bg: '#FFFBEB' },
          { label: 'In Progress', value: stats.inProgress, color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'Resolved',    value: stats.resolved,   color: '#166534', bg: '#DCFCE7' },
        ].map(s => (
          <div key={s.label} className="card p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + status filter */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-9 text-sm" placeholder="Search by ticket number, subject…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <select className="input pr-8 text-sm appearance-none" value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)} style={{ minWidth: 140 }}>
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_for_resident">Awaiting Reply</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3 text-center">
          <TicketCheck className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {tickets.length === 0 ? 'No tickets yet' : 'No tickets match your search'}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {tickets.length === 0
              ? 'Submit a ticket to report a concern or request a service.'
              : 'Try adjusting your search or status filter.'}
          </p>
          {tickets.length === 0 && (
            <button onClick={() => setShowNew(true)} className="btn-primary mt-1 text-sm">
              Submit Your First Ticket
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(ticket => {
            const catMeta = CATEGORIES.find(c => c.id === ticket.category)
            const CatIcon = catMeta?.icon || HelpCircle
            const needsReply = ticket.status === 'waiting_for_resident'
            return (
              <Link key={ticket.id} href={`/tickets/${ticket.id}`}
                className="card p-4 flex items-start gap-4 hover:shadow-md transition-all group"
                style={{ borderLeft: needsReply ? '3px solid #EA580C' : undefined }}>
                {/* Category icon */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: catMeta ? `${catMeta.color}15` : 'var(--surface-3)' }}>
                  <CatIcon className="w-4 h-4" style={{ color: catMeta?.color || 'var(--text-muted)' }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                    <span className="text-[11px] font-bold font-mono" style={{ color: 'var(--brand)' }}>
                      {ticket.ticket_number}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>·</span>
                    <CategoryLabel category={ticket.category} />
                  </div>
                  <p className="text-sm font-semibold leading-snug mb-1.5 group-hover:underline"
                    style={{ color: 'var(--text-primary)', textDecorationColor: 'var(--brand)' }}>
                    {ticket.subject}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                    {needsReply && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full animate-pulse"
                        style={{ background: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA' }}>
                        Reply needed
                      </span>
                    )}
                  </div>
                </div>

                {/* Date + arrow */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                  </p>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                    style={{ color: 'var(--text-muted)' }} />
                </div>
              </Link>
            )
          })}
          <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
            {statusFilter !== 'all' || search ? ` (filtered from ${tickets.length} total)` : ''}
          </p>
        </div>
      )}
        </>
      )}

      {/* New Ticket Modal */}
      {showNew && (
        <NewTicketModal
          profile={profile}
          onClose={() => setShowNew(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
