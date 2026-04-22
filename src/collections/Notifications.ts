import type { CollectionConfig } from 'payload'
import { isSuperadminOrAbove, ownNotificationsAccess } from '@/access'
import type { Access } from 'payload'

// Club admins can create; members cannot
const notificationCreateAccess: Access = ({ req }) => {
  const user = req.user as { role?: string } | null
  if (!user) return false
  return ['master', 'superadmin', 'club-admin'].includes(user.role ?? '')
}

// Only the recipient (or admins) can mark as read
const notificationUpdateAccess: Access = ({ req }) => {
  const user = req.user as { id: string; role?: string } | null
  if (!user) return false
  if (['master', 'superadmin'].includes(user.role ?? '')) return true
  return { recipient: { equals: user.id } }
}

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'isRead', 'recipient', 'createdAt'],
  },
  access: {
    create: notificationCreateAccess,
    read: ownNotificationsAccess,
    update: notificationUpdateAccess,
    delete: isSuperadminOrAbove,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      options: [
        { label: 'Announcement', value: 'announcement' },
        { label: 'Payment', value: 'payment' },
        { label: 'New Service', value: 'service' },
        { label: 'Manual', value: 'manual' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
    },
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'isRead',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
}
