import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import React from 'react'
import { AnnouncementForm } from '@/components/AnnouncementForm'

interface Props {
  params: Promise<{ 'club-slug': string }>
}

export default async function NewAnnouncementPage({ params }: Props) {
  const { 'club-slug': slug } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const tenantId = String(
    typeof (user as { tenant?: unknown }).tenant === 'object' &&
    (user as { tenant?: unknown }).tenant !== null
      ? (user as { tenant: { id: unknown } }).tenant.id
      : (user as { tenant?: unknown }).tenant ?? '',
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/${slug}/dashboard/announcements`}
          className="text-slate-400 hover:text-slate-600 transition text-sm"
        >
          ← Πίσω
        </Link>
        <h2 className="text-xl font-bold text-slate-800">Νέα Ανακοίνωση</h2>
      </div>
      <AnnouncementForm tenantId={tenantId} slug={slug} />
    </div>
  )
}
