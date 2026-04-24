import type { CollectionConfig } from 'payload'
import { tenantAdminWrite, receiptsReadAccess } from '@/access'
import { createNotification } from '@/lib/notifications'

export const Receipts: CollectionConfig = {
  slug: 'receipts',
  admin: {
    useAsTitle: 'receiptNumber',
    defaultColumns: ['receiptNumber', 'member', 'totalAmount', 'issuedAt', 'paymentMethod'],
  },
  access: {
    create: tenantAdminWrite,
    read: receiptsReadAccess,
    update: tenantAdminWrite,
    delete: tenantAdminWrite,
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create' && req.user) {
          data.issuedBy = req.user.id
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req, context }) => {
        if (operation !== 'create') return
        if (context.skipNotification) return

        const memberId = typeof doc.member === 'object' ? doc.member?.id : doc.member
        const tenantId = typeof doc.tenant === 'object' ? doc.tenant?.id : doc.tenant
        if (!memberId || !tenantId) return

        await createNotification(req.payload, req, memberId, tenantId, {
          title: 'Απόδειξη Πληρωμής',
          message: `Εκδόθηκε απόδειξη #${doc.receiptNumber} ποσού ${doc.totalAmount}€.`,
          type: 'payment',
        })
      },
    ],
  },
  fields: [
    {
      name: 'receiptNumber',
      type: 'text',
      required: true,
      admin: { description: 'Ελεύθερη μορφή, π.χ. ΑΠΟ-2026-001' },
    },
    {
      name: 'member',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
    },
    {
      name: 'issuedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
    },
    {
      name: 'issuedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar' },
    },
    {
      name: 'paymentMethod',
      type: 'select',
      required: true,
      defaultValue: 'cash',
      options: [
        { label: 'Μετρητά', value: 'cash' },
        { label: 'Τραπεζική Μεταφορά', value: 'transfer' },
        { label: 'Κάρτα', value: 'card' },
        { label: 'Άλλο', value: 'other' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'lineItems',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'enrollment',
          type: 'relationship',
          relationTo: 'enrollments',
        },
        {
          name: 'description',
          type: 'text',
          required: true,
          admin: { description: 'π.χ. Απρίλιος 2026 ή 8 συνεδρίες' },
        },
        {
          name: 'sessionsCount',
          type: 'number',
          min: 0,
          admin: { description: 'Αριθμός συνεδριών (μόνο για πλάνα συνεδριών)' },
        },
        {
          name: 'baseAmount',
          type: 'number',
          required: true,
          min: 0,
          admin: { description: 'Τιμή προ έκπτωσης (€)' },
        },
        {
          name: 'discountAmount',
          type: 'number',
          defaultValue: 0,
          min: 0,
          admin: { description: 'Έκπτωση (€)' },
        },
        {
          name: 'finalAmount',
          type: 'number',
          required: true,
          min: 0,
          admin: { description: 'Τελικό ποσό (€)' },
        },
      ],
    },
    {
      name: 'totalAmount',
      type: 'number',
      required: true,
      min: 0,
      admin: { position: 'sidebar', description: 'Σύνολο (€)' },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  timestamps: true,
}
