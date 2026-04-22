import type { CollectionConfig } from 'payload'
import { isSuperadminOrAbove, isClubAdminOrAbove, publicRead, getTenantId } from '@/access'
import type { Access } from 'payload'

const tenantUpdateAccess: Access = ({ req }) => {
  const user = req.user as { role?: string; tenant?: string | { id: string } } | null
  if (!user) return false
  if (['master', 'superadmin'].includes(user.role ?? '')) return true
  if (user.role === 'club-admin') {
    const tenantId = getTenantId(user as Parameters<typeof getTenantId>[0])
    if (!tenantId) return false
    return { id: { equals: tenantId } }
  }
  return false
}

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'isActive', 'createdAt'],
  },
  access: {
    create: isSuperadminOrAbove,
    read: publicRead,
    update: tenantUpdateAccess,
    delete: ({ req }) => (req.user as { role?: string } | null)?.role === 'master',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL-safe identifier, e.g. "golden-eagles". Cannot be changed after creation.',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'clubInfo',
      type: 'richText',
    },
    {
      name: 'contactEmail',
      type: 'email',
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
