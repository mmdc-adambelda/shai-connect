'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Leaf, Loader2, Eye, EyeOff, AlertCircle, Lock } from 'lucide-react'

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

  const [mode, setMode]       = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [showPw, setShowPw]   = useState(false)

  // Shared fields
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  // Sign-up only fields
  const [firstName, setFirstName]     = useState('')
  const [lastName, setLastName]       = useState('')
  const [projectCode, setProjectCode] = useState('')
  const [blockNo, setBlockNo]         = useState('')
  const [lotNo, setLotNo]             = useState('')
  const [phase, setPhase]             = useState('Phase 1')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [checkingCode, setCheckingCode] = useState(false)

  // Format & validate SHPY code as user types
  const handleProjectCodeChange = (val: string) => {
    // Auto-uppercase and strip spaces
    const cleaned = val.toUpperCase().replace(/\s/g, '')
    setProjectCode(cleaned)
  }

  const validateSignup = () => {
    const errors: Record<string, string> = {}
    if (!firstName.trim())                errors.firstName = 'First name is required.'
    else if (firstName.trim().length < 2) errors.firstName = 'First name is too short.'
    if (!lastName.trim())                 errors.lastName = 'Last name is required.'
    else if (lastName.trim().length < 2)  errors.lastName = 'Last name is too short.'

    // Project code validation
    if (!projectCode.trim())
      errors.projectCode = 'SHPY Project Code is required.'
    else if (!/^SHPY\d{6}$/.test(projectCode))
      errors.projectCode = 'Must be in the format SHPY followed by 6 digits (e.g. SHPY916228).'

    // Block & Lot
    if (!blockNo)
      errors.blockNo = 'Block number is required.'
    else if (!/^\d+$/.test(blockNo) || parseInt(blockNo) <= 0)
      errors.blockNo = 'Block must be a positive whole number.'

    if (!lotNo)
      errors.lotNo = 'Lot number is required.'
    else if (!/^\d+$/.test(lotNo) || parseInt(lotNo) <= 0)
      errors.lotNo = 'Lot must be a positive whole number.'

    if (!email.trim())
      errors.email = 'Email is required.'
    if (!password || password.length < 6)
      errors.password = 'Password must be at least 6 characters.'
    return errors
  }

  const getErrorMessage = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('fetch') || msg.includes('NetworkError') || msg.includes('network'))
      return 'Cannot connect. Please check your internet connection and try again.'
    return msg
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess(''); setFieldErrors({})

    if (mode === 'signup') {
      const errors = validateSignup()
      if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }

      // Check uniqueness of project code against existing profiles
      setCheckingCode(true)
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('project_code', projectCode)
        .maybeSingle()
      setCheckingCode(false)

      if (existing) {
        setFieldErrors({ projectCode: 'This SHPY Project Code is already registered. Contact your HOA admin if this is an error.' })
        return
      }
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { setError(error.message) }
        else { router.push('/feed'); router.refresh() }
      } else {
        const fullName = `${firstName.trim()} ${lastName.trim()}`
        const unit     = `Block ${blockNo}, Lot ${lotNo}`

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name:    fullName,
              project_code: projectCode,
              block_no:     parseInt(blockNo),
              lot_no:       parseInt(lotNo),
              unit,
              phase,
            }
          }
        })

        if (error) {
          setError(error.message)
        } else if (data.user) {
          // Also upsert the profile with project_code since trigger may not catch it
          await supabase.from('profiles').upsert({
            id:           data.user.id,
            full_name:    fullName,
            project_code: projectCode,
            block_no:     parseInt(blockNo),
            lot_no:       parseInt(lotNo),
            unit,
            phase,
          }, { onConflict: 'id' })

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
    setEmail(''); setPassword('')
    setFirstName(''); setLastName(''); setProjectCode('')
    setBlockNo(''); setLotNo('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--surface-2)' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'var(--brand)' }}>
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
          <div className="flex rounded-lg p-1 mb-5" style={{ background: 'var(--surface-2)' }}>
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className="flex-1 py-1.5 rounded-md text-sm font-medium transition-all"
                style={{
                  background: mode === m ? 'var(--surface)' : 'transparent',
                  color:      mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow:  mode === m ? 'var(--shadow-xs)' : 'none',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Banners */}
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

            {mode === 'signup' && (
              <>
                {/* Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>First Name *</label>
                    <input className={`input ${fieldErrors.firstName ? 'border-red-400' : ''}`} type="text"
                      value={firstName} onChange={e => setFirstName(e.target.value)}
                      placeholder="Juan" autoComplete="given-name" />
                    {fieldErrors.firstName && <FieldError msg={fieldErrors.firstName} />}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Last Name *</label>
                    <input className={`input ${fieldErrors.lastName ? 'border-red-400' : ''}`} type="text"
                      value={lastName} onChange={e => setLastName(e.target.value)}
                      placeholder="dela Cruz" autoComplete="family-name" />
                    {fieldErrors.lastName && <FieldError msg={fieldErrors.lastName} />}
                  </div>
                </div>

                {/* SHPY Project Code */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    SHPY Project Code *
                  </label>
                  <div className="relative">
                    <input
                      className={`input font-mono tracking-widest ${fieldErrors.projectCode ? 'border-red-400' : ''}`}
                      type="text"
                      value={projectCode}
                      onChange={e => handleProjectCodeChange(e.target.value)}
                      placeholder="e.g. SHPY916228"
                      maxLength={10}
                      spellCheck={false}
                    />
                    {checkingCode && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>
                  {fieldErrors.projectCode
                    ? <FieldError msg={fieldErrors.projectCode} />
                    : <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Your unique HOA project code. This cannot be changed after registration.</p>
                  }
                </div>

                {/* Block & Lot — separated integers */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Block No. *</label>
                    <input
                      className={`input ${fieldErrors.blockNo ? 'border-red-400' : ''}`}
                      type="number"
                      min="1"
                      step="1"
                      value={blockNo}
                      onChange={e => setBlockNo(e.target.value.replace(/\D/g, ''))}
                      placeholder="3"
                    />
                    {fieldErrors.blockNo && <FieldError msg={fieldErrors.blockNo} />}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Lot No. *</label>
                    <input
                      className={`input ${fieldErrors.lotNo ? 'border-red-400' : ''}`}
                      type="number"
                      min="1"
                      step="1"
                      value={lotNo}
                      onChange={e => setLotNo(e.target.value.replace(/\D/g, ''))}
                      placeholder="12"
                    />
                    {fieldErrors.lotNo && <FieldError msg={fieldErrors.lotNo} />}
                  </div>
                </div>

                {/* Phase */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Phase</label>
                  <select className="input" value={phase} onChange={e => setPhase(e.target.value)}>
                    {PHASES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email Address *</label>
              <input className={`input ${fieldErrors.email ? 'border-red-400' : ''}`} type="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com" autoComplete="email" />
              {fieldErrors.email && <FieldError msg={fieldErrors.email} />}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password *</label>
              <div className="relative">
                <input
                  className={`input pr-10 ${fieldErrors.password ? 'border-red-400' : ''}`}
                  type={showPw ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <FieldError msg={fieldErrors.password} />}
              {mode === 'signup' && !fieldErrors.password && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Minimum 6 characters</p>
              )}
            </div>

            <button type="submit" disabled={loading || checkingCode}
              className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 mt-1">
              {(loading || checkingCode) && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-center text-xs mt-4 flex items-center justify-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <Lock className="w-3 h-3" /> Only verified Sabella HOA residents may register.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
