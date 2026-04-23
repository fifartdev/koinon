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

  const { userId } = (await request.json()) as { userId: string }
  if (!userId) return Response.json({ message: 'userId required' }, { status: 400 })

  const actorTenantId = String(
    typeof (user as { tenant?: unknown }).tenant === 'object' && (user as { tenant: { id: unknown } }).tenant !== null
      ? (user as { tenant: { id: unknown } }).tenant.id
      : (user as { tenant?: unknown }).tenant ?? ''
  )

  // Load target user
  const target = await payload.findByID({ collection: 'users', id: userId, depth: 0 })

  const targetTenantId = String(
    typeof (target as { tenant?: unknown }).tenant === 'object' && (target as { tenant: unknown }).tenant !== null
      ? (target as { tenant: { id: unknown } }).tenant.id
      : (target as { tenant?: unknown }).tenant ?? ''
  )

  // Enforce tenant isolation (masters bypass)
  if (!['master', 'superadmin'].includes(actorRole ?? '') && targetTenantId !== actorTenantId) {
    return Response.json({ message: 'Forbidden' }, { status: 403 })
  }

  if ((target as { role?: string }).role !== 'member') {
    return Response.json({ message: 'Target user is not a member' }, { status: 400 })
  }

  // Generate a fresh password-reset token (this is what the invite link uses)
  // forgotPassword returns the token string directly in Payload 3.x
  const token = await payload.forgotPassword({
    collection: 'users',
    data: { email: target.email! },
    disableEmail: true,
  })

  const tenant = await payload.findByID({ collection: 'tenants', id: targetTenantId })
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const tenantSlug = (tenant as { slug?: string }).slug ?? ''
  const inviteUrl = `${baseUrl}/${tenantSlug}/login?token=${token}&email=${encodeURIComponent(target.email!)}`
  const inviterName = `${(user as { firstName?: string }).firstName ?? ''} ${(user as { lastName?: string }).lastName ?? ''}`.trim() || user.email!

  await sendInviteEmail({
    to: target.email!,
    clubName: (tenant as { name?: string }).name ?? 'Your Club',
    inviteUrl,
    inviterName,
  })

  return Response.json({ ok: true })
}
