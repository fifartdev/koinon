'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string | number
  name: string
}

export function ClubAdminActions({ userId, name }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/superadmin/delete-club-admin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      })
      let data: { message?: string } = {}
      try { data = await res.json() } catch { /* non-JSON */ }
      if (!res.ok) { setError(data.message ?? 'Σφάλμα διαγραφής.'); setConfirming(false); return }
      router.refresh()
    } catch {
      setError('Σφάλμα δικτύου.')
      setConfirming(false)
    } finally {
      setBusy(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-600">Διαγραφή χρήστη <strong>{name}</strong>;</span>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg px-2.5 py-1 transition disabled:opacity-50"
        >
          {busy ? '…' : 'Ναι, Διαγραφή'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs font-medium text-slate-500 hover:text-slate-700 transition"
        >
          Ακύρωση
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        onClick={() => setConfirming(true)}
        className="text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg px-2.5 py-1 transition"
      >
        Διαγραφή
      </button>
    </div>
  )
}
