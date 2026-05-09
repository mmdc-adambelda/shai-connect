'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Edit2, Save, X, CheckCircle, Lock, Eye, EyeOff,
  UserPlus, UserCheck, Users, FileText, MapPin, Shield, Camera, Loader2
} from 'lucide-react'
import type { Profile } from '@/types'
import { useFollow } from '@/hooks/useEngagement'
import Link from 'next/link'

const NOTIF_PREFS = [
  { key: 'announcements', label: 'Announcements',  desc: 'Official HOA bulletins and notices' },
  { key: 'chat',          label: 'Phase Chat',      desc: 'New messages in your phase room' },
  { key: 'dm',            label: 'Direct Messages', desc: 'Private message alerts' },
  { key: 'reactions',     label: 'Reactions',       desc: 'Likes and comments on your posts' },
]
const PHASES = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4']

// ── Avatar ──────────────────────────────────────────────────────
function Avatar({ name, avatarUrl, size = 80 }: { name: string; avatarUrl?: string | null; size?: number }) {
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="avatar font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials}
    </div>
  )
}

// ── Follow Button ────────────────────────────────────────────────
function FollowButton({ targetUserId, initialIsFollowing }: { targetUserId: string; initialIsFollowing: boolean }) {
  const { isFollowing, toggle, loading } = useFollow(targetUserId, initialIsFollowing)
  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`btn-follow ${isFollowing ? 'following' : 'not-following'}`}
    >
      {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}

// ── People Modal (followers / following) ─────────────────────────
function PeopleModal({ title, userId, type, onClose }: {
  title: string; userId: string; type: 'followers' | 'following'; onClose: () => void
}) {
  const [people, setPeople] = useState<Profile[]>([])
  const [loaded, setLoaded] = useState(false)

  // Load once on mount
  useState(() => {
    fetch(`/api/users/${userId}/${type}?limit=50`)
      .then(r => r.json())
      .then(data => { setPeople(data[type] ?? []); setLoaded(true) })
  })

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <button className="btn-icon w-7 h-7" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
          {!loaded && <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>}
          {loaded && people.length === 0 && (
            <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No {type} yet</div>
          )}
          {people.map(person => (
            <Link
              key={person.id}
              href={`/profile?userId=${person.id}`}
              onClick={onClose}
              className="flex items-center gap-3 px-5 py-3 transition-colors"
              style={{ borderBottom: '1px solid var(--border-soft)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              <Avatar name={person.full_name || 'Resident'} avatarUrl={person.avatar_url} size={38} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{person.full_name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{person.unit} · {person.phase}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main ProfileClient ───────────────────────────────────────────
export default function ProfileClient({
  profile, email, postCount, followingCount, followerCount,
  viewingUserId, isOwnProfile, isFollowing: initialIsFollowing,
}: {
  profile: Profile | null
  email: string
  postCount: number
  followingCount: number
  followerCount: number
  viewingUserId: string
  isOwnProfile: boolean
  isFollowing: boolean
}) {
  const supabase = createClient()

  // Profile edit state
  const [editing, setEditing]       = useState(false)
  const [fullName, setFullName]     = useState(profile?.full_name || '')
  const [unit, setUnit]             = useState(profile?.unit || '')
  const [phase, setPhase]           = useState(profile?.phase || 'Phase 1')
  const [bio, setBio]               = useState(profile?.bio || '')
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)

  // Avatar state
  const [avatarUrl, setAvatarUrl]       = useState(profile?.avatar_url ?? null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError]   = useState('')
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Password state
  const [showPwSection, setShowPwSection] = useState(false)
  const [newPw, setNewPw]               = useState('')
  const [confirmPw, setConfirmPw]       = useState('')
  const [showNewPw, setShowNewPw]       = useState(false)
  const [pwError, setPwError]           = useState('')
  const [pwSuccess, setPwSuccess]       = useState('')
  const [pwSaving, setPwSaving]         = useState(false)

  // Social state
  const [followCount, setFollowCount]   = useState({ followers: followerCount, following: followingCount })
  const [peopleModal, setPeopleModal]   = useState<'followers' | 'following' | null>(null)

  // Notifications
  const [notifs, setNotifs] = useState<Record<string, boolean>>({
    announcements: true, chat: true, dm: true, reactions: false,
  })

  // ── Avatar upload ──────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setAvatarError('')

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) { setAvatarError('Only JPG, PNG, WEBP, or GIF allowed.'); return }
    if (file.size > 2 * 1024 * 1024) { setAvatarError('Photo must be under 2MB.'); return }

    setAvatarUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `avatars/${profile.id}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('shai-uploads')
      .upload(path, file, { upsert: true, cacheControl: '0' })

    if (upErr) { setAvatarError('Upload failed. Please try again.'); setAvatarUploading(false); return }

    const { data: urlData } = supabase.storage.from('shai-uploads').getPublicUrl(path)
    // Bust cache by appending timestamp
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

    await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', profile.id)
    setAvatarUrl(publicUrl)
    setAvatarUploading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // ── Save profile text fields ───────────────────────────────────
  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({ full_name: fullName, unit, phase, bio }).eq('id', profile.id)
    setSaving(false); setEditing(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // ── Password change ────────────────────────────────────────────
  const handlePasswordChange = async () => {
    setPwError(''); setPwSuccess('')
    if (!newPw || !confirmPw) { setPwError('Please fill in all fields.'); return }
    if (newPw.length < 6)     { setPwError('Password must be at least 6 characters.'); return }
    if (newPw !== confirmPw)  { setPwError('Passwords do not match.'); return }
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) {
      setPwError(error.message)
    } else {
      setPwSuccess('Password changed successfully!')
      setNewPw(''); setConfirmPw('')
      setTimeout(() => { setPwSuccess(''); setShowPwSection(false) }, 3000)
    }
    setPwSaving(false)
  }

  const roleBadgeClass = (role: string) => {
    if (role === 'admin')     return 'badge-red'
    if (role === 'moderator') return 'badge-blue'
    return 'badge-gray'
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {isOwnProfile ? 'My Profile' : profile?.full_name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {isOwnProfile ? 'Manage your account and preferences' : `${profile?.unit} · ${profile?.phase}`}
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--brand)' }}>
            <CheckCircle className="w-4 h-4" /> Saved!
          </div>
        )}
      </div>

      {/* Profile card */}
      <div className="card mb-4 overflow-hidden">
        {/* Cover */}
        <div className="h-24" style={{ background: 'linear-gradient(135deg, var(--brand) 0%, #22884f 50%, #a8d5b0 100%)' }} />

        <div className="px-6 pb-5">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <div
                className="ring-4 rounded-full"
                style={{ background: 'var(--surface)' }}
              >
                <Avatar
                  name={profile?.full_name || 'Me'}
                  avatarUrl={avatarUrl}
                  size={80}
                />
              </div>
              {/* Camera button — only own profile */}
              {isOwnProfile && (
                <>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors"
                    style={{
                      background: 'var(--brand)', borderColor: 'var(--surface)',
                      color: 'white',
                    }}
                    title="Change profile photo"
                  >
                    {avatarUploading
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Camera className="w-3.5 h-3.5" />
                    }
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </>
              )}
            </div>

            <div className="flex gap-2 mt-10">
              {!isOwnProfile && profile?.id && (
                <FollowButton targetUserId={profile.id} initialIsFollowing={initialIsFollowing} />
              )}
              {isOwnProfile && !editing && (
                <button onClick={() => setEditing(true)} className="btn-ghost py-2 px-3 text-xs gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Avatar error */}
          {avatarError && (
            <p className="text-xs text-red-500 mb-2">{avatarError}</p>
          )}

          {/* Name + info */}
          {!editing ? (
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{profile?.full_name}</h2>
                <span className={`badge ${roleBadgeClass(profile?.role || 'resident')}`}>
                  {profile?.role?.charAt(0).toUpperCase()}{profile?.role?.slice(1)}
                </span>
                <span className="badge badge-green text-[10px]">✓ Verified</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                <MapPin className="w-3.5 h-3.5" />
                {profile?.unit} · {profile?.phase}
              </div>
              {profile?.bio && (
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{profile.bio}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Block & Lot</label>
                  <input className="input" value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g. Block 3, Lot 12" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Phase</label>
                  <select className="input" value={phase} onChange={e => setPhase(e.target.value)}>
                    {PHASES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Bio (optional)</label>
                <textarea
                  className="input resize-none" rows={2}
                  placeholder="Tell your neighbors a bit about yourself…"
                  value={bio} onChange={e => setBio(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving} className="btn-primary py-2 text-xs gap-1.5">
                  <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)} className="btn-ghost py-2 text-xs gap-1.5">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 pt-4" style={{ borderTop: '1px solid var(--border-soft)' }}>
            {[
              { label: 'Posts',     value: postCount,              icon: FileText,  onClick: undefined },
              { label: 'Followers', value: followCount.followers,  icon: Users,     onClick: () => setPeopleModal('followers') },
              { label: 'Following', value: followCount.following,  icon: UserCheck, onClick: () => setPeopleModal('following') },
            ].map(({ label, value, icon: Icon, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="text-center py-3 rounded-xl transition-colors"
                style={{ cursor: onClick ? 'pointer' : 'default' }}
                onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '' }}
              >
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                <p className="text-xs mt-0.5 flex items-center justify-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <Icon className="w-3 h-3" /> {label}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Own profile — account details */}
      {isOwnProfile && (
        <>
          <div className="card p-5 mb-4">
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Account Details</h3>
            <div className="space-y-1">
              {[
                { label: 'Role',         value: <span className={`badge ${roleBadgeClass(profile?.role || 'resident')}`}>{profile?.role}</span> },
                { label: 'Email',        value: email },
                { label: 'Phase',        value: profile?.phase },
                { label: 'Block & Lot',  value: profile?.unit },
                { label: 'Verification', value: <span className="badge badge-blue">✓ Verified Homeowner</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Password */}
          <div className="card p-5 mb-4">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Password</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Change your account password</p>
              </div>
              <button
                onClick={() => { setShowPwSection(!showPwSection); setPwError(''); setPwSuccess('') }}
                className="btn-ghost py-2 text-xs gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" /> {showPwSection ? 'Cancel' : 'Change'}
              </button>
            </div>
            {showPwSection && (
              <div className="mt-4 pt-4 space-y-3" style={{ borderTop: '1px solid var(--border-soft)' }}>
                {pwError   && <div className="p-3 rounded-xl text-sm text-red-700"   style={{ background: '#fee2e2', border: '1px solid #fca5a5' }}>{pwError}</div>}
                {pwSuccess && <div className="p-3 rounded-xl text-sm text-green-700" style={{ background: '#dcfce7', border: '1px solid #86efac' }}>{pwSuccess}</div>}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>New Password</label>
                  <div className="relative">
                    <input
                      className="input pr-9" type={showNewPw ? 'text' : 'password'}
                      placeholder="At least 6 characters" value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Confirm Password</label>
                  <input className="input" type="password" placeholder="Re-enter new password"
                    value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handlePasswordChange() }} />
                </div>
                <button onClick={handlePasswordChange} disabled={pwSaving || !newPw || !confirmPw} className="btn-primary text-xs gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> {pwSaving ? 'Saving…' : 'Update Password'}
                </button>
              </div>
            )}
          </div>

          {/* Notification preferences */}
          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Notification Preferences</h3>
            <div className="space-y-0.5">
              {NOTIF_PREFS.map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifs(p => ({ ...p, [key]: !p[key] }))}
                    className={`toggle ${notifs[key] ? 'on' : ''}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* People modal */}
      {peopleModal && (
        <PeopleModal
          title={peopleModal === 'followers' ? 'Followers' : 'Following'}
          userId={profile?.id ?? ''}
          type={peopleModal}
          onClose={() => setPeopleModal(null)}
        />
      )}
    </div>
  )
}
