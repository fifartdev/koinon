'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SuperadminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      let data: { user?: { role?: string }; errors?: { message?: string }[] } = {}
      try { data = await res.json() } catch { /* non-JSON */ }

      if (!res.ok) {
        setError(data.errors?.[0]?.message ?? 'Λανθασμένα στοιχεία σύνδεσης.')
        return
      }

      const role = data.user?.role
      if (role !== 'superadmin') {
        await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
        setError('Μόνο λογαριασμοί superadmin επιτρέπονται εδώ.')
        return
      }

      router.replace('/superadmin')
    } catch {
      setError('Σφάλμα δικτύου. Δοκιμάστε ξανά.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-3xl font-bold text-indigo-600 tracking-tight">Koinon</span>
          <p className="text-slate-500 text-sm mt-1">Πίνακας Superadmin</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h1 className="text-lg font-semibold text-slate-800 mb-6">Σύνδεση</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Κωδικός
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl py-2.5 transition"
            >
              {loading ? 'Σύνδεση…' : 'Σύνδεση'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
