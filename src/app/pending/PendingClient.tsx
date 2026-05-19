'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Leaf, Clock, LogOut, RefreshCw, ShieldCheck, Mail, MapPin, KeyRound } from 'lucide-react'
import { useState } from 'react'
import type { Profile } from '@/types'

export default function PendingClient({
  profile,
  email,
}: {
  profile: Profile | null
  email: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [checking, setChecking] = useState(false)
  const [justChecked, setJustChecked] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  // Let the user manually re-check if they've been approved
  const handleCheckStatus = async () => {
    setChecking(true)
    const { data } = await supabase
      .from('profiles')
      .select('is_verified')
      .eq('id', profile?.id ?? '')
      .single()

    if (data?.is_verified) {
      router.push('/feed')
      router.refresh()
    } else {
      setJustChecked(true)
      setChecking(false)
      setTimeout(() => setJustChecked(false), 4000)
    }
  }

  const locationDisplay = profile?.block_no && profile?.lot_no
    ? `Block ${profile.block_no}, Lot ${profile.lot_no}`
    : profile?.unit || '—'

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'var(--surface-2)' }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'var(--brand)' }}
          >
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--brand)' }}>
            SHAI Connect
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Sabella Homeowners Association Inc.
          </p>
        </div>

        {/* Pending card */}
        <div className="card p-6 mb-4">
          {/* Status badge */}
          <div className="flex justify-center mb-5">
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={{
                background: 'var(--amber-light, #fef6e4)',
                color: '#b45309',
                border: '1px solid #fcd34d',
              }}
            >
              <Clock className="w-4 h-4" />
              Pending Verification
            </div>
          </div>

          <h2 className="text-lg font-bold text-center mb-2" style={{ color: 'var(--text-primary)' }}>
            Your account is under review
          </h2>
          <p className="text-sm text-center mb-6" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
            A community admin or moderator will verify your homeowner identity
            before you can access SHAI Connect. You will be notified once approved.
          </p>

          {/* Submitted info summary */}
          <div
            className="rounded-xl p-4 mb-5 space-y-2.5"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Your submitted details
            </p>

            <div className="flex items-center gap-2.5 text-sm">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brand)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Name:</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{profile?.full_name || '—'}</span>
            </div>

            <div className="flex items-center gap-2.5 text-sm">
              <KeyRound className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brand)' }} />
              <span style={{ color: 'var(--text-muted)' }}>SHPY Code:</span>
              <span className="font-mono font-bold tracking-widest" style={{ color: 'var(--text-primary)' }}>
                {profile?.project_code || '—'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-sm">
              <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brand)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Location:</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{locationDisplay} · {profile?.phase}</span>
            </div>

            <div className="flex items-center gap-2.5 text-sm">
              <Mail className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brand)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Email:</span>
              <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{email}</span>
            </div>
          </div>

          {/* Already approved notice */}
          {justChecked && (
            <div
              className="p-3 rounded-xl text-sm text-center mb-4"
              style={{
                background: '#fef6e4',
                color: '#b45309',
                border: '1px solid #fcd34d',
              }}
            >
              Your account is still pending. Please wait for admin approval.
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full btn-primary flex items-center justify-center gap-2 py-2.5"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking…' : 'Check Approval Status'}
            </button>
            <button
              onClick={handleSignOut}
              className="w-full btn-ghost flex items-center justify-center gap-2 py-2.5 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          If you have questions, contact your HOA administrator directly.
        </p>
      </div>
    </div>
  )
}
