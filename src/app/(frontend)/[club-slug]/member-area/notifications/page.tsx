import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Notification } from '@/payload-types'
import { NotificationList } from './NotificationList'

export default async function NotificationsPage() {
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
      <h1 className="text-xl font-bold text-slate-800 mb-5">Ειδοποιήσεις</h1>
      <NotificationList initial={notifications as Notification[]} />
    </div>
  )
}
