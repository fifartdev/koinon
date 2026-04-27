import type { Payload, PayloadRequest } from 'payload'

type NotificationType = 'announcement' | 'payment' | 'service' | 'manual'

interface NotificationData {
  title: string
  message: string
  type: NotificationType
}

export async function createNotification(
  payload: Payload,
  req: PayloadRequest,
  recipientId: string | number,
  tenantId: string | number,
  data: NotificationData,
) {
  return payload.create({
    collection: 'notifications',
    data: {
      title: data.title,
      message: data.message,
      type: data.type,
      tenant: Number(tenantId),
      recipient: Number(recipientId),
      isRead: false,
    },
    req,
    context: { skipNotification: true },
  })
}

export async function broadcastToTenantMembers(
  payload: Payload,
  req: PayloadRequest,
  tenantId: string | number,
  data: NotificationData,
) {
  const { docs: members } = await payload.find({
    collection: 'users',
    where: {
      and: [
        { tenant: { equals: tenantId } },
        { role: { in: ['member', 'club-admin'] } },
      ],
    },
    limit: 2000,
    depth: 0,
    req,
  })

  await Promise.all(
    members.map((member) =>
      createNotification(payload, req, member.id, tenantId, data),
    ),
  )
}
