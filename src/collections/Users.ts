import type { CollectionConfig } from 'payload'
import { isSuperadminOrAbove, usersReadAccess, usersUpdateAccess } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'role', 'tenant'],
  },
  auth: true,
  access: {
    create: isSuperadminOrAbove,
    read: usersReadAccess,
    update: usersUpdateAccess,
    delete: isSuperadminOrAbove,
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'member',
      saveToJWT: true,
      options: [
        { label: 'Master', value: 'master' },
        { label: 'Superadmin', value: 'superadmin' },
        { label: 'Club Admin', value: 'club-admin' },
        { label: 'Member', value: 'member' },
      ],
      access: {
        update: ({ req }) => {
          const user = req.user as { role?: string } | null
          return ['master', 'superadmin'].includes(user?.role ?? '')
        },
      },
    },
    {
      name: 'landline',
      type: 'text',
      admin: { description: 'Σταθερό τηλέφωνο' },
    },
    {
      name: 'mobile',
      type: 'text',
      admin: { description: 'Κινητό τηλέφωνο' },
    },
    {
      name: 'homeAddress',
      type: 'text',
      admin: { description: 'Διεύθυνση κατοικίας' },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      saveToJWT: true,
      index: true,
      admin: {
        condition: (data) => ['club-admin', 'member'].includes(data?.role ?? ''),
      },
    },
    // ── Global discount (applies on top of per-enrollment discounts) ────
    {
      name: 'globalDiscountType',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'Χωρίς γενική έκπτωση', value: 'none' },
        { label: 'Ποσοστό (%)', value: 'percent' },
        { label: 'Ποσό (€)', value: 'fixed' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Γενική έκπτωση για όλες τις υπηρεσίες',
        condition: (data) => data?.role === 'member',
      },
    },
    {
      name: 'globalDiscountValue',
      type: 'number',
      min: 0,
      admin: {
        position: 'sidebar',
        condition: (data) => data?.role === 'member' && data?.globalDiscountType && data?.globalDiscountType !== 'none',
      },
    },
    {
      name: 'globalDiscountNote',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Αιτιολογία γενικής έκπτωσης',
        condition: (data) => data?.role === 'member' && data?.globalDiscountType && data?.globalDiscountType !== 'none',
      },
    },
  ],
}
