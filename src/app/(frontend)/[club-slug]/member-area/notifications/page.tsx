import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import React from 'react'
import type { Notification } from '@/payload-types'

interface Props {
  params: Promise<{ 'club-slug': string }>
}

const TYPE_ICON: Record<string, string> = {
  announcement: '📢',
  payment: '💳',
  service: '🗓',
  manual: '💬',
}

export default async function NotificationsPage({ params }: Props) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const { docs: notifications } = await payload.find({
    collection: 'notifications',
    where: { recipient: { equals: user!.id } },
    sort: '-createdAt',
    limit: 50,
  })

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-5">Notifications</h1>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          All caught up — no notifications!
        </div>
      ) : (
        <div className="space-y-3">
          {(notifications as Notification[]).map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-2xl border p-4 flex gap-3 ${
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
      )}
    </div>
  )
}
