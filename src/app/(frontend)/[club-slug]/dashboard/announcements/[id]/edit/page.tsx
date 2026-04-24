import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { AnnouncementForm } from '@/components/AnnouncementForm'

interface Props {
  params: Promise<{ 'club-slug': string; id: string }>
}

export default async function EditAnnouncementPage({ params }: Props) {
  const { 'club-slug': slug, id } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const tenantId = String(
    typeof (user as { tenant?: unknown }).tenant === 'object' &&
    (user as { tenant?: unknown }).tenant !== null
      ? (user as { tenant: { id: unknown } }).tenant.id
      : (user as { tenant?: unknown }).tenant ?? '',
  )

  let announcement
  try {
    announcement = await payload.findByID({ collection: 'announcements', id, depth: 0 })
  } catch {
    notFound()
  }

  const role = (user as { role?: string }).role ?? ''
  if (!['master', 'superadmin'].includes(role)) {
    const aTenantId = String(
      typeof (announcement as { tenant?: unknown }).tenant === 'object' &&
      (announcement as { tenant?: unknown }).tenant !== null
        ? (announcement as { tenant: { id: unknown } }).tenant.id
        : (announcement as { tenant?: unknown }).tenant ?? '',
    )
    if (aTenantId !== tenantId) notFound()
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/${slug}/dashboard/announcements`}
          className="text-slate-400 hover:text-slate-600 transition text-sm"
        >
          ← Πίσω
        </Link>
        <h2 className="text-xl font-bold text-slate-800">Επεξεργασία Ανακοίνωσης</h2>
      </div>
      <AnnouncementForm
        tenantId={tenantId}
        slug={slug}
        announcement={{
          id: announcement.id,
          title: (announcement as { title?: string }).title,
          content: (announcement as { content?: unknown }).content,
          isPinned: (announcement as { isPinned?: boolean }).isPinned,
          status: (announcement as { status?: string }).status,
        }}
      />
    </div>
  )
}
