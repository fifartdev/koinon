'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  id: string | number
  slug: string
  isActive: boolean
}

export function TenantActions({ id, slug, isActive }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function toggleActive() {
    setBusy(true)
    try {
      await fetch(`/api/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !isActive }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/superadmin/clubs/${id}/edit`}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-2.5 py-1 transition"
      >
        Επεξεργασία
      </Link>
      <button
        onClick={toggleActive}
        disabled={busy}
        className={`text-xs font-medium rounded-lg px-2.5 py-1 transition disabled:opacity-50 ${
          isActive
            ? 'text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200'
            : 'text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100'
        }`}
      >
        {busy ? '…' : isActive ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
      </button>
      <a
        href={`/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg px-2.5 py-1 transition"
      >
        Προβολή ↗
      </a>
    </div>
  )
}
