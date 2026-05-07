'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  mode: 'create' | 'edit'
  existing?: {
    id: string | number
    name: string
    slug: string
    contactEmail?: string | null
    isActive: boolean
  }
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function TenantForm({ mode, existing }: Props) {
  const router = useRouter()
  const [name, setName] = useState(existing?.name ?? '')
  const [slug, setSlug] = useState(existing?.slug ?? '')
  const [contactEmail, setContactEmail] = useState(existing?.contactEmail ?? '')
  const [isActive, setIsActive] = useState(existing?.isActive ?? true)
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slugTouched && mode === 'create') {
      setSlug(toSlug(name))
    }
  }, [name, slugTouched, mode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const body = {
      name,
      slug,
      contactEmail: contactEmail || null,
      isActive,
    }

    try {
      const url = mode === 'create' ? '/api/tenants' : `/api/tenants/${existing!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      let data: { errors?: { message?: string }[] } = {}
      try { data = await res.json() } catch { /* non-JSON */ }

      if (!res.ok) {
        setError(data.errors?.[0]?.message ?? 'Σφάλμα αποθήκευσης.')
        return
      }

      router.push('/superadmin/clubs')
      router.refresh()
    } catch {
      setError('Σφάλμα δικτύου. Δοκιμάστε ξανά.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Όνομα Συλλόγου <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          placeholder="π.χ. Αθλητικός Σύλλογος Αθηνών"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Slug (URL) <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition">
          <span className="px-3 text-slate-400 text-sm bg-slate-50 border-r border-slate-200 py-2.5 select-none whitespace-nowrap">
            koinon.app/
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }}
            required
            disabled={mode === 'edit'}
            className="flex-1 px-3 py-2.5 text-sm text-slate-900 focus:outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
            placeholder="athletic-club-athens"
          />
        </div>
        {mode === 'edit' && (
          <p className="text-xs text-slate-400 mt-1">Το slug δεν μπορεί να αλλάξει μετά τη δημιουργία.</p>
        )}
      </div>

      {/* Contact email */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Email Επικοινωνίας
        </label>
        <input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          placeholder="info@σύλλογος.gr"
        />
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsActive((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
            isActive ? 'bg-indigo-600' : 'bg-slate-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm text-slate-700">
          {isActive ? 'Ενεργός' : 'Ανενεργός'}
        </span>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl px-5 py-2.5 transition"
        >
          {loading ? 'Αποθήκευση…' : mode === 'create' ? 'Δημιουργία Συλλόγου' : 'Αποθήκευση'}
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
