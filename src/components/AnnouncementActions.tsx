'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import React from 'react'

interface Props {
  slug: string
  announcementId: number | string
}

export function AnnouncementActions({ slug, announcementId }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await fetch(`/api/announcements/${announcementId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      router.refresh()
    } catch {
      // ignore
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Link
        href={`/${slug}/dashboard/announcements/${announcementId}/edit`}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition px-2.5 py-1 rounded-lg hover:bg-indigo-50"
      >
        Επεξεργασία
      </Link>
      {confirming ? (
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition disabled:opacity-50"
          >
            {loading ? '…' : 'Διαγραφή;'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-xs text-slate-400 hover:text-slate-600 transition px-1"
          >
            Άκυρο
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="text-xs font-medium text-slate-400 hover:text-red-500 transition px-2.5 py-1 rounded-lg hover:bg-red-50"
        >
          Διαγραφή
        </button>
      )}
    </div>
  )
}
