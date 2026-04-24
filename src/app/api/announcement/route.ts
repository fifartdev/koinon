import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import config from '@payload-config'

function getTenantId(user: unknown): string {
  const u = user as { tenant?: unknown }
  return String(
    typeof u.tenant === 'object' && u.tenant !== null
      ? (u.tenant as { id: unknown }).id
      : (u.tenant ?? ''),
  )
}

export async function POST(request: Request) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers })
  if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 })

  const role = (user as { role?: string }).role ?? ''
  if (!['master', 'superadmin', 'club-admin'].includes(role)) {
    return Response.json({ message: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = (await request.json()) as {
      title: string
      content?: string
      isPinned?: boolean
      status?: 'draft' | 'published'
    }

    const doc = await payload.create({
      collection: 'announcements',
      data: {
        title: body.title,
        content: body.content ?? '',
        isPinned: body.isPinned ?? false,
        status: body.status ?? 'draft',
        tenant: Number(getTenantId(user)),
      },
      overrideAccess: true,
    })

    return Response.json({ id: doc.id }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Σφάλμα αποθήκευσης'
    return Response.json({ message: msg }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers })
  if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 })

  const role = (user as { role?: string }).role ?? ''
  if (!['master', 'superadmin', 'club-admin'].includes(role)) {
    return Response.json({ message: 'Forbidden' }, { status: 403 })
  }

  const tenantId = getTenantId(user)

  try {
    const body = (await request.json()) as {
      id: number | string
      title: string
      content?: string
      isPinned?: boolean
      status?: 'draft' | 'published'
    }

    // Verify tenant ownership
    const existing = await payload.findByID({
      collection: 'announcements',
      id: String(body.id),
      depth: 0,
      overrideAccess: true,
    })
    const existingTenantId = String(
      typeof (existing as { tenant?: unknown }).tenant === 'object' &&
      (existing as { tenant?: unknown }).tenant !== null
        ? (existing as { tenant: { id: unknown } }).tenant.id
        : (existing as { tenant?: unknown }).tenant ?? '',
    )
    if (!['master', 'superadmin'].includes(role) && existingTenantId !== tenantId) {
      return Response.json({ message: 'Forbidden' }, { status: 403 })
    }

    const doc = await payload.update({
      collection: 'announcements',
      id: String(body.id),
      data: {
        title: body.title,
        content: body.content ?? '',
        isPinned: body.isPinned ?? false,
        status: body.status ?? 'draft',
      },
      overrideAccess: true,
    })

    return Response.json({ id: doc.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Σφάλμα αποθήκευσης'
    return Response.json({ message: msg }, { status: 500 })
  }
}
