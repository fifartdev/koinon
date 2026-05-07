import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import config from '@payload-config'
import { sendInviteEmail } from '@/lib/resend'

export async function POST(request: Request) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers })
  if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 })
  if ((user as { role?: string }).role !== 'superadmin') {
    return Response.json({ message: 'Forbidden' }, { status: 403 })
  }

  const body = (await request.json()) as {
    email: string
    firstName: string
    lastName: string
    tenantId: string | number
  }

  if (!body.email || !body.firstName || !body.lastName || !body.tenantId) {
    return Response.json({ message: 'Λείπουν υποχρεωτικά πεδία.' }, { status: 400 })
  }

  type TenantShape = { id: string | number; name?: string; slug?: string }
  let tenant: TenantShape | null = null
  try {
    const result = await payload.findByID({ collection: 'tenants', id: String(body.tenantId), overrideAccess: true })
    tenant = result as unknown as TenantShape
  } catch {
    return Response.json({ message: 'Ο σύλλογος δεν βρέθηκε.' }, { status: 404 })
  }
  if (!tenant) return Response.json({ message: 'Ο σύλλογος δεν βρέθηκε.' }, { status: 404 })

  const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-4)

  let newUser: { id: string | number }
  try {
    newUser = await payload.create({
      collection: 'users',
      data: {
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        role: 'club-admin',
        tenant: Number(body.tenantId),
        password: randomPassword,
      },
      overrideAccess: true,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Σφάλμα δημιουργίας χρήστη.'
    return Response.json({ message }, { status: 422 })
  }

  const token = await payload.forgotPassword({
    collection: 'users',
    data: { email: body.email },
    disableEmail: true,
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const tenantSlug = (tenant as { slug?: string }).slug ?? ''
  const inviteUrl = `${baseUrl}/${tenantSlug}/login?token=${token}&email=${encodeURIComponent(body.email)}`
  const inviterName = `${(user as { firstName?: string }).firstName ?? ''} ${(user as { lastName?: string }).lastName ?? ''}`.trim() || user.email!

  try {
    await sendInviteEmail({
      to: body.email,
      clubName: (tenant as { name?: string }).name ?? 'Koinon',
      inviteUrl,
      inviterName,
    })
  } catch {
    // Non-fatal — user is created, email failed
  }

  return Response.json({ id: newUser.id }, { status: 201 })
}
