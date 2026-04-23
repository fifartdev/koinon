'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import React from 'react'

export function MemberActions({ userId, memberName }: { userId: string; memberName: string }) {
  const router = useRouter()
  const [loadingResend, setLoadingResend] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [resendDone, setResendDone] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  async function handleResend() {
    setLoadingResend(true)
    setError('')
    try {
      const res = await fetch('/api/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        credentials: 'include',
      })
      if (!res.ok) {
        let msg = 'Σφάλμα επαναποστολής'
        try { msg = ((await res.json()) as { message?: string }).message ?? msg } catch { /* non-JSON body */ }
        throw new Error(msg)
      }
      setResendDone(true)
      setTimeout(() => setResendDone(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα')
    } finally {
      setLoadingResend(false)
    }
  }

  async function handleDelete() {
    setLoadingDelete(true)
    setError('')
    try {
      const res = await fetch('/api/delete-member', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        credentials: 'include',
      })
      if (!res.ok) {
        let msg = 'Σφάλμα διαγραφής'
        try { msg = ((await res.json()) as { message?: string }).message ?? msg } catch { /* non-JSON body */ }
        throw new Error(msg)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα')
      setLoadingDelete(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Διαγραφή <strong>{memberName}</strong>;</span>
        <button
          onClick={handleDelete}
          disabled={loadingDelete}
          className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition disabled:opacity-50"
        >
          {loadingDelete ? '…' : 'Ναι'}
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
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-500">{error}</span>}
      <button
        onClick={handleResend}
        disabled={loadingResend}
        title="Επαναποστολή πρόσκλησης"
        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 transition"
      >
        {loadingResend ? '…' : resendDone ? '✓ Εστάλη' : 'Επαναποστολή'}
      </button>
      <span className="text-slate-200">|</span>
      <button
        onClick={() => setConfirming(true)}
        className="text-xs text-red-500 hover:text-red-700 font-medium transition"
      >
        Διαγραφή
      </button>
    </div>
  )
}
