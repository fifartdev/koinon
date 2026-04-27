import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { EnrollmentForm } from '@/components/EnrollmentForm'

interface Props {
  params: Promise<{ 'club-slug': string; id: string }>
}

export default async function DependentEnrollmentsPage({ params }: Props) {
  const { 'club-slug': slug, id: depId } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const tenantId = String(
    typeof (user as { tenant?: unknown }).tenant === 'object' && (user as { tenant: unknown }).tenant !== null
      ? (user as { tenant: { id: unknown } }).tenant.id
      : (user as { tenant?: unknown }).tenant ?? '',
  )
  const role = (user as { role?: string }).role ?? ''

  let dep: { id: number; firstName?: string; lastName?: string; tenant?: unknown; parent?: unknown }
  try {
    dep = await payload.findByID({ collection: 'dependents', id: depId, depth: 1 }) as typeof dep
  } catch {
    notFound()
  }

  const depTenantId = String(
    typeof dep.tenant === 'object' && dep.tenant !== null
      ? (dep.tenant as { id: unknown }).id
      : dep.tenant ?? '',
  )
  if (!['master', 'superadmin'].includes(role) && depTenantId !== tenantId) notFound()

  const parent = dep.parent as { id?: number; firstName?: string; lastName?: string; email?: string } | null
  const parentId = String(parent?.id ?? '')
  const parentName = parent
    ? `${parent.firstName ?? ''} ${parent.lastName ?? ''}`.trim() || (parent.email ?? '')
    : '—'

  const { docs: services } = await payload.find({
    collection: 'services',
    where: { and: [{ tenant: { equals: tenantId } }, { isActive: { equals: true } }] },
    sort: 'title',
    limit: 100,
  })

  const { docs: enrollments } = await payload.find({
    collection: 'enrollments',
    where: { and: [{ dependent: { equals: depId } }, { tenant: { equals: tenantId } }] },
    limit: 100,
    depth: 0,
  })

  const depName = `${dep.firstName ?? ''} ${dep.lastName ?? ''}`.trim()

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/${slug}/dashboard/members/${parentId}`}
          className="text-xs text-slate-500 hover:text-slate-700 transition"
        >
          ← {parentName}
        </Link>
        <h2 className="text-xl font-bold text-slate-800 mt-2">
          Εγγραφές — {depName}
          <span className="ml-2 text-sm font-normal text-slate-400">(τέκνο)</span>
        </h2>
      </div>

      <EnrollmentForm
        memberId={parentId}
        memberName={depName}
        tenantId={tenantId}
        slug={slug}
        services={services as Parameters<typeof EnrollmentForm>[0]['services']}
        enrollments={enrollments as Parameters<typeof EnrollmentForm>[0]['enrollments']}
        dependentId={depId}
      />
    </div>
  )
}
