import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import config from '@payload-config'

export async function POST(request: Request) {
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

  const body = (await request.json()) as {
    firstName: string
    lastName: string
    dateOfBirth?: string | null
    notes?: string | null
    parentId: string
    tenantId: string
  }

  if (!body.firstName || !body.lastName || !body.parentId || !body.tenantId) {
    return Response.json({ message: 'Λείπουν υποχρεωτικά πεδία' }, { status: 400 })
  }

  if (!['master', 'superadmin'].includes(role ?? '') && body.tenantId !== actorTenantId) {
    return Response.json({ message: 'Forbidden' }, { status: 403 })
  }

  try {
    const dep = await payload.create({
      collection: 'dependents',
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth ?? undefined,
        notes: body.notes ?? undefined,
        parent: Number(body.parentId),
        tenant: Number(body.tenantId),
      },
      overrideAccess: false,
      user,
    })
    return Response.json({ ok: true, id: dep.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Σφάλμα δημιουργίας'
    return Response.json({ message }, { status: 500 })
  }
}
