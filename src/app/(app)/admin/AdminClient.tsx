'use client'

import { useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Users, FileText, Megaphone, MessageSquare, ShieldAlert,
  CheckCircle, XCircle, Edit2, Save, X, Search,
  ShieldCheck, ShieldOff, KeyRound, Hash,
  Trash2, Upload, Wallet, RefreshCw,
} from 'lucide-react'
import type { Profile } from '@/types'
import clsx from 'clsx'
import ResidentsClient from '../residents/ResidentsClient'

const PHASES = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4']

const MOCK_FLAGS = [
  { id: '1', user: 'unknown_user_42',  content: 'Spam post in Phase 2 chat',             reason: 'Spam',          time: '2h ago' },
  { id: '2', user: 'resident_anon',    content: 'Offensive comment on announcement',      reason: 'Conduct',       time: '5h ago' },
  { id: '3', user: 'new_account_7',   content: 'Unverified claim about HOA funds',       reason: 'Misinformation', time: '1d ago' },
]

const reasonBadge: Record<string, string> = {
  Spam: 'badge-yellow',
  Conduct: 'badge-red',
  Misinformation: 'badge-red',
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function roleBadgeClass(role: string) {
  if (role === 'superadmin') return 'badge-red'
  if (role === 'admin')      return 'badge-red'
  if (role === 'moderator')  return 'badge-blue'
  return 'badge-green'
}

// ── Inline Edit Modal ─────────────────────────────────────────────
function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: Profile
  onClose: () => void
  onSaved: (updated: Profile) => void
}) {
  const supabase = createClient()
  const [fullName, setFullName]     = useState(user.full_name)
  const [projectCode, setProjectCode] = useState(user.project_code ?? '')
  const [blockNo, setBlockNo]       = useState(String(user.block_no ?? ''))
  const [lotNo, setLotNo]           = useState(String(user.lot_no ?? ''))
  const [phase, setPhase]           = useState(user.phase)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  const handleSave = async () => {
    setError('')
    if (!fullName.trim())                       { setError('Full name is required.'); return }
    if (!/^SHPY\d{6}$/.test(projectCode))       { setError('SHPY code must be SHPY followed by 6 digits.'); return }
    if (!blockNo || parseInt(blockNo) <= 0)     { setError('Block must be a positive number.'); return }
    if (!lotNo   || parseInt(lotNo)   <= 0)     { setError('Lot must be a positive number.'); return }

    setSaving(true)
    const unit = `Block ${blockNo}, Lot ${lotNo}`
    const { error: dbErr } = await supabase
      .from('profiles')
      .update({
        full_name:    fullName.trim(),
        project_code: projectCode.trim().toUpperCase(),
        block_no:     parseInt(blockNo),
        lot_no:       parseInt(lotNo),
        unit,
        phase,
      })
      .eq('id', user.id)

    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }

    onSaved({
      ...user,
      full_name:    fullName.trim(),
      project_code: projectCode.trim().toUpperCase(),
      block_no:     parseInt(blockNo),
      lot_no:       parseInt(lotNo),
      unit,
      phase,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-6"
        style={{ boxShadow: 'var(--shadow-xl)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Edit Resident</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Changes saved immediately to the database</p>
          </div>
          <button onClick={onClose} className="btn-icon w-7 h-7"><X className="w-4 h-4" /></button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
            {error}
          </div>
        )}

        <div className="space-y-3">
          {/* Full name */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Full Name *</label>
            <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Juan dela Cruz" />
          </div>

          {/* SHPY code */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <KeyRound className="w-3 h-3" /> SHPY Project Code *
            </label>
            <input
              className="input font-mono tracking-widest"
              value={projectCode}
              onChange={e => setProjectCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
              placeholder="SHPY916228"
              maxLength={10}
            />
          </div>

          {/* Block & Lot */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Hash className="w-3 h-3" /> Block No. *
              </label>
              <input
                className="input" type="number" min="1" step="1"
                value={blockNo}
                onChange={e => setBlockNo(e.target.value.replace(/\D/g, ''))}
                placeholder="3"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Hash className="w-3 h-3" /> Lot No. *
              </label>
              <input
                className="input" type="number" min="1" step="1"
                value={lotNo}
                onChange={e => setLotNo(e.target.value.replace(/\D/g, ''))}
                placeholder="12"
              />
            </div>
          </div>

          {/* Phase */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Phase</label>
            <select className="input" value={phase} onChange={e => setPhase(e.target.value)}>
              {PHASES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-1.5 py-2 text-sm">
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button onClick={onClose} className="btn-ghost py-2 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Main AdminClient ──────────────────────────────────────────────
// ── CSV parser (handles quoted fields) ────────────────────────────
function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/)
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
  return { headers, rows }
}

export default function AdminClient({
  users: initialUsers,
  currentProfile,
  stats,
  residents,
  initialFollowing,
}: {
  users: Profile[]
  currentProfile: Profile
  stats: { totalUsers: number; totalPosts: number; totalAnnouncements: number; totalMessages: number }
  residents: Profile[]
  initialFollowing: Set<string>
}) {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'overview' | 'residents' | 'directory' | 'flags' | 'dues'>(
    (searchParams.get('tab') as 'directory') === 'directory' ? 'directory' : 'overview'
  )
  const [users, setUsers] = useState<Profile[]>(initialUsers)
  const [userSearch, setUserSearch] = useState('')
  const [verifyFilter, setVerifyFilter] = useState<'all' | 'pending' | 'verified'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [resolvedFlags, setResolvedFlags] = useState<Set<string>>(new Set())

  // Dues CSV upload state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([])
  const [codeCol, setCodeCol] = useState('')
  const [balanceCol, setBalanceCol] = useState('')
  const [csvUploading, setCsvUploading] = useState(false)
  const [csvResult, setCsvResult] = useState<{ updated: number; notFound: number } | null>(null)
  const [csvError, setCsvError] = useState('')
  const csvInputRef = useRef<HTMLInputElement>(null)

  // ── Verify / Unverify ──────────────────────────────────────────
  const handleVerify = async (userId: string, verify: boolean) => {
    setActionLoading(userId)
    await supabase.from('profiles').update({ is_verified: verify }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: verify } : u))
    setActionLoading(null)
  }

  // ── Delete resident ────────────────────────────────────────────
  const handleDelete = async (userId: string) => {
    setActionLoading(userId)
    await supabase.from('profiles').delete().eq('id', userId)
    setUsers(prev => prev.filter(u => u.id !== userId))
    setConfirmDeleteId(null)
    setActionLoading(null)
  }

  // ── After edit saved ───────────────────────────────────────────
  const handleUserSaved = (updated: Profile) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
  }

  // ── CSV parse on file select ───────────────────────────────────
  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvError(''); setCsvResult(null)
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const { headers, rows } = parseCSV(ev.target?.result as string)
        setCsvHeaders(headers)
        setCsvRows(rows)
        setCodeCol(headers.find(h => /project|code|shpy/i.test(h)) ?? headers[0] ?? '')
        setBalanceCol(headers.find(h => /balance|due|amount/i.test(h)) ?? headers[1] ?? '')
      } catch {
        setCsvError('Could not parse CSV. Make sure it is a valid comma-separated file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── Apply CSV to all matched profiles ──────────────────────────
  const handleApplyDues = async () => {
    if (!codeCol || !balanceCol || csvRows.length === 0) return
    setCsvUploading(true); setCsvError(''); setCsvResult(null)
    let updated = 0; let notFound = 0
    for (const row of csvRows) {
      const code = row[codeCol]?.trim()
      const raw  = row[balanceCol]?.replace(/[^0-9.-]/g, '')
      const amount = parseFloat(raw)
      if (!code || isNaN(amount)) { notFound++; continue }
      const { error } = await supabase
        .from('profiles')
        .update({ hoa_balance: amount })
        .eq('project_code', code)
      error ? notFound++ : updated++
    }
    setCsvUploading(false)
    setCsvResult({ updated, notFound })
    setCsvHeaders([]); setCsvRows([])
  }

  // ── Filtering ──────────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.project_code ?? '').toLowerCase().includes(userSearch.toLowerCase()) ||
      u.unit.toLowerCase().includes(userSearch.toLowerCase())
    const matchesVerify =
      verifyFilter === 'all' ? true :
      verifyFilter === 'pending' ? !u.is_verified :
      u.is_verified
    return matchesSearch && matchesVerify
  })

  const pendingCount = users.filter(u => !u.is_verified).length

  const statCards = [
    { label: 'Total Residents',  value: stats.totalUsers,         icon: Users,        color: '#1b6b45' },
    { label: 'Total Posts',       value: stats.totalPosts,         icon: FileText,     color: '#2563eb' },
    { label: 'Announcements',     value: stats.totalAnnouncements, icon: Megaphone,    color: '#d97706' },
    { label: 'Chat Messages',     value: stats.totalMessages,      icon: MessageSquare,color: '#7c3aed' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Admin Panel</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Community governance and moderation tools</p>
        </div>
        <span className="badge badge-red flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" /> Admin Only
        </span>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-lg w-fit"
        style={{ background: 'var(--surface-2)' }}
      >
        {([
          { key: 'overview',  label: 'Overview'  },
          { key: 'residents', label: 'Residents' },
          { key: 'directory', label: 'Directory' },
          { key: 'flags',     label: 'Flagged'   },
          { key: 'dues',      label: 'Dues'       },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5"
            style={{
              background: tab === key ? 'var(--surface)' : 'transparent',
              color:      tab === key ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow:  tab === key ? 'var(--shadow-xs)' : 'none',
            }}
          >
            {label}
            {key === 'flags' && (
              <span className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#ef4444' }}>
                {MOCK_FLAGS.length - resolvedFlags.size}
              </span>
            )}
            {key === 'residents' && pendingCount > 0 && (
              <span className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#d97706' }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  </div>
                  <Icon className="w-5 h-5 mt-0.5" style={{ color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Pending verification alert */}
          {pendingCount > 0 && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl mb-6 cursor-pointer"
              style={{ background: '#fef6e4', border: '1px solid #fcd34d' }}
              onClick={() => { setTab('residents'); setVerifyFilter('pending') }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#fcd34d' }}>
                <ShieldAlert className="w-4 h-4" style={{ color: '#92400e' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: '#92400e' }}>
                  {pendingCount} resident{pendingCount > 1 ? 's' : ''} pending verification
                </p>
                <p className="text-xs" style={{ color: '#b45309' }}>Click to review and approve</p>
              </div>
            </div>
          )}

          <div className="card p-5">
            <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Phase Breakdown</h3>
            {['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4'].map(phase => {
              const count = users.filter(u => u.phase === phase && u.is_verified).length
              const pct = stats.totalUsers > 0 ? Math.round((count / stats.totalUsers) * 100) : 0
              return (
                <div key={phase} className="mb-3">
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    <span>{phase}</span>
                    <span className="font-semibold">{count} verified residents ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--brand)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── RESIDENTS ── */}
      {tab === 'residents' && (
        <div className="card overflow-hidden">
          {/* Toolbar */}
          <div
            className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center"
            style={{ borderBottom: '1px solid var(--border-soft)' }}
          >
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <input
                className="input pl-9 w-full"
                placeholder="Search by name, SHPY code, or unit…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
            </div>
            {/* Filter pills */}
            <div className="flex gap-1.5 flex-shrink-0">
              {([
                { key: 'all',     label: 'All' },
                { key: 'pending', label: `Pending (${pendingCount})` },
                { key: 'verified',label: 'Verified' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setVerifyFilter(key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: verifyFilter === key ? 'var(--brand)' : 'var(--surface-2)',
                    color:      verifyFilter === key ? 'white' : 'var(--text-muted)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
              {filteredUsers.length} shown
            </span>
          </div>

          {/* Table — scrollable on mobile */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr style={{ background: 'var(--surface-2)' }}>
                  {['Resident', 'SHPY Code', 'Block / Lot', 'Phase', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr
                    key={user.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border-soft)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    {/* Resident */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                          style={{ background: 'var(--brand)' }}
                        >
                          {initials(user.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.full_name}</p>
                          <span className={clsx('badge text-[10px]', roleBadgeClass(user.role))}>{user.role}</span>
                        </div>
                      </div>
                    </td>

                    {/* SHPY */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold tracking-widest" style={{ color: 'var(--text-primary)' }}>
                        {user.project_code || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </span>
                    </td>

                    {/* Block / Lot */}
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {user.block_no && user.lot_no
                        ? `Blk ${user.block_no}, Lot ${user.lot_no}`
                        : user.unit || '—'}
                    </td>

                    {/* Phase */}
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{user.phase}</td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {user.is_verified ? (
                        <span className="badge badge-green flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
                          style={{ background: '#fef6e4', color: '#b45309', border: '1px solid #fcd34d' }}>
                          <XCircle className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {user.id !== currentProfile.id ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Verify / Unverify */}
                          {!user.is_verified ? (
                            <button
                              onClick={() => handleVerify(user.id, true)}
                              disabled={actionLoading === user.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                              style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {actionLoading === user.id ? '…' : 'Verify'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleVerify(user.id, false)}
                              disabled={actionLoading === user.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                              style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}
                            >
                              <ShieldOff className="w-3.5 h-3.5" />
                              {actionLoading === user.id ? '…' : 'Un-verify'}
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => setEditingUser(user)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-soft)' }}
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>

                          {/* Delete / confirm */}
                          {confirmDeleteId === user.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(user.id)}
                                disabled={actionLoading === user.id}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                                style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}
                              >
                                {actionLoading === user.id ? '…' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border-soft)' }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(user.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                              style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>You</span>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                      No residents match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DIRECTORY ── */}
      {tab === 'directory' && (
        <ResidentsClient
          residents={residents}
          currentUserId={currentProfile.id}
          initialFollowing={initialFollowing}
        />
      )}

      {/* ── FLAGS ── */}
      {tab === 'flags' && (
        <div className="card overflow-hidden">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Flagged Content</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Review and moderate reported posts and users</p>
          </div>
          <div>
            {MOCK_FLAGS.map(flag => {
              const resolved = resolvedFlags.has(flag.id)
              return (
                <div key={flag.id}
                  className={clsx('p-4 flex items-start gap-4 transition-colors', resolved && 'opacity-50')}
                  style={{ borderBottom: '1px solid var(--border-soft)' }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{flag.user}</span>
                      <span className={`badge ${reasonBadge[flag.reason] || 'badge-gray'}`}>{flag.reason}</span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{flag.content}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{flag.time}</p>
                  </div>
                  {resolved ? (
                    <div className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--brand)' }}>
                      <CheckCircle className="w-4 h-4" /> Resolved
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setResolvedFlags(p => new Set(p).add(flag.id))} className="btn-primary py-1.5 text-xs">Remove</button>
                      <button onClick={() => setResolvedFlags(p => new Set(p).add(flag.id))} className="btn-ghost py-1.5 text-xs">Dismiss</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── DUES ── */}
      {tab === 'dues' && (
        <div className="max-w-2xl flex flex-col gap-5">

          {/* Header */}
          <div className="card p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-xlight)' }}>
                <Wallet className="w-5 h-5" style={{ color: 'var(--brand)' }} />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Upload Monthly Due Balances</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Upload a CSV exported from your ledger app. Map the <strong>Project Code</strong> and <strong>Balance</strong> columns — the system will update all matched residents automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Upload zone */}
          {csvHeaders.length === 0 && !csvResult && (
            <div
              className="card p-8 flex flex-col items-center gap-3 text-center cursor-pointer transition-colors"
              style={{ border: '2px dashed var(--border-soft)' }}
              onClick={() => csvInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file) {
                  const fakeEvent = { target: { files: [file], value: '' } } as unknown as React.ChangeEvent<HTMLInputElement>
                  handleCSVFile(fakeEvent)
                }
              }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                <Upload className="w-5 h-5" style={{ color: 'var(--brand)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Click or drag &amp; drop your CSV</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Must have a header row. Comma-separated (.csv)</p>
              </div>
              <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCSVFile} />
            </div>
          )}

          {csvError && (
            <div className="p-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
              {csvError}
            </div>
          )}

          {/* Column mapping + preview */}
          {csvHeaders.length > 0 && (
            <div className="card p-5 flex flex-col gap-5">
              <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Map Columns &nbsp;<span className="font-normal text-xs" style={{ color: 'var(--text-muted)' }}>({csvRows.length} rows detected)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Project Code column
                  </label>
                  <select className="input w-full" value={codeCol} onChange={e => setCodeCol(e.target.value)}>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Balance / Amount column
                  </label>
                  <select className="input w-full" value={balanceCol} onChange={e => setBalanceCol(e.target.value)}>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              {/* Preview table */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Preview (first 5 rows)</p>
                <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-soft)' }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'var(--surface-2)' }}>
                        <th className="px-3 py-2 text-left font-bold" style={{ color: 'var(--text-muted)' }}>Project Code</th>
                        <th className="px-3 py-2 text-left font-bold" style={{ color: 'var(--text-muted)' }}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.slice(0, 5).map((row, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--border-soft)' }}>
                          <td className="px-3 py-2 font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{row[codeCol] || '—'}</td>
                          <td className="px-3 py-2" style={{ color: 'var(--text-primary)' }}>{row[balanceCol] || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleApplyDues}
                  disabled={csvUploading || !codeCol || !balanceCol}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {csvUploading
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating…</>
                    : <><Upload className="w-3.5 h-3.5" /> Apply to All Residents</>
                  }
                </button>
                <button
                  onClick={() => { setCsvHeaders([]); setCsvRows([]); setCsvError('') }}
                  className="btn-ghost text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Result */}
          {csvResult && (
            <div className="card p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" style={{ color: 'var(--brand)' }} />
                <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Upload Complete</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-4" style={{ background: 'var(--brand-xlight)' }}>
                  <p className="text-2xl font-bold" style={{ color: 'var(--brand)' }}>{csvResult.updated}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--brand)' }}>Residents updated</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: '#fef6e4' }}>
                  <p className="text-2xl font-bold" style={{ color: '#b45309' }}>{csvResult.notFound}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#b45309' }}>Not matched / skipped</p>
                </div>
              </div>
              <button
                onClick={() => setCsvResult(null)}
                className="btn-ghost text-sm self-start"
              >
                Upload Another CSV
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={handleUserSaved}
        />
      )}
    </div>
  )
}
