import type { CollectionConfig } from 'payload'
import { tenantAdminWrite, enrollmentsReadAccess } from '@/access'
import { createNotification } from '@/lib/notifications'
import { sendPaymentReminderEmail } from '@/lib/resend'

export const Enrollments: CollectionConfig = {
  slug: 'enrollments',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['member', 'service', 'paymentStatus', 'tenant'],
  },
  access: {
    create: tenantAdminWrite,
    read: enrollmentsReadAccess,
    update: tenantAdminWrite,
    delete: tenantAdminWrite,
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req, context }) => {
        if (context.skipNotification) return
        if (doc.paymentStatus !== 'unpaid') return
        if (previousDoc?.paymentStatus === 'unpaid') return

        const tenantId =
          typeof doc.tenant === 'object' ? doc.tenant?.id : doc.tenant
        const memberId =
          typeof doc.member === 'object' ? doc.member?.id : doc.member
        if (!tenantId || !memberId) return

        const serviceTitle =
          typeof doc.service === 'object'
            ? doc.service?.title
            : 'your service'

        // In-app notification
        await createNotification(req.payload, req, memberId, tenantId, {
          title: 'Payment Required',
          message: `Your payment for "${serviceTitle}" is now due. Please contact your admin.`,
          type: 'payment',
        })

        // Email notification — fetch member details
        try {
          const member = await req.payload.findByID({
            collection: 'users',
            id: memberId,
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

          if (member.email) {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
            await sendPaymentReminderEmail({
              to: member.email,
              memberName: `${(member as { firstName?: string }).firstName ?? ''} ${(member as { lastName?: string }).lastName ?? ''}`.trim() || member.email,
              serviceName: serviceTitle,
              clubName: (tenant as { name?: string }).name ?? 'Your Club',
              dashboardUrl: `${baseUrl}/${(tenant as { slug?: string }).slug ?? ''}/member-area`,
            })
          }
        } catch {
          // Email failure is non-fatal
        }
      },
    ],
  },
  fields: [
    {
      name: 'member',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
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
      name: 'paymentStatus',
      type: 'select',
      required: true,
      defaultValue: 'unpaid',
      options: [
        { label: 'Paid', value: 'paid' },
        { label: 'Unpaid', value: 'unpaid' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'paidAt',
      type: 'date',
      admin: {
        condition: (data) => data?.paymentStatus === 'paid',
        position: 'sidebar',
      },
    },
    {
      name: 'enrolledAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
}
