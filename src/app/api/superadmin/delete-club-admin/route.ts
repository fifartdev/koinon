import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import config from '@payload-config'

export async function DELETE(request: Request) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers })
  if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 })
  if ((user as { role?: string }).role !== 'superadmin') {
    return Response.json({ message: 'Forbidden' }, { status: 403 })
  }

  const body = (await request.json()) as { userId: string | number }
  if (!body.userId) return Response.json({ message: 'userId required' }, { status: 400 })

  // Verify target is a club-admin (never allow deleting master/superadmin via this route)
  type UserShape = { id: string | number; role?: string }
  let target: UserShape | null = null
  try {
    const result = await payload.findByID({ collection: 'users', id: String(body.userId), overrideAccess: true })
    target = result as unknown as UserShape
  } catch {
    return Response.json({ message: 'Ο χρήστης δεν βρέθηκε.' }, { status: 404 })
  }
  if (!target) return Response.json({ message: 'Ο χρήστης δεν βρέθηκε.' }, { status: 404 })
  if (target.role !== 'club-admin') {
    return Response.json({ message: 'Μόνο club-admin χρήστες μπορούν να διαγραφούν εδώ.' }, { status: 403 })
  }

  try {
    // Delete notifications first (FK constraint)
    const { docs: notifications } = await payload.find({
      collection: 'notifications',
      where: { recipient: { equals: body.userId } },
      limit: 0,
      overrideAccess: true,
    })
    for (const n of notifications) {
      await payload.delete({ collection: 'notifications', id: String(n.id), overrideAccess: true })
    }

    await payload.delete({ collection: 'users', id: String(body.userId), overrideAccess: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Σφάλμα διαγραφής.'
    return Response.json({ message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
