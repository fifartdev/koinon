import type { Access } from 'payload'

type AnyUser = {
  id: string
  role?: string
  tenant?: string | { id: string }
}

function getUser(req: { user?: unknown }): AnyUser | null {
  return (req.user as AnyUser) ?? null
}

export function getTenantId(user: AnyUser): string | null {
  if (!user.tenant) return null
  return typeof user.tenant === 'object' ? user.tenant.id : user.tenant
}

/** /admin access — master role only */
export const isMaster: Access = ({ req }) => {
  const user = getUser(req)
  return user?.role === 'master'
}

/** Superadmin + master */
export const isSuperadminOrAbove: Access = ({ req }) => {
  const user = getUser(req)
  return ['master', 'superadmin'].includes(user?.role ?? '')
}

/** Club admin + superadmin + master */
export const isClubAdminOrAbove: Access = ({ req }) => {
  const user = getUser(req)
  if (!user) return false
  return ['master', 'superadmin', 'club-admin'].includes(user.role ?? '')
}

/** Any authenticated user */
export const isAuthenticated: Access = ({ req }) => Boolean(req.user)

/**
 * Write access scoped to the user's tenant.
 * master/superadmin → all docs.
 * club-admin → only docs in their tenant.
 */
export const tenantAdminWrite: Access = ({ req }) => {
  const user = getUser(req)
  if (!user) return false
  if (['master', 'superadmin'].includes(user.role ?? '')) return true
  if (user.role === 'club-admin') {
    const tenantId = getTenantId(user)
    if (!tenantId) return false
    return { tenant: { equals: tenantId } }
  }
  return false
}

/**
 * Read access scoped to the user's tenant.
 * master/superadmin → all.
 * club-admin | member → own tenant.
 * unauthenticated → denied.
 */
export const tenantMemberRead: Access = ({ req }) => {
  const user = getUser(req)
  if (!user) return false
  if (['master', 'superadmin'].includes(user.role ?? '')) return true
  const tenantId = getTenantId(user)
  if (!tenantId) return false
  return { tenant: { equals: tenantId } }
}

/**
 * Users collection:
 * master/superadmin → all.
 * club-admin → own tenant's users.
 * member → own record only.
 */
export const usersReadAccess: Access = ({ req }) => {
  const user = getUser(req)
  if (!user) return false
  if (['master', 'superadmin'].includes(user.role ?? '')) return true
  if (user.role === 'club-admin') {
    const tenantId = getTenantId(user)
    if (!tenantId) return false
    return { tenant: { equals: tenantId } } as any // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  return { id: { equals: user.id } } as any // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Users update:
 * master/superadmin → any.
 * club-admin → members in their tenant.
 * member → own record.
 */
export const usersUpdateAccess: Access = ({ req }) => {
  const user = getUser(req)
  if (!user) return false
  if (['master', 'superadmin'].includes(user.role ?? '')) return true
  if (user.role === 'club-admin') {
    const tenantId = getTenantId(user)
    if (!tenantId) return false
    return { tenant: { equals: tenantId } } as any // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  return { id: { equals: user.id } } as any // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Notifications: each user sees only their own.
 * master/superadmin see all.
 */
export const ownNotificationsAccess: Access = ({ req }) => {
  const user = getUser(req)
  if (!user) return false
  if (['master', 'superadmin'].includes(user.role ?? '')) return true
  return { recipient: { equals: user.id } }
}

/**
 * Enrollments read:
 * club-admin → own tenant.
 * member → own enrollments.
 */
export const enrollmentsReadAccess: Access = ({ req }) => {
  const user = getUser(req)
  if (!user) return false
  if (['master', 'superadmin'].includes(user.role ?? '')) return true
  if (user.role === 'club-admin') {
    const tenantId = getTenantId(user)
    if (!tenantId) return false
    return { tenant: { equals: tenantId } }
  }
  // member sees own enrollments
  return { member: { equals: user.id } } as any // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Receipts:
 * club-admin → own tenant.
 * member → own receipts only.
 */
export const receiptsReadAccess: Access = ({ req }) => {
  const user = getUser(req)
  if (!user) return false
  if (['master', 'superadmin'].includes(user.role ?? '')) return true
  const tenantId = getTenantId(user)
  if (!tenantId) return false
  if (user.role === 'club-admin') return { tenant: { equals: tenantId } } as any // eslint-disable-line @typescript-eslint/no-explicit-any
  return { and: [{ member: { equals: user.id } }, { tenant: { equals: tenantId } }] } as any // eslint-disable-line @typescript-eslint/no-explicit-any
}

/** Public read (used for landing page data — no auth required) */
export const publicRead: Access = () => true
