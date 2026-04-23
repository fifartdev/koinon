import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import config from '@payload-config'
import { sendInviteEmail } from '@/lib/resend'

export async function POST(request: Request) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers })
  if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 })

  const actorRole = (user as { role?: string }).role
  if (!['master', 'superadmin', 'club-admin'].includes(actorRole ?? '')) {
    return Response.json({ message: 'Forbidden' }, { status: 403 })
  }

  const body = (await request.json()) as {
    email: string
    firstName: string
    lastName: string
    tenantId?: string
  }

  const tenantId =
    body.tenantId ??
    (typeof (user as { tenant?: string | { id: string } }).tenant === 'object'
      ? ((user as { tenant: { id: string } }).tenant.id)
      : ((user as { tenant?: string }).tenant ?? ''))

  if (!tenantId) {
    return Response.json({ message: 'Tenant required' }, { status: 400 })
  }

  // Fetch tenant for club name and slug
  const tenant = await payload.findByID({
    collection: 'tenants',
    id: tenantId,
  })

  // Create the user in Payload (they'll receive a password reset email via Resend)
  const randomPassword = Math.random().toString(36).slice(-12)
  let newUser: { id: string | number }
  try {
    newUser = await payload.create({
      collection: 'users',
      data: {
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        role: 'member',
        tenant: Number(tenantId),
        password: randomPassword,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Σφάλμα δημιουργίας χρήστη'
    return Response.json({ message }, { status: 422 })
  }

  // Generate a password reset token so the invitee sets their own password
  // forgotPassword returns the token string directly in Payload 3.x
  const token = await payload.forgotPassword({
    collection: 'users',
    data: { email: body.email },
    disableEmail: true,
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const tenantSlug = (tenant as { slug?: string }).slug ?? ''
  const inviteUrl = `${baseUrl}/${tenantSlug}/login?token=${token}&email=${encodeURIComponent(body.email)}`
  const inviterName = `${(user as { firstName?: string }).firstName ?? ''} ${(user as { lastName?: string }).lastName ?? ''}`.trim() || user.email!

  await sendInviteEmail({
    to: body.email,
    clubName: (tenant as { name?: string }).name ?? 'Your Club',
    inviteUrl,
    inviterName,
  })

  return Response.json({ id: newUser.id }, { status: 201 })
}
