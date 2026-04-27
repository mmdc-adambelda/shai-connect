'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Edit2, Save, X, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react'
import type { Profile } from '@/types'

const NOTIF_PREFS = [
  { key: 'announcements', label: 'Announcements', desc: 'Official HOA bulletins and notices' },
  { key: 'chat', label: 'Phase Chat', desc: 'New messages in your phase room' },
  { key: 'dm', label: 'Direct Messages', desc: 'Private message alerts' },
  { key: 'reactions', label: 'Reactions', desc: 'Likes and comments on your posts' },
]

const PHASES = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4']

export default function ProfileClient({
  profile,
  email,
  postCount,
  followingCount,
  followerCount,
}: {
  profile: Profile | null
  email: string
  postCount: number
  followingCount: number
  followerCount: number
}) {
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [unit, setUnit] = useState(profile?.unit || '')
  const [phase, setPhase] = useState(profile?.phase || 'Phase 1')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notifs, setNotifs] = useState<Record<string, boolean>>({
    announcements: true, chat: true, dm: true, reactions: false,
  })

  // Password change state
  const [showPwSection, setShowPwSection] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  const supabase = createClient()

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({ full_name: fullName, unit, phase }).eq('id', profile.id)
    setSaving(false)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handlePasswordChange = async () => {
    setPwError('')
    setPwSuccess('')
    if (!newPw || !confirmPw) { setPwError('Please fill in all fields.'); return }
    if (newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return }
    if (newPw !== confirmPw) { setPwError('New passwords do not match.'); return }
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) {
      setPwError(error.message)
    } else {
      setPwSuccess('Password changed successfully!')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => { setPwSuccess(''); setShowPwSection(false) }, 3000)
    }
    setPwSaving(false)
  }

  const roleBadgeClass = (role: string) => {
    if (role === 'admin') return 'badge-red'
    if (role === 'moderator') return 'badge-blue'
    return 'badge-green'
  }

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account and preferences</p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 font-medium">
            <CheckCircle className="w-4 h-4" /> Saved!
          </div>
        )}
      </div>

      {/* Profile header */}
      <div className="card p-6 mb-4">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 flex items-center justify-center font-bold text-2xl border-2 border-brand-300 dark:border-brand-700 flex-shrink-0">
            {initials(profile?.full_name || 'Me')}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                  <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Block & Lot</label>
                  <input className="input" value={unit} onChange={e => setUnit(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Phase</label>
                  <select className="input" value={phase} onChange={e => setPhase(e.target.value)}>
                    {PHASES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-1.5 py-1.5">
                    <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-ghost flex items-center gap-1.5 py-1.5">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{profile?.full_name}</h2>
                  <span className={`badge ${roleBadgeClass(profile?.role || 'resident')}`}>
                    {profile?.role?.charAt(0).toUpperCase()}{profile?.role?.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.unit} · {profile?.phase}</p>
                <p className="text-sm text-gray-400 mt-0.5">{email}</p>
                <button onClick={() => setEditing(true)} className="mt-3 btn-ghost flex items-center gap-1.5 py-1.5 text-xs">
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
          {[
            { label: 'Posts', value: postCount },
            { label: 'Following', value: followingCount },
            { label: 'Followers', value: followerCount },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Account details */}
      <div className="card p-5 mb-4">
        <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-4">Account Details</h3>
        <div className="space-y-3">
          {[
            { label: 'Role', value: <span className={`badge ${roleBadgeClass(profile?.role || 'resident')}`}>{profile?.role}</span> },
            { label: 'Phase', value: profile?.phase },
            { label: 'Block & Lot', value: profile?.unit },
            { label: 'Verification', value: <span className="badge badge-blue">✓ Verified Homeowner</span> },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
              <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Password change */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Password</h3>
            <p className="text-xs text-gray-400 mt-0.5">Change your account password</p>
          </div>
          <button
            onClick={() => { setShowPwSection(!showPwSection); setPwError(''); setPwSuccess('') }}
            className="btn-ghost flex items-center gap-1.5 text-xs py-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            {showPwSection ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {showPwSection && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
            {pwError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
                {pwSuccess}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">New Password</label>
              <div className="relative">
                <input
                  className="input pr-9"
                  type={showNewPw ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Confirm New Password</label>
              <input
                className="input"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handlePasswordChange() }}
              />
            </div>
            <button
              onClick={handlePasswordChange}
              disabled={pwSaving || !newPw || !confirmPw}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {pwSaving ? 'Saving…' : 'Update Password'}
            </button>
          </div>
        )}
      </div>

      {/* Notification preferences */}
      <div className="card p-5">
        <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-4">Notification Preferences</h3>
        <div className="space-y-1">
          {NOTIF_PREFS.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <button
                onClick={() => setNotifs(prev => ({ ...prev, [key]: !prev[key] }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${notifs[key] ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifs[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
