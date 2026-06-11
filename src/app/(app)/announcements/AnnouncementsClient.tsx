'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { Pin, Download, CheckCircle, Loader2, X, ImagePlus, ZoomIn } from 'lucide-react'
import type { Announcement, Profile } from '@/types'

const CATEGORIES = ['Utilities', 'Meeting', 'Security', 'Finance', 'General']

const catBadge: Record<string, string> = {
  Utilities: 'badge-blue',
  Meeting:   'badge-green',
  Security:  'badge-red',
  Finance:   'badge-yellow',
  General:   'badge-gray',
}

export default function AnnouncementsClient({
  announcements: initial,
  currentProfile,
  currentUserId,
}: {
  announcements: Announcement[]
  currentProfile: Profile | null
  currentUserId: string
}) {
  const supabase = createClient()
  const isAdminOrMod = currentProfile?.role === 'admin' || currentProfile?.role === 'moderator'

  // List state
  const [announcements, setAnnouncements] = useState(initial)

  // Compose state
  const [showModal, setShowModal]   = useState(false)
  const [title, setTitle]           = useState('')
  const [body, setBody]             = useState('')
  const [category, setCategory]     = useState('General')
  const [pinned, setPinned]         = useState(false)
  const [saving, setSaving]         = useState(false)

  // Photo state
  const [photo, setPhoto]           = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError('')
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) { setPhotoError('Only JPG, PNG, WEBP, or GIF allowed.'); return }
    if (file.size > 5 * 1024 * 1024) { setPhotoError('Image must be under 5MB.'); return }
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const removePhoto = () => {
    setPhoto(null)
    setPhotoPreview(null)
    setPhotoError('')
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  const resetModal = () => {
    setTitle(''); setBody(''); setCategory('General'); setPinned(false)
    removePhoto(); setShowModal(false)
  }

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) return
    setSaving(true)

    let image_url: string | null = null

    // Upload photo if selected
    if (photo) {
      const ext  = photo.name.split('.').pop()
      const path = `announcements/${currentUserId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('shai-uploads')
        .upload(path, photo, { upsert: true })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('shai-uploads').getPublicUrl(path)
        image_url = urlData.publicUrl
      }
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title: title.trim(),
        body: body.trim(),
        category,
        pinned,
        created_by: currentUserId,
        image_url,
      })
      .select('*, profiles(id, full_name, role)')
      .single()

    if (!error && data) {
      setAnnouncements(prev =>
        [data, ...prev].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
      )
      resetModal()
    }

    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Announcement Board</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Official HOA advisories — admin-posted only</p>
        </div>
        {isAdminOrMod && (
          <button onClick={() => setShowModal(true)} className="btn-primary">+ Post</button>
        )}
      </div>

      {/* ── Compose Modal ───────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={resetModal}
        >
          <div
            className="card w-full max-w-lg overflow-hidden flex flex-col"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <h2 className="font-bold text-gray-900 dark:text-gray-100">New Announcement</h2>
              <button onClick={resetModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Title *</label>
                <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Water Interruption Notice" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Category</label>
                <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Message *</label>
                <textarea
                  className="input resize-none"
                  style={{ minHeight: 100 }}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Write the official announcement…"
                />
              </div>

              {/* Photo upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Attachment Photo <span className="font-normal opacity-60">(optional, max 5MB)</span>
                </label>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                {!photoPreview ? (
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed text-sm transition-colors"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brand)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--brand)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
                  >
                    <ImagePlus className="w-4 h-4" /> Add Photo
                  </button>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                    <img src={photoPreview} alt="Preview" className="w-full object-cover max-h-56" />
                    <button
                      onClick={removePhoto}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.55)', color: 'white' }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {photoError && <p className="text-xs text-red-500 mt-1">{photoError}</p>}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox" checked={pinned}
                  onChange={e => setPinned(e.target.checked)}
                  className="w-4 h-4 accent-brand-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">📌 Pin this announcement</span>
              </label>
            </div>

            {/* Modal footer */}
            <div className="flex gap-2 justify-end px-6 py-4" style={{ borderTop: '1px solid var(--border-soft)' }}>
              <button onClick={resetModal} className="btn-ghost">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !title.trim() || !body.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Announcement list ───────────────────────────────────── */}
      <div className="space-y-4">
        {announcements.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">📢</p>
            <p className="text-gray-500">No announcements yet.</p>
          </div>
        )}

        {announcements.map(a => (
          <div
            key={a.id}
            className="card overflow-hidden"
            style={a.pinned ? { borderLeft: '3px solid var(--accent)' } : {}}
          >
            {/* Pinned banner */}
            {a.pinned && (
              <div
                className="flex items-center gap-2 px-5 py-2"
                style={{ background: 'var(--accent-light)', borderBottom: '1px solid #e8d47a' }}
              >
                <Pin className="w-3 h-3 flex-shrink-0" style={{ color: '#8a6b1a' }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8a6b1a' }}>
                  Pinned Announcement
                </span>
              </div>
            )}

            <div className="p-5">
              <div className="flex items-center gap-2 flex-wrap mb-2.5">
                <span className={`badge ${catBadge[a.category] || 'badge-gray'}`}>{a.category}</span>
              </div>

              <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-1.5">{a.title}</h2>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                🛡️ HOA Admin · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{a.body}</p>

              {/* Attached photo */}
              {(a as Announcement & { image_url?: string | null }).image_url && (
                <div
                  className="mt-4 overflow-hidden border cursor-zoom-in relative group rounded-xl"
                  style={{ borderColor: 'var(--border-soft)' }}
                  onClick={() => setLightboxUrl((a as Announcement & { image_url?: string | null }).image_url!)}
                >
                  <img
                    src={(a as Announcement & { image_url?: string | null }).image_url!}
                    alt="Announcement photo"
                    className="w-full object-cover max-h-72"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-soft)' }}>
                <button
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7'; e.currentTarget.style.color = '#166534' }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-muted)' }}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Acknowledge
                </button>
                {(a as Announcement & { image_url?: string | null }).image_url && (
                  <a
                    href={(a as Announcement & { image_url?: string | null }).image_url!}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--surface-3)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '' }}
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
