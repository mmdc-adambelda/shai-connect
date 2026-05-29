'use client'

import { useState, useEffect } from 'react'
import { FileText, Upload, Trash2, Edit3, Eye, FilePlus, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

/* ─── Types ──────────────────────────────────────────── */
interface BoardResolution {
  id: string
  resolution_number: string
  title: string
  description: string
  pdf_url: string | null
  approval_date: string
  uploaded_by: string
  created_at: string
  published: boolean
  profiles?: { full_name: string }
}

/* ─── Role helpers ───────────────────────────────────── */
const canUpload   = (r?: string) => ['superadmin', 'admin'].includes(r ?? '')
const canDelete   = (r?: string) => r === 'superadmin'
const canEditMeta = (r?: string) => r === 'superadmin'

/* ─── Upload modal (placeholder UI) ─────────────────── */
function UploadModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="card w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base font-display" style={{ color: 'var(--text-primary)' }}>
            Upload Board Resolution
          </h3>
          <button className="btn-icon w-8 h-8" onClick={onClose}>✕</button>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          PDF upload functionality will be available once the storage bucket is configured in Supabase.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={onClose}>Save</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────── */
export default function BoardResolutionsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [resolutions, setResolutions] = useState<BoardResolution[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(prof)
      }
      // Attempt to fetch resolutions (table may not exist yet)
      try {
        const { data } = await supabase
          .from('board_resolutions')
          .select('*, profiles(full_name)')
          .eq('published', true)
          .order('approval_date', { ascending: false })
        setResolutions(data || [])
      } catch {
        setResolutions([])
      }
      setLoading(false)
    }
    load()
  }, [])

  const role = profile?.role

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--brand)' }}
          >
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
              Board Resolutions
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Official resolutions approved by the Board of Trustees
            </p>
          </div>
        </div>
        {canUpload(role) && (
          <button
            className="btn-primary flex items-center gap-2 self-start sm:self-auto"
            onClick={() => setShowUpload(true)}
          >
            <Upload className="w-4 h-4" />
            Upload Resolution
          </button>
        )}
      </div>

      {/* ── Role badge ── */}
      {role && canUpload(role) && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium"
          style={{ background: 'var(--brand-xlight)', border: '1px solid var(--brand-light)', color: 'var(--brand)' }}
        >
          <ShieldIcon role={role} />
          {role === 'superadmin'
            ? 'Super Admin — You can upload, edit, delete, and publish resolutions.'
            : 'Admin — You can upload, replace, and publish resolutions.'}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <LoadingSkeleton />
      ) : resolutions.length === 0 ? (
        <EmptyState onUpload={canUpload(role) ? () => setShowUpload(true) : undefined} />
      ) : (
        <div className="space-y-3">
          {resolutions.map(res => (
            <ResolutionCard
              key={res.id}
              resolution={res}
              canDelete={canDelete(role)}
              canEdit={canEditMeta(role)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────── */

function ShieldIcon({ role }: { role: string }) {
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
      style={{ background: 'var(--brand)' }}
    >
      {role.toUpperCase()}
    </span>
  )
}

function EmptyState({ onUpload }: { onUpload?: () => void }) {
  return (
    <div
      className="card flex flex-col items-center justify-center py-20 px-6 text-center"
      style={{ minHeight: '380px' }}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'var(--brand-xlight)', border: '2px dashed var(--brand-light)' }}
      >
        <FilePlus className="w-9 h-9" style={{ color: 'var(--brand)' }} />
      </div>
      <h2 className="text-lg font-bold font-display mb-2" style={{ color: 'var(--text-primary)' }}>
        Board Resolutions
      </h2>
      <p className="text-sm max-w-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
        This section is currently being updated. Official Board Resolutions will be published here soon.
      </p>
      <div
        className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl"
        style={{ background: 'var(--brand-xlight)', color: 'var(--brand)' }}
      >
        <Clock className="w-3.5 h-3.5" />
        Coming soon
      </div>
      {onUpload && (
        <button className="btn-primary mt-4 flex items-center gap-2" onClick={onUpload}>
          <Upload className="w-4 h-4" />
          Upload First Resolution
        </button>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="h-4 rounded" style={{ background: 'var(--surface-3)', width: '40%' }} />
          <div className="h-3 rounded mt-3" style={{ background: 'var(--surface-3)', width: '70%' }} />
          <div className="h-3 rounded mt-2" style={{ background: 'var(--surface-3)', width: '55%' }} />
        </div>
      ))}
    </div>
  )
}

function ResolutionCard({
  resolution,
  canDelete,
  canEdit,
}: {
  resolution: BoardResolution
  canDelete: boolean
  canEdit: boolean
}) {
  return (
    <div className="card p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: 'var(--brand)' }}
            >
              {resolution.resolution_number}
            </span>
            {resolution.published && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--brand-xlight)', color: 'var(--brand)' }}
              >
                Published
              </span>
            )}
          </div>
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            {resolution.title}
          </h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Approved: {new Date(resolution.approval_date).toLocaleDateString('en-PH', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
          {resolution.description && (
            <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {resolution.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {resolution.pdf_url && (
            <a
              href={resolution.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-2"
            >
              <Eye className="w-3.5 h-3.5" />
              View PDF
            </a>
          )}
          {canEdit && (
            <button className="btn-icon w-8 h-8" title="Edit metadata">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          {canDelete && (
            <button
              className="btn-icon w-8 h-8"
              title="Delete"
              style={{ color: '#ef4444', borderColor: '#fecaca' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
