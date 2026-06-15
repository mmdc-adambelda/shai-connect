'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft, Send, Lock, Unlock, ChevronDown, AlertCircle,
  CheckCircle, Clock, Loader2, XCircle, User, Shield, Wrench,
  Droplets, Lightbulb, Building2, Receipt, AlertTriangle,
  HelpCircle, MoreHorizontal, RotateCcw, Tag, Calendar,
  UserCheck, Activity, MessageSquare,
} from 'lucide-react'
import type { Profile, SupportTicket, TicketComment, TicketActivity, TicketStatus } from '@/types'
import { formatDistanceToNow, format } from 'date-fns'

// ── Shared meta ──────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; bg: string; color: string; border: string }> = {
  open:                 { label: 'Open',               bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  assigned:             { label: 'Assigned',            bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  in_progress:          { label: 'In Progress',         bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  waiting_for_resident: { label: 'Awaiting Reply',      bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  resolved:             { label: 'Resolved',            bg: '#DCFCE7', color: '#166534', border: '#86EFAC' },
  closed:               { label: 'Closed',              bg: 'var(--surface-3)', color: 'var(--text-muted)', border: 'var(--border)' },
}
const PRIORITY_META: Record<string, { label: string; color: string; dot: string }> = {
  low:    { label: 'Low',    color: '#6B7280', dot: '#9CA3AF' },
  medium: { label: 'Medium', color: '#2563EB', dot: '#3B82F6' },
  high:   { label: 'High',   color: '#D97706', dot: '#F59E0B' },
  urgent: { label: 'Urgent', color: '#DC2626', dot: '#EF4444' },
}
const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  security_concern:    { label: 'Security Concern',    icon: Shield,         color: '#DC2626' },
  maintenance_request: { label: 'Maintenance Request', icon: Wrench,         color: '#D97706' },
  water_service:       { label: 'Water Service',       icon: Droplets,       color: '#2563EB' },
  streetlight_concern: { label: 'Streetlight Concern', icon: Lightbulb,      color: '#7C3AED' },
  facility_reservation:{ label: 'Facility Reservation',icon: Building2,      color: '#0891B2' },
  financial_inquiry:   { label: 'Financial Inquiry',   icon: Receipt,        color: '#16A34A' },
  community_complaint: { label: 'Community Complaint', icon: AlertTriangle,  color: '#EA580C' },
  general_inquiry:     { label: 'General Inquiry',     icon: HelpCircle,     color: 'var(--brand)' },
  other:               { label: 'Other',               icon: MoreHorizontal, color: 'var(--text-muted)' },
}
const ALL_STATUSES: TicketStatus[] = ['open','assigned','in_progress','waiting_for_resident','resolved','closed']
const PRIORITY_ORDER = ['low','medium','high','urgent']

function roleLabel(role: string) {
  if (role === 'superadmin') return 'Super Admin'
  if (role === 'admin')      return 'Admin'
  if (role === 'moderator')  return 'Moderator'
  return 'Resident'
}

function InitialsAvatar({ name, role, size = 36 }: { name: string; role?: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const isAgent = role && ['moderator','admin','superadmin'].includes(role)
  return (
    <div className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{
        width: size, height: size, fontSize: size * 0.33,
        background: isAgent ? 'var(--brand)' : 'var(--surface-3)',
        color:      isAgent ? 'white' : 'var(--text-secondary)',
        border:     isAgent ? '2px solid var(--brand-mid)' : '2px solid var(--border)',
      }}>
      {initials}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || STATUS_META.open
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}>
      {m.label}
    </span>
  )
}

function ActivityItem({ item }: { item: TicketActivity }) {
  const actor = (item.profiles as unknown as { full_name: string; role: string } | null)
  const actorName = actor?.full_name || 'System'

  let text = ''
  if (item.action === 'created')         text = 'submitted this ticket'
  else if (item.action === 'status')     text = `changed status to "${STATUS_META[item.new_value || '']?.label || item.new_value}"`
  else if (item.action === 'priority')   text = `changed priority to "${item.new_value}"`
  else if (item.action === 'assigned')   text = `assigned this ticket to ${item.new_value}`
  else if (item.action === 'unassigned') text = 'removed the assignee'
  else                                   text = item.action

  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--surface-3)' }}>
        <Activity className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
      </div>
      <p className="text-xs flex-1" style={{ color: 'var(--text-muted)' }}>
        <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{actorName}</span> {text}
        <span className="ml-1.5">· {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export default function TicketDetailClient({
  ticket: initialTicket,
  currentProfile,
  currentUserId,
  isAgent,
  initialComments,
  initialActivity,
  agents,
}: {
  ticket: SupportTicket & {
    submitter?: { id: string; full_name: string; unit: string; role: string; avatar_url?: string | null } | null
    assignee?: { id: string; full_name: string; role: string } | null
  }
  currentProfile: Profile | null
  currentUserId: string
  isAgent: boolean
  initialComments: TicketComment[]
  initialActivity: TicketActivity[]
  agents: { id: string; full_name: string; role: string }[]
}) {
  const supabase = createClient()
  const [ticket, setTicket] = useState(initialTicket)
  const [comments, setComments] = useState<TicketComment[]>(initialComments)
  const [activity, setActivity] = useState<TicketActivity[]>(initialActivity)
  const [replyText, setReplyText] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingPriority, setUpdatingPriority] = useState(false)
  const [updatingAssignee, setUpdatingAssignee] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  // Real-time comments subscription
  useEffect(() => {
    const channel = supabase
      .channel(`ticket-comments:${ticket.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'ticket_comments',
        filter: `ticket_id=eq.${ticket.id}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('ticket_comments')
          .select('*, profiles(id, full_name, role, avatar_url)')
          .eq('id', payload.new.id)
          .single()
        if (!data) return
        // residents: skip internal notes (RLS should handle this but double-check client-side)
        if (!isAgent && (data as TicketComment).is_internal) return
        setComments(prev => prev.find(c => c.id === data.id) ? prev : [...prev, data as TicketComment])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [ticket.id, isAgent]) // eslint-disable-line react-hooks/exhaustive-deps

  const logActivity = async (action: string, old_value: string | null, new_value: string | null) => {
    const { data } = await supabase
      .from('ticket_activity')
      .insert({ ticket_id: ticket.id, user_id: currentUserId, action, old_value, new_value })
      .select('*, profiles(id, full_name, role)')
      .single()
    if (data) setActivity(prev => [...prev, data as TicketActivity])
  }

  const handleSendReply = async () => {
    if (!replyText.trim()) return
    setSending(true)
    const { data, error } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id:   ticket.id,
        user_id:     currentUserId,
        content:     replyText.trim(),
        is_internal: isAgent && isInternal,
      })
      .select('*, profiles(id, full_name, role, avatar_url)')
      .single()
    setSending(false)
    if (!error && data) {
      setComments(prev => [...prev, data as TicketComment])
      setReplyText('')
      if (textareaRef.current) { textareaRef.current.style.height = 'auto' }

      // If resident replies and ticket is waiting, auto-move to in_progress
      if (!isAgent && ticket.status === 'waiting_for_resident') {
        await handleStatusChange('in_progress')
      }
    }
  }

  const handleStatusChange = async (newStatus: TicketStatus) => {
    setUpdatingStatus(true)
    const updates: Partial<SupportTicket> = { status: newStatus }
    if (newStatus === 'resolved') updates.resolved_at = new Date().toISOString()
    if (newStatus === 'closed')   updates.closed_at   = new Date().toISOString()
    await supabase.from('support_tickets').update(updates).eq('id', ticket.id)
    await logActivity('status', ticket.status, newStatus)
    setTicket(prev => ({ ...prev, ...updates }))
    setUpdatingStatus(false)
  }

  const handlePriorityChange = async (newPriority: string) => {
    setUpdatingPriority(true)
    await supabase.from('support_tickets').update({ priority: newPriority }).eq('id', ticket.id)
    await logActivity('priority', ticket.priority, newPriority)
    setTicket(prev => ({ ...prev, priority: newPriority as SupportTicket['priority'] }))
    setUpdatingPriority(false)
  }

  const handleAssigneeChange = async (agentId: string) => {
    setUpdatingAssignee(true)
    const agent = agents.find(a => a.id === agentId)
    const updates: Partial<SupportTicket> = {
      assigned_to: agentId || null,
      assigned_at: agentId ? new Date().toISOString() : null,
      status: agentId && ticket.status === 'open' ? 'assigned' : ticket.status,
    }
    await supabase.from('support_tickets').update(updates).eq('id', ticket.id)
    await logActivity('assigned', ticket.assignee?.full_name || null, agent?.full_name || null)
    setTicket(prev => ({
      ...prev, ...updates,
      assignee: agent ? { id: agent.id, full_name: agent.full_name, role: agent.role } : null,
    }))
    setUpdatingAssignee(false)
  }

  // Merge comments and activity into a unified timeline
  const timeline: Array<{ type: 'comment'; data: TicketComment } | { type: 'activity'; data: TicketActivity }> =
    [
      ...comments.map(c  => ({ type: 'comment'  as const, data: c })),
      ...activity.map(a  => ({ type: 'activity' as const, data: a })),
    ].sort((a, b) => new Date(a.data.created_at).getTime() - new Date(b.data.created_at).getTime())

  const catMeta = CATEGORY_META[ticket.category] || CATEGORY_META.other
  const CatIcon = catMeta.icon
  const priMeta = PRIORITY_META[ticket.priority] || PRIORITY_META.medium
  const statusMeta = STATUS_META[ticket.status] || STATUS_META.open
  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed'

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <Link href={isAgent ? '/support' : '/tickets'}
          className="btn-icon w-8 h-8" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {isAgent ? 'Service Desk' : 'My Tickets'} /
          <span className="font-mono font-bold ml-1" style={{ color: 'var(--brand)' }}>
            {ticket.ticket_number}
          </span>
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start">

        {/* ── LEFT: Conversation ─────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Ticket header card */}
          <div className="card p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${catMeta.color}15` }}>
                <CatIcon className="w-5 h-5" style={{ color: catMeta.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold font-mono" style={{ color: 'var(--brand)' }}>
                    {ticket.ticket_number}
                  </span>
                  <StatusBadge status={ticket.status} />
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${priMeta.dot}20`, color: priMeta.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: priMeta.dot }} />
                    {priMeta.label}
                  </span>
                </div>
                <h1 className="text-base font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                  {ticket.subject}
                </h1>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {catMeta.label} · Submitted {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            {/* Original description */}
            <div className="mt-4 p-3.5 rounded-xl" style={{ background: 'var(--surface-2)' }}>
              <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Description
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                {ticket.description}
              </p>
              {ticket.contact_info && (
                <p className="text-xs mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                  Contact: {ticket.contact_info}
                </p>
              )}
            </div>
          </div>

          {/* Conversation thread */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <MessageSquare className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Conversation</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                {comments.length}
              </span>
            </div>

            <div className="px-5 py-4 flex flex-col gap-0 min-h-[80px]">
              {timeline.length === 0 && (
                <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
                  No messages yet. Start the conversation below.
                </p>
              )}

              {timeline.map((item, i) => {
                if (item.type === 'activity') {
                  return <ActivityItem key={`act-${item.data.id}`} item={item.data} />
                }

                const comment = item.data
                const author = comment.profiles as unknown as { id: string; full_name: string; role: string; avatar_url?: string | null } | null
                const authorName = author?.full_name || 'Unknown'
                const authorRole = author?.role || 'resident'
                const isOwn = comment.user_id === currentUserId
                const isAgentComment = ['moderator','admin','superadmin'].includes(authorRole)

                return (
                  <div key={`cmt-${comment.id}`}
                    className={`flex gap-3 py-3 ${i > 0 ? 'border-t' : ''}`}
                    style={{ borderColor: 'var(--border-soft)' }}>
                    <InitialsAvatar name={authorName} role={authorRole} size={32} />
                    <div className="flex-1 min-w-0">
                      {/* Author row */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {authorName}
                        </span>
                        {isAgentComment && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: 'var(--brand-xlight)', color: 'var(--brand)' }}>
                            {roleLabel(authorRole)}
                          </span>
                        )}
                        {comment.is_internal && isAgent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: '#FEF9C3', color: '#854D0E', border: '1px solid #FDE68A' }}>
                            <Lock className="w-2.5 h-2.5" /> Internal Note
                          </span>
                        )}
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      {/* Bubble */}
                      <div className="px-3.5 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
                        style={{
                          background: comment.is_internal
                            ? '#FFFBEB'
                            : isOwn
                              ? 'var(--brand-xlight)'
                              : 'var(--surface-2)',
                          color: comment.is_internal ? '#92400E' : 'var(--text-secondary)',
                          border: comment.is_internal ? '1px solid #FDE68A' : undefined,
                        }}>
                        {comment.content}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            {!isResolved ? (
              <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--border-soft)' }}>
                <div className="pt-4 flex flex-col gap-2">
                  {/* Internal note toggle (agents only) */}
                  {isAgent && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setIsInternal(!isInternal)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all"
                        style={{
                          background: isInternal ? '#FEF9C3' : 'var(--surface-2)',
                          color:      isInternal ? '#854D0E'  : 'var(--text-muted)',
                          border:     `1px solid ${isInternal ? '#FDE68A' : 'var(--border-soft)'}`,
                        }}>
                        {isInternal ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        {isInternal ? 'Internal Note' : 'Public Reply'}
                      </button>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {isInternal ? 'Visible to agents only' : 'Visible to resident'}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    <textarea
                      ref={textareaRef}
                      className="input flex-1 resize-none text-sm"
                      rows={2}
                      style={{
                        background: isInternal ? '#FFFBEB' : undefined,
                        borderColor: isInternal ? '#FDE68A' : undefined,
                      }}
                      placeholder={isInternal
                        ? 'Add an internal note (only agents can see this)…'
                        : 'Write a reply…'
                      }
                      value={replyText}
                      onChange={e => {
                        setReplyText(e.target.value)
                        const el = textareaRef.current
                        if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px' }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && replyText.trim()) {
                          e.preventDefault(); handleSendReply()
                        }
                      }}
                    />
                    <button onClick={handleSendReply}
                      disabled={!replyText.trim() || sending}
                      className="btn-primary flex-shrink-0 flex items-center gap-1.5 text-sm py-2.5 disabled:opacity-50"
                      style={isInternal ? { background: '#D97706' } : {}}>
                      {sending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Send className="w-4 h-4" />
                      }
                      <span className="hidden sm:inline">{sending ? 'Sending…' : 'Send'}</span>
                    </button>
                  </div>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    Ctrl+Enter to send quickly
                  </p>
                </div>
              </div>
            ) : (
              <div className="px-5 pb-5 pt-4 flex items-center gap-2 text-sm"
                style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-soft)' }}>
                <CheckCircle className="w-4 h-4" style={{ color: 'var(--brand)' }} />
                This ticket is {ticket.status}.
                {isAgent && (
                  <button onClick={() => handleStatusChange('open')}
                    className="ml-1 font-semibold text-xs underline" style={{ color: 'var(--brand)' }}>
                    Reopen
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Sidebar ─────────────────────────────────── */}
        <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-3">

          {/* Status card */}
          <div className="card p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5"
              style={{ color: 'var(--text-muted)' }}>Status</p>
            {isAgent ? (
              <div className="relative">
                <select
                  value={ticket.status}
                  onChange={e => handleStatusChange(e.target.value as TicketStatus)}
                  disabled={updatingStatus}
                  className="w-full text-sm font-semibold pr-7 py-1.5 pl-2.5 rounded-lg border appearance-none"
                  style={{
                    background: statusMeta.bg,
                    color:      statusMeta.color,
                    borderColor: statusMeta.border,
                  }}
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ color: statusMeta.color }} />
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: statusMeta.bg, color: statusMeta.color, border: `1px solid ${statusMeta.border}` }}>
                {statusMeta.label}
              </span>
            )}
          </div>

          {/* Priority card */}
          <div className="card p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5"
              style={{ color: 'var(--text-muted)' }}>Priority</p>
            {isAgent ? (
              <div className="relative">
                <select
                  value={ticket.priority}
                  onChange={e => handlePriorityChange(e.target.value)}
                  disabled={updatingPriority}
                  className="w-full text-sm font-semibold pr-7 py-1.5 pl-2.5 rounded-lg border appearance-none"
                  style={{ background: 'var(--surface-2)', color: priMeta.color, borderColor: 'var(--border)' }}
                >
                  {PRIORITY_ORDER.map(p => (
                    <option key={p} value={p}>{PRIORITY_META[p]?.label || p}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }} />
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: priMeta.color }}>
                <span className="w-2 h-2 rounded-full" style={{ background: priMeta.dot }} />
                {priMeta.label}
              </span>
            )}
          </div>

          {/* Assignee card */}
          <div className="card p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5"
              style={{ color: 'var(--text-muted)' }}>Assigned To</p>
            {isAgent ? (
              <div className="relative">
                <select
                  value={ticket.assigned_to || ''}
                  onChange={e => handleAssigneeChange(e.target.value)}
                  disabled={updatingAssignee}
                  className="w-full text-sm pr-7 py-1.5 pl-2.5 rounded-lg border appearance-none"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                >
                  <option value="">Unassigned</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.full_name} ({roleLabel(a.role)})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }} />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {ticket.assignee ? (
                  <>
                    <InitialsAvatar name={ticket.assignee.full_name} role={ticket.assignee.role} size={28} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {ticket.assignee.full_name}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {roleLabel(ticket.assignee.role)}
                      </p>
                    </div>
                  </>
                ) : (
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Pending Assignment</span>
                )}
              </div>
            )}
          </div>

          {/* Ticket details card */}
          <div className="card p-4 flex flex-col gap-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Details
            </p>
            <Row icon={Tag} label="Category" value={catMeta.label} />
            <Row icon={Calendar} label="Submitted" value={format(new Date(ticket.created_at), 'MMM d, yyyy')} />
            {ticket.assigned_at && (
              <Row icon={UserCheck} label="Assigned" value={format(new Date(ticket.assigned_at), 'MMM d, yyyy')} />
            )}
            {ticket.resolved_at && (
              <Row icon={CheckCircle} label="Resolved" value={format(new Date(ticket.resolved_at), 'MMM d, yyyy')} />
            )}
            {ticket.submitter && (
              <Row icon={User} label="Resident" value={`${ticket.submitter.full_name} · ${ticket.submitter.unit}`} />
            )}
            {ticket.contact_info && (
              <Row icon={HelpCircle} label="Contact" value={ticket.contact_info} />
            )}
          </div>

          {/* Agent quick actions */}
          {isAgent && !isResolved && (
            <div className="card p-4 flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
                Quick Actions
              </p>
              <button onClick={() => handleStatusChange('in_progress')}
                disabled={ticket.status === 'in_progress' || updatingStatus}
                className="w-full text-sm py-2 px-3 rounded-lg font-semibold text-left transition-all disabled:opacity-40"
                style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>
                Mark In Progress
              </button>
              <button onClick={() => handleStatusChange('waiting_for_resident')}
                disabled={ticket.status === 'waiting_for_resident' || updatingStatus}
                className="w-full text-sm py-2 px-3 rounded-lg font-semibold text-left transition-all disabled:opacity-40"
                style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>
                Waiting for Resident
              </button>
              <button onClick={() => handleStatusChange('resolved')}
                disabled={updatingStatus}
                className="w-full text-sm py-2 px-3 rounded-lg font-semibold text-left transition-all"
                style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' }}>
                Mark Resolved
              </button>
            </div>
          )}

          {/* Reopen for agents */}
          {isAgent && isResolved && (
            <button onClick={() => handleStatusChange('open')}
              className="card p-3 w-full flex items-center gap-2 text-sm font-semibold transition-all hover:shadow-md"
              style={{ color: 'var(--text-secondary)' }}>
              <RotateCcw className="w-4 h-4" /> Reopen Ticket
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{value}</p>
      </div>
    </div>
  )
}
