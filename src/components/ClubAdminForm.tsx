'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Tenant {
  id: string | number
  name: string
  slug: string
}

interface Props {
  tenants: Tenant[]
}

export function ClubAdminForm({ tenants }: Props) {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/superadmin/create-club-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ firstName, lastName, email, tenantId }),
      })

      let data: { message?: string } = {}
      try { data = await res.json() } catch { /* non-JSON */ }

      if (!res.ok) {
        setError(data.message ?? 'Σφάλμα αποθήκευσης.')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/superadmin/club-admins')
        router.refresh()
      }, 1500)
    } catch {
      setError('Σφάλμα δικτύου. Δοκιμάστε ξανά.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <span className="text-4xl">✅</span>
        <p className="text-slate-700 font-medium">Ο διαχειριστής δημιουργήθηκε και στάλθηκε πρόσκληση!</p>
        <p className="text-sm text-slate-400">Ανακατεύθυνση…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {/* Name row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Όνομα <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            placeholder="Αλέξης"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Επώνυμο <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            placeholder="Παπαδόπουλος"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          placeholder="admin@συλλογος.gr"
        />
      </div>

      {/* Tenant */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Σύλλογος <span className="text-red-500">*</span>
        </label>
        {tenants.length === 0 ? (
          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            Δεν υπάρχουν ενεργοί σύλλογοι. Δημιουργήστε πρώτα έναν σύλλογο.
          </p>
        ) : (
          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            required
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
          >
            <option value="">— Επιλέξτε σύλλογο —</option>
            {tenants.map((t) => (
              <option key={String(t.id)} value={String(t.id)}>
                {t.name} ({t.slug})
              </option>
            ))}
          </select>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Θα σταλεί email πρόσκλησης για ορισμό κωδικού πρόσβασης.
      </p>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={loading || tenants.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl px-5 py-2.5 transition"
        >
          {loading ? 'Δημιουργία…' : 'Δημιουργία & Αποστολή Πρόσκλησης'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-slate-500 hover:text-slate-700 transition px-3 py-2.5"
        >
          Ακύρωση
        </button>
      </div>
    </form>
  )
}
