import type { CollectionConfig } from 'payload'
import { tenantAdminWrite } from '@/access'

export const Dependents: CollectionConfig = {
  slug: 'dependents',
  admin: {
    useAsTitle: 'firstName',
    defaultColumns: ['firstName', 'lastName', 'parent', 'tenant'],
  },
  access: {
    create: tenantAdminWrite,
    read: ({ req: { user } }) => {
      if (!user) return false
      const u = user as { role?: string; tenant?: unknown; id?: number }
      if (['master', 'superadmin'].includes(u.role ?? '')) return true
      const tenantId =
        typeof u.tenant === 'object' && u.tenant !== null
          ? (u.tenant as { id: unknown }).id
          : u.tenant
      if (u.role === 'club-admin') return { tenant: { equals: tenantId } } as any // eslint-disable-line @typescript-eslint/no-explicit-any
      return { and: [{ tenant: { equals: tenantId } }, { parent: { equals: u.id } }] } as any // eslint-disable-line @typescript-eslint/no-explicit-any
    },
    update: tenantAdminWrite,
    delete: tenantAdminWrite,
  },
  fields: [
    { name: 'firstName', type: 'text', required: true },
    { name: 'lastName', type: 'text', required: true },
    {
      name: 'dateOfBirth',
      type: 'date',
      admin: { description: 'Ημερομηνία γέννησης (προαιρετικό)' },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: { description: 'Γονέας / κηδεμόνας (ενήλικο μέλος)' },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
    },
    { name: 'notes', type: 'text', admin: { description: 'Σημειώσεις' } },
  ],
  timestamps: true,
}
