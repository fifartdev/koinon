import type { CollectionConfig } from 'payload'
import { tenantAdminWrite, tenantMemberRead } from '@/access'
import { broadcastToTenantMembers } from '@/lib/notifications'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'tutor', 'fee', 'tenant', 'isActive'],
  },
  access: {
    create: tenantAdminWrite,
    read: tenantMemberRead,
    update: tenantAdminWrite,
    delete: tenantAdminWrite,
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req, context }) => {
        if (operation !== 'create') return
        if (context.skipNotification) return

        const tenantId =
          typeof doc.tenant === 'object' ? doc.tenant?.id : doc.tenant
        if (!tenantId) return

        await broadcastToTenantMembers(req.payload, req, tenantId, {
          title: 'New Service Available',
          message: `"${doc.title}" has been added to your club.`,
          type: 'service',
        })
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'tutor',
      type: 'text',
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
    },
    {
      name: 'weeklySchedule',
      type: 'array',
      fields: [
        {
          name: 'day',
          type: 'select',
          required: true,
          options: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
        },
        { name: 'startTime', type: 'text', required: true },
        { name: 'endTime', type: 'text', required: true },
        { name: 'location', type: 'text' },
      ],
    },
    {
      name: 'fee',
      type: 'number',
      min: 0,
      admin: { description: 'Monthly fee in local currency' },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
}
