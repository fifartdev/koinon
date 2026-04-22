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
  recipientId: string,
  tenantId: string,
  data: NotificationData,
) {
  return payload.create({
    collection: 'notifications',
    data: {
      title: data.title,
      message: data.message,
      type: data.type,
      tenant: tenantId,
      recipient: recipientId,
      isRead: false,
    },
    req,
    context: { skipNotification: true },
  })
}

export async function broadcastToTenantMembers(
  payload: Payload,
  req: PayloadRequest,
  tenantId: string,
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
    select: { id: true },
    req,
  })

  await Promise.all(
    members.map((member) =>
      createNotification(payload, req, member.id as string, tenantId, data),
    ),
  )
}
