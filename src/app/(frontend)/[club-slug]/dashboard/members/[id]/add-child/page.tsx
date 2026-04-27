import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import React from 'react'
import { AddChildForm } from '@/components/AddChildForm'

interface Props {
  params: Promise<{ 'club-slug': string; id: string }>
}

export default async function AddChildPage({ params }: Props) {
  const { 'club-slug': slug, id: memberId } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const tenantId = String(
    typeof (user as { tenant?: unknown }).tenant === 'object' && (user as { tenant: unknown }).tenant !== null
      ? (user as { tenant: { id: unknown } }).tenant.id
      : (user as { tenant?: unknown }).tenant ?? '',
  )

  let member: { id: number; firstName?: string; lastName?: string; tenant?: unknown }
  try {
    member = await payload.findByID({ collection: 'users', id: memberId, depth: 0 }) as typeof member
  } catch {
    notFound()
  }

  const memberTenantId = String(
    typeof member.tenant === 'object' && member.tenant !== null
      ? (member.tenant as { id: unknown }).id
      : member.tenant ?? '',
  )
  const role = (user as { role?: string }).role ?? ''
  if (!['master', 'superadmin'].includes(role) && memberTenantId !== tenantId) notFound()

  const parentName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim()

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/${slug}/dashboard/members`}
          className="text-xs text-slate-500 hover:text-slate-700 transition"
        >
          ← Μέλη
        </Link>
        <h2 className="text-xl font-bold text-slate-800 mt-2">Προσθήκη Παιδιού</h2>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <AddChildForm
          parentId={String(member.id)}
          parentName={parentName}
          tenantId={tenantId}
          slug={slug}
        />
      </div>
    </div>
  )
}
