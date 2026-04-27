import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import config from '@payload-config'

export async function DELETE(request: Request) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers })
  if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 })

  const role = (user as { role?: string }).role
  if (!['master', 'superadmin', 'club-admin'].includes(role ?? '')) {
    return Response.json({ message: 'Forbidden' }, { status: 403 })
  }

  const actorTenantId = String(
    typeof (user as { tenant?: unknown }).tenant === 'object' && (user as { tenant: { id: unknown } }).tenant !== null
      ? (user as { tenant: { id: unknown } }).tenant.id
      : (user as { tenant?: unknown }).tenant ?? '',
  )

  const { dependentId } = (await request.json()) as { dependentId: string }
  if (!dependentId) return Response.json({ message: 'dependentId required' }, { status: 400 })

  let dep: { tenant?: unknown }
  try {
    dep = await payload.findByID({ collection: 'dependents', id: dependentId, depth: 0 }) as typeof dep
  } catch {
    return Response.json({ message: 'Δεν βρέθηκε' }, { status: 404 })
  }

  const depTenantId = String(
    typeof dep.tenant === 'object' && dep.tenant !== null
      ? (dep.tenant as { id: unknown }).id
      : dep.tenant ?? '',
  )
  if (!['master', 'superadmin'].includes(role ?? '') && depTenantId !== actorTenantId) {
    return Response.json({ message: 'Forbidden' }, { status: 403 })
  }

  try {
    // Delete dependent's enrollments first
    const { docs: enrollments } = await payload.find({
      collection: 'enrollments',
      where: { dependent: { equals: dependentId } },
      limit: 1000,
      overrideAccess: true,
    })
    for (const e of enrollments) {
      await payload.delete({ collection: 'enrollments', id: String(e.id), overrideAccess: true })
    }

    await payload.delete({ collection: 'dependents', id: dependentId, overrideAccess: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Σφάλμα διαγραφής'
    return Response.json({ message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
