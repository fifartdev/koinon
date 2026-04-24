import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import config from '@payload-config'

export async function DELETE(request: Request) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers })
  if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 })

  const actorRole = (user as { role?: string }).role
  if (!['master', 'superadmin', 'club-admin'].includes(actorRole ?? '')) {
    return Response.json({ message: 'Forbidden' }, { status: 403 })
  }

  const { userId } = (await request.json()) as { userId: string }
  if (!userId) return Response.json({ message: 'userId required' }, { status: 400 })

  const actorTenantId = String(
    typeof (user as { tenant?: unknown }).tenant === 'object' && (user as { tenant: { id: unknown } }).tenant !== null
      ? (user as { tenant: { id: unknown } }).tenant.id
      : (user as { tenant?: unknown }).tenant ?? ''
  )

  // Load target user to verify tenant + role
  let target: Awaited<ReturnType<typeof payload.findByID>>
  try {
    target = await payload.findByID({ collection: 'users', id: userId, depth: 0 })
  } catch {
    return Response.json({ message: 'Ο χρήστης δεν βρέθηκε' }, { status: 404 })
  }

  const targetTenantId = String(
    typeof (target as { tenant?: unknown }).tenant === 'object' && (target as { tenant: unknown }).tenant !== null
      ? (target as { tenant: { id: unknown } }).tenant.id
      : (target as { tenant?: unknown }).tenant ?? ''
  )

  if (!['master', 'superadmin'].includes(actorRole ?? '') && targetTenantId !== actorTenantId) {
    return Response.json({ message: 'Forbidden' }, { status: 403 })
  }

  if ((target as { role?: string }).role !== 'member') {
    return Response.json({ message: 'Only members can be deleted via this endpoint' }, { status: 400 })
  }

  try {
    // Remove related records first to avoid foreign key constraint violations
    const { docs: enrollments } = await payload.find({
      collection: 'enrollments',
      where: { member: { equals: userId } },
      limit: 1000,
      overrideAccess: true,
    })
    for (const e of enrollments) {
      await payload.delete({ collection: 'enrollments', id: String(e.id), overrideAccess: true })
    }

    const { docs: notifications } = await payload.find({
      collection: 'notifications',
      where: { recipient: { equals: userId } },
      limit: 1000,
      overrideAccess: true,
    })
    for (const n of notifications) {
      await payload.delete({ collection: 'notifications', id: String(n.id), overrideAccess: true })
    }

    const { docs: receipts } = await payload.find({
      collection: 'receipts',
      where: { member: { equals: userId } },
      limit: 1000,
      overrideAccess: true,
    })
    for (const r of receipts) {
      await payload.delete({ collection: 'receipts', id: String(r.id), overrideAccess: true })
    }

    await payload.delete({ collection: 'users', id: userId, overrideAccess: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Σφάλμα διαγραφής'
    return Response.json({ message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
