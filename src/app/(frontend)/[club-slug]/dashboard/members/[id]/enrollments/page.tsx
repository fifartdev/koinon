import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import type { User, Service, Enrollment } from '@/payload-types'
import { EnrollmentForm } from '@/components/EnrollmentForm'

interface Props {
  params: Promise<{ 'club-slug': string; id: string }>
}

export default async function MemberEnrollmentsPage({ params }: Props) {
  const { 'club-slug': slug, id: memberId } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const tenantId = String(
    typeof (user as { tenant?: unknown }).tenant === 'object' && (user as { tenant: unknown }).tenant !== null
      ? (user as { tenant: { id: unknown } }).tenant.id
      : (user as { tenant?: unknown }).tenant ?? ''
  )

  const role = (user as { role?: string }).role ?? ''

  // Load the member
  let member: User
  try {
    member = await payload.findByID({ collection: 'users', id: memberId, depth: 0 }) as User
  } catch {
    notFound()
  }

  // Verify the member belongs to this admin's tenant
  if (!['master', 'superadmin'].includes(role)) {
    const memberTenantId = String(
      typeof (member as { tenant?: unknown }).tenant === 'object' && (member as { tenant: unknown }).tenant !== null
        ? (member as { tenant: { id: unknown } }).tenant.id
        : (member as { tenant?: unknown }).tenant ?? ''
    )
    if (memberTenantId !== tenantId) notFound()
  }

  // Load all active services for this tenant
  const { docs: services } = await payload.find({
    collection: 'services',
    where: { and: [{ tenant: { equals: tenantId } }, { isActive: { equals: true } }] },
    sort: 'title',
    limit: 100,
  })

  // Load existing enrollments for this member
  const { docs: enrollments } = await payload.find({
    collection: 'enrollments',
    where: { and: [{ member: { equals: memberId } }, { tenant: { equals: tenantId } }] },
    limit: 100,
    depth: 0,
  })

  const memberName = `${(member as { firstName?: string }).firstName ?? ''} ${(member as { lastName?: string }).lastName ?? ''}`.trim() || member.email!

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/${slug}/dashboard/members`}
          className="text-slate-400 hover:text-slate-600 transition text-sm"
        >
          ← Πίσω
        </Link>
        <h2 className="text-xl font-bold text-slate-800">
          Εγγραφές — {memberName}
        </h2>
      </div>
      <EnrollmentForm
        memberId={memberId}
        memberName={memberName}
        tenantId={tenantId}
        slug={slug}
        services={services as Service[]}
        enrollments={enrollments as Enrollment[]}
      />
    </div>
  )
}
