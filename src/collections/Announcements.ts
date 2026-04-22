import type { CollectionConfig } from 'payload'
import { tenantAdminWrite, tenantMemberRead } from '@/access'
import { broadcastToTenantMembers } from '@/lib/notifications'
import { sendAnnouncementEmail } from '@/lib/resend'

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'isPinned', 'tenant', 'publishedAt'],
  },
  access: {
    create: tenantAdminWrite,
    read: tenantMemberRead,
    update: tenantAdminWrite,
    delete: tenantAdminWrite,
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req, context }) => {
        if (context.skipNotification) return
        if (doc.status !== 'published') return
        if (previousDoc?.status === 'published') return

        const tenantId =
          typeof doc.tenant === 'object' ? doc.tenant?.id : doc.tenant
        if (!tenantId) return

        // In-app broadcast
        await broadcastToTenantMembers(req.payload, req, tenantId, {
          title: doc.title,
          message: 'A new announcement has been posted.',
          type: 'announcement',
        })

        // Email all club members
        try {
          const { docs: members } = await req.payload.find({
            collection: 'users',
            where: {
              and: [
                { tenant: { equals: tenantId } },
                { role: { in: ['member', 'club-admin'] } },
              ],
            },
            limit: 2000,
            req,
          })

          const tenant =
            typeof doc.tenant === 'object'
              ? doc.tenant
              : await req.payload.findByID({
                  collection: 'tenants',
                  id: tenantId,
                  req,
                })

          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
          const memberAreaUrl = `${baseUrl}/${(tenant as { slug?: string }).slug ?? ''}/member-area`
          const clubName = (tenant as { name?: string }).name ?? 'Your Club'

          await Promise.allSettled(
            members.map((member) => {
              if (!member.email) return Promise.resolve()
              const firstName = (member as { firstName?: string }).firstName ?? ''
              const lastName = (member as { lastName?: string }).lastName ?? ''
              return sendAnnouncementEmail({
                to: member.email,
                memberName: `${firstName} ${lastName}`.trim() || member.email,
                announcementTitle: doc.title,
                clubName,
                memberAreaUrl,
              })
            }),
          )
        } catch {
          // Email failure is non-fatal
        }
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
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
    },
    {
      name: 'isPinned',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        condition: (data) => data?.status === 'published',
      },
      hooks: {
        beforeChange: [
          ({ data, siblingData }) => {
            if (siblingData?.status === 'published' && !data) {
              return new Date().toISOString()
            }
            return data
          },
        ],
      },
    },
  ],
  timestamps: true,
}
