'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import React from 'react'

interface Props {
  parentId: string
  parentName: string
  tenantId: string
  slug: string
}

export function AddChildForm({ parentId, parentName, tenantId, slug }: Props) {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Συμπληρώστε όνομα και επώνυμο')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/add-dependent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth: dateOfBirth || null,
          notes: notes.trim() || null,
          parentId,
          tenantId,
        }),
      })
      if (!res.ok) {
        let msg = 'Σφάλμα αποθήκευσης'
        try {
          msg = ((await res.json()) as { message?: string }).message ?? msg
        } catch { /* */ }
        throw new Error(msg)
      }
      router.push(`/${slug}/dashboard/members`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <p className="text-sm text-slate-500 mb-6">
        Γονέας: <span className="font-semibold text-slate-700">{parentName}</span>
      </p>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-100">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Όνομα <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Γιώργος"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Επώνυμο <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Παπαδόπουλος"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Ημερομηνία Γέννησης
          </label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Σημειώσεις</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Προαιρετικά"
          />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 text-sm"
          >
            {loading ? 'Αποθήκευση…' : 'Προσθήκη Παιδιού'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Άκυρο
          </button>
        </div>
      </div>
    </div>
  )
}
