'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { Pin, Download, CheckCircle, Loader2, X } from 'lucide-react'
import type { Announcement, Profile } from '@/types'

const CATEGORIES = ['Utilities', 'Meeting', 'Security', 'Finance', 'General']

const catBadge: Record<string, string> = {
  Utilities: 'badge-blue',
  Meeting: 'badge-green',
  Security: 'badge-red',
  Finance: 'badge-yellow',
  General: 'badge-gray',
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
  const [announcements, setAnnouncements] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('General')
  const [pinned, setPinned] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const isAdminOrMod = currentProfile?.role === 'admin' || currentProfile?.role === 'moderator'

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('announcements')
      .insert({ title: title.trim(), body: body.trim(), category, pinned, created_by: currentUserId })
      .select('*, profiles(id, full_name, role)')
      .single()
    if (!error && data) {
      setAnnouncements(prev => [data, ...prev].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)))
      setShowModal(false)
      setTitle(''); setBody(''); setPinned(false); setCategory('General')
    }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Announcement Board</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Official HOA advisories — admin-posted only</p>
        </div>
        {isAdminOrMod && (
          <button onClick={() => setShowModal(true)} className="btn-primary">+ Post</button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="card p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 dark:text-gray-100">New Announcement</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Title</label>
                <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Water Interruption Notice" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Category</label>
                <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Message</label>
                <textarea className="input min-h-[100px] resize-none" value={body} onChange={e => setBody(e.target.value)} placeholder="Write the official announcement..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="w-4 h-4 accent-brand-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">📌 Pin this announcement</span>
              </label>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
              <button onClick={handleSave} disabled={saving || !title || !body} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Publish
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {announcements.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">📢</p>
            <p className="text-gray-500">No announcements yet.</p>
          </div>
        )}
        {announcements.map(a => (
          <div key={a.id} className={`card p-5 ${a.pinned ? 'border-l-4 border-l-yellow-400' : ''}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {a.pinned && (
                    <span className="flex items-center gap-1 badge badge-yellow">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  <span className={`badge ${catBadge[a.category] || 'badge-gray'}`}>{a.category}</span>
                </div>
                <h2 className="font-bold text-gray-900 dark:text-gray-100">{a.title}</h2>
                <p className="text-xs text-gray-400 mt-0.5 mb-3">
                  🛡️ HOA Admin · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{a.body}</p>
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" /> Acknowledge
                  </button>
                  <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
