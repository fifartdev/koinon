'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import React from 'react'

interface Props {
  tenantId: string
  slug: string
  announcement?: {
    id: number | string
    title?: string | null
    content?: unknown
    isPinned?: boolean | null
    status?: string | null
  }
}


export function AnnouncementForm({ tenantId, slug, announcement }: Props) {
  const router = useRouter()
  const isEdit = !!announcement

  const [title, setTitle] = useState(announcement?.title ?? '')
  const [content, setContent] = useState(
    typeof announcement?.content === 'string' ? announcement.content : '',
  )
  const [isPinned, setIsPinned] = useState(announcement?.isPinned ?? false)
  const [status, setStatus] = useState<'draft' | 'published'>(
    (announcement?.status as 'draft' | 'published') ?? 'draft',
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const now = new Date().toISOString()
    const body = isEdit
      ? { title, content, isPinned, status, ...(status === 'published' ? { publishedAt: now } : {}) }
      : { title, content, isPinned, status, tenant: Number(tenantId), ...(status === 'published' ? { publishedAt: now } : {}) }

    try {
      const url = isEdit ? `/api/announcements/${announcement!.id}` : '/api/announcements'
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      })

      if (!res.ok) {
        let msg = 'Σφάλμα αποθήκευσης'
        try {
          const data = (await res.json()) as { errors?: { message: string }[]; message?: string }
          msg = data.errors?.[0]?.message ?? data.message ?? msg
        } catch {}
        throw new Error(msg)
      }

      router.push(`/${slug}/dashboard/announcements`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα αποθήκευσης')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm">Περιεχόμενο</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Τίτλος <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="π.χ. Αλλαγή ωραρίου Σεπτεμβρίου"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Κείμενο <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
            placeholder="Γράψτε το κείμενο της ανακοίνωσης…"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm">Ρυθμίσεις</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Κατάσταση</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="draft">Πρόχειρο</option>
            <option value="published">Δημοσιευμένη</option>
          </select>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="w-4 h-4 rounded accent-indigo-600"
          />
          <span className="text-sm font-medium text-slate-700">Καρφιτσωμένη ανακοίνωση</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? 'Αποθήκευση…' : isEdit ? 'Αποθήκευση Αλλαγών' : 'Δημοσίευση'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/${slug}/dashboard/announcements`)}
          className="text-sm text-slate-500 hover:text-slate-700 transition"
        >
          Άκυρο
        </button>
      </div>
    </form>
  )
}
