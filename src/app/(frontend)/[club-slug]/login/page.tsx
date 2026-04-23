'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import React from 'react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams<{ 'club-slug': string }>()
  const clubSlug = params['club-slug']
  const redirect = searchParams.get('redirect') ?? 'member-area'

  // Invite / password-reset flow
  const inviteToken = searchParams.get('token')
  const inviteEmail = searchParams.get('email') ?? ''

  // Set-password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Οι κωδικοί δεν ταιριάζουν')
      return
    }
    if (newPassword.length < 8) {
      setError('Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken, password: newPassword }),
        credentials: 'include',
      })
      if (!res.ok) {
        let msg = 'Σφάλμα ορισμού κωδικού'
        try { msg = ((await res.json()) as { errors?: { message: string }[]; message?: string }).errors?.[0]?.message ?? msg } catch { /* */ }
        throw new Error(msg)
      }
      // After reset, log in automatically
      const loginRes = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, password: newPassword }),
        credentials: 'include',
      })
      if (!loginRes.ok) throw new Error('Ο κωδικός ορίστηκε. Συνδεθείτε με τα νέα σας στοιχεία.')
      const data = (await loginRes.json()) as {
        user?: { role?: string; tenant?: { slug?: string } | string }
      }
      const role = data.user?.role
      const tenantSlug = typeof data.user?.tenant === 'object' ? data.user?.tenant?.slug : null
      const slug = tenantSlug ?? clubSlug
      router.push(role === 'club-admin' ? `/${slug}/dashboard` : `/${slug}/member-area`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })
      if (!res.ok) {
        const data = (await res.json()) as { message?: string }
        throw new Error(data.message ?? 'Λάθος στοιχεία σύνδεσης')
      }
      const data = (await res.json()) as {
        user?: { role?: string; tenant?: { slug?: string } | string }
      }
      const role = data.user?.role
      const tenantSlug = typeof data.user?.tenant === 'object' ? data.user?.tenant?.slug : null
      const slug = tenantSlug ?? clubSlug
      router.push(role === 'club-admin' ? `/${slug}/dashboard` : `/${slug}/${redirect}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα σύνδεσης')
    } finally {
      setLoading(false)
    }
  }

  // ── Set-password view (invite link) ────────────────────────────────────────
  if (inviteToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Καλώς ήρθατε</h1>
            <p className="text-sm text-slate-500 mb-6">
              Ορίστε τον κωδικό πρόσβασής σας για να ολοκληρώσετε την εγγραφή.
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-5 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  readOnly
                  value={inviteEmail}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Νέος Κωδικός <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Τουλάχιστον 8 χαρακτήρες"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Επιβεβαίωση Κωδικού <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Αποθήκευση…' : 'Ορισμός Κωδικού & Είσοδος'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ── Regular login view ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Σύνδεση</h1>
          <p className="text-sm text-slate-500 mb-6">
            Πρόσβαση στην περιοχή μελών
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-5 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Κωδικός</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Σύνδεση…' : 'Σύνδεση'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
