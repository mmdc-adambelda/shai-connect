'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Search, ChevronDown, ArrowRight, BarChart3,
  Clock, CheckCircle, Loader2, XCircle, User,
  AlertCircle, Filter, RefreshCw, Inbox, UserCheck,
  Shield, Wrench, Droplets, Lightbulb, Building2,
  Receipt, AlertTriangle, HelpCircle, MoreHorizontal,
} from 'lucide-react'
import type { Profile, SupportTicket, TicketStatus } from '@/types'
import { formatDistanceToNow, format, differenceInHours } from 'date-fns'

// ── Shared constants ─────────────────────────────────────────

const STATUS_META: Record<string, { label: string; bg: string; color: string; border: string }> = {
  open:                 { label: 'Open',             bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  assigned:             { label: 'Assigned',          bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  in_progress:          { label: 'In Progress',       bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  waiting_for_resident: { label: 'Awaiting Reply',    bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  resolved:             { label: 'Resolved',          bg: '#DCFCE7', color: '#166534', border: '#86EFAC' },
  closed:               { label: 'Closed',            bg: 'var(--surface-3)', color: 'var(--text-muted)', border: 'var(--border)' },
}
const PRIORITY_META: Record<string, { label: string; color: string; dot: string; order: number }> = {
  urgent: { label: 'Urgent', color: '#DC2626', dot: '#EF4444', order: 0 },
  high:   { label: 'High',   color: '#D97706', dot: '#F59E0B', order: 1 },
  medium: { label: 'Medium', color: '#2563EB', dot: '#3B82F6', order: 2 },
  low:    { label: 'Low',    color: '#6B7280', dot: '#9CA3AF', order: 3 },
}
const CATEGORY_META: Record<string, { label: string; icon: React.ElementType }> = {
  security_concern:    { label: 'Security Concern',    icon: Shield },
  maintenance_request: { label: 'Maintenance Request', icon: Wrench },
  water_service:       { label: 'Water Service',       icon: Droplets },
  streetlight_concern: { label: 'Streetlight Concern', icon: Lightbulb },
  facility_reservation:{ label: 'Facility Reservation',icon: Building2 },
  financial_inquiry:   { label: 'Financial Inquiry',   icon: Receipt },
  community_complaint: { label: 'Community Complaint', icon: AlertTriangle },
  general_inquiry:     { label: 'General Inquiry',     icon: HelpCircle },
  other:               { label: 'Other',               icon: MoreHorizontal },
}

function roleLabel(role: string) {
  if (role === 'superadmin') return 'Super Admin'
  if (role === 'admin')      return 'Admin'
  if (role === 'moderator')  return 'Moderator'
  return 'Resident'
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || STATUS_META.open
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}>
      {m.label}
    </span>
  )
}

function PriorityDot({ priority }: { priority: string }) {
  const p = PRIORITY_META[priority] || PRIORITY_META.medium
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap"
      style={{ color: p.color }}>
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.dot }} />
      {p.label}
    </span>
  )
}

// ── Ticket Row ────────────────────────────────────────────────

function TicketRow({
  ticket,
  agents,
  currentUserId,
  onStatusChange,
  onAssign,
}: {
  ticket: SupportTicket
  agents: { id: string; full_name: string; role: string }[]
  currentUserId: string
  onStatusChange: (id: string, status: TicketStatus) => void
  onAssign: (id: string, agentId: string) => void
}) {
  const sub = ticket.submitter as unknown as { full_name: string; unit: string } | null
  const catMeta = CATEGORY_META[ticket.category] || CATEGORY_META.other
  const CatIcon = catMeta.icon

  return (
    <tr className="border-b transition-colors hover:bg-[var(--surface-2)]"
      style={{ borderColor: 'var(--border-soft)' }}>
      {/* Ticket # */}
      <td className="px-4 py-3 whitespace-nowrap">
        <Link href={`/tickets/${ticket.id}`}
          className="font-mono text-xs font-bold hover:underline" style={{ color: 'var(--brand)' }}>
          {ticket.ticket_number}
        </Link>
      </td>

      {/* Subject + category */}
      <td className="px-4 py-3 max-w-[240px]">
        <Link href={`/tickets/${ticket.id}`} className="group">
          <p className="text-sm font-semibold leading-snug truncate group-hover:underline"
            style={{ color: 'var(--text-primary)', textDecorationColor: 'var(--brand)' }}>
            {ticket.subject}
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            <CatIcon className="w-3 h-3 flex-shrink-0" />
            {catMeta.label}
          </span>
        </Link>
      </td>

      {/* Priority */}
      <td className="px-4 py-3 whitespace-nowrap">
        <PriorityDot priority={ticket.priority} />
      </td>

      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        <StatusBadge status={ticket.status} />
      </td>

      {/* Submitted by */}
      <td className="px-4 py-3 whitespace-nowrap">
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {sub?.full_name || '—'}
        </p>
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{sub?.unit}</p>
      </td>

      {/* Assignee */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="relative">
          <select
            value={ticket.assigned_to || ''}
            onChange={e => onAssign(ticket.id, e.target.value)}
            className="text-xs pr-5 py-1 pl-2 rounded-lg border appearance-none w-full max-w-[130px]"
            style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
            <option value="">Unassigned</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.full_name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
            style={{ color: 'var(--text-muted)' }} />
        </div>
      </td>

      {/* Date */}
      <td className="px-4 py-3 whitespace-nowrap">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
        </p>
      </td>

      {/* View */}
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <Link href={`/tickets/${ticket.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all"
          style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}>
          View <ArrowRight className="w-3 h-3" />
        </Link>
      </td>
    </tr>
  )
}

// ── Ticket Table ─────────────────────────────────────────────

function TicketTable({
  tickets,
  agents,
  currentUserId,
  onStatusChange,
  onAssign,
  emptyMessage = 'No tickets found.',
}: {
  tickets: SupportTicket[]
  agents: { id: string; full_name: string; role: string }[]
  currentUserId: string
  onStatusChange: (id: string, status: TicketStatus) => void
  onAssign: (id: string, agentId: string) => void
  emptyMessage?: string
}) {
  if (tickets.length === 0) {
    return (
      <div className="card p-12 flex flex-col items-center gap-3 text-center">
        <Inbox className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{emptyMessage}</p>
      </div>
    )
  }
  return (
    <div className="card overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[780px]">
        <thead>
          <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
            {['Ticket #', 'Subject', 'Priority', 'Status', 'Submitted By', 'Assigned To', 'Opened', ''].map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              agents={agents}
              currentUserId={currentUserId}
              onStatusChange={onStatusChange}
              onAssign={onAssign}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────

export default function SupportClient({
  tickets: initialTickets,
  agents,
  currentProfile,
  currentUserId,
}: {
  tickets: SupportTicket[]
  agents: { id: string; full_name: string; role: string }[]
  currentProfile: Profile
  currentUserId: string
}) {
  const supabase = createClient()
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets)
  const [tab, setTab] = useState<'overview' | 'all' | 'queue' | 'resolved' | 'analytics'>('overview')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  // ── Stats ──────────────────────────────────────────────────
  const stats = useMemo(() => ({
    open:       tickets.filter(t => t.status === 'open').length,
    assigned:   tickets.filter(t => t.status === 'assigned').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    waiting:    tickets.filter(t => t.status === 'waiting_for_resident').length,
    resolved:   tickets.filter(t => t.status === 'resolved').length,
    closed:     tickets.filter(t => t.status === 'closed').length,
    total:      tickets.length,
    unresolved: tickets.filter(t => !['resolved','closed'].includes(t.status)).length,
  }), [tickets])

  // ── Filtered lists ─────────────────────────────────────────
  const applyFilters = (list: SupportTicket[]) => {
    const q = search.toLowerCase()
    return list.filter(t => {
      const matchSearch = !q ||
        t.ticket_number.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.submitter as unknown as { full_name: string } | null)?.full_name?.toLowerCase().includes(q) ||
        t.category.replace(/_/g, ' ').includes(q)
      const matchStatus   = statusFilter === 'all' || t.status === statusFilter
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter
      const matchCategory = categoryFilter === 'all' || t.category === categoryFilter
      return matchSearch && matchStatus && matchPriority && matchCategory
    })
  }

  const allFiltered      = applyFilters(tickets)
  const myQueue          = applyFilters(tickets.filter(t => t.assigned_to === currentUserId && !['resolved','closed'].includes(t.status)))
  const resolvedTickets  = applyFilters(tickets.filter(t => ['resolved','closed'].includes(t.status)))

  // ── Mutations ──────────────────────────────────────────────
  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    const updates: Partial<SupportTicket> = { status: newStatus }
    if (newStatus === 'resolved') updates.resolved_at = new Date().toISOString()
    if (newStatus === 'closed')   updates.closed_at   = new Date().toISOString()
    await supabase.from('support_tickets').update(updates).eq('id', ticketId)
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates } : t))
  }

  const handleAssign = async (ticketId: string, agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    const ticket = tickets.find(t => t.id === ticketId)
    const updates: Partial<SupportTicket> = {
      assigned_to: agentId || null,
      assigned_at: agentId ? new Date().toISOString() : null,
      status: agentId && ticket?.status === 'open' ? 'assigned' : ticket?.status,
    }
    await supabase.from('support_tickets').update(updates).eq('id', ticketId)
    setTickets(prev => prev.map(t => t.id === ticketId
      ? { ...t, ...updates, assignee: agent ? { id: agent.id, full_name: agent.full_name, role: agent.role } : undefined }
      : t
    ))
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    const { data } = await supabase
      .from('support_tickets')
      .select(`
        *,
        submitter:profiles!support_tickets_user_id_fkey(id, full_name, unit, role),
        assignee:profiles!support_tickets_assigned_to_fkey(id, full_name, role)
      `)
      .order('created_at', { ascending: false })
    if (data) setTickets(data as SupportTicket[])
    setRefreshing(false)
  }

  // ── Analytics ──────────────────────────────────────────────
  const analytics = useMemo(() => {
    const byCat: Record<string, number> = {}
    const byPri: Record<string, number> = {}
    let totalHours = 0
    let resolvedCount = 0

    tickets.forEach(t => {
      byCat[t.category] = (byCat[t.category] || 0) + 1
      byPri[t.priority] = (byPri[t.priority] || 0) + 1
      if (t.resolved_at) {
        totalHours += differenceInHours(new Date(t.resolved_at), new Date(t.created_at))
        resolvedCount++
      }
    })

    const maxCat = Math.max(...Object.values(byCat), 1)
    const maxPri = Math.max(...Object.values(byPri), 1)
    const avgHours = resolvedCount > 0 ? Math.round(totalHours / resolvedCount) : null
    const resolutionRate = stats.total > 0
      ? Math.round(((stats.resolved + stats.closed) / stats.total) * 100)
      : 0

    return { byCat, byPri, maxCat, maxPri, avgHours, resolutionRate }
  }, [tickets, stats])

  const TABS = [
    { id: 'overview',  label: 'Overview',   icon: BarChart3  },
    { id: 'all',       label: `All (${stats.unresolved})`, icon: Inbox },
    { id: 'queue',     label: `My Queue (${myQueue.length})`, icon: UserCheck },
    { id: 'resolved',  label: 'Resolved',   icon: CheckCircle },
    { id: 'analytics', label: 'Analytics',  icon: BarChart3  },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Service Desk
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Welcome, {currentProfile.full_name} · {roleLabel(currentProfile.role)}
          </p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="btn-ghost flex items-center gap-2 text-sm flex-shrink-0">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 mb-5 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap flex-shrink-0"
            style={{
              background: tab === t.id ? 'var(--brand)'       : 'transparent',
              color:      tab === t.id ? 'white'              : 'var(--text-muted)',
            }}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="flex flex-col gap-5">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Open',          value: stats.open,       color: '#B45309', bg: '#FFFBEB' },
              { label: 'Assigned',      value: stats.assigned,   color: '#1D4ED8', bg: '#EFF6FF' },
              { label: 'In Progress',   value: stats.inProgress, color: '#7C3AED', bg: '#F5F3FF' },
              { label: 'Awaiting',      value: stats.waiting,    color: '#C2410C', bg: '#FFF7ED' },
              { label: 'Resolved',      value: stats.resolved,   color: '#166534', bg: '#DCFCE7' },
              { label: 'Closed',        value: stats.closed,     color: 'var(--text-muted)', bg: 'var(--surface-3)' },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] font-semibold mt-1 uppercase tracking-wide"
                  style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Recent open tickets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                Recent Unresolved Tickets
              </h2>
              <button onClick={() => setTab('all')}
                className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>
                View all →
              </button>
            </div>
            <TicketTable
              tickets={tickets
                .filter(t => !['resolved','closed'].includes(t.status))
                .slice(0, 10)}
              agents={agents}
              currentUserId={currentUserId}
              onStatusChange={handleStatusChange}
              onAssign={handleAssign}
              emptyMessage="No open tickets. All clear!"
            />
          </div>
        </div>
      )}

      {/* ── ALL TICKETS / MY QUEUE / RESOLVED — shared filter bar ── */}
      {['all', 'queue', 'resolved'].includes(tab) && (
        <div className="flex flex-col gap-4">
          {/* Filter bar */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input className="input pl-9 text-sm" placeholder="Search by ticket #, subject, resident…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="relative">
              <select className="input pr-7 text-sm appearance-none" value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)} style={{ minWidth: 130 }}>
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: 'var(--text-muted)' }} />
            </div>

            <div className="relative">
              <select className="input pr-7 text-sm appearance-none" value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)} style={{ minWidth: 120 }}>
                <option value="all">All Priorities</option>
                {Object.entries(PRIORITY_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: 'var(--text-muted)' }} />
            </div>

            <div className="relative">
              <select className="input pr-7 text-sm appearance-none" value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)} style={{ minWidth: 150 }}>
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: 'var(--text-muted)' }} />
            </div>

            <span className="text-xs self-center" style={{ color: 'var(--text-muted)' }}>
              {tab === 'all' ? allFiltered.length :
               tab === 'queue' ? myQueue.length : resolvedTickets.length} ticket{(
                (tab === 'all' ? allFiltered : tab === 'queue' ? myQueue : resolvedTickets).length !== 1
              ) ? 's' : ''}
            </span>
          </div>

          {/* Table */}
          <TicketTable
            tickets={tab === 'all' ? allFiltered : tab === 'queue' ? myQueue : resolvedTickets}
            agents={agents}
            currentUserId={currentUserId}
            onStatusChange={handleStatusChange}
            onAssign={handleAssign}
            emptyMessage={
              tab === 'queue'    ? "No tickets assigned to you." :
              tab === 'resolved' ? "No resolved tickets yet."    : "No tickets match your filters."
            }
          />
        </div>
      )}

      {/* ── ANALYTICS ── */}
      {tab === 'analytics' && (
        <div className="flex flex-col gap-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Tickets',     value: stats.total,                                       color: 'var(--text-primary)' },
              { label: 'Resolution Rate',   value: `${analytics.resolutionRate}%`,                   color: '#166534' },
              { label: 'Avg Resolution',    value: analytics.avgHours != null ? `${analytics.avgHours}h` : 'N/A', color: '#7C3AED' },
              { label: 'Unresolved',        value: stats.unresolved,                                 color: '#B45309' },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] font-semibold mt-1 uppercase tracking-wide"
                  style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By category */}
            <div className="card p-5">
              <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
                Tickets by Category
              </h3>
              <div className="flex flex-col gap-3">
                {Object.entries(analytics.byCat)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, count]) => {
                    const meta = CATEGORY_META[cat] || CATEGORY_META.other
                    const Icon = meta.icon
                    const pct  = Math.round((count / analytics.maxCat) * 100)
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-1.5 text-xs font-medium"
                            style={{ color: 'var(--text-secondary)' }}>
                            <Icon className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                            {meta.label}
                          </span>
                          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: 'var(--brand)' }} />
                        </div>
                      </div>
                    )
                  })}
                {Object.keys(analytics.byCat).length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No data yet</p>
                )}
              </div>
            </div>

            {/* By priority */}
            <div className="card p-5">
              <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
                Tickets by Priority
              </h3>
              <div className="flex flex-col gap-3">
                {['urgent','high','medium','low'].map(pri => {
                  const count = analytics.byPri[pri] || 0
                  const meta  = PRIORITY_META[pri]
                  const pct   = Math.round((count / analytics.maxPri) * 100)
                  return (
                    <div key={pri}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1.5 text-xs font-medium"
                          style={{ color: 'var(--text-secondary)' }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: meta.dot }} />
                          {meta.label}
                        </span>
                        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: meta.dot }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Status breakdown table */}
          <div className="card p-5">
            <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Status Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(STATUS_META).map(([key, meta]) => {
                const count = tickets.filter(t => t.status === key).length
                const pct   = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                return (
                  <div key={key} className="flex flex-col items-center gap-1.5 p-3 rounded-xl"
                    style={{ background: meta.bg }}>
                    <p className="text-xl font-bold" style={{ color: meta.color }}>{count}</p>
                    <p className="text-[10px] font-semibold text-center" style={{ color: meta.color }}>
                      {meta.label}
                    </p>
                    <p className="text-[10px]" style={{ color: meta.color, opacity: 0.7 }}>{pct}%</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Agent workload */}
          <div className="card p-5">
            <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Agent Workload</h3>
            <div className="flex flex-col gap-2">
              {agents.map(agent => {
                const assigned = tickets.filter(t =>
                  t.assigned_to === agent.id && !['resolved','closed'].includes(t.status)
                ).length
                const resolved = tickets.filter(t =>
                  t.assigned_to === agent.id && ['resolved','closed'].includes(t.status)
                ).length
                return (
                  <div key={agent.id} className="flex items-center gap-3 py-2 border-b last:border-0"
                    style={{ borderColor: 'var(--border-soft)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                      style={{ background: 'var(--brand)' }}>
                      {agent.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{agent.full_name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{roleLabel(agent.role)}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-semibold" style={{ color: '#B45309' }}>{assigned} open</span>
                      <span className="font-semibold" style={{ color: '#166534' }}>{resolved} resolved</span>
                    </div>
                  </div>
                )
              })}
              {agents.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No agents yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
