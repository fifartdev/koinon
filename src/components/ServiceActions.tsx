'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import React from 'react'

interface Props {
  serviceId: string
  serviceTitle: string
  slug: string
}

export function ServiceActions({ serviceId, serviceTitle, slug }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const d = (await res.json()) as { errors?: { message: string }[]; message?: string }
        throw new Error(d.errors?.[0]?.message ?? d.message ?? 'Σφάλμα διαγραφής')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα')
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {error && <span className="text-xs text-red-500 w-full">{error}</span>}
        <span className="text-xs text-slate-500">Διαγραφή <strong>{serviceTitle}</strong>;</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition disabled:opacity-50"
        >
          {loading ? '…' : 'Ναι'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
        >
          Άκυρο
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 mt-3">
      {error && <span className="text-xs text-red-500">{error}</span>}
      <Link
        href={`/${slug}/dashboard/services/${serviceId}/edit`}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition"
      >
        Επεξεργασία
      </Link>
      <span className="text-slate-200">|</span>
      <button
        onClick={() => setConfirming(true)}
        className="text-xs font-medium text-red-500 hover:text-red-700 transition"
      >
        Διαγραφή
      </button>
    </div>
  )
}
