'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Leaf, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'

const PHASES = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4']

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {msg}
    </p>
  )
}

export default function AuthPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [mode, setMode]         = useState<'login' | 'signup'>('login')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [showPw, setShowPw]     = useState(false)

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [unit, setUnit]           = useState('')
  const [phase, setPhase]         = useState('Phase 1')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validateSignup = () => {
    const errors: Record<string, string> = {}
    if (!firstName.trim())               errors.firstName = 'First name is required.'
    else if (firstName.trim().length < 2) errors.firstName = 'First name is too short.'
    if (!lastName.trim())                errors.lastName = 'Last name is required.'
    else if (lastName.trim().length < 2)  errors.lastName = 'Last name is too short.'
    if (!unit.trim())                    errors.unit = 'Block & Lot is required.'
    if (!email.trim())                   errors.email = 'Email is required.'
    if (!password || password.length < 6) errors.password = 'Password must be at least 6 characters.'
    return errors
  }

  const getErrorMessage = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('fetch') || msg.includes('NetworkError') || msg.includes('network')) {
      return 'Cannot connect. Please check your internet connection and try again.'
    }
    return msg
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess(''); setFieldErrors({})

    if (mode === 'signup') {
      const errors = validateSignup()
      if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }
    }

    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { setError(error.message) } else { router.push('/feed'); router.refresh() }
      } else {
        const fullName = `${firstName.trim()} ${lastName.trim()}`
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, unit: unit.trim(), phase } }
        })
        if (error) { setError(error.message) }
        else if (data.user) {
          if (data.session) {
            router.push('/feed'); router.refresh()
          } else {
            setSuccess('Account created! Check your email and click the confirmation link, then sign in.')
            setMode('login')
            setEmail(''); setPassword('')
          }
        } else {
          setError('Something went wrong. Please try again.')
        }
      }
    } catch (err) {
      setError(getErrorMessage(err))
    }

    setLoading(false)
  }

  const switchMode = (m: 'login' | 'signup') => {
    setMode(m); setError(''); setSuccess(''); setFieldErrors({})
    setEmail(''); setPassword(''); setFirstName(''); setLastName(''); setUnit('')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--surface-2)' }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'var(--brand)' }}
          >
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--brand)' }}>
            SHAI Connect
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Sabella Homeowners Association Inc.
          </p>
        </div>

        <div className="card p-6">
          {/* Mode tabs */}
          <div
            className="flex rounded-lg p-1 mb-5"
            style={{ background: 'var(--surface-2)' }}
          >
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className="flex-1 py-1.5 rounded-md text-sm font-medium transition-all"
                style={{
                  background: mode === m ? 'var(--surface)' : 'transparent',
                  color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: mode === m ? 'var(--shadow-xs)' : 'none',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Error / success banners */}
          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'var(--brand-xlight)', color: 'var(--brand)', border: '1px solid var(--brand-light)' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>

            {/* Sign-up fields */}
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      First Name *
                    </label>
                    <input
                      className={`input ${fieldErrors.firstName ? 'border-red-400' : ''}`}
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Juan"
                      autoComplete="given-name"
                    />
                    {fieldErrors.firstName && <FieldError msg={fieldErrors.firstName} />}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Last Name *
                    </label>
                    <input
                      className={`input ${fieldErrors.lastName ? 'border-red-400' : ''}`}
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="dela Cruz"
                      autoComplete="family-name"
                    />
                    {fieldErrors.lastName && <FieldError msg={fieldErrors.lastName} />}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Block &amp; Lot *
                  </label>
                  <input
                    className={`input ${fieldErrors.unit ? 'border-red-400' : ''}`}
                    type="text"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="e.g. Block 3, Lot 12"
                  />
                  {fieldErrors.unit && <FieldError msg={fieldErrors.unit} />}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Phase
                  </label>
                  <select className="input" value={phase} onChange={e => setPhase(e.target.value)}>
                    {PHASES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Shared fields */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Email Address *
              </label>
              <input
                className={`input ${fieldErrors.email ? 'border-red-400' : ''}`}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
              />
              {fieldErrors.email && <FieldError msg={fieldErrors.email} />}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Password *
              </label>
              <div className="relative">
                <input
                  className={`input pr-10 ${fieldErrors.password ? 'border-red-400' : ''}`}
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <FieldError msg={fieldErrors.password} />}
              {mode === 'signup' && !fieldErrors.password && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Minimum 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 mt-1"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
              Only verified Sabella HOA residents may register.
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
