'use client'

import { useEffect, useState } from 'react'
import type { Notification } from '@/payload-types'

const TYPE_ICON: Record<string, string> = {
  announcement: '📢',
  payment: '💳',
  service: '🗓',
  manual: '💬',
}

export function NotificationList({ initial }: { initial: Notification[] }) {
  const [notifications, setNotifications] = useState(initial)

  useEffect(() => {
    const unread = initial.filter((n) => !n.isRead)
    if (unread.length === 0) return

    // Optimistically mark all unread as read in UI
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))

    // Persist to DB in parallel
    Promise.all(
      unread.map((n) =>
        fetch(`/api/notifications/${n.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true }),
          credentials: 'include',
        }),
      ),
    ).catch(() => {
      // Non-fatal — bell will self-correct on next poll
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        Είστε ενήμεροι — δεν υπάρχουν ειδοποιήσεις!
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`bg-white rounded-2xl border p-4 flex gap-3 transition-all duration-300 ${
            n.isRead ? 'border-slate-100 opacity-60' : 'border-indigo-100'
          }`}
        >
          <span className="text-xl shrink-0">
            {TYPE_ICON[n.type as string] ?? '💬'}
          </span>
          <div className="flex-1 min-w-0">
            <p className={`font-medium text-sm ${n.isRead ? 'text-slate-500' : 'text-slate-800'}`}>
              {n.title}
            </p>
            {n.message && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
            )}
            <p className="text-[10px] text-slate-300 mt-1">
              {new Date(n.createdAt).toLocaleString()}
            </p>
          </div>
          {!n.isRead && (
            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
          )}
        </div>
      ))}
    </div>
  )
}
