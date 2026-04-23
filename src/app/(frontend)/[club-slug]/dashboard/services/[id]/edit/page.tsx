import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { ServiceForm } from '@/components/ServiceForm'
import type { Service } from '@/payload-types'

interface Props {
  params: Promise<{ 'club-slug': string; id: string }>
}

export default async function EditServicePage({ params }: Props) {
  const { 'club-slug': slug, id } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const tenantId = String(
    typeof (user as { tenant?: unknown }).tenant === 'object' && (user as { tenant: unknown }).tenant !== null
      ? (user as { tenant: { id: unknown } }).tenant.id
      : (user as { tenant?: unknown }).tenant ?? ''
  )

  let service: Service
  try {
    service = await payload.findByID({ collection: 'services', id, depth: 0 }) as Service
  } catch {
    notFound()
  }

  // Verify this service belongs to the admin's tenant (master/superadmin bypass)
  const role = (user as { role?: string }).role ?? ''
  if (!['master', 'superadmin'].includes(role)) {
    const serviceTenantId = String(
      typeof (service as { tenant?: unknown }).tenant === 'object' && (service as { tenant: unknown }).tenant !== null
        ? (service as { tenant: { id: unknown } }).tenant.id
        : (service as { tenant?: unknown }).tenant ?? ''
    )
    if (serviceTenantId !== tenantId) notFound()
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/${slug}/dashboard/services`}
          className="text-slate-400 hover:text-slate-600 transition text-sm"
        >
          ← Πίσω
        </Link>
        <h2 className="text-xl font-bold text-slate-800">Επεξεργασία Υπηρεσίας</h2>
      </div>
      <ServiceForm tenantId={tenantId} slug={slug} service={service} />
    </div>
  )
}
