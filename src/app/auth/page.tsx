'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Home, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'

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

  // Login fields
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  // Sign-up fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [unit, setUnit]           = useState('')
  const [phase, setPhase]         = useState('Phase 1')

  // Per-field validation errors (signup only)
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('your-project-id') || supabaseUrl === '') {
      setError('Supabase is not configured. Please add your credentials to .env.local.')
      return
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
          options: {
            data: {
              full_name: fullName,
              unit: unit.trim(),
              phase,
            }
          }
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 mb-4">
            <Home className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-brand-700 dark:text-brand-400">SHAI Connect</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sabella Homeowners Association Inc.</p>
        </div>

        <div className="card p-8">
          {/* Mode tabs */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 mb-6">
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === m
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Global error / success */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm whitespace-pre-line">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* ── Sign-up only fields ── */}
            {mode === 'signup' && (
              <>
                {/* First + Last name side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      First Name *
                    </label>
                    <input
                      className={`input ${fieldErrors.firstName ? 'border-red-400 focus:border-red-400' : ''}`}
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Juan"
                      autoComplete="given-name"
                    />
                    {fieldErrors.firstName && <FieldError msg={fieldErrors.firstName} />}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      Last Name *
                    </label>
                    <input
                      className={`input ${fieldErrors.lastName ? 'border-red-400 focus:border-red-400' : ''}`}
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
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Block & Lot *
                  </label>
                  <input
                    className={`input ${fieldErrors.unit ? 'border-red-400 focus:border-red-400' : ''}`}
                    type="text"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="e.g. Block 3, Lot 12"
                  />
                  {fieldErrors.unit && <FieldError msg={fieldErrors.unit} />}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Phase
                  </label>
                  <select className="input" value={phase} onChange={e => setPhase(e.target.value)}>
                    {PHASES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* ── Shared fields ── */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Email Address *
              </label>
              <input
                className={`input ${fieldErrors.email ? 'border-red-400 focus:border-red-400' : ''}`}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
              />
              {fieldErrors.email && <FieldError msg={fieldErrors.email} />}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Password *
              </label>
              <div className="relative">
                <input
                  className={`input pr-9 ${fieldErrors.password ? 'border-red-400 focus:border-red-400' : ''}`}
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <FieldError msg={fieldErrors.password} />}
              {mode === 'signup' && !fieldErrors.password && (
                <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-center text-xs text-gray-400 mt-4">
              Only verified Sabella HOA residents may register.
            </p>
          )}
        </div>

        <div className="mt-4 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs font-bold text-yellow-800 dark:text-yellow-400 mb-1">⚙️ First-time setup?</p>
          <p className="text-xs text-yellow-700 dark:text-yellow-500">
            Make sure you have a <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">.env.local</code> file
            with your Supabase credentials, and that you ran{' '}
            <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">supabase/schema.sql</code> in the Supabase SQL Editor.
          </p>
        </div>
      </div>
    </div>
  )
}
