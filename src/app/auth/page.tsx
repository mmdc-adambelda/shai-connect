'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Home, Loader2 } from 'lucide-react'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [unit, setUnit] = useState('')
  const [phase, setPhase] = useState('Phase 1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const getErrorMessage = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('Failed to fetch') || msg.includes('fetch') || msg.includes('NetworkError') || msg.includes('network')) {
      return 'Cannot connect to Supabase. Please check:\n1. Your .env.local file exists in the project root\n2. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are filled in correctly\n3. You restarted the dev server after creating .env.local (Ctrl+C then npm run dev)'
    }
    return msg
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('your-project-id') || supabaseUrl === '') {
      setError('Supabase is not configured.\n\nSteps to fix:\n1. Copy .env.example to .env.local\n2. Fill in your Supabase URL and anon key (from supabase.com → Settings → API)\n3. Stop the server (Ctrl+C) and run npm run dev again')
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setError(error.message)
        } else {
          router.push('/feed')
          router.refresh()
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })

        if (error) {
          setError(error.message)
        } else if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName,
            unit,
            phase,
            role: 'resident',
          })

          if (profileError && profileError.code !== '23505') {
            setError(
              profileError.message.includes('profiles')
                ? 'Profile could not be saved. Make sure you ran the schema.sql file in your Supabase SQL Editor.'
                : profileError.message
            )
          } else if (data.session) {
            router.push('/feed')
            router.refresh()
          } else {
            setSuccess('Account created! Check your email inbox and click the confirmation link, then come back here to sign in.')
            setMode('login')
          }
        } else {
          setError('Something went wrong during signup. Please try again.')
        }
      }
    } catch (err) {
      setError(getErrorMessage(err))
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 mb-4">
            <Home className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-brand-700 dark:text-brand-400">SHAI Connect</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sabella Homeowners Association Inc.</p>
        </div>

        <div className="card p-8">
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 mb-6">
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Full Name</label>
                  <input className="input" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Juan dela Cruz" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Block & Lot</label>
                  <input className="input" type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g. Block 3, Lot 12" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Phase</label>
                  <select className="input" value={phase} onChange={e => setPhase(e.target.value)}>
                    <option>Phase 1</option>
                    <option>Phase 2</option>
                    <option>Phase 3</option>
                    <option>Phase 4</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Email Address</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
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
            Make sure you have a <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">.env.local</code> file with your Supabase credentials, and that you ran <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">supabase/schema.sql</code> in the Supabase SQL Editor.
          </p>
        </div>
      </div>
    </div>
  )
}
